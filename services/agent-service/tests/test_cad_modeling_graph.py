"""真实 CAD 图、Markdown Skill、工具注册和建模 API 调用链回归。"""

from io import BytesIO
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app
from app.harness.trace import TraceRecorder
from app.skills.registry import get_skill_registry
from app.tools.registry import ToolRegistry
from test_cad_modeling_api import finished, request_spec


@pytest.fixture
def graph_client(tmp_path):
    trace = TraceRecorder()
    app = create_app(SimpleNamespace(container=SimpleNamespace(trace=trace)))
    app.state.cad_modeling_root = tmp_path / "designs"
    with TestClient(app) as client:
        yield client, trace


def complete(client, payload):
    response = client.post("/api/cad/designs", json=payload)
    assert response.status_code == 202
    identifier = response.json()["design_id"]
    finished(client, identifier)
    # 等队列工作线程退出，避免观察到终态与日志尾部之间的瞬时差异。
    client.app.state.cad_modeling_service.close()
    return client.get(f"/api/cad/designs/{identifier}").json()


def test_real_api_builds_solid_via_node_skill_and_tool(graph_client):
    client, trace = graph_client
    result = complete(client, request_spec())
    assert result["status"] == "ready", result
    assert result["geometry"]["volume_mm3"] == pytest.approx(31415.9265359)
    node_rows = [row for row in trace.list() if row["event"] == "step_completed" and row.get("node") == "model_3d"]
    assert len(node_rows) == 1, "建模 API 绕过了实际 CAD 图中的 model_3d 节点"
    assert node_rows[0]["skill"] == "production_modeling_skill"
    assert node_rows[0]["task_id"] == result["design_id"]
    tool_rows = [row for row in trace.list() if row["event"] == "tool_completed" and row.get("tool_name") == "generate_3d_model"]
    assert len(tool_rows) == 1
    assert tool_rows[0]["skill"] == "production_modeling_skill"
    assert tool_rows[0]["step"] == "build_model"
    assert tool_rows[0]["input"] == {"design_id": result["design_id"]}
    assert tool_rows[0]["output"]["geometry"]["step_roundtrip_valid"] is True
    assert result["execution"]["node"] == "model_3d"
    assert result["execution"]["skill"] == "production_modeling_skill"
    assert result["execution"]["tool"] == "generate_3d_model"
    assert {event.get("skill") for event in result["events"]} == {"production_modeling_skill"}


def test_missing_dimensions_pass_through_same_node_without_fake_success(graph_client):
    client, trace = graph_client
    result = complete(client, {"prompt": "做一个没有尺寸的零件"})
    assert result["status"] == "needs_input"
    assert result["artifacts"] == []
    assert result["missing_information"]
    rows = [row for row in trace.list() if row.get("tool_name") == "generate_3d_model" and row["event"] == "tool_completed"]
    assert len(rows) == 1
    assert rows[0]["output"]["status"] == "needs_input"


def test_parallel_jobs_keep_independent_modeling_contexts(graph_client):
    client, trace = graph_client
    first = request_spec()
    second = request_spec()
    second["spec"]["operations"][0]["length"] = 60
    second["spec"]["operations"][1]["length"] = 60
    identifiers = [client.post("/api/cad/designs", json=payload).json()["design_id"] for payload in (first, second)]
    client.app.state.cad_modeling_service.close()
    results = [client.get(f"/api/cad/designs/{identifier}").json() for identifier in identifiers]
    assert [value["status"] for value in results] == ["ready", "ready"]
    assert [value["geometry"]["volume_mm3"] for value in results] == pytest.approx([31415.9265359, 37699.1118431])
    rows = [row for row in trace.list() if row.get("tool_name") == "generate_3d_model" and row["event"] == "tool_completed"]
    assert len(rows) == 2
    assert {row["task_id"] for row in rows} == set(identifiers)
    assert all(row["task_id"] == row["input"]["design_id"] == row["output"]["design_id"] for row in rows)


def test_engineering_query_cannot_inherit_modeling_skill_permissions():
    registry = get_skill_registry()
    query_skills = registry.select("cad", {"query": "BOM 零件查询", "component": "主轴"})
    assert "generate_3d_model" not in registry.merge_tools(query_skills)
    selected = registry.select("cad", names=["production_modeling_skill"])
    assert registry.merge_tools(selected) == ["generate_3d_model"]


def test_modeling_tool_rejects_unbound_execution_and_is_hidden_from_model():
    tools = ToolRegistry()
    assert "generate_3d_model" not in {row["function"]["name"] for row in tools.tool_schemas()}
    with pytest.raises(PermissionError, match="可信"):
        tools.execute("generate_3d_model", {"design_id": "CAD-0123456789ABCDEF0123"})


def test_local_mcp_url_cannot_bypass_modeling_task_guard(monkeypatch):
    remote_calls = []

    def external_response(request, **kwargs):
        # 只替代外部网络边界；实际工具注册、路由和任务校验均执行真实代码。
        remote_calls.append(request.full_url)
        return BytesIO(b'{"status":"ready","design_id":"CAD-0123456789ABCDEF0123"}')

    monkeypatch.setenv("MCP_LOCAL_URL", "http://127.0.0.1:9")
    monkeypatch.setattr("app.mcp.client.urlopen", external_response)
    tools = ToolRegistry()
    with pytest.raises(PermissionError, match="可信"):
        tools.execute(
            "generate_3d_model",
            {"design_id": "CAD-0123456789ABCDEF0123"},
            context={"agent": "cad", "skill": "production_modeling_skill", "allowed_tools": ["generate_3d_model"]},
        )
    assert remote_calls == []
