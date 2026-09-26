"""Deterministic WorkOrder, inventory, technician and QMS business operations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import uuid4

from .repository import build_repository
from ..quality import PartInspectionService


class BackendBusinessService:
    VALID_STATUSES = {"open", "in_progress", "completed", "closed", "rejected", "timeout"}

    def __init__(self, repository: Any | None = None) -> None:
        self.repository = repository or build_repository()
        self.inspection = PartInspectionService()
        self._quality: dict[str, dict[str, Any]] = {str(item.get("quality_check_id")): item for item in self._list_records("quality") if item.get("quality_check_id")}
        self._closure_tasks: dict[str, dict[str, Any]] = {str(item.get("closure_task_id")): item for item in self._list_records("closure") if item.get("closure_task_id")}
        self._audit: list[dict[str, Any]] = self._list_records("audit")
        self._experiences: dict[str, dict[str, Any]] = {str(item.get("experience_id")): item for item in self._list_records("experience") if item.get("experience_id")}

    def _save_record(self, record_type: str, record_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        saver = getattr(self.repository, "save_record", None)
        if saver is not None:
            return dict(saver(record_type, record_id, payload))
        return dict(payload)

    def _list_records(self, record_type: str) -> list[dict[str, Any]]:
        loader = getattr(self.repository, "list_records", None)
        return [dict(item) for item in (loader(record_type) if loader is not None else [])]

    def _append_audit(self, record: dict[str, Any]) -> None:
        self._audit.append(record)
        self._save_record("audit", str(record.get("audit_id") or uuid4().hex), record)

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _order_result(order: Mapping[str, Any], **extra: Any) -> dict[str, Any]:
        value = dict(order)
        return {**value, "success": True, "workorder": value, "workorder_id": str(value.get("workorder_id") or ""), "backend": "backend-service", **extra}

    def create_workorder(self, **values: Any) -> dict[str, Any]:
        order = {
            "workorder_id": "WO-" + uuid4().hex[:10].upper(),
            "device_id": str(values.get("device_id") or "unknown"), "status": "open",
            "title": str(values.get("title") or "设备维修工单"), "plan_id": str(values.get("plan_id") or ""),
            "steps": list(values.get("steps") or values.get("repair_steps") or []),
            "repair_target": dict(values.get("repair_target") or values.get("target_part") or {}),
            "drawing_context": dict(values.get("drawing_context") or values.get("engineering_context") or {}),
            "alarm_code": str(values.get("alarm_code") or ""), "diagnosis_context": dict(values.get("diagnosis_context") or values.get("diagnosis") or {}),
            "repair_feedback": {}, "repair_verification": {}, "status_history": [], "events": [],
            "priority": str(values.get("priority") or "normal"), "risk_level": str(values.get("risk_level") or ""),
            "source": str(values.get("source") or "backend"), "idempotency_key": str(values.get("idempotency_key") or ""),
            "event_id": str(values.get("event_id") or ""), "diagnosis_snapshot": dict(values.get("diagnosis_snapshot") or values.get("diagnosis") or {}),
            "maintenance_plan_snapshot": dict(values.get("maintenance_plan_snapshot") or values.get("maintenance_plan") or {}),
            "created_at": self._now(), "updated_at": self._now(),
        }
        existing = self.repository.create(order)
        if not existing.get("events"):
            self._record_event(existing, "created", "", "open", {})
            existing = self.repository.update(existing)
        return self._order_result(existing)

    def get_workorder(self, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        value = self.repository.get(workorder_id)
        return {**dict(value or {}), "success": bool(value), "found": bool(value), "workorder": dict(value or {}), "workorder_id": workorder_id, "backend": "backend-service"}

    def query_workorder(self, workorder_id: str = "", **kwargs: Any) -> dict[str, Any]:
        return self.get_workorder(workorder_id=workorder_id, **kwargs)

    def list_workorders(self, device_id: str = "", status: str = "", **_: Any) -> dict[str, Any]:
        values = [item for item in self.repository.list() if (not device_id or item.get("device_id") == device_id) and (not status or item.get("status") == status)]
        return {"success": True, "items": values, "total": len(values), "backend": "backend-service"}

    def update_workorder(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> dict[str, Any]:
        order = self.repository.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        if status not in self.VALID_STATUSES:
            raise ValueError("无效工单状态：%s" % status)
        previous = str(order.get("status") or "")
        if status == "closed" and previous != "closed":
            if previous != "completed" or (order.get("repair_verification") or {}).get("passed") is not True:
                raise ValueError("工单关闭前必须完成维修并通过验证")
        if status == "completed" and previous != "completed":
            verification = fields.get("repair_verification") or order.get("repair_verification") or {}
            if not isinstance(verification, Mapping) or verification.get("passed") is not True:
                raise ValueError("维修完成必须提供明确且通过的 repair_verification")
        order.update({key: value for key, value in fields.items() if key not in {"action", "workorder_id"}})
        order["status"] = status
        order["updated_at"] = self._now()
        if status == "in_progress" and not order.get("started_at"):
            order["started_at"] = order["updated_at"]
        if status == "completed":
            order["completed_at"] = order["updated_at"]
        if status == "closed":
            order["closed_at"] = order["updated_at"]
        self._record_event(order, "status_changed" if status != previous else "updated", previous, status, fields)
        value = self.repository.update(order)
        return self._order_result(value)

    def assign_workorder(self, workorder_id: str, assignee: str = "", **_: Any) -> dict[str, Any]:
        return self.update_workorder(workorder_id, status="in_progress", assignee=assignee)

    def submit_repair_feedback(self, workorder_id: str, feedback: Any = "", repair_feedback: Any = None, **_: Any) -> dict[str, Any]:
        order = self._require(workorder_id)
        normalized = dict(repair_feedback or feedback) if isinstance(repair_feedback or feedback, Mapping) else {"feedback": str(feedback or "")}
        order["repair_feedback"] = normalized
        order["updated_at"] = self._now()
        self._record_event(order, "repair_feedback_submitted", order.get("status", ""), order.get("status", ""), normalized)
        value = self.repository.update(order)
        return self._order_result(value)

    def mark_repair_completed(self, workorder_id: str, repair_feedback: Any = None, feedback: Any = None, repair_verification: Mapping[str, Any] | None = None, **_: Any) -> dict[str, Any]:
        verification = dict(repair_verification or {})
        if verification.get("passed") is not True:
            raise ValueError("维修完成必须提供明确且通过的 repair_verification")
        feedback_value = repair_feedback if repair_feedback is not None else feedback
        result = self.submit_repair_feedback(workorder_id, feedback_value or {})
        order = result["workorder"]
        verification.setdefault("status", "verified")
        verification.setdefault("verified_at", self._now())
        order["repair_verification"] = verification
        return self.update_workorder(workorder_id, status="completed", repair_feedback=order.get("repair_feedback") or {}, repair_verification=verification)

    def close_workorder(self, workorder_id: str, reason: str = "", **_: Any) -> dict[str, Any]:
        order = self._require(workorder_id)
        if order.get("status") == "closed":
            return self._order_result(order, already_closed=True)
        if order.get("status") != "completed":
            raise ValueError("工单必须先完成维修（completed）后才能关闭")
        if (order.get("repair_verification") or {}).get("passed") is not True:
            raise ValueError("工单关闭前必须通过维修验证（repair_verification.passed=true）")
        return self.update_workorder(workorder_id, status="closed", closure_reason=reason)

    def reopen_workorder(self, workorder_id: str, **_: Any) -> dict[str, Any]:
        return self.update_workorder(workorder_id, status="open")

    def get_workorder_template(self, device_id: str = "", plan: Mapping[str, Any] | None = None, **_: Any) -> dict[str, Any]:
        return {"template_id": "WO-TPL-MAINT-001", "device_id": device_id, "title": "设备维修工单", "steps": list((plan or {}).get("repair_steps") or []), "source": "backend-service"}

    def submit_workorder_draft(self, **values: Any) -> dict[str, Any]:
        draft_id = str(values.get("draft_id") or "WOD-" + uuid4().hex[:12].upper())
        draft = {**dict(values), "draft_id": draft_id, "submitted": True, "source": "backend-service"}
        self._save_record("workorder_draft", draft_id, draft)
        return draft

    def get_production_status(self, device_id: str = "", **_: Any) -> dict[str, Any]:
        return {"device_id": device_id, "line": "A线", "status": "running", "cycle_state": "processing", "cycle_state_label": "加工中", "source": "backend-service", "checked_at": self._now()}

    def query_technicians(self, **kwargs: Any) -> dict[str, Any]:
        return {"success": True, "items": [{"technician_id": "TECH-001", "name": "张工", "skills": ["机械", "主轴"], "available": True, "workload": 1}], "total": 1, "backend": "backend-service", **kwargs}

    def query_technician_skills(self, technician_id: str = "", **_: Any) -> dict[str, Any]:
        return {"success": True, "items": [{"technician_id": technician_id or "TECH-001", "skills": ["机械", "主轴"]}], "backend": "backend-service"}

    def query_technician_workload(self, technician_id: str = "", **_: Any) -> dict[str, Any]:
        return {"success": True, "items": [{"technician_id": technician_id or "TECH-001", "workload": 1}], "backend": "backend-service"}

    def query_shift(self, **_: Any) -> dict[str, Any]:
        return {"success": True, "shift": "白班", "start": "08:00", "end": "20:00", "backend": "backend-service"}

    def query_team_availability(self, **_: Any) -> dict[str, Any]:
        return {"success": True, "available": True, "team": "设备维修一组", "available_count": 1, "backend": "backend-service"}

    def query_spare_part(self, query: str = "", **_: Any) -> dict[str, Any]:
        item = {"part_no": query or "SP-ASSY-TC820-001", "available": True, "quantity": 4, "stock": 4, "part_id": query or "SP-ASSY-TC820-001", "name": "维修备件"}
        # Keep the generic backend contract compatible with the existing
        # Maintenance Agent, whose local MCP adapter exposes the same record
        # under ``parts``/``stock``.  The aliases are observational only and
        # do not change inventory semantics.
        return {"success": True, "items": [item], "parts": [item], "stock": [item], "backend": "backend-service"}

    query_inventory = query_stock = query_part_availability = query_spare_part

    def qms(self, operation: str, **arguments: Any) -> dict[str, Any]:
        return self.inspection.call(operation, **arguments)

    def persist_report(self, **values: Any) -> dict[str, Any]:
        # Agent Report tools submit {"report": ReportResult}; persist the
        # report itself so list/get and the frontend share one flat contract.
        submitted = values.get("report")
        report = dict(submitted) if isinstance(submitted, Mapping) else dict(values)
        report_id = str(report.get("report_id") or values.get("report_id") or "REPORT-" + uuid4().hex[:10].upper())
        report = {**report, "report_id": report_id, "persisted": True, "updated_at": self._now()}
        report = self._save_record("report", report_id, report)
        return {"success": True, "persisted": True, "report_id": report_id, "report": report, "backend": "backend-service"}

    def get_report(self, report_id: str = "", **_: Any) -> dict[str, Any]:
        report = self._get_record("report", report_id)
        return {"success": bool(report), "found": bool(report), "report_id": report_id, "report": dict(report or {}), "backend": "backend-service"}

    def list_reports(self, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        items = [item for item in self._list_records("report") if not workorder_id or str(item.get("workorder_id") or "") == workorder_id]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def save_experience(self, experience: Mapping[str, Any] | None = None, **values: Any) -> dict[str, Any]:
        item = dict(experience or values)
        key = str(item.get("experience_id") or "EXP-" + uuid4().hex[:10].upper())
        item["experience_id"] = key
        self._experiences[key] = self._save_record("experience", key, item)
        return {"success": True, "experience": dict(item), "experience_id": key, "backend": "backend-service"}

    def search_experience(self, device_id: str = "", limit: int = 20, **filters: Any) -> dict[str, Any]:
        values = list(self._experiences.values())
        if device_id:
            values = [item for item in values if str(item.get("device_id") or "") == device_id]
        return {"success": True, "items": [dict(item) for item in values[-max(1, int(limit)):]], "backend": "backend-service"}

    def create_quality_check(self, operator: str = "", **values: Any) -> dict[str, Any]:
        check_id = "QC-" + uuid4().hex[:12].upper()
        record = {"quality_check_id": check_id, "target_type": "production_part", "target_id": str(values.get("target_id") or values.get("part_id") or ""), "workorder_id": str(values.get("workorder_id") or ""), "part_id": str(values.get("part_id") or ""), "part_no": str(values.get("part_no") or ""), "result": str(values.get("result") or "pending"), "score": values.get("score"), "findings": list(values.get("findings") or []), "items": list(values.get("items") or []), "reviewer": str(values.get("reviewer") or operator), "status": "open", "created_at": self._now(), "updated_at": self._now()}
        self._quality[check_id] = self._save_record("quality", check_id, record)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_check_created", "object_id": check_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "quality_check_id": check_id, "quality_check": dict(record), "backend": "backend-service"}

    def list_quality_checks(self, target_id: str = "", status: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._quality.values() if (not target_id or item.get("target_id") == target_id) and (not status or item.get("status") == status)]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def get_quality_check(self, check_id: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id) or self._get_record("quality", check_id)
        return {"success": bool(item), "quality_check": dict(item or {}), "quality_check_id": check_id, "backend": "backend-service"}

    def submit_quality_appeal(self, check_id: str, reason: str = "", evidence: list[Any] | None = None, operator: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        appeal = {"appeal_id": "APPEAL-" + uuid4().hex[:10].upper(), "quality_check_id": check_id, "reason": reason, "evidence": list(evidence or []), "applicant": operator, "status": "pending", "created_at": self._now()}
        item["status"] = "appealed"
        item.setdefault("appeals", []).append(appeal)
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_appeal_submitted", "object_id": check_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "appeal": appeal, "backend": "backend-service"}

    def create_closure_task(self, operator: str = "", **values: Any) -> dict[str, Any]:
        task_id = "CLOSE-" + uuid4().hex[:12].upper()
        task = {"closure_task_id": task_id, "workorder_id": str(values.get("workorder_id") or ""), "quality_check_id": str(values.get("quality_check_id") or ""), "title": str(values.get("title") or ""), "owner": str(values.get("owner") or ""), "actions": list(values.get("actions") or []), "status": "open", "created_by": operator, "created_at": self._now(), "updated_at": self._now()}
        self._closure_tasks[task_id] = self._save_record("closure", task_id, task)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "closure_task_created", "object_id": task_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "closure_task_id": task_id, "closure_task": dict(task), "backend": "backend-service"}

    def list_closure_tasks(self, status: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._closure_tasks.values() if not status or item.get("status") == status]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def complete_closure_task(self, task_id: str, operator: str = "", note: str = "", **_: Any) -> dict[str, Any]:
        task = self._closure_tasks.get(task_id)
        if task is None:
            raise KeyError("闭环整改任务不存在：%s" % task_id)
        task.update({"status": "completed", "completion_note": note, "completed_by": operator, "completed_at": self._now(), "updated_at": self._now()})
        self._closure_tasks[task_id] = self._save_record("closure", task_id, task)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "closure_task_completed", "object_id": task_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "closure_task": dict(task), "backend": "backend-service"}

    def list_audit_logs(self, object_id: str = "", action: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._audit if (not object_id or item.get("object_id") == object_id) and (not action or item.get("action") == action)]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def _require(self, workorder_id: str) -> dict[str, Any]:
        value = self.repository.get(workorder_id)
        if value is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        return value

    def _get_record(self, record_type: str, record_id: str) -> dict[str, Any] | None:
        loader = getattr(self.repository, "get_record", None)
        if loader is None:
            return None
        value = loader(record_type, record_id)
        return dict(value) if value else None

    @staticmethod
    def _record_event(order: dict[str, Any], action: str, from_status: str, to_status: str, payload: Mapping[str, Any]) -> None:
        event = {"event_id": "WO-EVT-" + uuid4().hex[:12].upper(), "workorder_id": order["workorder_id"], "action": action, "from_status": from_status, "to_status": to_status, "payload": dict(payload or {}), "created_at": datetime.now(timezone.utc).isoformat()}
        order.setdefault("events", []).append(event)
        order.setdefault("status_history", []).append(event)
