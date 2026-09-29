"""质检、整改和审计的闭环服务。

配置 MYSQL_HOST 后自动使用 MySQL；未配置时保留进程内存回退，便于本地演示。
"""

from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any, Mapping
from uuid import uuid4

from .store import build_closure_store


def _quality_evidence_is_complete(values: Mapping[str, Any]) -> bool:
    checks = values.get("quality_validation") or values.get("inspection_summary") or values.get("checks")
    if not isinstance(checks, Mapping):
        return False
    required = ("dimensions", "appearance", "material", "function", "process")
    return all(
        checks.get(key) is True
        or (isinstance(checks.get(key), Mapping) and checks[key].get("passed") is True)
        for key in required
    )


class ClosureService:
    """统一管理质检记录、质检申诉、整改任务和审计事件。"""

    def __init__(self, trace: Any | None = None, store: Any | None = None) -> None:
        self.trace = trace
        self.store = store or build_closure_store()
        self.backend = getattr(self.store, "backend", "memory")
        self._lock = Lock()
        self._quality_checks: dict[str, dict[str, Any]] = {}
        self._appeals: dict[str, list[dict[str, Any]]] = {}
        self._closure_tasks: dict[str, dict[str, Any]] = {}
        self._audit_logs: list[dict[str, Any]] = []

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _id(prefix: str) -> str:
        return "%s-%s" % (prefix, uuid4().hex[:12].upper())

    def create_quality_check(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        values = dict(payload)
        if values.get("target_type", "production_part") != "production_part":
            raise ValueError("Quality checks only support production_part targets")
        if values.get("inspection_type", "part_quality") != "part_quality":
            raise ValueError("Quality checks only support part_quality inspections")
        check_id = self._id("QC")
        result = str(values.get("result") or "pending").lower()
        if result not in {"pending", "passed", "failed", "minor_issue", "major_issue", "high_risk"}:
            result = "pending"
        evidence = list(values.get("evidence") or values.get("inspection_evidence") or values.get("items") or [])
        if result == "passed" and not _quality_evidence_is_complete(values):
            # 只有通用备注或任意 evidence 不能证明尺寸、外观、材料、功能和工艺均已检测。
            result = "pending"
        if result == "passed":
            workflow_status = "passed"
        elif result in {"failed", "minor_issue", "major_issue", "high_risk"}:
            workflow_status = "failed"
        else:
            workflow_status = "open"
        record = {
            "quality_check_id": check_id,
            "target_type": "production_part",
            "target_id": str(values.get("target_id") or ""),
            "workorder_id": str(values.get("workorder_id") or ""),
            "part_id": str(values.get("part_id") or ""),
            "part_no": str(values.get("part_no") or ""),
            "batch_id": str(values.get("batch_id") or ""),
            "production_order_id": str(values.get("production_order_id") or ""),
            "inspection_type": "part_quality",
            "score": values.get("score"),
            "result": result,
            "findings": list(values.get("findings") or []),
            "items": list(values.get("items") or []),
            "evidence": evidence,
            "reviewer": str(values.get("reviewer") or operator or ""),
            "risk_level": str(values.get("risk_level") or "R1"),
            "status": workflow_status,
            "reinspection": {},
            "appeal_ids": [],
            "created_at": self._now(),
            "updated_at": self._now(),
        }
        with self._lock:
            self._quality_checks[check_id] = record
        if self.store:
            self.store.create_quality_check(record)
        self._audit("quality_check_created", check_id, operator, {"result": result, "target_id": record["target_id"]})
        return dict(record)

    def record_part_quality(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        """使用共享质量 Schema 持久化一次生产零件检验。"""

        values = dict(payload)
        part_id = str(values.get("part_id") or values.get("target_id") or "")
        values.setdefault("target_type", "production_part")
        values.setdefault("target_id", part_id or str(values.get("part_no") or ""))
        values.setdefault("inspection_type", "part_quality")
        return self.create_quality_check(values, operator=operator)

    def list_quality_checks(self, target_id: str = "", status: str = "") -> list[dict[str, Any]]:
        if self.store:
            return self.store.list_quality_checks(target_id=target_id, status=status)
        with self._lock:
            values = list(self._quality_checks.values())
        return [
            dict(item)
            for item in values
            if (not target_id or item.get("target_id") == target_id)
            and (not status or item.get("status") == status)
        ]

    def get_quality_check(self, check_id: str) -> dict[str, Any] | None:
        if self.store:
            return self.store.get_quality_check(check_id)
        with self._lock:
            item = self._quality_checks.get(check_id)
            return dict(item) if item else None

    def submit_appeal(self, check_id: str, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        with self._lock:
            appeal_id = self._id("APPEAL")
            appeal = {
                "appeal_id": appeal_id,
                "quality_check_id": check_id,
                "reason": str(payload.get("reason") or ""),
                "evidence": list(payload.get("evidence") or []),
                "applicant": str(payload.get("applicant") or operator or ""),
                "status": "pending",
                "created_at": self._now(),
            }
            self._appeals.setdefault(check_id, []).append(appeal)
            check["appeal_ids"] = list(check.get("appeal_ids") or []) + [appeal_id]
            check["status"] = "appealed"
            check["updated_at"] = self._now()
            self._quality_checks[check_id] = dict(check)
        if self.store:
            self.store.create_appeal(appeal)
            self.store.update_quality_check(check_id, {"appeal_ids": check["appeal_ids"], "status": "appealed", "updated_at": check["updated_at"]})
        self._audit("quality_appeal_submitted", check_id, operator, {"appeal_id": appeal_id})
        return dict(appeal)

    def resolve_appeal(
        self,
        check_id: str,
        appeal_id: str = "",
        decision: str = "approved",
        reason: str = "",
        operator: str = "",
    ) -> dict[str, Any]:
        """处理质检申诉，并把批准的申诉送入整改流程。"""

        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        decision = str(decision or "approved").lower()
        if decision not in {"approved", "rejected", "withdrawn", "closed"}:
            raise ValueError("无效申诉结论：%s" % decision)
        appeals = list(self._appeals.get(check_id) or [])
        appeal = next((item for item in appeals if not appeal_id or item.get("appeal_id") == appeal_id), None)
        if appeal is None and self.store:
            stored = getattr(self.store, "list_appeals", lambda _check_id: [])(check_id)
            appeal = next((item for item in stored if not appeal_id or item.get("appeal_id") == appeal_id), None)
            if appeal is not None:
                appeals.append(dict(appeal))
        if appeal is None:
            raise KeyError("申诉记录不存在：%s" % appeal_id)
        if appeal.get("status") != "pending":
            raise ValueError("申诉已结束，不能重复处理")
        appeal.update({"status": decision, "resolution_reason": reason, "resolved_by": operator, "resolved_at": self._now()})
        with self._lock:
            self._appeals[check_id] = appeals
        if decision == "approved":
            next_status = "rectification"
        else:
            next_status = decision
        result = self._set_quality_status(check_id, next_status, operator, {})
        self._audit("quality_appeal_resolved", check_id, operator, {"appeal_id": appeal.get("appeal_id"), "decision": decision})
        return {"appeal": dict(appeal), **result}

    def create_closure_task(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        values = dict(payload)
        quality_check_id = str(values.get("quality_check_id") or "")
        quality_check = self.get_quality_check(quality_check_id) if quality_check_id else None
        if quality_check_id and quality_check is None:
            raise KeyError("质检记录不存在：%s" % quality_check_id)
        if quality_check and quality_check.get("status") not in {"failed", "rectification", "appealed", "passed", "open"}:
            raise ValueError("当前质检状态不能创建整改任务：%s" % quality_check.get("status"))
        task_id = self._id("CLOSE")
        record = {
            "closure_task_id": task_id,
            "workorder_id": str(values.get("workorder_id") or ""),
            "quality_check_id": quality_check_id,
            "title": str(values.get("title") or ""),
            "owner": str(values.get("owner") or ""),
            "actions": list(values.get("actions") or []),
            "due_at": str(values.get("due_at") or ""),
            "status": "open",
            "created_by": operator,
            "created_at": self._now(),
            "updated_at": self._now(),
        }
        with self._lock:
            self._closure_tasks[task_id] = record
        if self.store:
            self.store.create_closure_task(record)
        if quality_check and quality_check.get("status") in {"failed", "rectification"}:
            self._set_quality_status(quality_check_id, "rectification", operator, {"closure_task_id": task_id})
        self._audit("closure_task_created", task_id, operator, {"workorder_id": record["workorder_id"]})
        return dict(record)

    def list_closure_tasks(self, status: str = "") -> list[dict[str, Any]]:
        if self.store:
            return self.store.list_closure_tasks(status=status)
        with self._lock:
            values = list(self._closure_tasks.values())
        return [dict(item) for item in values if not status or item.get("status") == status]

    def complete_closure_task(self, task_id: str, operator: str = "", note: str = "") -> dict[str, Any]:
        task = self.store.get_closure_task(task_id) if self.store else self._closure_tasks.get(task_id)
        if task is None:
            raise KeyError("闭环整改任务不存在：%s" % task_id)
        if task.get("status") != "open":
            raise ValueError("整改任务已经完成，不能重复提交")
        with self._lock:
            task["status"] = "completed"
            task["completion_note"] = note
            task["completed_by"] = operator
            task["completed_at"] = self._now()
            task["updated_at"] = task["completed_at"]
            result = dict(task)
            self._closure_tasks[task_id] = dict(task)
        if self.store:
            self.store.update_closure_task(task_id, {"status": task["status"], "completion_note": task["completion_note"], "completed_by": task["completed_by"], "completed_at": task["completed_at"], "updated_at": task["updated_at"]})
        quality_check_id = str(task.get("quality_check_id") or "")
        check = self.get_quality_check(quality_check_id) if quality_check_id else None
        if check and check.get("status") == "rectification":
            related = [
                item for item in self.list_closure_tasks()
                if str(item.get("quality_check_id") or "") == quality_check_id
            ]
            if related and all(item.get("status") == "completed" for item in related):
                self._set_quality_status(quality_check_id, "reinspection", operator, {"closure_task_id": task_id})
        self._audit("closure_task_completed", task_id, operator, {"note": note})
        return result

    def record_reinspection(self, check_id: str, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        """记录整改后的复检，复检本身不直接放行。"""

        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if check.get("status") != "reinspection":
            raise ValueError("只有完成整改的质检记录才能复检")
        values = dict(payload)
        passed = values.get("passed") is True
        evidence = list(values.get("evidence") or values.get("inspection_evidence") or values.get("items") or [])
        if passed and not evidence:
            raise ValueError("复检通过必须提供检测证据")
        reinspection = {
            "passed": passed,
            "findings": list(values.get("findings") or []),
            "evidence": evidence,
            "operator": str(values.get("operator") or operator or ""),
            "checked_at": self._now(),
        }
        status = "reinspection" if passed else "failed"
        result = self._set_quality_status(check_id, status, operator, {"reinspection": reinspection})
        self._audit("quality_reinspection_recorded", check_id, operator, {"passed": passed, "findings": reinspection["findings"]})
        return result

    def release_quality_check(self, check_id: str, operator: str = "") -> dict[str, Any]:
        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        direct_pass = check.get("status") == "passed" and bool(check.get("evidence") or check.get("items"))
        reinspected_pass = check.get("status") == "reinspection" and (check.get("reinspection") or {}).get("passed") is True
        if not direct_pass and not reinspected_pass:
            raise ValueError("质检未通过有效检测或复检，不能 Release")
        result = self._set_quality_status(check_id, "released", operator, {})
        self._audit("quality_released", check_id, operator, {})
        return result

    def close_quality_check(self, check_id: str, operator: str = "", note: str = "") -> dict[str, Any]:
        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if check.get("status") != "released":
            raise ValueError("只有 Release 后的质检记录才能 Close")
        result = self._set_quality_status(check_id, "closed", operator, {"note": note})
        self._audit("quality_closed", check_id, operator, {"note": note})
        return result

    def _set_quality_status(self, check_id: str, status: str, operator: str, changes: Mapping[str, Any]) -> dict[str, Any]:
        now = self._now()
        with self._lock:
            check = self._quality_checks.get(check_id)
            if check is None and self.store:
                check = self.store.get_quality_check(check_id)
            if check is None:
                raise KeyError("质检记录不存在：%s" % check_id)
            check = dict(check)
            check["status"] = status
            check["updated_at"] = now
            if "reinspection" in changes:
                check["reinspection"] = dict(changes["reinspection"] or {})
            self._quality_checks[check_id] = dict(check)
        if self.store:
            updates = {"status": status, "updated_at": now}
            if "reinspection" in changes:
                updates["reinspection"] = check.get("reinspection") or {}
            self.store.update_quality_check(check_id, updates)
        self._audit("quality_status_changed", check_id, operator, {"status": status, **dict(changes)})
        return dict(check)

    def audit_logs(self, object_id: str = "", action: str = "") -> list[dict[str, Any]]:
        if self.store:
            return self.store.list_audit_logs(object_id=object_id, action=action)
        with self._lock:
            values = list(self._audit_logs)
        return [
            dict(item)
            for item in values
            if (not object_id or item.get("object_id") == object_id)
            and (not action or item.get("action") == action)
        ]

    def _audit(self, action: str, object_id: str, operator: str, changes: Mapping[str, Any]) -> None:
        record = {
            "audit_id": self._id("AUDIT"),
            "action": action,
            "object_id": object_id,
            "operator": operator,
            "changes": dict(changes),
            "created_at": self._now(),
        }
        with self._lock:
            self._audit_logs.append(record)
        if self.store:
            self.store.create_audit(record)
        if self.trace:
            self.trace.record(type="audit", name=action, agent="closure", object_id=object_id, operator=operator, changes=dict(changes))
