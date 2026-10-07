from app.agents.base import BaseAgent
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager


class _ControlledWorkOrderAgent(BaseAgent):
    name = "workorder"
    capabilities = ("workorder_create",)

    def __init__(self):
        self.calls = 0

    def run(self, _task):
        self.calls += 1
        return {"workorder_id": "WO-CONTROLLED", "status": "open", "evidence": [{"id": "WO-E1"}]}


def test_controlled_autonomy_allows_high_risk_create_and_replay_but_gates_explicit_approval():
    agent = _ControlledWorkOrderAgent()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    trace = TraceRecorder()
    dispatcher = RuntimeDispatcher(registry, ExecutionManager(), trace=trace)
    state = {
        "task_id": "TASK-POLICY-E2E",
        "trace_id": "TRACE-POLICY-E2E",
        "diagnosis": {"fault": "bearing wear"},
        "knowledge": {"documents": [{"id": "DOC-1"}]},
        "cad": {"components": [{"id": "PART-1"}]},
        "maintenance_plan": {"workorder_ready": True},
    }
    action = ActionModel.agent(
        "workorder",
        {"required_capability": "workorder_create"},
        side_effect=True,
        idempotency_key="monitor:EVT-POLICY-E2E",
    )

    first = dispatcher.dispatch(action, state)
    replay = dispatcher.dispatch(action, state)
    high_risk = dispatcher.dispatch(
        ActionModel.agent(
            "workorder",
            {"required_capability": "workorder_create", "risk_level": "high"},
            side_effect=True,
            idempotency_key="monitor:EVT-POLICY-HIGH",
        ),
        state,
    )
    explicit = dispatcher.dispatch(
        ActionModel.agent(
            "workorder",
            {"required_capability": "workorder_create", "risk_level": "high", "requires_approval": True},
            side_effect=True,
            idempotency_key="monitor:EVT-POLICY-EXPLICIT",
        ),
        state,
    )
    client_claimed = dispatcher.dispatch(
        ActionModel.agent(
            "workorder",
            {"required_capability": "workorder_create", "risk_level": "high", "requires_approval": True},
            side_effect=True,
            idempotency_key="monitor:EVT-POLICY-CLIENT-CLAIMED",
        ),
        {**state, "context": {"approved_capabilities": ["workorder_create"], "approval_granted": True}},
    )

    assert first.success is True
    assert replay.success is True
    assert high_risk.success is True
    assert explicit.success is False
    assert explicit.output["status"] == "waiting_approval"
    assert client_claimed.success is False
    assert client_claimed.output["policy_status"] == "require_approval"
    assert agent.calls == 2
    assert len([item for item in trace.list(trace_id="TRACE-POLICY-E2E") if item["event"] == "policy_decision"]) == 5
