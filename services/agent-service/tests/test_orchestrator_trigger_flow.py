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

    container = SimpleNamespace(requests=_Requests(), tracing=_Tracing(), harnesses={"report": _ReportHarness()})
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


def test_same_event_has_one_task_and_one_workorder(monkeypatch):
    from fastapi.testclient import TestClient
    from app.api.server import create_app

    # 该 E2E 验证 Runtime 契约，不依赖测试进程中可用的外部 RAG 服务。
    monkeypatch.setenv("RAG_ALLOW_LOCAL_FALLBACK", "true")
    monkeypatch.setenv("RAG_SERVICE_TIMEOUT_SECONDS", "1")
    client = TestClient(create_app())
    event = {"event_id": "EVT-E2E-1", "device_id": "D-1", "alarm_code": "E102", "event_type": "alarm"}
    first = client.post("/api/v1/agent/event", json={"event": event}).json()
    second = client.post("/api/v1/agent/event", json={"event": event}).json()
    assert second["task_id"] == first["task_id"]
    # 低置信度或需人工复核时必须阻断自动派单，不能把诊断结果伪装成工单已进入维修。
    assert first["status"] == "blocked"
    assert first["runtime_result"]["status"] == "blocked"
    assert "workorder" not in first or not first.get("workorder")
    assert first["runtime_plan"]["actions"]
    planned_capabilities = [item["payload"]["required_capability"] for item in first["runtime_plan"]["actions"]]
    assert planned_capabilities
    assert "workorder_create" not in planned_capabilities
    assert set(planned_capabilities) <= {"document_search", "diagnosis_review"}
    trace_events = {item.get("event") for item in first["trace"]}
    assert {
        "goal_parsed", "planner_start", "planner_end", "capability_selected", "action_selected",
        "execution_start", "execution_end", "evidence_added", "evaluation_result", "loop_continue", "loop_stop",
    } <= trace_events
    orders = client.get("/api/workorders").json()["items"]
    matching = [item for item in orders if item.get("event_id") == "EVT-E2E-1"]
    assert matching == []

    assert matching == []
