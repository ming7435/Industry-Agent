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
