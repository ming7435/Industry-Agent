from pathlib import Path

import pytest

from app.skills.registry import SkillRegistry, get_skill_registry
from app.tools.registry import ToolRegistry


def _write_skill(path: Path, name: str, tools: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "---\nname: %s\ntools:\n%s---\n\n# %s\n\n用于测试的技能文档。\n"
        % (name, "".join("  - %s\n" % tool for tool in tools), name),
        encoding="utf-8",
    )


def test_validate_tools_rejects_missing_tool_with_source_context(tmp_path: Path) -> None:
    _write_skill(tmp_path / "diagnosis" / "alarm.md", "alarm_skill", ["missing_tool"])
    registry = SkillRegistry(tmp_path)

    with pytest.raises(ValueError, match=r"diagnosis.*alarm_skill.*alarm\.md.*missing_tool"):
        registry.validate_tools({"known_tool"})


def test_validate_tools_rejects_duplicate_name_within_agent(tmp_path: Path) -> None:
    _write_skill(tmp_path / "diagnosis" / "one.md", "same_skill", [])
    _write_skill(tmp_path / "diagnosis" / "two.md", "same_skill", [])

    with pytest.raises(ValueError, match=r"diagnosis.*same_skill.*one\.md.*two\.md"):
        SkillRegistry(tmp_path).validate_tools(set())


def test_validate_tools_allows_same_name_for_different_agents(tmp_path: Path) -> None:
    _write_skill(tmp_path / "diagnosis" / "skill.md", "shared_name", [])
    _write_skill(tmp_path / "knowledge" / "skill.md", "shared_name", [])
    SkillRegistry(tmp_path).validate_tools(set())


def test_validate_tools_allows_empty_agent_directory(tmp_path: Path) -> None:
    (tmp_path / "unused_agent").mkdir()
    SkillRegistry(tmp_path).validate_tools(set())


def test_real_skill_catalog_matches_registered_tools() -> None:
    tools = ToolRegistry()
    get_skill_registry().validate_tools(tools.mcp.handlers)


def test_repair_plan_skill_allows_plan_generation_tool() -> None:
    skill = get_skill_registry().get("maintenance", "repair_plan_skill")

    assert skill is not None
    assert "generate_repair_plan" in skill.tools


def test_specialized_skill_replaces_default_but_keeps_always_skill() -> None:
    registry = get_skill_registry()

    assert [skill.name for skill in registry.select("knowledge", {"alarm_code": "700001"})] == ["alarm_search_skill"]
    assert [skill.name for skill in registry.select("knowledge", {"query": "查询设备手册"})] == ["manual_search_skill"]
    assert [skill.name for skill in registry.select("knowledge", {"query": "普通问题"})] == ["hybrid_search_skill"]
    assert [skill.name for skill in registry.select("memory", {"query": "learn"})] == [
        "experience_extraction", "memory_dedup",
    ]


def test_alarm_skill_includes_its_real_retrieval_fallback() -> None:
    registry = get_skill_registry()
    allowed = set(registry.merge_tools(registry.select("knowledge", {"alarm_code": "700001"})))

    assert {"search_alarm_knowledge", "search_knowledge", "fetch_document", "fetch_chunk"} <= allowed
    assert "search_manual" not in allowed


def test_markdown_skill_loads_front_matter_and_document_body(tmp_path: Path) -> None:
    path = tmp_path / "diagnosis" / "alarm.md"
    path.parent.mkdir(parents=True)
    path.write_text(
        "---\n"
        "name: alarm_skill\n"
        "goal: 诊断报警\n"
        "steps:\n"
        "  - collect_evidence\n"
        "tools:\n"
        "  - get_device_logs\n"
        "---\n\n"
        "# 报警诊断\n\n"
        "## 执行说明\n\n必须先收集设备证据。\n",
        encoding="utf-8",
    )

    skill = SkillRegistry(tmp_path).get("diagnosis", "alarm_skill")

    assert skill is not None
    assert skill.goal == "诊断报警"
    assert skill.steps == ("collect_evidence",)
    assert skill.tools == ("get_device_logs",)
    assert "# 报警诊断" in skill.document
    assert "必须先收集设备证据" in skill.document


def test_registry_rejects_markdown_without_front_matter(tmp_path: Path) -> None:
    path = tmp_path / "diagnosis" / "alarm.md"
    path.parent.mkdir(parents=True)
    path.write_text("# 只有正文\n", encoding="utf-8")

    with pytest.raises(ValueError, match=r"Front Matter.*alarm\.md"):
        SkillRegistry(tmp_path).list("diagnosis")


def test_real_skill_catalog_is_markdown_only() -> None:
    root = Path(__file__).parents[1] / "app" / "skills"

    assert list(root.rglob("*.yaml")) == []
    markdown_files = list(root.rglob("*.md"))
    assert markdown_files
    assert all(path.read_text(encoding="utf-8").startswith("---\n") for path in markdown_files)
