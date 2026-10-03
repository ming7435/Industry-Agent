"""Skill 兼容名称不能产生重复激活或扩大权限。"""

from types import SimpleNamespace

import pytest

from app.agents.base import trace_skill_node
from app.harness.trace import TraceRecorder
from app.skills.registry import SkillRegistry, get_skill_registry
from app.tools.registry import ToolRegistry


def test_old_names_resolve_to_canonical_definitions_once():
    registry = get_skill_registry()
    cad = registry.get("cad", "part_search_skill")
    assert cad is not None
    assert cad.name == "drawing_lookup_skill"
    assert [s.name for s in registry.select("cad", names=["part_search_skill", "drawing_lookup_skill"])] == ["drawing_lookup_skill"]
    assert registry.get("router", "entity_extraction_skill").name == "intent_routing_skill"


def test_explicit_selection_keeps_first_requested_order():
    registry = get_skill_registry()
    assert [s.name for s in registry.select("cad", names=["part_search_skill", "bom_analysis_skill", "drawing_lookup_skill"])] == ["drawing_lookup_skill", "bom_analysis_skill"]


def test_alias_conflict_reports_both_source_paths(tmp_path):
    directory = tmp_path / "cad"
    directory.mkdir()
    (directory / "one.md").write_text("---\nname: first\naliases: [collision]\ntools: []\n---\n# 第一个\n", encoding="utf-8")
    (directory / "two.md").write_text("---\nname: collision\ntools: []\n---\n# 第二个\n", encoding="utf-8")
    with pytest.raises(ValueError, match=r"cad.*collision.*one\.md.*two\.md"):
        SkillRegistry(tmp_path).validate_tools(set())


def test_alias_cannot_expand_tool_scope():
    registry = get_skill_registry()
    alias_tools = registry.merge_tools(registry.select("cad", names=["part_search_skill"]))
    assert set(alias_tools) == {"query_part", "query_bom", "query_drawing", "query_relation", "fetch_engineering_record"}
    tools = ToolRegistry()
    assert tools.guard_call("query_drawing", {}, context={"allowed_tools": alias_tools})["allow"] is True
    assert tools.guard_call("create_workorder", {}, context={"allowed_tools": alias_tools})["allow"] is False
    assert tools.guard_call("query_drawing", {}, context={"allowed_tools": []})["allow"] is False


def test_trace_records_canonical_and_requested_skill():
    trace = TraceRecorder()
    wrapped = trace_skill_node("cad", "resolve_component", lambda state: {"route": "query"}, skill_step="resolve_part")
    result = wrapped({"agent": SimpleNamespace(runtime_trace=trace), "active_skills": ["part_search_skill"], "task_id": "T", "trace_id": "R"})
    row = result["step_history"][0]
    assert row["skill"] == "drawing_lookup_skill"
    assert row["requested_skills"] == ["part_search_skill"]
    assert trace.list(task_id="T", trace_id="R")[-1]["state_change"]["requested_skills"] == ["part_search_skill"]
