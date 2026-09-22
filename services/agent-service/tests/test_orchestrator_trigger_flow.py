from types import SimpleNamespace


class _Tracing:
    def start(self, *_args, **_kwargs):
        return None

    def finish(self, _name, _state, payload):
        return payload


class _Requests:
    def access_memory(self, *_args, **_kwargs):
        raise AssertionError("trigger report must not learn memory")


class _ReportHarness:
    def execute_agent(self, _state):
        return {"report_id": "R-1", "report_type": "incident_report"}


def test_trigger_report_does_not_start_memory_learning():
    from app.graph.nodes import OrchestratorNodes

    container = SimpleNamespace(
        requests=_Requests(),
        tracing=_Tracing(),
        harnesses={"report": _ReportHarness()},
    )
    result = OrchestratorNodes(container).report({"entry": "trigger", "task_id": "TASK-1", "trace_id": "TRACE-1"})

    assert result["report"]["report_id"] == "R-1"
    assert "memory" not in result


def test_orchestrator_response_trace_isolated_to_current_task_and_trace():
    from app.graph.workflow import AgentOrchestrator
    from app.harness.trace import TraceRecorder

    class _Graph:
        def invoke(self, state):
            return dict(state)

    trace = TraceRecorder()
    trace.record(task_id="OTHER", trace_id="OTHER-TRACE", event="old")
    orchestrator = object.__new__(AgentOrchestrator)
    orchestrator.graph = _Graph()
    orchestrator.container = SimpleNamespace(trace=trace)

    result = orchestrator._execute_graph({"entry": "user", "user_text": "hello"})

    assert result["trace"] == []
