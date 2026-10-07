"""调用真实 CAD 图和技能；只替换远程模型与 MCP 网络边界。"""
import json

import pytest

from app.agents.cad.agent import CADAgent
from app.harness.trace import TraceRecorder
from app.skills import get_skill_registry
from app.tools.registry import ToolRegistry


CODE = "from llmcad import *\n# 隔离测试的远程 CAD 代码"
PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="


class RemoteCAD:
    server_instructions = "示例：使用服务返回的 llmcad 语法构造设计"
    def __init__(self, result=None):
        self.calls = []
        self.result = result if result is not None else {"content": [
            {"type": "text", "text": "预览成功"},
            {"type": "image", "mimeType": "image/png", "data": PNG},
        ], "isError": False}

    def list_tools(self):
        return [
            {"name": "list_designs", "description": "列出设计", "inputSchema": {
                "type": "object", "properties": {}, "additionalProperties": False}},
            {"name": "get_design_code", "description": "读取设计最新代码", "inputSchema": {
                "type": "object", "properties": {"designId": {"type": "string"}},
                "required": ["designId"], "additionalProperties": False}},
            {"name": "render_preview", "description": "渲染设计预览", "inputSchema": {
                "type": "object", "properties": {"code": {"type": "string"}, "views": {
                    "type": "array", "items": {"type": "string", "enum": ["front", "back", "right", "left", "top", "bottom", "iso"]}}},
                "required": ["code"], "additionalProperties": False}},
            {"name": "save_design", "description": "保存设计", "inputSchema": {
                "type": "object", "properties": {"designId": {"type": "string"}, "code": {"type": "string"}, "message": {"type": "string"}},
                "required": ["designId", "code"], "additionalProperties": False}},
        ]

    def call_tool(self, name, arguments):
        self.calls.append((name, arguments))
        if name == "list_designs":
            return {"content": [{"type": "text", "text": json.dumps({"designs": [{"id": "design-1", "name": "销轴"}]})}]}
        if name == "get_design_code":
            return {"content": [{"type": "text", "text": json.dumps({"designId": "design-1", "code": CODE})}]}
        if name == "save_design":
            return {"content": [{"type": "text", "text": "保存成功"}], "isError": False}
        assert name == "render_preview"
        return self.result


class RemoteModel:
    available = True
    timeout = 90

    def __init__(self, args=None, repeat=False, steps=None):
        self.calls = []
        self.arguments = args if args is not None else {"code": CODE, "views": ["iso"]}
        self.steps = steps if steps is not None else [("render_preview", self.arguments)]
        self.repeat = repeat

    def chat(self, messages, tools=None, **kwargs):
        self.calls.append((messages.copy(), tools))
        message = {"role": "assistant", "content": "已返回 BuildCAD 的工具结果。"}
        index = len(self.calls) - 1
        if index < len(self.steps) or (self.repeat and self.steps):
            name, arguments = self.steps[min(index, len(self.steps) - 1)]
            message = {"role": "assistant", "content": None, "tool_calls": [{
                "id": f"call-{len(self.calls)}", "type": "function", "function": {
                    "name": name, "arguments": json.dumps(arguments)}}]}
        return {"choices": [{"message": message}]}


def run(remote=None, model=None, *, action="preview", design_id=""):
    trace = TraceRecorder()
    agent = CADAgent(ToolRegistry(trace=trace))
    result = agent.run_buildcad("外径30mm、长50mm的销轴", run_id="BC-test",
                               client=remote or RemoteCAD(), model=model or RemoteModel(),
                               action=action, design_id=design_id)
    return result, trace


def test_actual_node_skill_tool_uses_discovered_schema_and_preserves_result():
    remote, model = RemoteCAD(), RemoteModel()
    result, trace = run(remote, model)
    assert result["status"] == "completed"
    assert len(model.calls) == 1
    assert remote.calls == [("render_preview", model.arguments)]
    model_schema = next(tool["function"]["parameters"] for tool in model.calls[0][1] if tool["function"]["name"] == "render_preview")
    remote_schema = next(tool["inputSchema"] for tool in remote.list_tools() if tool["name"] == "render_preview")
    assert model_schema == remote_schema
    assert RemoteCAD.server_instructions in str(model.calls[0][0])
    assert result["calls"][0]["result"]["content"] == [
        {"type": "text", "text": "预览成功"},
        {"type": "image", "mimeType": "image/png", "data": PNG},
    ]
    assert result["execution"]["node"] == "model_3d"
    assert result["execution"]["tool"] == "buildcad_mcp"
    rows = [r for r in trace.list() if r["event"] == "tool_completed"]
    assert len(rows) == 1
    assert rows[0]["skill"] == "production_modeling_skill"
    assert rows[0]["task_id"] == "BC-test"
    assert rows[0]["input"]["tool_name"] == "render_preview"


def test_wrong_dynamic_schema_stops_before_network():
    remote = RemoteCAD()
    result, _ = run(remote, RemoteModel({"invented_code": "x"}))
    assert result["status"] == "failed"
    assert remote.calls == []


def test_duplicate_write_is_not_reexecuted():
    remote = RemoteCAD()
    model = RemoteModel(repeat=True, steps=[
        ("render_preview", {"code": CODE, "views": ["iso"]}),
        ("save_design", {"designId": "design-1", "code": CODE, "message": "更新销轴"}),
    ])
    result, _ = run(remote, model, action="save", design_id="design-1")
    assert remote.calls == [
        ("list_designs", {}),
        ("get_design_code", {"designId": "design-1"}),
        ("render_preview", {"code": CODE, "views": ["iso"]}),
        ("save_design", {"designId": "design-1", "code": CODE, "message": "更新销轴"}),
    ]
    assert result["status"] == "completed"
    assert not result.get("error")
    assert len(model.calls) == 2


@pytest.mark.parametrize("second_message", ["更新销轴", "再次更新销轴"])
def test_tool_scope_blocks_second_save_even_when_message_changes(second_message):
    from app.tools.cad.buildcad_mcp import BuildCADInputError, buildcad_scope, buildcad_mcp

    remote = RemoteCAD()
    definitions = {tool["name"]: tool for tool in remote.list_tools()}
    # 直接走工具入口，验证重复写入保护不依赖节点提前结束。
    with buildcad_scope(remote, definitions, action="save", design_id="design-1"):
        buildcad_mcp("list_designs", {})
        buildcad_mcp("get_design_code", {"designId": "design-1"})
        buildcad_mcp("render_preview", {"code": CODE, "views": ["iso"]})
        result = buildcad_mcp("save_design", {"designId": "design-1", "code": CODE, "message": "更新销轴"})
        assert result["content"][0]["text"] == "保存成功"
        with pytest.raises(BuildCADInputError, match="重复"):
            buildcad_mcp("save_design", {"designId": "design-1", "code": CODE, "message": second_message})
    assert remote.calls == [
        ("list_designs", {}),
        ("get_design_code", {"designId": "design-1"}),
        ("render_preview", {"code": CODE, "views": ["iso"]}),
        ("save_design", {"designId": "design-1", "code": CODE, "message": "更新销轴"}),
    ]


def test_save_reads_selected_design_then_previews_exact_code_before_one_write():
    remote = RemoteCAD()
    model = RemoteModel(steps=[
        ("render_preview", {"code": CODE, "views": ["iso"]}),
        ("save_design", {"designId": "design-1", "code": CODE, "message": "更新销轴"}),
    ])
    result, trace = run(remote, model, action="save", design_id="design-1")
    assert result["status"] == "completed", result
    assert len(model.calls) == 2
    assert remote.calls == [
        ("list_designs", {}),
        ("get_design_code", {"designId": "design-1"}),
        ("render_preview", {"code": CODE, "views": ["iso"]}),
        ("save_design", {"designId": "design-1", "code": CODE, "message": "更新销轴"}),
    ]
    assert [call["tool"] for call in result["calls"]] == ["list_designs", "get_design_code", "render_preview", "save_design"]
    assert result["calls"][-1]["result"]["content"][0]["text"] == "保存成功"
    assert json.loads(model.calls[0][0][-1]["content"])["latest_code"] == CODE
    rows = [row for row in trace.list() if row["event"] == "tool_completed"]
    assert [row["input"]["tool_name"] for row in rows] == ["list_designs", "get_design_code", "render_preview", "save_design"]
    assert all(row["skill"] == "production_modeling_skill" and row["task_id"] == "BC-test" for row in rows)


def test_mcp_error_never_reports_design_success():
    result, _ = run(RemoteCAD({"isError": True, "content": [{"type": "text", "text": "无效图纸"}]}))
    assert result["status"] == "failed"
    assert result["calls"][0]["result"]["isError"] is True


def test_no_tool_result_cannot_claim_generated_model():
    model = RemoteModel(steps=[])
    result, _ = run(model=model)
    assert result["status"] == "needs_input"
    assert "尚未执行建模" in result["answer"]
    assert not result["calls"]


def test_queries_cannot_select_buildcad_skill_and_tool_is_scoped():
    registry = get_skill_registry()
    assert "buildcad_mcp" not in registry.merge_tools(registry.select("cad", {"query": "BOM查询"}))
    assert registry.merge_tools(registry.select("cad", names=["production_modeling_skill"])) == ["buildcad_mcp"]
    tools = ToolRegistry()
    assert "buildcad_mcp" not in {x["function"]["name"] for x in tools.tool_schemas()}
    with pytest.raises(PermissionError):
        tools.execute("buildcad_mcp", {"tool_name": "save_design", "arguments": {}})


def test_provider_value_error_is_not_exposed():
    class LeakingModel(RemoteModel):
        def chat(self, *args, **kwargs):
            raise ValueError("provider secret=DO_NOT_SHOW")
    result, trace = run(model=LeakingModel())
    assert result["status"] == "failed"
    assert "DO_NOT_SHOW" not in json.dumps([result, trace.list()])


def test_schema_external_reference_cannot_open_network(monkeypatch):
    import urllib.request
    from app.tools.cad.buildcad_mcp import BuildCADInputError, buildcad_scope, buildcad_mcp
    contacted = []
    def deny(*args, **kwargs):
        contacted.append(args)
        raise RuntimeError("不应该访问此地址")
    monkeypatch.setattr(urllib.request, "urlopen", deny)
    remote = RemoteCAD()
    with buildcad_scope(remote, {"render_preview": {"inputSchema": {"$ref": "http://127.0.0.1:9876/schema"}}}):
        with pytest.raises(BuildCADInputError, match="schema"):
            buildcad_mcp("render_preview", {"code": CODE})
    assert contacted == []
    assert remote.calls == []
