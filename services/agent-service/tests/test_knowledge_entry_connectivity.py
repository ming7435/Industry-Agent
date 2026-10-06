"""公开知识问答模式由服务端授权检索，客户端不能指定内部能力。"""

from types import SimpleNamespace
import pytest

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.agents.base import AgentResult
from app.agents.router.agent import RouterAgent
from app.harness import TraceRecorder
from app.runtime.coordinator import RuntimeCoordinator
from app.runtime.planner import Planner, Plan
from app.runtime.action import ActionModel
from app.graph.workflow import AgentOrchestrator
from app.runtime.tracing import NodeTrace


def _real_coordinator(*, suggest_write=False, bad_plan=False):
    calls = []

    class Dispatcher:
        def dispatch(self, action, state):
            calls.append(action.required_capability)
            return AgentResult(success=True, output={"status": "completed", "documents": [{"id": "evidence"}]},
                               evidence=[{"id": "evidence"}], confidence=1,
                               next_actions=[{"required_capability": "workorder_query"}] if suggest_write else [])

    planner = Planner()
    if bad_plan:
        class InvalidPlanner:
            def plan(self, goal, context):
                return Plan(goal, [ActionModel.agent("workorder", payload={"required_capability": "workorder_query"})])
        planner = InvalidPlanner()
    container = SimpleNamespace(agents={"router": RouterAgent()}, trace=TraceRecorder(),
                                planner=planner, dispatcher=Dispatcher())
    return RuntimeCoordinator(container), calls


def test_real_router_cannot_upgrade_knowledge_to_workorder():
    coordinator, calls = _real_coordinator()
    result = coordinator.run({"entry": "knowledge", "user_text": "给工单 WO-123 派工的方法有哪些",
                              "context": {"route_hint": "workorder", "required_capabilities": ["document_search"]}})
    assert result["goal_event"]["required_capabilities"] == ["document_search"]
    assert calls == ["document_search"]


def test_event_shaped_context_cannot_upgrade_knowledge():
    coordinator, calls = _real_coordinator()
    coordinator.run({"entry": "knowledge", "user_text": "查询工单 WO-123",
                     "context": {"event_id": "EV-123", "abnormal_metrics": {"temperature": 100}}})
    assert calls == ["document_search"]


def test_knowledge_replanning_cannot_read_or_write_workorders():
    coordinator, calls = _real_coordinator(suggest_write=True)
    result = coordinator.run({"entry": "knowledge", "user_text": "维修手册", "context": {"required_capabilities": ["document_search"]}})
    assert calls == ["document_search"]
    assert result["runtime_result"]["status"] == "blocked"
    assert result["runtime_result"]["stop_reason"] == "knowledge_read_only_scope"


def test_bad_knowledge_plan_is_rejected_before_dispatch():
    coordinator, calls = _real_coordinator(bad_plan=True)
    result = coordinator.run({"entry": "knowledge", "user_text": "维修手册"})
    assert calls == []
    assert result["runtime_result"]["status"] == "blocked"


@pytest.mark.parametrize("text,context", [
    ("给工单 WO-123 派工", {}),
    ("查询工单 WO-123", {"route_hint": "workorder_query"}),
    ("维修手册", {"event_id": "EV-123", "abnormal_metrics": {"temperature": 100}}),
])
def test_real_api_graph_router_planner_remain_read_only(monkeypatch, text, context):
    monkeypatch.setenv("AGENT_API_TOKEN", "")
    coordinator, calls = _real_coordinator()
    container = coordinator.container
    container.tracing = NodeTrace(container.trace)
    container.coordinator = coordinator
    runtime = AgentOrchestrator(container=container)
    with TestClient(create_app(runtime)) as client:
        response = client.post("/api/v1/agent/question", json={"mode": "knowledge", "user_text": text, "context": context})
    assert response.status_code == 200, response.text
    assert calls == ["document_search"]
    assert response.json()["entry"] == "knowledge"


def test_knowledge_mode_uses_server_owned_read_only_capability(monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "")
    calls = []

    def run_user(text, context):
        calls.append((text, context))
        return {"knowledge": {"answer": "检索结果"}}

    runtime = SimpleNamespace(container=SimpleNamespace(), run_knowledge=run_user)
    with TestClient(create_app(runtime)) as client:
        # 即使问题文字含派工，知识模式只检索资料，不能变成工单操作。
        response = client.post("/api/v1/agent/question", json={"user_text": "给送料机派工的方法有哪些", "mode": "knowledge", "context": {"device_id": "M-1", "alarm_active": True}})
    assert response.status_code == 200, response.text
    assert len(calls) == 1
    assert "required_capabilities" not in calls[0][1]
    assert calls[0][1]["device_id"] == "M-1"


def test_knowledge_mode_still_rejects_client_owned_internal_capabilities(monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "")
    runtime = SimpleNamespace(container=SimpleNamespace(), run_user=lambda *_: (_ for _ in ()).throw(AssertionError("不应执行")))
    with TestClient(create_app(runtime)) as client:
        response = client.post("/api/v1/agent/question", json={"user_text": "测试", "mode": "knowledge", "context": {"required_capabilities": ["workorder_create"]}})
    assert response.status_code == 422


def test_unknown_question_mode_is_rejected(monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "")
    runtime = SimpleNamespace(container=SimpleNamespace(), run_user=lambda *_: {})
    with TestClient(create_app(runtime)) as client:
        assert client.post("/api/v1/agent/question", json={"user_text": "检查", "mode": "workorder", "context": {}}).status_code == 422
