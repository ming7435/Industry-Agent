"""质检、整改和审计的闭环服务。

配置 MYSQL_HOST 后自动使用 MySQL；未配置时保留进程内存回退，便于本地演示。
"""

from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any, Mapping
from uuid import uuid4

from .store import build_closure_store


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
            "reviewer": str(values.get("reviewer") or operator or ""),
            "risk_level": str(values.get("risk_level") or "R1"),
            "status": "open",
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

    def create_closure_task(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        values = dict(payload)
        task_id = self._id("CLOSE")
        record = {
            "closure_task_id": task_id,
            "workorder_id": str(values.get("workorder_id") or ""),
            "quality_check_id": str(values.get("quality_check_id") or ""),
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
        self._audit("closure_task_completed", task_id, operator, {"note": note})
        return result

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
