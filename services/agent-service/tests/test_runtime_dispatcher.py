from app.agents.base import BaseAgent, AgentResult
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.execution import ExecutionManager


class _Agent(BaseAgent):
    name = "diagnosis"
    capabilities = ("fault_analysis",)

    def run(self, task):
        return {"success": True, "evidence": [{"id": task["event_id"]}], "confidence": 0.95}


def _dispatcher():
    from app.runtime.dispatcher import RuntimeDispatcher

    trace = TraceRecorder()
    registry = CapabilityRegistry()
    registry.register_agent(_Agent())
    return RuntimeDispatcher(registry, ExecutionManager(trace=lambda event, payload: trace.record(event=event, **payload)), trace), trace


def test_dispatcher_selects_agent_by_required_capability():
    dispatcher, trace = _dispatcher()
    result = dispatcher.dispatch(
        ActionModel.agent("legacy-target", {"required_capability": "fault_analysis", "event_id": "EVT-1"}),
        {"task_id": "TASK-1", "trace_id": "TRACE-1", "event_id": "EVT-1"},
    )

    assert isinstance(result, AgentResult)
    assert result.success is True
    assert result.evidence == [{"id": "EVT-1"}]
    events = [item["event"] for item in trace.list(trace_id="TRACE-1")]
    assert "capability_selected" in events
    assert "execution_start" in events
    assert "execution_end" in events


def test_dispatcher_blocks_unknown_capability():
    dispatcher, _trace = _dispatcher()
    result = dispatcher.dispatch(
        ActionModel.agent("unknown", {"required_capability": "not_registered"}),
        {"task_id": "TASK-2", "trace_id": "TRACE-2"},
    )

    assert result.success is False
    assert "capability" in result.output["error"]


def test_dispatcher_reuses_side_effect_execution_record():
    dispatcher, _trace = _dispatcher()
    action = ActionModel.agent(
        "legacy-target",
        {"required_capability": "fault_analysis", "event_id": "EVT-3"},
        side_effect=True,
        idempotency_key="event:EVT-3",
    )
    first = dispatcher.dispatch(action, {"task_id": "TASK-3", "trace_id": "TRACE-3", "event_id": "EVT-3"})
    second = dispatcher.dispatch(action, {"task_id": "TASK-3", "trace_id": "TRACE-3", "event_id": "EVT-3"})

    assert first.output == second.output


def test_dispatcher_task_adapter_canonicalizes_capability_aliases():
    from app.runtime.dispatcher import RuntimeDispatcher
    from app.runtime.capability import CapabilityDefinition

    class _KnowledgeAgent(BaseAgent):
        name = "knowledge"
        capabilities = ("document_search",)

        def run(self, task):
            self.task = task
            return {"success": True, "documents": [{"id": "DOC-1"}], "confidence": 1.0}

    agent = _KnowledgeAgent()
    registry = CapabilityRegistry([CapabilityDefinition(
        "document_search", "knowledge", "knowledge", "knowledge", aliases=("knowledge_search",),
    )])
    registry.register_agent(agent)
    dispatcher = RuntimeDispatcher(registry, ExecutionManager())

    result = dispatcher.dispatch(
        ActionModel.agent("legacy-target", {"required_capability": "knowledge_search"}),
        {"task_id": "TASK-ALIAS", "trace_id": "TRACE-ALIAS", "diagnosis": {"summary": "主轴温度异常"}, "context": {}},
    )

    assert result.success is True
    assert agent.task["query"] == "主轴温度异常"

