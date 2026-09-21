"""质检、整改和审计的最小闭环服务。

当前实现使用进程内存，字段和状态设计与后续 MySQL 表保持一致。
生产部署时将存储替换为数据库适配器即可，不改变 API 契约。
"""

from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any, Mapping
from uuid import uuid4


class ClosureService:
    """统一管理质检记录、质检申诉、整改任务和审计事件。"""

    def __init__(self, trace: Any | None = None) -> None:
        self.trace = trace
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
        check_id = self._id("QC")
        result = str(values.get("result") or "pending").lower()
        if result not in {"pending", "passed", "failed", "minor_issue", "major_issue", "high_risk"}:
            result = "pending"
        record = {
            "quality_check_id": check_id,
            "target_type": str(values.get("target_type") or "workorder"),
            "target_id": str(values.get("target_id") or ""),
            "workorder_id": str(values.get("workorder_id") or ""),
            "part_id": str(values.get("part_id") or ""),
            "part_no": str(values.get("part_no") or ""),
            "batch_id": str(values.get("batch_id") or ""),
            "production_order_id": str(values.get("production_order_id") or ""),
            "inspection_type": str(values.get("inspection_type") or ""),
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
        self._audit("quality_check_created", check_id, operator, {"result": result, "target_id": record["target_id"]})
        return dict(record)

    def record_part_quality(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        """Persist one production-part inspection using the shared quality schema."""

        values = dict(payload)
        part_id = str(values.get("part_id") or values.get("target_id") or "")
        values.setdefault("target_type", "production_part")
        values.setdefault("target_id", part_id or str(values.get("part_no") or ""))
        values.setdefault("inspection_type", "part_quality")
        return self.create_quality_check(values, operator=operator)

    def list_quality_checks(self, target_id: str = "", status: str = "") -> list[dict[str, Any]]:
        with self._lock:
            values = list(self._quality_checks.values())
        return [
            dict(item)
            for item in values
            if (not target_id or item.get("target_id") == target_id)
            and (not status or item.get("status") == status)
        ]

    def get_quality_check(self, check_id: str) -> dict[str, Any] | None:
        with self._lock:
            item = self._quality_checks.get(check_id)
            return dict(item) if item else None

    def submit_appeal(self, check_id: str, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        with self._lock:
            check = self._quality_checks.get(check_id)
            if check is None:
                raise KeyError("质检记录不存在：%s" % check_id)
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
        self._audit("closure_task_created", task_id, operator, {"workorder_id": record["workorder_id"]})
        return dict(record)

    def list_closure_tasks(self, status: str = "") -> list[dict[str, Any]]:
        with self._lock:
            values = list(self._closure_tasks.values())
        return [dict(item) for item in values if not status or item.get("status") == status]

    def complete_closure_task(self, task_id: str, operator: str = "", note: str = "") -> dict[str, Any]:
        with self._lock:
            task = self._closure_tasks.get(task_id)
            if task is None:
                raise KeyError("闭环整改任务不存在：%s" % task_id)
            task["status"] = "completed"
            task["completion_note"] = note
            task["completed_by"] = operator
            task["completed_at"] = self._now()
            task["updated_at"] = task["completed_at"]
            result = dict(task)
        self._audit("closure_task_completed", task_id, operator, {"note": note})
        return result

    def audit_logs(self, object_id: str = "", action: str = "") -> list[dict[str, Any]]:
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
        if self.trace:
            self.trace.record(type="audit", name=action, agent="closure", object_id=object_id, operator=operator, changes=dict(changes))
