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


def test_high_risk_action_waits_for_explicit_approval():
    action = _workorder_action(payload={"risk_level": "high"})

    decision = RuntimePolicy().evaluate(action, _ready_state())

    assert decision.status == PolicyStatus.REQUIRE_APPROVAL
    assert decision.reason == "approval_required"

    approved = RuntimePolicy().evaluate(action, {**_ready_state(), "context": {"approved_capabilities": ["workorder_create"]}})
    assert approved.status == PolicyStatus.ALLOW

    boolean_approved = RuntimePolicy().evaluate(action, {**_ready_state(), "approval_granted": True})
    assert boolean_approved.status == PolicyStatus.ALLOW


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
