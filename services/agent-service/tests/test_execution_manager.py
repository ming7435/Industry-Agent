import time


def test_execution_manager_times_out_without_killing_worker():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager, ExecutionStatus

    manager = ExecutionManager(timeout_seconds=0.01)
    record = manager.execute(
        ActionModel.tool("slow-tool"),
        lambda: time.sleep(0.05),
    )

    assert record.status == ExecutionStatus.TIMEOUT
    assert record.cancel_requested is True


def test_execution_manager_respects_pre_execution_cancellation():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager, ExecutionStatus

    manager = ExecutionManager()
    pending = manager.reserve(ActionModel.agent("diagnosis"))
    cancelled = manager.cancel(pending.execution_id)
    executed = manager.execute(pending.action, lambda: "must not run", execution_id=pending.execution_id)

    assert cancelled.status == ExecutionStatus.CANCELLED
    assert executed.status == ExecutionStatus.CANCELLED


def test_execution_manager_deduplicates_side_effect_by_idempotency_key():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager, ExecutionStatus

    calls = []
    manager = ExecutionManager()
    action = ActionModel.agent(
        "workorder.create", {"event_id": "EVT-1"},
        side_effect=True, idempotency_key="monitor:EVT-1",
    )
    first = manager.execute(action, lambda: calls.append("create") or {"workorder_id": "WO-1"})
    second = manager.execute(action, lambda: calls.append("duplicate") or {"workorder_id": "WO-2"})

    assert first.status == ExecutionStatus.SUCCESS
    assert second.result == {"workorder_id": "WO-1"}
    assert calls == ["create"]


def test_execution_manager_retries_failed_action_with_bounded_attempts():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager, ExecutionStatus

    calls = []
    manager = ExecutionManager(timeout_seconds=1, max_retries=2)

    def handler():
        calls.append(len(calls) + 1)
        if len(calls) < 2:
            raise RuntimeError("temporary")
        return {"ok": True}

    record = manager.execute(ActionModel.tool("retryable"), handler)

    assert record.status == ExecutionStatus.SUCCESS
    assert record.attempts == 2
    assert record.retry_count == 1
    assert len(record.history) == 2


def test_execution_manager_tracks_side_effect_application():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager

    manager = ExecutionManager()
    action = ActionModel.tool("quality.update", side_effect=True, idempotency_key="quality:Q-1")
    record = manager.execute(action, lambda: {"quality_check_id": "Q-1"})

    assert record.side_effect_applied is True
    assert record.side_effect_status == "applied"


def test_execution_manager_reconciles_side_effect_before_retrying_handler():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager, ExecutionStatus

    handler_calls = []
    state_checks = []
    manager = ExecutionManager(max_retries=2)
    action = ActionModel.agent(
        "workorder",
        side_effect=True,
        idempotency_key="monitor:EVT-RECONCILE",
    )

    def state_check():
        state_checks.append(len(state_checks) + 1)
        return None if len(state_checks) == 1 else {"workorder_id": "WO-RECONCILED"}

    def handler():
        handler_calls.append("create")
        raise RuntimeError("response lost after create")

    record = manager.execute(action, handler, state_check=state_check)

    assert record.status == ExecutionStatus.SUCCESS
    assert record.result == {"workorder_id": "WO-RECONCILED"}
    assert record.side_effect_status == "reconciled"
    assert handler_calls == ["create"]
    assert len(state_checks) == 2


def test_failed_side_effect_repeated_execute_only_reconciles():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager, ExecutionStatus

    calls = []
    manager = ExecutionManager(max_retries=2)
    action = ActionModel.agent("workorder", side_effect=True, idempotency_key="monitor:EVT-FAILED")

    def handler():
        calls.append("create")
        raise RuntimeError("response lost")

    first = manager.execute(action, handler)
    still_failed = manager.execute(action, handler)
    assert still_failed.status == ExecutionStatus.FAILED
    assert calls == ["create"]
    second = manager.execute(action, handler, state_check=lambda: {"workorder_id": "WO-1"})

    assert first is second
    assert second.status == ExecutionStatus.SUCCESS
    assert second.side_effect_status == "reconciled"
    assert calls == ["create"]


def test_timeout_is_not_retried_while_worker_may_still_run():
    from app.runtime.action import ActionModel
    from app.runtime.execution import ExecutionManager, ExecutionStatus

    calls = []
    manager = ExecutionManager(timeout_seconds=0.01, max_retries=2)
    record = manager.execute(ActionModel.tool("slow-tool"), lambda: calls.append("call") or time.sleep(0.05))

    assert record.status == ExecutionStatus.TIMEOUT
    assert record.attempts == 1
    assert calls == ["call"]
