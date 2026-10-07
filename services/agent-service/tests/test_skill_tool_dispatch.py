"""Skill 的工具步骤必须实际控制调度、参数门禁和权限范围。"""

import pytest

from app.harness.trace import TraceRecorder
from app.skills.registry import SkillRegistry
from app.tools.registry import ToolRegistry


def skill_for(tmp_path, tool="measure_solid", allowed="measure_solid", required="diameter"):
    directory = tmp_path / "cad"
    directory.mkdir()
    (directory / "model.md").write_text(
        "---\nname: modeling_test\ntrigger: production_modeling\n"
        f"tools: [{allowed}]\nsteps:\n  - id: build_model\n    type: tool\n"
        f"    tool: {tool}\n    required_inputs: [{required}]\n---\n# 建模测试技能\n",
        encoding="utf-8",
    )
    return SkillRegistry(tmp_path).get("cad", "modeling_test")


def run_step(skill, tools, arguments):
    executor = getattr(skill, "execute_tool_step", None)
    assert callable(executor), "Skill 缺少实际调度工具步骤的执行入口"
    return executor("build_model", tools, arguments, context={"task_id": "CAD-SKILL-TEST"})


def test_markdown_step_selects_actual_tool_and_keeps_context(tmp_path):
    skill = skill_for(tmp_path)
    trace = TraceRecorder()
    tools = ToolRegistry(trace=trace)
    tools.mcp.handlers["measure_solid"] = lambda diameter: {"diameter_mm": diameter, "radius_mm": diameter / 2}
    # 节点不能硬编码生成工具：本例的 Markdown 声明的是另一工具。
    result = run_step(skill, tools, {"diameter": 30})
    assert result == {"diameter_mm": 30, "radius_mm": 15}
    row = next(item for item in trace.list() if item["event"] == "tool_completed")
    assert row["tool_name"] == "measure_solid"
    assert row["task_id"] == "CAD-SKILL-TEST"
    assert row["skill"] == "modeling_test"
    assert row["step"] == "build_model"
    assert row["context"]["allowed_tools"] == ["measure_solid"]


def test_step_cannot_call_tool_outside_skill_permissions(tmp_path):
    skill = skill_for(tmp_path, allowed="query_part")
    tools = ToolRegistry()
    with pytest.raises(PermissionError):
        run_step(skill, tools, {"diameter": 30})


def test_missing_required_input_is_rejected_before_handler(tmp_path):
    skill = skill_for(tmp_path)
    tools = ToolRegistry()
    tools.mcp.handlers["measure_solid"] = lambda **values: pytest.fail("缺少必需输入时不能执行工具")
    with pytest.raises(ValueError, match="diameter"):
        run_step(skill, tools, {})


def test_failed_tool_is_not_automatically_retried(tmp_path):
    skill = skill_for(tmp_path)
    tools = ToolRegistry(trace=TraceRecorder())
    def unavailable(diameter):
        raise RuntimeError("隔离适配器不可用")
    tools.mcp.handlers["measure_solid"] = unavailable
    with pytest.raises(RuntimeError, match="隔离适配器不可用"):
        run_step(skill, tools, {"diameter": 30})
    assert len([item for item in tools.trace.list() if item["event"] == "tool_started"]) == 1


def test_non_tool_step_cannot_be_executed_as_tool(tmp_path):
    skill = skill_for(tmp_path)
    from dataclasses import replace
    skill = replace(skill, steps=({"id": "build_model", "type": "validate", "tool": "measure_solid"},))
    with pytest.raises(ValueError):
        run_step(skill, ToolRegistry(), {"diameter": 30})
