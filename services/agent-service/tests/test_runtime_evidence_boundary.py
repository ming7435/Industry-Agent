from types import SimpleNamespace

from app.agents.base import AgentResult, BaseAgent
from app.agents.diagnosis.graph import request_diagnosis_reasoning
from app.agents.diagnosis.schemas import AgentStatus, DiagnosisState
from app.agents.maintenance.graph import request_knowledge
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager


class _KnowledgeAgent(BaseAgent):
    name = "knowledge"
    capabilities = ("document_search",)

    def __init__(self):
        self.calls = 0

    def run(self, task):
        self.calls += 1
        return {"documents": [{"id": "fresh"}], "query": task["query"]}


def test_runtime_reuses_exact_diagnosis_knowledge_evidence():
    agent = _KnowledgeAgent()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    trace = TraceRecorder()
    dispatcher = RuntimeDispatcher(
        registry,
        ExecutionManager(trace=lambda event, payload: trace.record(event=event, **payload)),
        trace,
    )

    result = dispatcher.dispatch(
        ActionModel.agent("knowledge", {"required_capability": "document_search"}),
        {
            "task_id": "TASK-EVIDENCE-1",
            "trace_id": "TRACE-EVIDENCE-1",
            "diagnosis": {
                "tool_calls": [
                    {
                        "name": "search_knowledge",
                        "arguments": {"query": "bearing overheating", "limit": 5},
                        "result": {
                            "success": True,
                            "query": "bearing overheating",
                            "documents": [{"id": "DOC-1", "content": "bearing SOP"}],
                        },
                    }
                ]
            },
            "event": {"event_id": "EVT-EVIDENCE-1"},
            "user_text": "bearing overheating",
        },
    )

    assert result.success is True
    assert result.output["documents"] == [{"id": "DOC-1", "content": "bearing SOP"}]
    assert result.evidence == [{"id": "DOC-1", "content": "bearing SOP"}]
    assert agent.calls == 0


def test_runtime_managed_diagnosis_does_not_call_knowledge_provider():
    calls = []

    class _Client:
        available = True

        def chat(self, *_args, **_kwargs):
            return {"choices": [{"message": {"role": "assistant", "content": "{}"}}]}

    class _Agent:
        client = _Client()
        knowledge_provider = lambda *_args: calls.append("provider")

        def _tool_schemas_for(self, _allowed):
            return []

        def request_knowledge(self, *_args):
            calls.append("request")
            return {"documents": [{"id": "unexpected"}]}

    event = {"event_id": "EVT-DIAG-BOUNDARY", "runtime_managed": True}
    runtime = DiagnosisState(abnormal_event=event, status=AgentStatus.RUNNING, allowed_tools=[])
    result = request_diagnosis_reasoning({
        "agent": _Agent(),
        "agent_state": runtime,
        "event": event,
        "alarm_code": None,
    })

    assert result["route"] == "validate"
    assert calls == []


def test_runtime_managed_maintenance_does_not_call_knowledge_provider():
    calls = []

    class _Agent:
        def request_knowledge(self, *_args):
            calls.append("request")
            return {"documents": [{"id": "unexpected"}]}

    result = request_knowledge({
        "agent": _Agent(),
        "request": {"runtime_managed": True, "knowledge": {}},
        "query": "bearing overheating",
        "diagnosis": SimpleNamespace(),
    })

    assert result["knowledge"] == {}
    assert calls == []


def test_runtime_maintenance_task_is_marked_runtime_managed():
    task = RuntimeDispatcher._task_for_agent(
        "repair_planning",
        {"event": {"event_id": "EVT-MAINT-BOUNDARY"}},
        {},
    )

    assert task["runtime_managed"] is True
