from app.runtime.action import ActionModel
from app.runtime.policy import PolicyStatus, RuntimePolicy


def _workorder_action(**kwargs):
    return ActionModel.agent(
        "workorder",
        {"required_capability": "workorder_create", **kwargs.pop("payload", {})},
        side_effect=True,
        idempotency_key=kwargs.pop("idempotency_key", "monitor:EVT-1"),
        **kwargs,
    )


def _ready_state():
    return {
        "diagnosis": {"fault": "bearing wear"},
        "knowledge": {"documents": [{"id": "DOC-1"}]},
        "cad": {"components": [{"id": "PART-1"}]},
        "maintenance_plan": {"workorder_ready": True},
    }


def test_side_effect_without_idempotency_is_denied_before_execution():
    action = _workorder_action(idempotency_key="")

    decision = RuntimePolicy().evaluate(action, _ready_state())

    assert decision.status == PolicyStatus.DENY
    assert decision.reason == "idempotency_key_required"


def test_workorder_creation_requires_complete_runtime_evidence():
    action = _workorder_action()
    state = {"diagnosis": {"fault": "bearing wear"}}

    decision = RuntimePolicy().evaluate(action, state)

    assert decision.status == PolicyStatus.DENY
    assert decision.reason == "missing_required_evidence"
    assert set(decision.missing_evidence) == {"knowledge", "cad", "maintenance_plan"}


def test_router_workorder_create_cannot_use_update_evidence_gate():
    action = ActionModel.agent(
        "workorder", {"required_capability": "workorder_update", "target_input": {"action": "create"}},
        side_effect=True, idempotency_key="plan:create-1",
    )

    decision = RuntimePolicy().evaluate(action, {})

    assert decision.reason == "missing_required_evidence"
    assert set(decision.missing_evidence) == {"diagnosis", "knowledge", "cad", "maintenance_plan"}


def test_workorder_query_cannot_smuggle_create_action():
    action = ActionModel.agent(
        "workorder",
        {"required_capability": "workorder_query", "target_input": {"action": "create", "maintenance_plan": {"device_id": "D-1"}}},
    )

    decision = RuntimePolicy().evaluate(action, _ready_state())

    assert decision.status == PolicyStatus.DENY
    assert decision.reason == "workorder_action_scope_violation"


def test_high_risk_action_waits_for_explicit_approval():
    action = _workorder_action(payload={"risk_level": "high"})

    decision = RuntimePolicy().evaluate(action, _ready_state())

    assert decision.status == PolicyStatus.REQUIRE_APPROVAL
    assert decision.reason == "approval_required"

    client_claimed = RuntimePolicy().evaluate(
        action,
        {**_ready_state(), "context": {"approved_capabilities": ["workorder_create"], "approval_granted": True}},
    )
    assert client_claimed.status == PolicyStatus.REQUIRE_APPROVAL


def test_server_bound_approval_allows_only_the_exact_pending_action():
    action = _workorder_action(payload={"risk_level": "high", "workorder_id": "WO-1"})
    pending = {"status": "resuming", "action": action.as_dict()}
    policy = RuntimePolicy(approval_lookup=lambda pending_id: pending if pending_id == "P-1" else None)

    approved = policy.evaluate(action, {**_ready_state(), "runtime_resume": {"pending_id": "P-1"}})
    assert approved.status == PolicyStatus.ALLOW

    changed = action.model_copy(update={"payload": {**action.payload, "workorder_id": "WO-2"}})
    changed_result = policy.evaluate(changed, {**_ready_state(), "runtime_resume": {"pending_id": "P-1"}})
    assert changed_result.status == PolicyStatus.REQUIRE_APPROVAL


def test_read_only_capability_is_allowed_without_approval():
    action = ActionModel.agent(
        "knowledge",
        {"required_capability": "document_search"},
    )

    decision = RuntimePolicy().evaluate(action, {})

    assert decision.status == PolicyStatus.ALLOW


def test_quality_policy_rejects_non_part_inspection_scope():
    action = ActionModel.agent(
        "quality",
        {"required_capability": "quality_inspection", "inspection_type": "repair_verification"},
    )

    decision = RuntimePolicy().evaluate(action, {})

    assert decision.status == PolicyStatus.DENY
    assert decision.reason == "quality_scope_violation"
