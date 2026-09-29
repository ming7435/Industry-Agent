"""确定性的工单、库存、技师和 QMS 业务操作。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping
from uuid import uuid4
import hashlib
import json
import os

from .repository import build_repository
from ..quality import PartInspectionService


class BackendBusinessService:
    VALID_STATUSES = {"open", "in_progress", "awaiting_verification", "completed", "closed", "rejected", "timeout"}
    STATUS_TRANSITIONS = {
        "open": {"open", "in_progress", "rejected", "timeout"},
        "in_progress": {"in_progress", "awaiting_verification", "rejected", "timeout"},
        "awaiting_verification": {"awaiting_verification", "completed", "in_progress"},
        "completed": {"completed", "closed", "in_progress"},
        "closed": {"closed", "open"},
        "rejected": {"rejected", "open"},
        "timeout": {"timeout", "open"},
    }
    REQUIRED_RECOVERY_CHECKS = ("device_identity", "operational", "alarms_clear", "metrics_available")

    def __init__(self, repository: Any | None = None) -> None:
        self.repository = repository or build_repository()
        self.inspection = PartInspectionService()
        self._quality: dict[str, dict[str, Any]] = {str(item.get("quality_check_id")): item for item in self._list_records("quality") if item.get("quality_check_id")}
        self._closure_tasks: dict[str, dict[str, Any]] = {str(item.get("closure_task_id")): item for item in self._list_records("closure") if item.get("closure_task_id")}
        self._audit: list[dict[str, Any]] = self._list_records("audit")
        self._experiences: dict[str, dict[str, Any]] = {str(item.get("experience_id")): item for item in self._list_records("experience") if item.get("experience_id")}
        self._inventory: dict[str, dict[str, Any]] = {}

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
    def _idempotency_fingerprint(values: Mapping[str, Any]) -> str:
        fields = {
            key: values.get(key)
            for key in (
                "device_id", "title", "plan_id", "steps", "required_parts", "repair_target",
                "drawing_context", "alarm_code", "diagnosis_context", "priority", "risk_level",
                "source", "event_id", "diagnosis_snapshot", "maintenance_plan_snapshot",
            )
        }
        encoded = json.dumps(fields, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)
        return hashlib.sha256(encoded.encode("utf-8")).hexdigest()

    @staticmethod
    def _order_result(order: Mapping[str, Any], **extra: Any) -> dict[str, Any]:
        value = dict(order)
        return {**value, "success": True, "workorder": value, "workorder_id": str(value.get("workorder_id") or ""), "backend": "backend-service", **extra}

    def create_workorder(self, **values: Any) -> dict[str, Any]:
        fingerprint = self._idempotency_fingerprint(values)
        order = {
            "workorder_id": "WO-" + uuid4().hex[:10].upper(),
            "device_id": str(values.get("device_id") or "unknown"), "status": "open",
            "title": str(values.get("title") or "设备维修工单"), "plan_id": str(values.get("plan_id") or ""),
            "steps": list(values.get("steps") or values.get("repair_steps") or []),
            "required_parts": list(values.get("required_parts") or []),
            "repair_target": dict(values.get("repair_target") or values.get("target_part") or {}),
            "drawing_context": dict(values.get("drawing_context") or values.get("engineering_context") or {}),
            "alarm_code": str(values.get("alarm_code") or ""), "diagnosis_context": dict(values.get("diagnosis_context") or values.get("diagnosis") or {}),
            "repair_feedback": {}, "repair_verification": {}, "status_history": [], "events": [],
            "priority": str(values.get("priority") or "normal"), "risk_level": str(values.get("risk_level") or ""),
            "source": str(values.get("source") or "backend"), "idempotency_key": str(values.get("idempotency_key") or ""),
            "event_id": str(values.get("event_id") or ""), "diagnosis_snapshot": dict(values.get("diagnosis_snapshot") or values.get("diagnosis") or {}),
            "maintenance_plan_snapshot": dict(values.get("maintenance_plan_snapshot") or values.get("maintenance_plan") or {}),
            "created_at": self._now(), "updated_at": self._now(),
            "idempotency_fingerprint": fingerprint,
        }
        existing = self.repository.create(order)
        if str(existing.get("workorder_id") or "") != str(order.get("workorder_id") or ""):
            existing_fingerprint = str(existing.get("idempotency_fingerprint") or self._idempotency_fingerprint(existing))
            if existing_fingerprint != fingerprint:
                raise ValueError("幂等键已绑定不同的工单参数")
            return self._order_result(existing)
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

    def delete_workorder(self, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        workorder_id = str(workorder_id or "").strip()
        if not workorder_id:
            raise ValueError("workorder_id 不能为空")
        order = self.repository.get(workorder_id)
        if order is None:
            return {"success": False, "deleted": False, "found": False, "workorder_id": workorder_id, "backend": "backend-service"}
        if str(order.get("status") or "open") not in {"open", "rejected", "timeout"} or order.get("repair_feedback") or order.get("repair_verification"):
            raise ValueError("只有未开始且没有维修结果的工单允许删除")
        deleted = bool(getattr(self.repository, "delete", lambda _id: False)(workorder_id))
        return {"success": deleted, "deleted": deleted, "found": deleted, "workorder_id": workorder_id, "backend": "backend-service"}

    def update_workorder(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> dict[str, Any]:
        order = self.repository.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        if status not in self.VALID_STATUSES:
            raise ValueError("无效工单状态：%s" % status)
        previous = str(order.get("status") or "")
        allowed = self.STATUS_TRANSITIONS.get(previous, set())
        if status not in allowed:
            raise ValueError("不允许的工单状态迁移：%s -> %s" % (previous, status))
        if status == "closed" and previous != "closed":
            if previous != "completed" or not self._verification_is_valid(order.get("repair_verification"), order):
                raise ValueError("工单关闭前必须完成维修并通过基于设备恢复数据的验证")
        if previous == "closed" and status != "open":
            immutable = {"repair_feedback", "repair_verification", "maintenance_plan_snapshot", "diagnosis_snapshot", "steps", "repair_target"}
            if immutable.intersection(fields):
                raise ValueError("已关闭工单的维修事实已冻结，请先重开工单")
        if previous == "closed" and status == "open":
            immutable = {"repair_feedback", "repair_verification", "maintenance_plan_snapshot", "diagnosis_snapshot", "steps", "repair_target"}
            if immutable.intersection(fields):
                raise ValueError("重开工单仅允许改变状态，维修事实仍保持冻结")
        if status == "in_progress" and previous != "in_progress" and not str(fields.get("assignee") or order.get("assignee") or "").strip():
            raise ValueError("进入 in_progress 前必须完成派工并提供 assignee")
        if previous == "awaiting_verification" and status == "in_progress":
            failed_verification = fields.get("repair_verification")
            if not isinstance(failed_verification, Mapping) or failed_verification.get("passed") is not False:
                raise ValueError("验证失败回退必须提交 passed=false 的 repair_verification")
        candidate = {**order, **fields, "status": status}
        if status == "completed" and not self._verification_is_valid(candidate.get("repair_verification"), candidate):
            raise ValueError("维修完成必须提供基于设备恢复数据且通过的 repair_verification")
        if status == "closed" and not self._verification_is_valid(candidate.get("repair_verification"), candidate):
            raise ValueError("工单关闭前必须通过基于设备恢复数据的维修验证")
        if status == "completed" and previous != "completed":
            verification = fields.get("repair_verification") or order.get("repair_verification") or {}
            if not self._verification_is_valid(verification, order):
                raise ValueError("维修完成必须提供基于设备恢复数据且通过的 repair_verification")
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
        assignee = str(assignee or "").strip()
        if not assignee:
            raise ValueError("派工必须提供 assignee")
        candidates = self.query_technicians().get("items") or []
        candidate = next((item for item in candidates if str(item.get("technician_id") or "") == assignee), None)
        if not candidate:
            raise ValueError("技师不存在：%s" % assignee)
        if candidate.get("available") is False:
            raise ValueError("技师当前不可用：%s" % assignee)
        self._reserve_required_parts(self._require(workorder_id))
        return self.update_workorder(workorder_id, status="in_progress", assignee=assignee)

    def submit_repair_feedback(self, workorder_id: str, feedback: Any = "", repair_feedback: Any = None, **_: Any) -> dict[str, Any]:
        order = self._require(workorder_id)
        if str(order.get("status") or "") not in {"in_progress", "awaiting_verification"}:
            raise ValueError("只有 in_progress 或 awaiting_verification 工单可以提交维修反馈")
        normalized = dict(repair_feedback or feedback) if isinstance(repair_feedback or feedback, Mapping) else {"feedback": str(feedback or "")}
        order["repair_feedback"] = normalized
        order["updated_at"] = self._now()
        self._record_event(order, "repair_feedback_submitted", order.get("status", ""), order.get("status", ""), normalized)
        value = self.repository.update(order)
        return self._order_result(value)

    def mark_repair_completed(self, workorder_id: str, repair_feedback: Any = None, feedback: Any = None, repair_verification: Mapping[str, Any] | None = None, **_: Any) -> dict[str, Any]:
        current = self._require(workorder_id)
        if str(current.get("status") or "") != "in_progress":
            raise ValueError("维修提交前工单必须处于 in_progress，不能跳过派工")
        if not str(current.get("assignee") or "").strip() or not current.get("started_at"):
            raise ValueError("维修提交前必须完成派工并记录 started_at")
        supplied = dict(repair_verification or {})
        recovery = supplied.get("device_recovery") or supplied.get("recovery_snapshot")
        if not isinstance(recovery, Mapping):
            raise ValueError("维修完成必须提供设备恢复数据，不能只提交 passed=true")
        feedback_value = repair_feedback if repair_feedback is not None else feedback
        if not self._has_feedback(feedback_value):
            raise ValueError("维修完成必须提供实际维修反馈")
        result = self.submit_repair_feedback(workorder_id, feedback_value or {})
        order = result["workorder"]
        verification = self._build_repair_verification(order, recovery, order.get("repair_feedback") or {})
        if not verification["passed"]:
            raise ValueError("设备恢复数据未通过维修验证：%s" % "、".join(verification.get("validation_findings") or []))
        order = self.update_workorder(workorder_id, status="awaiting_verification", repair_feedback=order.get("repair_feedback") or {}, repair_verification=verification)
        order["repair_verification"] = verification
        return self.update_workorder(workorder_id, status="completed", repair_feedback=order.get("repair_feedback") or {}, repair_verification=verification)

    def record_repair_verification_failed(self, workorder_id: str, repair_verification: Mapping[str, Any] | None = None, reason: str = "", **_: Any) -> dict[str, Any]:
        """记录验证失败事件，禁止无证据地从待验证直接改回处理中。"""
        order = self._require(workorder_id)
        if str(order.get("status") or "") != "awaiting_verification":
            raise ValueError("只有 awaiting_verification 工单可以记录验证失败")
        verification = dict(repair_verification or {})
        verification["passed"] = False
        verification["status"] = "failed"
        verification.setdefault("source", "device_recovery")
        if reason:
            verification.setdefault("validation_findings", []).append(str(reason))
        return self.update_workorder(workorder_id, status="in_progress", repair_verification=verification)

    def close_workorder(self, workorder_id: str, reason: str = "", **_: Any) -> dict[str, Any]:
        order = self._require(workorder_id)
        if order.get("status") == "closed":
            return self._order_result(order, already_closed=True)
        if order.get("status") != "completed":
            raise ValueError("工单必须先完成维修（completed）后才能关闭")
        if not self._verification_is_valid(order.get("repair_verification"), order):
            raise ValueError("工单关闭前必须通过基于设备恢复数据的维修验证")
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
        return {"device_id": device_id, "line": "A线", "status": "running", "cycle_state": "processing", "cycle_state_label": "加工中", "source": "backend-local-fixture", "synthetic": True, "degraded": True, "checked_at": self._now()}

    def query_technicians(self, **kwargs: Any) -> dict[str, Any]:
        item = {"technician_id": "TECH-001", "name": "张工", "skills": ["机械", "主轴"], "available": True, "workload": 1, "synthetic": True, "degraded": True}
        return {"success": True, "items": [item], "total": 1, "backend": "backend-local-fixture", "synthetic": True, "degraded": True, **kwargs}

    def query_technician_skills(self, technician_id: str = "", **_: Any) -> dict[str, Any]:
        return {"success": True, "items": [{"technician_id": technician_id or "TECH-001", "skills": ["机械", "主轴"], "synthetic": True}], "backend": "backend-local-fixture", "synthetic": True, "degraded": True}

    def query_technician_workload(self, technician_id: str = "", **_: Any) -> dict[str, Any]:
        return {"success": True, "items": [{"technician_id": technician_id or "TECH-001", "workload": 1, "synthetic": True}], "backend": "backend-local-fixture", "synthetic": True, "degraded": True}

    def query_shift(self, **_: Any) -> dict[str, Any]:
        return {"success": True, "shift": "白班", "start": "08:00", "end": "20:00", "backend": "backend-local-fixture", "synthetic": True, "degraded": True}

    def query_team_availability(self, **_: Any) -> dict[str, Any]:
        return {"success": True, "available": True, "team": "设备维修一组", "available_count": 1, "backend": "backend-local-fixture", "synthetic": True, "degraded": True}

    def query_spare_part(self, query: str = "", **_: Any) -> dict[str, Any]:
        part_no = query or "SP-ASSY-TC820-001"
        item = dict(self._inventory.get(part_no) or {"part_no": part_no, "available": True, "quantity": 4, "stock": 4, "part_id": part_no, "name": "维修备件", "reserved": 0, "consumed": 0, "synthetic": True})
        # 保持通用后端契约与现有维修 Agent 兼容；本地 MCP 适配器会在
        # ``parts``/``stock`` 下暴露同一条记录。这些别名只用于观察，
        # 不改变库存语义。
        return {"success": True, "items": [item], "parts": [item], "stock": [item], "backend": "backend-service", "synthetic": bool(item.get("synthetic")), "inventory_status": "demo_only" if item.get("synthetic") else "ready"}

    def reserve_inventory(self, part_no: str, quantity: int = 1, workorder_id: str = "", **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单预留")
        amount = max(1, int(quantity))
        if int(item.get("stock") or 0) - int(item.get("reserved") or 0) < amount:
            raise ValueError("库存不足，无法预留")
        item["reserved"] = int(item.get("reserved") or 0) + amount
        item["reservation_id"] = "RES-" + uuid4().hex[:10].upper()
        self._inventory[str(part_no)] = item
        return {"success": True, "reservation": dict(item), "backend": "backend-service"}

    def release_inventory(self, part_no: str, quantity: int = 1, **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单释放")
        item["reserved"] = max(0, int(item.get("reserved") or 0) - max(1, int(quantity)))
        self._inventory[str(part_no)] = item
        return {"success": True, "inventory": dict(item), "backend": "backend-service"}

    def consume_inventory(self, part_no: str, quantity: int = 1, **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单消耗")
        amount = max(1, int(quantity))
        if int(item.get("reserved") or 0) < amount:
            raise ValueError("未预留足量库存，不能消耗")
        item["reserved"] -= amount
        item["stock"] -= amount
        item["quantity"] = item["stock"]
        item["consumed"] = int(item.get("consumed") or 0) + amount
        self._inventory[str(part_no)] = item
        return {"success": True, "inventory": dict(item), "backend": "backend-service"}

    def return_inventory(self, part_no: str, quantity: int = 1, **_: Any) -> dict[str, Any]:
        item = self.query_spare_part(part_no)["items"][0]
        if item.get("synthetic"):
            raise ValueError("演示库存不能被正式工单归还")
        item["stock"] = int(item.get("stock") or 0) + max(1, int(quantity))
        item["quantity"] = item["stock"]
        self._inventory[str(part_no)] = item
        return {"success": True, "inventory": dict(item), "backend": "backend-service"}

    query_inventory = query_stock = query_part_availability = query_spare_part

    def qms(self, operation: str, **arguments: Any) -> dict[str, Any]:
        return self.inspection.call(operation, **arguments)

    def persist_report(self, **values: Any) -> dict[str, Any]:
        # Agent 报告工具提交 {"report": ReportResult}；直接持久化报告本身，
        # 使列表、详情接口和前端共用同一个扁平契约。
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

    def delete_report(self, report_id: str = "", **_: Any) -> dict[str, Any]:
        report_id = str(report_id or "").strip()
        if not report_id:
            raise ValueError("report_id 不能为空")
        deleted = bool(getattr(self.repository, "delete_record", lambda *_args: False)("report", report_id))
        return {"success": deleted, "deleted": deleted, "found": deleted, "report_id": report_id, "backend": "backend-service"}

    def save_experience(self, experience: Mapping[str, Any] | None = None, **values: Any) -> dict[str, Any]:
        item = dict(experience or values)
        source_workorder = str(item.get("source_workorder") or item.get("workorder_id") or "").strip()
        if not source_workorder:
            raise ValueError("经验记录必须关联 source_workorder")
        source_order = self.repository.get(source_workorder)
        if source_order is None or str(source_order.get("status") or "") != "closed":
            raise ValueError("经验记录只能来自已关闭工单")
        if not self._verification_is_valid(source_order.get("repair_verification"), source_order, enforce_freshness=False):
            raise ValueError("经验记录来源工单缺少有效设备恢复验证")
        try:
            quality_score = float(item.get("experience_quality_score") or 0.0)
        except (TypeError, ValueError):
            quality_score = 0.0
        if str(item.get("validation_status") or "") not in {"accepted", "duplicate"} or quality_score < 0.8:
            raise ValueError("经验记录尚未通过质量准入校验")
        if self._contains_untrusted_flag(item) or self._contains_untrusted_flag(source_order):
            raise ValueError("合成演示数据不得写入经验库")
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
        result = str(values.get("result") or "pending").lower()
        if result not in {"pending", "passed", "failed", "minor_issue", "major_issue", "high_risk"}:
            result = "pending"
        if result == "passed" and not self._quality_evidence_is_complete(values):
            # 只有通用备注或任意 evidence 不能证明尺寸、外观、材料、功能和工艺均已检测。
            result = "pending"
        workflow_status = "passed" if result == "passed" else "failed" if result in {"failed", "minor_issue", "major_issue", "high_risk"} else "open"
        record = {
            "quality_check_id": check_id,
            "target_type": "production_part",
            "target_id": str(values.get("target_id") or values.get("part_id") or ""),
            "workorder_id": str(values.get("workorder_id") or ""),
            "part_id": str(values.get("part_id") or ""),
            "part_no": str(values.get("part_no") or ""),
            "batch_id": str(values.get("batch_id") or ""),
            "production_order_id": str(values.get("production_order_id") or ""),
            "inspection_type": str(values.get("inspection_type") or "part_quality"),
            "score": values.get("score"),
            "result": result,
            "findings": list(values.get("findings") or []),
            "items": list(values.get("items") or []),
            "quality_validation": dict(values.get("quality_validation") or values.get("inspection_summary") or {}),
            "evidence": list(values.get("evidence") or values.get("inspection_evidence") or []),
            "reviewer": str(values.get("reviewer") or operator),
            "risk_level": str(values.get("risk_level") or "R1"),
            "status": workflow_status,
            "reinspection": {},
            "created_at": self._now(),
            "updated_at": self._now(),
        }
        self._quality[check_id] = self._save_record("quality", check_id, record)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_check_created", "object_id": check_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "quality_check_id": check_id, "quality_check": dict(record), "backend": "backend-service"}

    def list_quality_checks(self, target_id: str = "", status: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._quality.values() if (not target_id or item.get("target_id") == target_id) and (not status or item.get("status") == status)]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def get_quality_check(self, check_id: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id) or self._get_record("quality", check_id)
        return {"success": bool(item), "quality_check": dict(item or {}), "quality_check_id": check_id, "backend": "backend-service"}

    def submit_quality_appeal(self, check_id: str, reason: str = "", evidence: list[Any] | None = None, operator: str = "", applicant: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        appeal = {"appeal_id": "APPEAL-" + uuid4().hex[:10].upper(), "quality_check_id": check_id, "reason": reason, "evidence": list(evidence or []), "applicant": applicant or operator, "status": "pending", "created_at": self._now()}
        item["status"] = "appealed"
        item.setdefault("appeals", []).append(appeal)
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_appeal_submitted", "object_id": check_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "appeal": appeal, "backend": "backend-service"}

    def resolve_quality_appeal(self, check_id: str, appeal_id: str = "", decision: str = "approved", reason: str = "", operator: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        appeals = list(item.get("appeals") or [])
        appeal = next((value for value in appeals if not appeal_id or value.get("appeal_id") == appeal_id), None)
        if appeal is None:
            raise KeyError("申诉记录不存在：%s" % appeal_id)
        decision = str(decision or "approved").lower()
        if decision not in {"approved", "rejected", "withdrawn", "closed"}:
            raise ValueError("无效申诉结论：%s" % decision)
        if appeal.get("status") != "pending":
            raise ValueError("申诉已结束，不能重复处理")
        appeal.update({"status": decision, "resolution_reason": reason, "resolved_by": operator, "resolved_at": self._now()})
        item["appeals"] = appeals
        # 申诉批准后必须重新整改并复检，不能停留在 appealed 状态。
        item["status"] = "rectification" if decision == "approved" else decision
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_appeal_resolved", "object_id": check_id, "operator": operator, "decision": decision, "created_at": self._now()})
        return {"success": True, "appeal": dict(appeal), "quality_check": dict(item), "backend": "backend-service"}

    def create_closure_task(self, operator: str = "", **values: Any) -> dict[str, Any]:
        quality_check_id = str(values.get("quality_check_id") or "")
        quality_check = self._quality.get(quality_check_id) if quality_check_id else None
        if quality_check_id and quality_check is None:
            raise KeyError("质检记录不存在：%s" % quality_check_id)
        if quality_check and quality_check.get("status") not in {"failed", "rectification", "appealed", "passed", "open"}:
            raise ValueError("当前质检状态不能创建整改任务：%s" % quality_check.get("status"))
        task_id = "CLOSE-" + uuid4().hex[:12].upper()
        task = {"closure_task_id": task_id, "workorder_id": str(values.get("workorder_id") or ""), "quality_check_id": quality_check_id, "title": str(values.get("title") or ""), "owner": str(values.get("owner") or ""), "actions": list(values.get("actions") or []), "due_at": str(values.get("due_at") or ""), "status": "open", "created_by": operator, "created_at": self._now(), "updated_at": self._now()}
        self._closure_tasks[task_id] = self._save_record("closure", task_id, task)
        if quality_check and quality_check.get("status") in {"failed", "rectification"}:
            quality_check["status"] = "rectification"
            quality_check["updated_at"] = self._now()
            self._quality[quality_check_id] = self._save_record("quality", quality_check_id, quality_check)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "closure_task_created", "object_id": task_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "closure_task_id": task_id, "closure_task": dict(task), "backend": "backend-service"}

    def list_closure_tasks(self, status: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._closure_tasks.values() if not status or item.get("status") == status]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def complete_closure_task(self, task_id: str, operator: str = "", note: str = "", **_: Any) -> dict[str, Any]:
        task = self._closure_tasks.get(task_id)
        if task is None:
            raise KeyError("闭环整改任务不存在：%s" % task_id)
        if task.get("status") != "open":
            raise ValueError("整改任务已经完成，不能重复提交")
        task.update({"status": "completed", "completion_note": note, "completed_by": operator, "completed_at": self._now(), "updated_at": self._now()})
        self._closure_tasks[task_id] = self._save_record("closure", task_id, task)
        quality_check_id = str(task.get("quality_check_id") or "")
        quality_check = self._quality.get(quality_check_id) if quality_check_id else None
        if quality_check and quality_check.get("status") == "rectification":
            related = [
                item for item in self._closure_tasks.values()
                if str(item.get("quality_check_id") or "") == quality_check_id
            ]
            if related and all(item.get("status") == "completed" for item in related):
                quality_check["status"] = "reinspection"
                quality_check["updated_at"] = self._now()
                self._quality[quality_check_id] = self._save_record("quality", quality_check_id, quality_check)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "closure_task_completed", "object_id": task_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "closure_task": dict(task), "backend": "backend-service"}

    def reinspect_quality_check(self, check_id: str, passed: bool = False, findings: list[Any] | None = None, evidence: list[Any] | None = None, operator: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id) or self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if item.get("status") != "reinspection":
            raise ValueError("只有完成整改的质检记录才能复检")
        if passed and not evidence:
            raise ValueError("复检通过必须提供检测证据")
        reinspection = {"passed": bool(passed), "findings": list(findings or []), "evidence": list(evidence or []), "operator": operator, "checked_at": self._now()}
        item["reinspection"] = reinspection
        item["status"] = "reinspection" if passed else "failed"
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_reinspection_recorded", "object_id": check_id, "operator": operator, "passed": bool(passed), "created_at": self._now()})
        return {"success": True, "quality_check": dict(item), "quality_check_id": check_id, "backend": "backend-service"}

    def release_quality_check(self, check_id: str, operator: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id) or self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        direct_pass = item.get("status") == "passed" and bool(item.get("evidence") or item.get("items"))
        reinspected_pass = item.get("status") == "reinspection" and (item.get("reinspection") or {}).get("passed") is True
        if not direct_pass and not reinspected_pass:
            raise ValueError("质检未通过有效检测或复检，不能 Release")
        item["status"] = "released"
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_released", "object_id": check_id, "operator": operator, "created_at": self._now()})
        return {"success": True, "quality_check": dict(item), "quality_check_id": check_id, "backend": "backend-service"}

    def close_quality_check(self, check_id: str, operator: str = "", note: str = "", **_: Any) -> dict[str, Any]:
        item = self._quality.get(check_id) or self._get_record("quality", check_id)
        if item is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if item.get("status") != "released":
            raise ValueError("只有 Release 后的质检记录才能 Close")
        item["status"] = "closed"
        item["close_note"] = note
        item["updated_at"] = self._now()
        self._quality[check_id] = self._save_record("quality", check_id, item)
        self._append_audit({"audit_id": "AUDIT-" + uuid4().hex[:10].upper(), "action": "quality_closed", "object_id": check_id, "operator": operator, "note": note, "created_at": self._now()})
        return {"success": True, "quality_check": dict(item), "quality_check_id": check_id, "backend": "backend-service"}

    def list_audit_logs(self, object_id: str = "", action: str = "", **_: Any) -> dict[str, Any]:
        items = [dict(item) for item in self._audit if (not object_id or item.get("object_id") == object_id) and (not action or item.get("action") == action)]
        return {"success": True, "items": items, "count": len(items), "backend": "backend-service"}

    def _require(self, workorder_id: str) -> dict[str, Any]:
        value = self.repository.get(workorder_id)
        if value is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        return value

    def _reserve_required_parts(self, order: Mapping[str, Any]) -> None:
        """派工前预留维修方案声明的备件，避免未锁库存就进入执行中。"""
        reservations = dict(order.get("inventory_reservations") or {})
        for raw in order.get("required_parts") or []:
            item = raw if isinstance(raw, Mapping) else {"part_no": str(raw)}
            part_no = str(item.get("part_no") or item.get("part_id") or "").strip()
            if not part_no:
                raise ValueError("维修方案中的备件缺少 part_no，不能派工")
            quantity = max(1, int(item.get("quantity") or 1))
            if part_no in reservations and int(reservations[part_no].get("quantity") or 0) >= quantity:
                continue
            reservation = self.reserve_inventory(part_no=part_no, quantity=quantity, workorder_id=str(order.get("workorder_id") or ""))
            reservations[part_no] = {"reservation_id": (reservation.get("reservation") or {}).get("reservation_id", ""), "quantity": quantity}
        if reservations and str(order.get("workorder_id") or ""):
            order_value = dict(order)
            order_value["inventory_reservations"] = reservations
            self.repository.update(order_value)

    @staticmethod
    def _has_feedback(value: Any) -> bool:
        if isinstance(value, Mapping):
            return any(str(value.get(key) or "").strip() for key in ("feedback", "summary", "result", "content", "repair_feedback"))
        return bool(str(value or "").strip())

    @staticmethod
    def _contains_untrusted_flag(value: Any) -> bool:
        if isinstance(value, Mapping):
            if value.get("synthetic") is True or value.get("is_synthetic") is True or value.get("degraded") is True:
                return True
            return any(BackendBusinessService._contains_untrusted_flag(item) for item in value.values())
        if isinstance(value, (list, tuple, set)):
            return any(BackendBusinessService._contains_untrusted_flag(item) for item in value)
        return False

    @staticmethod
    def _quality_evidence_is_complete(values: Mapping[str, Any]) -> bool:
        checks = values.get("quality_validation") or values.get("inspection_summary") or values.get("checks")
        if not isinstance(checks, Mapping):
            return False
        required = ("dimensions", "appearance", "material", "function", "process")
        return all(
            isinstance(checks.get(key), Mapping)
            and checks[key].get("passed") is True
            and checks[key].get("sufficient_data") is True
            and str(checks[key].get("status") or "").lower() == "pass"
            and bool(checks[key].get("items"))
            for key in required
        )

    @classmethod
    def _verification_is_valid(cls, verification: Any, order: Mapping[str, Any], *, enforce_freshness: bool = True) -> bool:
        if not isinstance(verification, Mapping) or verification.get("passed") is not True:
            return False
        if verification.get("source") != "device_recovery":
            return False
        recovery = verification.get("device_recovery")
        checks = verification.get("checks")
        return isinstance(recovery, Mapping) and isinstance(checks, Mapping) and all(checks.get(key) is True for key in cls.REQUIRED_RECOVERY_CHECKS) and (not enforce_freshness or cls._recovery_is_fresh(recovery))

    @classmethod
    def _build_repair_verification(cls, order: Mapping[str, Any], recovery: Mapping[str, Any], feedback: Mapping[str, Any]) -> dict[str, Any]:
        values = dict(recovery)
        device_id = str(order.get("device_id") or "")
        recovery_device_id = str(values.get("device_id") or values.get("id") or "")
        status = str(values.get("status") or values.get("state") or "").lower()
        fault_evidence = values.get("fault_evidence") if isinstance(values.get("fault_evidence"), Mapping) else {}
        active_alarms = values.get("active_alarms")
        alarms_clear = not bool(values.get("alarm_code") or active_alarms or fault_evidence.get("active"))
        metrics = values.get("metrics") or values.get("metric_details")
        checks = {
            "device_identity": bool(device_id and recovery_device_id and device_id == recovery_device_id),
            "operational": status in {"running", "idle", "ready", "standby", "normal", "completed"}
            or (status in {"stopped", "paused"} and values.get("restart_requested") is True),
            "alarms_clear": alarms_clear,
            "metrics_available": isinstance(metrics, Mapping) and bool(metrics),
            "recovery_fresh": cls._recovery_is_fresh(values),
        }
        findings: list[str] = []
        if not checks["device_identity"]:
            findings.append("设备身份与工单不一致")
        if not checks["operational"]:
            findings.append("设备未恢复到可运行状态")
        if not checks["alarms_clear"]:
            findings.append("设备仍存在活动报警或故障证据")
        if not checks["metrics_available"]:
            findings.append("缺少设备恢复指标")
        if not checks["recovery_fresh"]:
            findings.append("recovery_fresh")
        return {
            "source": "device_recovery",
            "passed": not findings,
            "device_recovery": values,
            "checks": checks,
            "validation_findings": findings,
            "feedback": dict(feedback or {}),
            "status": "verified" if not findings else "failed",
            "verified_at": cls._now(),
        }

    @staticmethod
    def _recovery_is_fresh(recovery: Mapping[str, Any], *, now: datetime | None = None) -> bool:
        if any(recovery.get(key) is True for key in ("stale", "expired", "is_stale")):
            return False
        raw_checked_at = recovery.get("checked_at") or recovery.get("timestamp") or recovery.get("updated_at")
        if not raw_checked_at:
            return False
        try:
            _checked_at = datetime.fromisoformat(str(raw_checked_at).replace("Z", "+00:00"))
            if _checked_at.tzinfo is None:
                _checked_at = _checked_at.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            return False
        current = now or datetime.now(timezone.utc)
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        try:
            max_age = float(os.getenv("RECOVERY_MAX_AGE_SECONDS", "86400"))
            clock_skew = float(os.getenv("RECOVERY_CLOCK_SKEW_SECONDS", "30"))
        except (TypeError, ValueError):
            return False
        if max_age < 0 or clock_skew < 0:
            return False
        age = (current - _checked_at).total_seconds()
        if age > max_age or age < -clock_skew:
            return False
        raw_expires_at = recovery.get("expires_at")
        if not raw_expires_at:
            return True
        try:
            expires_at = datetime.fromisoformat(str(raw_expires_at).replace("Z", "+00:00"))
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            return False
        return expires_at > current

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
