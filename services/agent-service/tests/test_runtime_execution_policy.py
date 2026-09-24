from types import SimpleNamespace

from app.agents.base import BaseAgent
from app.harness import AgentHarness, TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.execution import ExecutionManager


class _FailingAgent(BaseAgent):
    name = "diagnosis"
    capabilities = ("fault_analysis",)

    def __init__(self):
        self.calls = 0

    def run(self, _task):
        self.calls += 1
        raise RuntimeError("failed once")


def test_runtime_dispatcher_uses_one_harness_attempt_and_execution_manager_policy():
    from app.runtime.dispatcher import RuntimeDispatcher

    agent = _FailingAgent()
    trace = TraceRecorder()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    dispatcher = RuntimeDispatcher(
        registry,
        ExecutionManager(timeout_seconds=1, max_retries=0),
        trace=trace,
        harnesses={"diagnosis": AgentHarness(agent, timeout_seconds=1, max_retries=5, trace=trace)},
    )

    result = dispatcher.dispatch(
        ActionModel.agent("diagnosis", {"required_capability": "fault_analysis"}),
        {"task_id": "TASK-POLICY", "trace_id": "TRACE-POLICY"},
    )

    assert result.success is False
    assert agent.calls == 1


def test_runtime_loop_timeout_is_derived_from_execution_manager_timeout():
    from app.runtime.coordinator import RuntimeCoordinator
    from app.runtime.planner import Planner

    trace = TraceRecorder()

    class _Dispatcher:
        def dispatch(self, _action, _state):
            from app.agents.base import AgentResult

            return AgentResult(success=True, output={"status": "completed"}, evidence=[{"id": "E-1"}])

    container = SimpleNamespace(
        planner=Planner(),
        dispatcher=_Dispatcher(),
        execution_manager=SimpleNamespace(timeout_seconds=2.0),
        trace=trace,
    )
    RuntimeCoordinator(container).run({
        "entry": "user",
        "task_id": "TASK-TIMEOUT-POLICY",
        "trace_id": "TRACE-TIMEOUT-POLICY",
        "user_text": "查询维修手册",
    })

    loop_start = next(item for item in trace.list(trace_id="TRACE-TIMEOUT-POLICY") if item["event"] == "loop_start")
    assert loop_start["state_change"]["timeout_seconds"] == 3.0
