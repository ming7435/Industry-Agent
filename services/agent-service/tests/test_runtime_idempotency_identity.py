from app.runtime.planner import Planner


def _workorder_action(workorder_id, task_id):
    return Planner().plan("关闭工单", {
        "required_capabilities": ["workorder_update"],
        "target_input": {"action": "close", "workorder_id": workorder_id},
        "task_id": task_id,
        "trace_id": "TRACE-" + task_id,
    }).actions[0]


def test_workorder_idempotency_distinguishes_target_but_ignores_runtime_trace_ids():
    first = _workorder_action("WO-1", "TASK-1")
    repeated = _workorder_action("WO-1", "TASK-2")
    different = _workorder_action("WO-2", "TASK-3")

    assert first.idempotency_key == repeated.idempotency_key
    assert first.fingerprint == repeated.fingerprint
    assert first.idempotency_key != different.idempotency_key


def test_event_revision_has_distinct_workorder_creation_identity():
    planner = Planner()
    first = planner.plan("故障派工", {"event_id": "EVT-1", "event_revision": 1}).actions[-1]
    escalated = planner.plan("故障派工", {"event_id": "EVT-1", "event_revision": 2}).actions[-1]

    assert first.idempotency_key != escalated.idempotency_key


def test_event_idempotency_is_scoped_to_tenant_and_device():
    planner = Planner()
    context = {"event_id": "EVT-SHARED", "event_revision": 1, "tenant_id": "T-1", "device_id": "D-1"}
    first = planner.plan("故障派工", context).actions[-1]
    duplicate = planner.plan("故障派工", context).actions[-1]
    other_device = planner.plan("故障派工", {**context, "device_id": "D-2"}).actions[-1]
    other_tenant = planner.plan("故障派工", {**context, "tenant_id": "T-2"}).actions[-1]

    assert first.idempotency_key == duplicate.idempotency_key
    assert len({first.idempotency_key, other_device.idempotency_key, other_tenant.idempotency_key}) == 3
