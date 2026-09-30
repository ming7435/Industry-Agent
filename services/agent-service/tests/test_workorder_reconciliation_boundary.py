from app.runtime.action import ActionModel
from app.runtime import container


def test_existing_workorder_does_not_reconcile_an_update_before_execution():
    resolvers = container.build_workorder_resolvers()
    action = ActionModel.agent(
        "workorder", {"workorder_id": "WO-1", "action": "update", "status": "closed"},
        side_effect=True, idempotency_key="update-one",
    )

    assert resolvers.callback("workorder_update", action, {"workorder_id": "WO-1"}) is None
    assert resolvers.callback("close_workorder", action, {"workorder_id": "WO-1"}) is None


def test_creation_does_not_trust_key_only_without_parameter_fingerprint():
    resolvers = container.build_workorder_resolvers()
    action = ActionModel.agent("workorder", {}, side_effect=True, idempotency_key="create-one")
    other = ActionModel.agent("workorder", {}, side_effect=True, idempotency_key="create-other")

    assert resolvers.callback("workorder_create", action, {}) is None
    assert resolvers.callback("workorder_create", other, {}) is None
