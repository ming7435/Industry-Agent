"""本地建模必须经过真实 CAD 节点和技能，尺寸不明确时禁止执行。"""
import json

import pytest

from app.agents.cad.agent import CADAgent
from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry


RUN_ID = "FC-" + "a" * 64
SPEC = {"units": "mm", "operations": [
    {"type": "cylinder", "mode": "add", "diameter": 30, "length": 50, "position": [0, 0, 0], "axis": "z"},
    {"type": "cylinder", "mode": "cut", "diameter": 10, "length": 50, "position": [0, 0, 0], "axis": "z"},
]}


class NoExecutionClient:
    def call_tool(self, *args, **kwargs):
        pytest.fail("不完整需求不能提交 FreeCAD")


class JsonModel:
    available = True
    timeout = 90

    def __init__(self, value):
        self.value = value

    def chat(self, messages, **kwargs):
        return {"choices": [{"message": {"role": "assistant", "content": json.dumps(self.value)}}]}


def run(prompt, *, model=None, spec=None, client=None):
    trace = TraceRecorder()
    agent = CADAgent(ToolRegistry(trace=trace))
    agent.runtime_trace = trace
    result = agent.run_freecad(prompt, run_id=RUN_ID, client=client or NoExecutionClient(), model=model, spec=spec)
    return result, trace


def test_missing_dimensions_returns_needs_input_without_execution():
    result, trace = run("做一根带轴向通孔的销轴")
    assert result["status"] == "needs_input"
    assert "尺寸" in result["answer"]
    assert result["calls"] == []
    assert result["execution"]["node"] == "model_3d"
    assert result["execution"]["skill"] == "production_modeling_skill"
    assert result["execution"]["tool"] == "freecad_mcp"
    assert result["execution"]["step_history"]


def test_model_questions_do_not_become_a_successful_model():
    result, _ = run("做一个安装座", model=JsonModel({"status": "needs_input", "questions": ["请提供长、宽、高和孔位尺寸。"]}))
    assert result["status"] == "needs_input"
    assert "孔位" in result["answer"]
    assert result["calls"] == []


def test_untrusted_model_code_is_rejected_without_execution():
    result, _ = run("做一个安装座", model=JsonModel({"spec": {"code": "import os"}}))
    assert result["status"] == "needs_input"
    assert not result["calls"]


@pytest.mark.parametrize("prompt", [
    "外径30mm、长50mm的销轴，带轴向通孔",
    "外径30mm、长50mm的销轴，带径向通孔10mm",
    "外径30mm、长50mm的销轴，增加倒角",
])
def test_explicit_parser_does_not_silently_drop_unresolved_features(prompt):
    result, _ = run(prompt)
    assert result["status"] == "needs_input"
    assert not result["calls"]


def test_model_cannot_fill_missing_hole_diameter_with_an_example():
    result, _ = run("外径30mm、长50mm的销轴，带同轴通孔", model=JsonModel({"status": "ready", "spec": SPEC}))
    assert result["status"] == "needs_input"
    assert not result["calls"]


def test_model_cannot_drop_requested_hole_and_report_success():
    result, _ = run("外径30mm、长50mm的销轴，孔径待定", model=JsonModel({"status": "ready", "spec": {"units": "mm", "operations": SPEC["operations"][:1]}}))
    assert result["status"] == "needs_input"
    assert not result["calls"]


def test_model_cannot_drop_unsupported_chamfer():
    result, _ = run("外径30mm、长50mm的销轴，带同轴通孔10mm，倒角2mm", model=JsonModel({"status": "ready", "spec": SPEC}))
    assert result["status"] == "needs_input"
    assert not result["calls"]


def test_graph_skill_tool_exports_valid_cylinder_with_through_hole(tmp_path, monkeypatch):
    from freecad_test_kernel import ScriptMCP
    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))
    result, trace = run("外径30mm、长50mm的销轴，带同轴通孔直径10mm", client=ScriptMCP())
    assert result["status"] == "completed", result
    assert result["spec"] == SPEC
    assert result["validation"]["solid_count"] == 1
    assert result["validation"]["volume_mm3"] == pytest.approx(31415.9265358979)
    assert {item["format"] for item in result["artifacts"]} == {"stl", "step", "fcstd"}
    assert result["calls"][0]["tool"] == "execute_code"
    rows = [row for row in trace.list() if row["event"] == "tool_completed"]
    assert len(rows) == 1
    assert rows[0]["task_id"] == RUN_ID
    assert rows[0]["skill"] == "production_modeling_skill"
    assert rows[0]["input"]["spec"] == SPEC
    assert result["execution"]["tool"] == "freecad_mcp"


def test_model_json_and_confirmed_spec_use_same_node_and_artifact_contract(tmp_path, monkeypatch):
    from freecad_test_kernel import ScriptMCP
    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))
    # 任意描述触发模型解析，输出仍经过尺寸校验和同一个技能工具步骤。
    result, _ = run("按说明生成套筒：30mm外径，50mm长度，10mm同轴通孔孔径", model=JsonModel({"status": "ready", "spec": SPEC}), client=ScriptMCP())
    assert result["status"] == "completed", result
    assert result["spec"] == SPEC


def test_regular_tetrahedron_uses_the_existing_node_skill_and_mcp(tmp_path, monkeypatch):
    from freecad_test_kernel import ScriptMCP
    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))
    result, _ = run("正四面体（立体三角形、四面相同、边长100mm）", client=ScriptMCP())
    assert result["status"] == "completed", result
    assert result["spec"] == {"units": "mm", "operations": [
        {"type": "tetrahedron", "mode": "add", "edge_length": 100, "position": [0, 0, 0]},
    ]}
    assert result["validation"]["volume_mm3"] == pytest.approx(117851.1301977579)
    assert result["validation"]["face_count"] == 4
    assert result["validation"]["edge_count"] == 6
    assert result["execution"]["node"] == "model_3d"
    assert result["execution"]["skill"] == "production_modeling_skill"
    assert result["execution"]["tool"] == "freecad_mcp"


@pytest.mark.parametrize("prompt,spec", [
    ("外径50mm、长30mm的销轴，带同轴通孔，孔径待定", {"units": "mm", "operations": [
        {"type": "cylinder", "mode": "add", "diameter": 50, "length": 30, "position": [0, 0, 0], "axis": "z"},
        {"type": "cylinder", "mode": "cut", "diameter": 30, "length": 30, "position": [0, 0, 0], "axis": "z"},
    ]}),
    ("外径30mm、长50mm的销轴，带2mm宽键槽", {"units": "mm", "operations": SPEC["operations"][:1]}),
    ("外径30mm、长50mm的销轴，两个直径10mm轴向通孔，孔位置待定", SPEC),
    ("长60mm、宽40mm、高20mm的长方体", {"units": "mm", "operations": [
        {"type": "box", "mode": "add", "length": 20, "width": 40, "height": 60, "position": [0, 0, 0]},
    ]}),
])
def test_model_cannot_borrow_dimensions_swap_roles_or_omit_features(prompt, spec, tmp_path, monkeypatch):
    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))
    # 隔离模型响应，但保留真实 Graph、Skill、Tool；任何几何执行都是失败。
    result, _ = run(prompt, model=JsonModel({"status": "ready", "spec": spec}))
    assert result["status"] == "needs_input", result
    assert result["calls"] == []


@pytest.mark.parametrize("prompt", ["正四面体，边长待定", "正四面体，边长100mm，倒角2mm", "四面体，边长100mm"])
def test_tetrahedron_requires_regular_shape_and_complete_supported_features(prompt):
    result, _ = run(prompt)
    assert result["status"] == "needs_input"
    assert not result["calls"]


@pytest.mark.parametrize("prompt", [
    "创建一个外径30mm、长50mm的圆柱，并做一根外径30mm、长50mm的销轴",
    "创建一个圆柱并做一根销轴，外径30mm、长50mm",
    "外径30mm、长50mm的销轴，带轴向通孔直径10mm",
    "外径30mm、长50mm的销轴，带同轴通孔直径10mm，并带同轴通孔直径10mm",
])
def test_multiple_parts_or_holes_and_unknown_hole_position_are_not_silently_collapsed(prompt, tmp_path, monkeypatch):
    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))
    result, _ = run(prompt, model=JsonModel({"status": "ready", "spec": SPEC}))
    assert result["status"] == "needs_input", result
    assert result["calls"] == []


def test_mcp_failure_is_retained_without_reporting_success(tmp_path, monkeypatch):
    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))

    class FailedMCP:
        def call_tool(self, name, arguments, **kwargs):
            return {"isError": True, "content": [{"type": "text", "text": "OCCError"}]}

    result, trace = run("明确规格", spec=SPEC, client=FailedMCP())
    assert result["status"] == "failed"
    assert result["artifacts"] == []
    assert result["calls"][0]["tool"] == "execute_code"
    assert result["calls"][0]["result"]["isError"] is True
    assert "请补充形状" not in result["answer"]


def test_mcp_gui_timeout_remains_unknown_and_is_not_replayed(tmp_path, monkeypatch):
    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))

    class TimedOutMCP:
        count = 0

        def call_tool(self, name, arguments, **kwargs):
            self.count += 1
            return {"content": [{"type": "text", "text":
                "Failed to execute code: GUI dispatch timed out after 90s while 'execute_code' was still running on FreeCAD's GUI thread."}]}

    client = TimedOutMCP()
    result, _ = run("明确规格", spec=SPEC, client=client)
    assert result["status"] == "outcome_unknown"
    assert result["error_code"] == "outcome_unknown"
    assert result["artifacts"] == []
    assert "不会自动重放" in result["answer"]
    assert result["calls"][0]["result"]["content"]
    assert client.count == 1


@pytest.mark.parametrize("prompt,operations", [
    ("外径30mm、长50mm的销轴，孔径待定", SPEC["operations"][:1]),
    ("外径30mm、长50mm的销轴，同轴通孔10mm，倒角2mm", SPEC["operations"]),
    ("外径30cm、长50mm的销轴，同轴通孔10mm", SPEC["operations"]),
])
def test_specification_guard_rejects_missing_features_and_mixed_units(prompt, operations):
    from app.agents.cad.graph import _dimensions_are_explicit
    assert not _dimensions_are_explicit({"units": "mm", "operations": operations}, prompt)
