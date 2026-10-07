from app.agents.base import BaseAgent
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager


class _WorkOrderAgent(BaseAgent):
    name = "workorder"
    capabilities = ("workorder_create",)

    def __init__(self):
        self.calls = 0
        self.last_task = None

    def run(self, task):
        self.calls += 1
        self.last_task = task
        return {"workorder_id": "WO-POLICY", "status": "open"}


def _dispatcher():
    agent = _WorkOrderAgent()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    trace = TraceRecorder()
    return RuntimeDispatcher(registry, ExecutionManager(), trace=trace), agent, trace


def _action(risk_level="normal", requires_approval=False):
    return ActionModel.agent(
        "workorder",
        {"required_capability": "workorder_create", "risk_level": risk_level, "requires_approval": requires_approval},
        side_effect=True,
        idempotency_key="monitor:EVT-POLICY",
    )


def _ready_state():
    return {
        "task_id": "TASK-POLICY", "trace_id": "TRACE-POLICY",
        "diagnosis": {"fault": "bearing wear"},
        "knowledge": {"documents": [{"id": "DOC-1"}]},
        "cad": {"components": [{"id": "PART-1"}]},
        "maintenance_plan": {"workorder_ready": True},
    }


def test_dispatcher_denies_missing_evidence_before_agent_execution():
    dispatcher, agent, trace = _dispatcher()

    result = dispatcher.dispatch(_action(), {"task_id": "TASK-POLICY", "trace_id": "TRACE-POLICY"})

    assert result.success is False
    assert result.output["policy_status"] == "deny"
    assert result.output["reason"] == "missing_required_evidence"
    assert agent.calls == 0
    assert any(item["event"] == "policy_decision" for item in trace.list(trace_id="TRACE-POLICY"))


def test_dispatcher_allows_risk_only_workorder_without_approval():
    dispatcher, agent, _trace = _dispatcher()

    result = dispatcher.dispatch(_action("high"), _ready_state())

    assert result.success is True
    assert agent.calls == 1


def test_dispatcher_waits_for_explicit_approval_without_agent_execution():
    dispatcher, agent, _trace = _dispatcher()

    result = dispatcher.dispatch(_action("high", requires_approval=True), _ready_state())

    assert result.success is False
    assert result.output["policy_status"] == "require_approval"
    assert result.output["status"] == "waiting_approval"
    assert agent.calls == 0


def test_client_scoped_approval_does_not_allow_explicitly_gated_workorder():
    dispatcher, agent, _trace = _dispatcher()
    state = {**_ready_state(), "context": {"approved_capabilities": ["workorder_create"]}}

    result = dispatcher.dispatch(_action("high", requires_approval=True), state)

    assert result.success is False
    assert result.output["policy_status"] == "require_approval"
    assert agent.calls == 0


def test_dispatcher_passes_planned_idempotency_key_to_workorder_agent():
    dispatcher, agent, _trace = _dispatcher()
    action = ActionModel.agent(
        "workorder",
        {"required_capability": "workorder_create", "target_input": {"idempotency_key": "client-forged"}},
        side_effect=True,
        idempotency_key="monitor:scoped:EVT-1:r2",
    )
    result = dispatcher.dispatch(action, _ready_state())

    assert result.success is True
    assert agent.last_task["idempotency_key"] == action.idempotency_key
