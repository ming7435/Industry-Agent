"""质检、整改和审计的闭环服务。

配置 MYSQL_HOST 后自动使用 MySQL；未配置时保留进程内存回退，便于本地演示。
"""

from __future__ import annotations

from datetime import datetime, timezone
from threading import RLock
from contextlib import contextmanager, nullcontext
from copy import deepcopy
from functools import wraps
from typing import Any, Mapping
from uuid import uuid4

from .store import build_closure_store


def _quality_operation(method):
    @wraps(method)
    def execute(self, *args, **kwargs):
        with self._quality_transaction():
            return method(self, *args, **kwargs)
    return execute


def _contains_untrusted_flag(value: Any) -> bool:
    if isinstance(value, Mapping):
        return any(value.get(key) is True for key in ("synthetic", "is_synthetic", "degraded")) or any(_contains_untrusted_flag(item) for item in value.values())
    if isinstance(value, (list, tuple, set)):
        return any(_contains_untrusted_flag(item) for item in value)
    return False


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


class ClosureService:
    """统一管理质检记录、质检申诉、整改任务和审计事件。"""

    def __init__(self, trace: Any | None = None, store: Any | None = None) -> None:
        self.trace = trace
        self.store = store or build_closure_store()
        self.backend = getattr(self.store, "backend", "memory")
        self._lock = RLock()
        self._quality_checks: dict[str, dict[str, Any]] = {}
        self._appeals: dict[str, list[dict[str, Any]]] = {}
        self._closure_tasks: dict[str, dict[str, Any]] = {}
        self._audit_logs: list[dict[str, Any]] = []

    @contextmanager
    def _quality_transaction(self):
        with self._lock:
            snapshot = deepcopy((self._quality_checks, self._closure_tasks, self._appeals, self._audit_logs))
            transaction = self.store.quality_transaction() if self.store else nullcontext()
            try:
                with transaction:
                    yield
            except Exception:
                self._quality_checks, self._closure_tasks, self._appeals, self._audit_logs = snapshot
                raise

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _id(prefix: str) -> str:
        return "%s-%s" % (prefix, uuid4().hex[:12].upper())

    @_quality_operation
    def create_quality_check(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        values = dict(payload)
        if values.get("target_type", "production_part") != "production_part":
            raise ValueError("Quality checks only support production_part targets")
        if values.get("inspection_type", "part_quality") != "part_quality":
            raise ValueError("Quality checks only support part_quality inspections")
        check_id = self._id("QC")
        result = str(values.get("result") or "pending").lower()
        if result not in {"pending", "passed", "failed", "minor_issue", "major_issue", "high_risk", "not_tested", "insufficient_data", "review"}:
            result = "pending"
        evidence = list(values.get("evidence") or values.get("inspection_evidence") or values.get("items") or [])
        if result == "passed" and (not _quality_evidence_is_complete(values) or _contains_untrusted_flag(values)):
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
            "quality_validation": dict(values.get("quality_validation") or values.get("inspection_summary") or {}),
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
            values = self.store.list_quality_checks(target_id=target_id, status=status)
            appeals = self.store.list_appeals() if values else []
        else:
            with self._lock:
                values = [deepcopy(item) for item in self._quality_checks.values()
                          if (not target_id or item.get("target_id") == target_id)
                          and (not status or item.get("status") == status)]
                appeals = [deepcopy(appeal) for group in self._appeals.values() for appeal in group]
        by_check: dict[str, list[dict[str, Any]]] = {}
        for appeal in appeals:
            by_check.setdefault(str(appeal.get("quality_check_id") or ""), []).append(appeal)
        return [{**item, "appeals": by_check.get(item["quality_check_id"], [])} for item in values]

    def get_quality_check(self, check_id: str) -> dict[str, Any] | None:
        if self.store:
            return self.store.get_quality_check(check_id)
        with self._lock:
            item = self._quality_checks.get(check_id)
            return dict(item) if item else None

    @_quality_operation
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

    @_quality_operation
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
        if decision not in {"approved", "rejected", "withdrawn"}:
            raise ValueError("无效申诉结论：%s" % decision)
        # 启用持久化时以事务内的当前记录/审计为准；其他实例可能已经处理缓存中的待办申诉。
        appeals = self.store.list_appeals(check_id) if self.store else list(self._appeals.get(check_id) or [])
        if appeal_id:
            appeal = next((item for item in appeals if item.get("appeal_id") == appeal_id), None)
        else:
            pending = [item for item in appeals if item.get("status") == "pending"]
            if len(pending) > 1:
                raise ValueError("存在多个待处理申诉，请指定 appeal_id")
            if not pending:
                raise ValueError("没有待处理的申诉")
            appeal = pending[0]
        if appeal is None:
            raise KeyError("申诉记录不存在：%s" % appeal_id)
        if appeal.get("status") != "pending":
            raise ValueError("申诉已结束，不能重复处理")
        appeal.update({"status": decision, "resolution_reason": reason, "resolved_by": operator, "resolved_at": self._now()})
        if self.store:
            self.store.update_appeal(check_id, str(appeal["appeal_id"]), appeal)
        with self._lock:
            self._appeals[check_id] = appeals
        if decision == "approved":
            next_status = "rectification"
        else:
            next_status = decision
        result = self._set_quality_status(check_id, next_status, operator, {})
        self._audit("quality_appeal_resolved", check_id, operator, {"appeal_id": appeal.get("appeal_id"), "decision": decision, "resolution_reason": reason, "resolved_by": operator, "resolved_at": appeal["resolved_at"]})
        return {"appeal": dict(appeal), **result}

    @_quality_operation
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
        if quality_check and quality_check.get("status") in {"failed", "rectification", "passed"}:
            self._set_quality_status(quality_check_id, "rectification", operator, {"closure_task_id": task_id})
        self._audit("closure_task_created", task_id, operator, {"workorder_id": record["workorder_id"]})
        return dict(record)

    def list_closure_tasks(self, status: str = "") -> list[dict[str, Any]]:
        if self.store:
            return self.store.list_closure_tasks(status=status)
        with self._lock:
            values = list(self._closure_tasks.values())
        return [dict(item) for item in values if not status or item.get("status") == status]

    @_quality_operation
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

    @_quality_operation
    def record_reinspection(self, check_id: str, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        """记录整改后的复检，复检本身不直接放行。"""

        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if check.get("status") != "reinspection":
            raise ValueError("只有完成整改的质检记录才能复检")
        values = dict(payload)
        if type(values.get("passed")) is not bool:
            raise ValueError("复检 passed 必须是布尔值")
        passed = values.get("passed") is True
        evidence = list(values.get("evidence") or values.get("inspection_evidence") or values.get("items") or [])
        reference = str(values.get("reinspection_check_id") or "")
        source = self._validated_reinspection(check, reference) if passed else None
        reinspection = {
            "passed": passed,
            "findings": list(values.get("findings") or []),
            "evidence": evidence,
            "operator": str(values.get("operator") or operator or ""),
            "checked_at": self._now(),
        }
        if source is not None:
            reinspection.update({"reinspection_check_id": reference, "quality_validation": deepcopy(source["quality_validation"])})
        status = "reinspection" if passed else "failed"
        result = self._set_quality_status(check_id, status, operator, {"reinspection": reinspection})
        self._audit("quality_reinspection_recorded", check_id, operator, {"passed": passed, "findings": reinspection["findings"], "reinspection_check_id": reference if passed else ""})
        return result

    @_quality_operation
    def release_quality_check(self, check_id: str, operator: str = "") -> dict[str, Any]:
        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        self._completed_quality_tasks(check_id)
        direct_pass = check.get("status") == "passed" and self._quality_record_is_trusted(check)
        reinspection = check.get("reinspection") or {}
        reinspected_pass = check.get("status") == "reinspection" and reinspection.get("passed") is True
        if reinspected_pass:
            self._validated_reinspection(check, str(reinspection.get("reinspection_check_id") or ""))
        if not direct_pass and not reinspected_pass:
            raise ValueError("质检未通过有效检测或复检，不能 Release")
        result = self._set_quality_status(check_id, "released", operator, {})
        self._audit("quality_released", check_id, operator, {"reinspection_check_id": str(reinspection.get("reinspection_check_id") or "")})
        return result

    @_quality_operation
    def close_quality_check(self, check_id: str, operator: str = "", note: str = "") -> dict[str, Any]:
        check = self.get_quality_check(check_id)
        if check is None:
            raise KeyError("质检记录不存在：%s" % check_id)
        if check.get("status") != "released":
            raise ValueError("只有 Release 后的质检记录才能 Close")
        result = self._set_quality_status(check_id, "closed", operator, {"note": note})
        self._audit("quality_closed", check_id, operator, {"note": note})
        return result

    def _completed_quality_tasks(self, check_id: str, *, required: bool = False) -> list[dict[str, Any]]:
        tasks = [item for item in self.list_closure_tasks() if str(item.get("quality_check_id") or "") == check_id]
        if (required and not tasks) or any(item.get("status") != "completed" or not item.get("completed_at") for item in tasks):
            raise ValueError("所有必需整改任务必须完成整改后才能复检或放行")
        return tasks

    @staticmethod
    def _quality_record_is_trusted(item: Mapping[str, Any]) -> bool:
        return (
            item.get("result") == "passed"
            and item.get("status") in {"passed", "released", "closed"}
            and item.get("target_type") == "production_part"
            and item.get("inspection_type") == "part_quality"
            and bool(str(item.get("part_id") or item.get("target_id") or "").strip())
            and bool(str(item.get("batch_id") or "").strip())
            and not _contains_untrusted_flag(item)
            and _quality_evidence_is_complete(item)
        )

    def _validated_reinspection(self, item: Mapping[str, Any], reference: str) -> dict[str, Any]:
        check_id = str(item.get("quality_check_id") or "")
        tasks = self._completed_quality_tasks(check_id, required=True)
        source = self.get_quality_check(reference) if reference and reference != check_id else None
        if source is None or not self._quality_record_is_trusted(source):
            raise ValueError("复检通过必须引用已持久化且五项检测通过的 reinspection_check_id")
        part_id = str(item.get("part_id") or item.get("target_id") or "").strip()
        batch_id = str(item.get("batch_id") or "").strip()
        if not part_id or not batch_id or part_id != str(source.get("part_id") or source.get("target_id") or "").strip() or batch_id != str(source.get("batch_id") or "").strip():
            raise ValueError("复检记录必须属于同一零件和非空生产批次")
        try:
            inspected_at = datetime.fromisoformat(str(source.get("created_at") or "").replace("Z", "+00:00"))
            completed_at = [datetime.fromisoformat(str(task["completed_at"]).replace("Z", "+00:00")) for task in tasks]
            if inspected_at.tzinfo is None or any(moment.tzinfo is None for moment in completed_at) or any(inspected_at < moment for moment in completed_at):
                raise ValueError("复检记录必须在所有整改完成之后生成")
        except (TypeError, ValueError) as error:
            raise ValueError("复检记录必须在所有整改完成之后生成且有有效时间") from error
        return source

    def _set_quality_status(self, check_id: str, status: str, operator: str, changes: Mapping[str, Any]) -> dict[str, Any]:
        now = self._now()
        with self._lock:
            check = self.store.get_quality_check(check_id) if self.store else self._quality_checks.get(check_id)
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
