"""Durable approval and pending Runtime task lifecycle."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable, Mapping
from uuid import uuid4

from .durable_store import DurableJsonStore


PENDING_NAMESPACE = "runtime_pending_task"
PENDING_STATUS = "pending_approval"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PendingTaskStore:
    """Persist the complete state needed to resume one blocked Action."""

    def __init__(self, path: str) -> None:
        if not str(path or "").strip():
            raise ValueError("pending task persistence requires a store path")
        self._store = DurableJsonStore(str(path))

    def create(
        self,
        *,
        action: Mapping[str, Any],
        state: Mapping[str, Any],
        plan: Mapping[str, Any],
        next_index: int,
        policy: Mapping[str, Any],
    ) -> dict[str, Any]:
        pending_id = "PENDING-" + uuid4().hex[:16].upper()
        record = {
            "pending_id": pending_id,
            "status": PENDING_STATUS,
            "created_at": _now(),
            "updated_at": _now(),
            "action": dict(action),
            "state": dict(state),
            "plan": dict(plan),
            "next_index": int(next_index),
            "policy": dict(policy),
            "result": {},
        }
        self._store.set(PENDING_NAMESPACE, pending_id, record)
        return dict(record)

    def get(self, pending_id: str) -> dict[str, Any] | None:
        return self._store.get(PENDING_NAMESPACE, str(pending_id))

    def update(self, pending_id: str, values: Mapping[str, Any]) -> dict[str, Any]:
        current = self.get(pending_id)
        if current is None:
            raise KeyError("pending task not found: %s" % pending_id)
        current.update(dict(values))
        current["updated_at"] = _now()
        self._store.set(PENDING_NAMESPACE, str(pending_id), current)
        return dict(current)

    def list(self, status: str = "") -> list[dict[str, Any]]:
        records = [self.get(key) for key in self._store.keys(PENDING_NAMESPACE)]
        values = [dict(item) for item in records if item is not None]
        return [item for item in values if not status or item.get("status") == status]


class ApprovalManager:
    """Approve or reject persisted Runtime policy waits exactly once."""

    def __init__(
        self,
        store: PendingTaskStore,
        resume_callback: Callable[[Mapping[str, Any]], Mapping[str, Any]] | None = None,
        trace: Any | None = None,
    ) -> None:
        self.store = store
        self.resume_callback = resume_callback
        self.trace = trace

    def create_pending(self, **kwargs: Any) -> dict[str, Any]:
        record = self.store.create(**kwargs)
        self._emit("approval_requested", record, status=record["status"])
        return record

    def get(self, pending_id: str) -> dict[str, Any] | None:
        return self.store.get(pending_id)

    def list(self, status: str = "") -> list[dict[str, Any]]:
        return self.store.list(status)

    def approve(self, pending_id: str, *, approved_by: str = "", note: str = "") -> dict[str, Any]:
        record = self._required(pending_id)
        if record.get("status") != PENDING_STATUS:
            return record
        approved = self.store.update(pending_id, {
            "status": "approved",
            "approved_by": str(approved_by),
            "approval_note": str(note),
            "approved_at": _now(),
        })
        self._emit("approval_approved", approved, approved_by=str(approved_by))
        if self.resume_callback is None:
            failed = self.store.update(pending_id, {
                "status": "resume_failed",
                "final_status": "blocked",
                "result": {"runtime_result": {"status": "blocked", "stop_reason": "resume_unavailable"}},
            })
            self._emit("approval_resumed", failed, status=failed["status"])
            return failed
        try:
            result = dict(self.resume_callback(approved) or {})
        except Exception as error:
            failed = self.store.update(pending_id, {
                "status": "resume_failed",
                "final_status": "blocked",
                "result": {"runtime_result": {"status": "blocked", "stop_reason": "resume_failed", "error": str(error)}},
            })
            self._emit("approval_resumed", failed, status=failed["status"])
            return failed
        runtime_result = result.get("runtime_result") if isinstance(result.get("runtime_result"), Mapping) else {}
        runtime_status = str(runtime_result.get("status") or result.get("status") or "blocked")
        final_status = "completed" if runtime_status == "completed" else "blocked"
        completed = self.store.update(pending_id, {
            "status": final_status,
            "final_status": runtime_status,
            "result": result,
        })
        self._emit("approval_resumed", completed, status=completed["status"])
        return completed

    def reject(self, pending_id: str, *, rejected_by: str = "", reason: str = "") -> dict[str, Any]:
        record = self._required(pending_id)
        if record.get("status") != PENDING_STATUS:
            return record
        rejected = self.store.update(pending_id, {
            "status": "rejected",
            "final_status": "blocked",
            "rejected_by": str(rejected_by),
            "rejection_reason": str(reason),
            "rejected_at": _now(),
            "result": {"runtime_result": {"status": "blocked", "stop_reason": "approval_rejected"}},
        })
        self._emit("approval_rejected", rejected, rejected_by=str(rejected_by))
        return rejected

    def _required(self, pending_id: str) -> dict[str, Any]:
        record = self.get(pending_id)
        if record is None:
            raise KeyError("pending task not found: %s" % pending_id)
        return record

    def _emit(self, event: str, record: Mapping[str, Any], **payload: Any) -> None:
        if self.trace is None or not hasattr(self.trace, "record"):
            return
        state = record.get("state") if isinstance(record.get("state"), Mapping) else {}
        self.trace.record(
            type="runtime", name="approval", node="runtime", agent="runtime", event=event,
            task_id=str(state.get("task_id") or ""), trace_id=str(state.get("trace_id") or ""),
            state_change={"pending_id": record.get("pending_id"), **payload},
            keys=["pending_id", *payload.keys()], tool_name="", latency=0.0, error="",
        )


__all__ = ["ApprovalManager", "PendingTaskStore", "PENDING_STATUS"]
