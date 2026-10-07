"""通过真实 CAD 图验证已观测的 BuildCAD schema 和动作边界。"""
import json
import base64

import pytest

from app.agents.cad.agent import CADAgent
from app.agents.cad.modeling_api import RunRequest
from app.clients.buildcad import BuildCADError
from app.tools.cad.buildcad_mcp import buildcad_mcp, buildcad_scope
from test_buildcad_api import api, PREFIX


PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="
CODE = 'from llmcad import Cylinder\nresult = Cylinder(30, 50)'
OLD_CODE = 'from llmcad import Cylinder\nresult = Cylinder(20, 40)'
SCHEMAS = [
    {"name": "list_designs", "inputSchema": {"type": "object", "properties": {}}},
    {"name": "get_design_code", "inputSchema": {"type": "object", "properties": {"designId": {"type": "string"}}, "required": ["designId"]}},
    {"name": "render_preview", "inputSchema": {"type": "object", "properties": {"code": {"type": "string"}, "views": {"type": "array", "items": {"type": "string", "enum": ["front", "back", "right", "left", "top", "bottom", "iso"]}}}, "required": ["code"]}},
    {"name": "save_design", "inputSchema": {"type": "object", "properties": {"designId": {"type": "string"}, "code": {"type": "string"}, "message": {"type": "string"}}, "required": ["designId", "code"]}},
]


class Remote:
    server_instructions = ""

    def __init__(self, **results):
        self.calls = []
        self.results = {
            "list_designs": {"content": [{"type": "text", "text": '[{"id":"design-1","title":"Pin"}]'}]},
            "get_design_code": {"content": [{"type": "text", "text": json.dumps({"code": OLD_CODE})}]},
            "render_preview": {"content": [{"type": "image", "mimeType": "image/png", "data": PNG}]},
            "save_design": {"content": [{"type": "text", "text": "saved"}]},
            **results,
        }

    def list_tools(self):
        return SCHEMAS

    def call_tool(self, name, arguments):
        self.calls.append((name, arguments))
        return self.results[name]


class Model:
    available = True

    def __init__(self, *steps):
        self.steps = list(steps)
        self.messages = []

    def chat(self, messages, tools=None):
        self.messages.append((list(messages), tools))
        message = {"role": "assistant", "content": "完成"}
        if self.steps:
            name, args = self.steps.pop(0)
            message["tool_calls"] = [{"id": f"call-{len(self.messages)}", "type": "function", "function": {"name": name, "arguments": json.dumps(args)}}]
        return {"choices": [{"message": message}]}


def execute(action="preview", design_id="", remote=None, model=None):
    remote = remote or Remote()
    result = CADAgent().run_buildcad("预览圆柱", run_id="BC-alignment", client=remote,
        model=model, action=action, design_id=design_id)
    return result, remote


def test_empty_design_list_is_a_completed_read_without_a_model():
    result, remote = execute("list_designs", remote=Remote(list_designs={"content": [{"type": "text", "text": "[]"}]}))
    assert result["status"] == "completed" and result["designs"] == []
    assert "没有" in result["answer"] or "暂无" in result["answer"]
    assert result["calls"][0]["result"]["content"][0]["text"] == "[]"
    assert remote.calls == [("list_designs", {})]
    assert result["action"] == "list_designs" and result["design_id"] == ""
    assert result["execution"]["node"] == "model_3d"
    assert result["execution"]["skill"] == "production_modeling_skill"


def test_get_code_is_direct_and_retains_raw_result():
    result, remote = execute("get_design_code", "design-1")
    assert result["status"] == "completed" and result["code"] == OLD_CODE
    assert remote.calls == [("get_design_code", {"designId": "design-1"})]
    assert result["calls"][0]["result"] == remote.results["get_design_code"]


@pytest.mark.parametrize("action", ["list_designs", "get_design_code"])
def test_read_without_usable_data_is_failed_and_preserves_raw_reply(action):
    reply = {"content": []}
    result, remote = execute(action, "design-1" if action == "get_design_code" else "", remote=Remote(**{action: reply}))
    assert result["status"] == "failed"
    assert result["error_tool"] == result["error_stage"] == action
    assert result["calls"][0]["result"] == reply
    assert len(remote.calls) == 1


def test_empty_code_is_a_valid_read_result():
    result, _ = execute("get_design_code", "design-1", remote=Remote(get_design_code={"structuredContent": {"code": ""}, "content": []}))
    assert result["status"] == "completed" and result["code"] == ""


@pytest.mark.parametrize("action", ["get_design_code", "save"])
@pytest.mark.parametrize("design_id", ["", "  "])
def test_selected_design_is_required_at_request_validation(action, design_id):
    with pytest.raises(ValueError):
        RunRequest(prompt="update", command_id="one", action=action, design_id=design_id)


def test_preview_cannot_write_even_if_model_requests_save():
    result, remote = execute(model=Model(("save_design", {"designId": "design-1", "code": CODE})))
    assert result["status"] == "failed" and remote.calls == []
    assert result["error_tool"] == "save_design"


def test_preview_cannot_finish_after_only_listing_designs():
    result, remote = execute(model=Model(("list_designs", {})))
    assert result["status"] == "needs_input"
    assert remote.calls == [("list_designs", {})]
    assert "尚未执行建模" in result["answer"]


@pytest.mark.parametrize("code", ["import cadquery as cq\nresult = cq.Workplane('XY')", "from llmcad import *\nshow_object(result)", "result = 1", "from llmcad import *\nresult = ("])
def test_render_rejects_incompatible_or_invalid_python_before_remote_call(code):
    result, remote = execute(model=Model(("render_preview", {"code": code})))
    assert result["status"] == "failed" and remote.calls == []
    assert result["error_tool"] == "render_preview"


@pytest.mark.parametrize("remote_result", [
    {"content": [{"type": "text", "text": "rendered"}]},
    {"content": [{"type": "image", "mimeType": "image/png", "data": ""}]},
    {"content": [{"type": "image", "mimeType": "image/png", "data": "not-an-image"}]},
])
def test_preview_requires_actual_image_evidence(remote_result):
    result, remote = execute(remote=Remote(render_preview=remote_result), model=Model(("render_preview", {"code": CODE})))
    assert result["status"] == "failed"
    assert result["error_tool"] == "render_preview"
    assert len(remote.calls) == 1


@pytest.mark.parametrize("image", [
    {"type": "resource_link", "mimeType": "image/png", "uri": "http://example.test/preview.png"},
    {"type": "resource_link", "mimeType": "image/svg+xml", "uri": "https://example.test/preview.svg"},
    {"type": "resource_link", "mimeType": "image/gif", "uri": "https://example.test/preview.gif"},
    {"type": "resource_link", "mimeType": "image/png", "uri": "https://name:password@example.test/preview.png"},
    {"type": "resource_link", "mimeType": "image/png", "uri": "https://example.test/pre\nview.png"},
    {"type": "resource_link", "mimeType": "image/png", "uri": "https://example.test/pre view.png"},
    {"type": "image", "mimeType": "image/gif", "data": base64.b64encode(b"GIF89a" + b"\x00" * 20).decode()},
    {"type": "text", "mimeType": "image/png", "data": PNG},
])
def test_undisplayable_image_does_not_complete_or_unlock_save(image):
    model = Model(("render_preview", {"code": CODE}), ("save_design", {"designId": "design-1", "code": CODE}))
    result, remote = execute("save", "design-1", remote=Remote(render_preview={"content": [image]}), model=model)
    assert result["status"] == "failed" and result["error_tool"] == "render_preview"
    assert [name for name, _ in remote.calls] == ["list_designs", "get_design_code", "render_preview"]


@pytest.mark.parametrize("mime", ["image/png", "image/jpeg", "image/webp"])
def test_safe_https_image_asset_is_preview_evidence(mime):
    reply = {"content": [{"type": "resource_link", "mimeType": mime, "uri": "https://example.test/preview"}]}
    result, _ = execute(remote=Remote(render_preview=reply), model=Model(("render_preview", {"code": CODE})))
    assert result["status"] == "completed"


@pytest.mark.parametrize("action", ["preview", "save"])
def test_confirmed_action_finishes_without_another_model_summary(action):
    class FailingSummary(Model):
        def chat(self, *args, **kwargs):
            if not self.steps:
                raise TimeoutError("总结超时不应改变已完成的远端事实")
            return super().chat(*args, **kwargs)
    steps = [("render_preview", {"code": CODE})]
    if action == "save":
        steps.append(("save_design", {"designId": "design-1", "code": CODE}))
    model = FailingSummary(*steps)
    result, remote = execute(action, "design-1" if action == "save" else "", model=model)
    assert result["status"] == "completed", result
    assert len(model.messages) == (2 if action == "save" else 1)
    assert [name for name, _ in remote.calls].count("save_design") == (1 if action == "save" else 0)


@pytest.mark.parametrize("action", ["preview", "save"])
def test_batch_stops_at_confirmed_action_without_executing_later_requests(action):
    class BatchedModel(Model):
        def chat(self, *args, **kwargs):
            reply = super().chat(*args, **kwargs)
            calls = reply["choices"][0]["message"]["tool_calls"]
            calls.append({"id": "later", "type": "function", "function": {"name": "get_design_code", "arguments": '{"designId":"other-design"}'}})
            return reply
    steps = [("render_preview", {"code": CODE})] if action == "preview" else [("save_design", {"designId": "design-1", "code": CODE})]
    model = BatchedModel(*steps)
    if action == "save":
        def first_preview_then_batch(messages, tools=None):
            if not model.messages:
                model.messages.append((messages, tools))
                return {"choices": [{"message": {"role": "assistant", "tool_calls": [{"id": "preview", "type": "function", "function": {"name": "render_preview", "arguments": json.dumps({"code": CODE})}}]}}]}
            return BatchedModel.chat(model, messages, tools=tools)
        model.chat = first_preview_then_batch
    result, remote = execute(action, "design-1" if action == "save" else "", model=model)
    assert result["status"] == "completed", result
    assert not any(arguments.get("designId") == "other-design" for _, arguments in remote.calls)


@pytest.mark.parametrize("answer", ["请提供长宽高、壁厚和孔径。", "我已经建模完成。"])
def test_no_tool_answer_is_retained_as_unexecuted_input_request(answer):
    class ClarifyingModel(Model):
        def chat(self, *args, **kwargs):
            return {"choices": [{"message": {"role": "assistant", "content": answer}}]}
    result, remote = execute(model=ClarifyingModel())
    assert result["status"] == "needs_input" and result["calls"] == [] and remote.calls == []
    assert answer in result["answer"] and "尚未执行建模" in result["answer"]


class ClarifyingAfterReads(Model):
    def __init__(self, *steps):
        super().__init__(*steps)
        self.clarifications = 0

    def chat(self, *args, **kwargs):
        if self.steps:
            return super().chat(*args, **kwargs)
        self.clarifications += 1
        return {"choices": [{"message": {"role": "assistant", "content": "请补充壁厚和孔径。"}}]}


@pytest.mark.parametrize("action,steps", [
    ("save", []),
    ("preview", [("list_designs", {})]),
    ("preview", [("list_designs", {}), ("get_design_code", {"designId": "design-1"})]),
])
def test_only_read_operations_do_not_hide_dimension_clarification(action, steps):
    result, remote = execute(action, "design-1", model=ClarifyingAfterReads(*steps))
    assert result["status"] == "needs_input"
    assert "请补充壁厚和孔径。" in result["answer"] and "尚未执行建模" in result["answer"]
    assert [name for name, _ in remote.calls] == (["list_designs", "get_design_code"] if action == "save" else [name for name, _ in steps])
    assert all(call.get("result") for call in result["calls"])


def test_clarification_after_preview_does_not_hide_unfinished_save():
    result, _ = execute("save", "design-1", model=ClarifyingAfterReads(("render_preview", {"code": CODE})))
    assert result["status"] == "failed" and result["error"]
    assert result["calls"][-1]["tool"] == "render_preview"


@pytest.mark.parametrize("failed_tool,reply,expected", [
    ("render_preview", {"isError": True, "content": [{"type": "text", "text": "fetch failed"}]}, "failed"),
    ("save_design", BuildCADError("outcome_unknown", "保存请求超时，请先核对。", 504), "outcome_unknown"),
])
def test_remote_failure_stops_before_any_later_clarification(failed_tool, reply, expected):
    class FailingRemote(Remote):
        def call_tool(self, name, arguments):
            value = super().call_tool(name, arguments)
            if isinstance(value, Exception):
                raise value
            return value
    steps = [("render_preview", {"code": CODE})]
    if failed_tool == "save_design":
        steps.append(("save_design", {"designId": "design-1", "code": CODE}))
    model = ClarifyingAfterReads(*steps)
    result, _ = execute("save", "design-1", remote=FailingRemote(**{failed_tool: reply}), model=model)
    assert result["status"] == expected and result["error_tool"] == failed_tool
    assert model.clarifications == 0


def test_fetch_failed_is_attributed_to_remote_render_without_retry():
    result, remote = execute(remote=Remote(render_preview={"isError": True, "content": [{"type": "text", "text": "fetch failed"}]}), model=Model(("render_preview", {"code": CODE})))
    assert result["status"] == "failed" and len(remote.calls) == 1
    assert result["error_tool"] == result["error_stage"] == "render_preview"
    assert "远端" in result["error"] and "fetch failed" in result["error"]
    assert result["calls"][0]["result"]["isError"] is True


def test_save_checks_account_and_latest_code_then_only_saves_rendered_code():
    model = Model(("render_preview", {"code": CODE}), ("save_design", {"designId": "design-1", "code": CODE, "message": "resize"}))
    result, remote = execute("save", "design-1", model=model)
    assert result["status"] == "completed" and result["code"] == CODE
    assert remote.calls == [("list_designs", {}), ("get_design_code", {"designId": "design-1"}), ("render_preview", {"code": CODE}), ("save_design", {"designId": "design-1", "code": CODE, "message": "resize"})]
    assert json.loads(model.messages[0][0][-1]["content"])["latest_code"] == OLD_CODE
    assert json.loads(model.messages[0][0][-1]["content"])["completed_tools"] == ["list_designs", "get_design_code"]
    assert result["designs"][0]["design_id"] == "design-1"


def test_existing_blank_design_can_be_saved_after_successful_preview():
    remote = Remote(get_design_code={"content": [{"type": "text", "text": '{"code":""}'}]})
    model = Model(("render_preview", {"code": CODE}), ("save_design", {"designId": "design-1", "code": CODE}))
    result, remote = execute("save", "design-1", remote=remote, model=model)
    assert result["status"] == "completed", result
    assert json.loads(model.messages[0][0][-1]["content"])["latest_code"] == ""
    assert remote.calls[-1] == ("save_design", {"designId": "design-1", "code": CODE})


@pytest.mark.parametrize("reply", [
    {"isError": True, "content": [{"type": "text", "text": "fetch failed"}]},
    {"content": [{"type": "text", "text": "rendered"}]},
])
def test_failed_or_imageless_render_never_reaches_save(reply):
    model = Model(("render_preview", {"code": CODE}), ("save_design", {"designId": "design-1", "code": CODE}))
    result, remote = execute("save", "design-1", remote=Remote(render_preview=reply), model=model)
    assert result["status"] == "failed" and result["error_tool"] == "render_preview"
    assert [name for name, _ in remote.calls] == ["list_designs", "get_design_code", "render_preview"]


@pytest.mark.parametrize("steps", [
    [("save_design", {"designId": "design-1", "code": CODE})],
    [("render_preview", {"code": CODE}), ("save_design", {"designId": "other-design", "code": CODE})],
    [("render_preview", {"code": CODE}), ("save_design", {"designId": "design-1", "code": OLD_CODE})],
    [("get_design_code", {"designId": "other-design"})],
])
def test_save_blocks_unrendered_code_and_cross_design_operations(steps):
    result, remote = execute("save", "design-1", model=Model(*steps))
    assert result["status"] == "failed"
    assert not any(name == "save_design" for name, _ in remote.calls)
    assert not any(args.get("designId") == "other-design" for _, args in remote.calls)


def test_nonexistent_design_blocks_save_before_model_or_get_code():
    result, remote = execute("save", "invented-design", model=Model())
    assert result["status"] == "failed"
    assert remote.calls == [("list_designs", {})]


def test_tool_entry_enforces_preview_scope_even_without_graph():
    remote = Remote()
    with buildcad_scope(remote, {row["name"]: row for row in SCHEMAS}):
        with pytest.raises(ValueError):
            buildcad_mcp("save_design", {"designId": "design-1", "code": CODE})
    assert remote.calls == []


def test_read_action_does_not_construct_model_and_exposes_action_and_designs(api):
    api.app.state.buildcad_client_factory = lambda: Remote(list_designs={"content": [{"type": "text", "text": "[]"}]})
    def forbidden_model():
        raise AssertionError("read actions must not depend on model configuration")
    api.app.state.buildcad_model_factory = forbidden_model
    response = api.client.post(PREFIX + "/runs", json={"prompt": "我的设计", "command_id": "read-one", "action": "list_designs"})
    assert response.status_code == 202
    result = api.client.get(PREFIX + "/runs/" + response.json()["run_id"]).json()
    assert result["status"] == "completed" and result["designs"] == []
    assert result["action"] == "list_designs" and result["design_id"] == ""


@pytest.mark.parametrize("changed", [{"action": "list_designs"}, {"design_id": "design-1"}, {"prompt": "another prompt"}])
def test_command_cannot_be_reused_for_another_action_design_or_prompt(api, changed):
    body = {"prompt": "圆柱", "command_id": "bound-command", "action": "preview", "design_id": ""}
    first = api.client.post(PREFIX + "/runs", json=body)
    assert first.status_code == 202
    second = api.client.post(PREFIX + "/runs", json={**body, **changed})
    assert second.status_code == 409
