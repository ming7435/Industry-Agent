from types import SimpleNamespace

from app.agents.base import AgentResult
from app.harness import TraceRecorder
from app.runtime.planner import Planner


class _Dispatcher:
    def __init__(self):
        self.actions = []

    def dispatch(self, action, state):
        self.actions.append(action)
        capability = action.required_capability
        key = {
            "fault_analysis": "diagnosis",
            "document_search": "knowledge",
            "drawing_search": "cad",
            "repair_planning": "maintenance_plan",
            "workorder_create": "workorder",
        }[capability]
        output = {"status": "open", "workorder_id": "WO-1"} if key == "workorder" else {"status": "completed", "evidence": [{"id": capability}]}
        return AgentResult(success=True, output=output, evidence=output.get("evidence", []), confidence=0.9)


def test_runtime_coordinator_uses_planned_capabilities_instead_of_graph_edges():
    from app.runtime.coordinator import RuntimeCoordinator

    dispatcher = _Dispatcher()
    container = SimpleNamespace(
        planner=Planner(),
        dispatcher=dispatcher,
        trace=TraceRecorder(),
    )
    result = RuntimeCoordinator(container).run({
        "entry": "trigger",
        "task_id": "TASK-RUNTIME-1",
        "trace_id": "TRACE-RUNTIME-1",
        "event": {"event_id": "EVT-RUNTIME-1", "device_id": "D-1", "event_type": "alarm"},
    })

    assert [action.required_capability for action in dispatcher.actions] == [
        "fault_analysis", "document_search", "drawing_search", "repair_planning", "workorder_create",
    ]
    assert result["runtime_result"]["status"] == "completed"
    assert result["workorder"]["workorder_id"] == "WO-1"
    assert result["status"] == "waiting_repair"


def test_user_goal_does_not_expand_into_an_automatic_workorder_plan():
    from app.runtime.coordinator import RuntimeCoordinator

    dispatcher = _Dispatcher()
    container = SimpleNamespace(planner=Planner(), dispatcher=dispatcher, trace=TraceRecorder())
    result = RuntimeCoordinator(container).run({
        "entry": "user",
        "task_id": "TASK-USER-1",
        "trace_id": "TRACE-USER-1",
        "user_text": "查询主轴维修手册",
    })

    assert [action.required_capability for action in dispatcher.actions] == ["document_search"]
    assert "workorder" not in result


def test_runtime_state_preserves_runtime_fields_through_langgraph_schema():
    from app.graph.workflow import AgentOrchestrator

    class _Container:
        trace = TraceRecorder()
        requests = SimpleNamespace()
        tracing = SimpleNamespace(
            start=lambda *_args, **_kwargs: None,
            finish=lambda _name, _state, payload: payload,
        )

        class _Coordinator:
            def run(self, state):
                return {
                    **state,
                    "goal_event": {"goal": "x"},
                    "runtime_plan": {"actions": []},
                    "runtime_result": {"status": "completed"},
                    "runtime_actions": [],
                }

        coordinator = _Coordinator()

    orchestrator = AgentOrchestrator(container=_Container())
    result = orchestrator.run_user("查询维修手册")

    assert result["runtime_plan"] == {"actions": []}
    assert result["runtime_result"]["status"] == "completed"
    assert result["runtime_actions"] == []
