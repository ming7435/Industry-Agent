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

    def run(self, _task):
        self.calls += 1
        return {"workorder_id": "WO-POLICY", "status": "open"}


def _dispatcher():
    agent = _WorkOrderAgent()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    trace = TraceRecorder()
    return RuntimeDispatcher(registry, ExecutionManager(), trace=trace), agent, trace


def _action(risk_level="normal"):
    return ActionModel.agent(
        "workorder",
        {"required_capability": "workorder_create", "risk_level": risk_level},
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


def test_dispatcher_waits_for_high_risk_approval_without_agent_execution():
    dispatcher, agent, _trace = _dispatcher()

    result = dispatcher.dispatch(_action("high"), _ready_state())

    assert result.success is False
    assert result.output["policy_status"] == "require_approval"
    assert result.output["status"] == "waiting_approval"
    assert agent.calls == 0


def test_scoped_approval_allows_high_risk_workorder():
    dispatcher, agent, _trace = _dispatcher()
    state = {**_ready_state(), "context": {"approved_capabilities": ["workorder_create"]}}

    result = dispatcher.dispatch(_action("high"), state)

    assert result.success is True
    assert agent.calls == 1
