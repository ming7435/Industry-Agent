"""Bounded Action execution with explicit cancellation and reconciliation state."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dataclasses import dataclass, field
from enum import Enum
from time import monotonic
from typing import Any, Callable, Dict, Mapping
from uuid import uuid4

from .action import ActionModel


class ExecutionStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"
    CANCELLED = "CANCELLED"
    UNKNOWN = "UNKNOWN"


@dataclass
class ExecutionRecord:
    execution_id: str
    action: ActionModel
    status: ExecutionStatus = ExecutionStatus.PENDING
    result: Any = None
    error: str = ""
    started_at: float | None = None
    finished_at: float | None = None
    cancel_requested: bool = False
    idempotency_key: str = ""
    attempts: int = 0
    retry_count: int = 0
    history: list[Dict[str, Any]] = field(default_factory=list)
    side_effect_applied: bool = False
    side_effect_status: str = "not_applied"
    metadata: Dict[str, Any] = field(default_factory=dict)


class ExecutionManager:
    """Execute Actions without pretending a timed-out thread was killed."""

    def __init__(self, timeout_seconds: float = 30.0, max_retries: int = 0, trace: Callable[[str, Dict[str, Any]], None] | None = None) -> None:
        self.timeout_seconds = float(timeout_seconds)
        self.max_retries = max(0, int(max_retries))
        self.trace = trace
        self._records: dict[str, ExecutionRecord] = {}
        self._idempotency: dict[str, str] = {}

    def _emit(self, event: str, record: ExecutionRecord, context: Mapping[str, Any] | None = None) -> None:
        if self.trace is not None:
            self.trace(event, {
                **dict(context or {}),
                "execution_id": record.execution_id,
                "status": record.status.value,
                "action": record.action.as_dict(),
                "idempotency_key": record.idempotency_key,
            })

    def reserve(self, action: ActionModel) -> ExecutionRecord:
        if action.side_effect and not action.idempotency_key:
            raise ValueError("side-effect actions require idempotency_key")
        if action.idempotency_key and action.idempotency_key in self._idempotency:
            return self._records[self._idempotency[action.idempotency_key]]
        record = ExecutionRecord(
            execution_id="EXEC-" + uuid4().hex[:16].upper(),
            action=action,
            idempotency_key=action.idempotency_key,
        )
        self._records[record.execution_id] = record
        if action.idempotency_key:
            self._idempotency[action.idempotency_key] = record.execution_id
        return record

    def execute(
        self,
        action: ActionModel,
        handler: Callable[[], Any],
        *,
        execution_id: str | None = None,
        state_check: Callable[[], Any] | None = None,
        timeout_seconds: float | None = None,
        trace_context: Mapping[str, Any] | None = None,
    ) -> ExecutionRecord:
        record = self._records.get(execution_id or "") if execution_id else None
        if record is None:
            record = self.reserve(action)
        if record.status in {ExecutionStatus.CANCELLED, ExecutionStatus.SUCCESS, ExecutionStatus.RUNNING}:
            return record
        if record.status in {ExecutionStatus.FAILED, ExecutionStatus.TIMEOUT, ExecutionStatus.UNKNOWN} and (record.action.side_effect or record.status != ExecutionStatus.FAILED):
            if state_check is not None:
                try:
                    existing = state_check()
                except Exception:
                    existing = None
                if existing is not None:
                    record.result = existing
                    record.status = ExecutionStatus.SUCCESS
                    record.error = ""
                    if record.action.side_effect:
                        record.side_effect_applied = True
                        record.side_effect_status = "reconciled"
                    record.finished_at = monotonic()
                    self._emit("execution_end", record, trace_context)
            return record
        if state_check is not None:
            existing = state_check()
            if existing is not None:
                record.result = existing
                record.status = ExecutionStatus.SUCCESS
                record.error = ""
                if action.side_effect:
                    record.side_effect_applied = True
                    record.side_effect_status = "reconciled"
                record.finished_at = monotonic()
                self._emit("execution_end", record, trace_context)
                return record
        retry_limit = self.max_retries
        for attempt_index in range(retry_limit + 1):
            record.status = ExecutionStatus.RUNNING
            record.error = ""
            record.started_at = monotonic()
            record.attempts += 1
            self._emit("execution_start", record, trace_context)
            executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="agent-execution")
            future = executor.submit(handler)
            attempt = {"attempt": record.attempts, "status": "RUNNING"}
            try:
                record.result = future.result(timeout=float(timeout_seconds or self.timeout_seconds))
                if record.cancel_requested:
                    record.status = ExecutionStatus.CANCELLED
                else:
                    record.status = ExecutionStatus.SUCCESS
                    if action.side_effect:
                        record.side_effect_applied = True
                        record.side_effect_status = "applied"
            except TimeoutError:
                record.cancel_requested = True
                record.status = ExecutionStatus.TIMEOUT
                record.error = "execution timeout; underlying operation may still be running"
                record.side_effect_status = "unknown" if action.side_effect else "not_applied"
                future.cancel()
            except Exception as error:
                record.status = ExecutionStatus.FAILED
                record.error = str(error)
                record.side_effect_status = "unknown" if action.side_effect else "not_applied"
            finally:
                record.finished_at = monotonic()
                executor.shutdown(wait=False, cancel_futures=True)
                attempt.update({"status": record.status.value, "error": record.error})
                record.history.append(attempt)
                self._emit("execution_end", record, trace_context)
            if record.status in {ExecutionStatus.SUCCESS, ExecutionStatus.CANCELLED}:
                break
            if action.side_effect:
                # A failed response may hide a committed external write. Check
                # authoritative state before considering another handler call.
                if state_check is not None:
                    try:
                        existing = state_check()
                    except Exception:
                        existing = None
                    if existing is not None:
                        record.result = existing
                        record.status = ExecutionStatus.SUCCESS
                        record.error = ""
                        record.side_effect_applied = True
                        record.side_effect_status = "reconciled"
                        record.finished_at = monotonic()
                        record.history.append({"attempt": record.attempts, "status": "SUCCESS", "reconciled": True})
                        self._emit("execution_end", record, trace_context)
                if record.status == ExecutionStatus.SUCCESS:
                    break
                # Without a successful state check, do not issue a duplicate
                # side effect. Reconciliation may be requested by the caller.
                break
            if record.status == ExecutionStatus.TIMEOUT:
                break
            if attempt_index >= retry_limit:
                break
        record.retry_count = max(0, record.attempts - 1)
        return record

    def cancel(self, execution_id: str) -> ExecutionRecord:
        record = self._records.get(execution_id)
        if record is None:
            return ExecutionRecord(execution_id=execution_id, action=ActionModel.wait("unknown"), status=ExecutionStatus.UNKNOWN)
        record.cancel_requested = True
        if record.status == ExecutionStatus.PENDING:
            record.status = ExecutionStatus.CANCELLED
            record.finished_at = monotonic()
        return record

    def get(self, execution_id: str) -> ExecutionRecord | None:
        return self._records.get(execution_id)

    def reconcile(self, execution_id: str, resolver: Callable[[], Any]) -> ExecutionRecord:
        record = self._records.get(execution_id)
        if record is None:
            return ExecutionRecord(execution_id=execution_id, action=ActionModel.wait("unknown"), status=ExecutionStatus.UNKNOWN)
        if record.status not in {ExecutionStatus.TIMEOUT, ExecutionStatus.UNKNOWN}:
            return record
        resolved = resolver()
        if resolved is not None:
            record.result = resolved
            record.status = ExecutionStatus.SUCCESS
            record.error = ""
            if record.action.side_effect:
                record.side_effect_applied = True
                record.side_effect_status = "reconciled"
            record.finished_at = monotonic()
        return record


__all__ = ["ExecutionStatus", "ExecutionRecord", "ExecutionManager"]
