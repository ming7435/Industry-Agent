from pathlib import Path

import pytest

from app.skills.registry import SkillRegistry, get_skill_registry
from app.tools.registry import ToolRegistry


def _write_skill(path: Path, name: str, tools: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "name: %s\ntools:\n%s" % (name, "".join("  - %s\n" % tool for tool in tools)),
        encoding="utf-8",
    )


def test_validate_tools_rejects_missing_tool_with_source_context(tmp_path: Path) -> None:
    _write_skill(tmp_path / "diagnosis" / "alarm.yaml", "alarm_skill", ["missing_tool"])
    registry = SkillRegistry(tmp_path)

    with pytest.raises(ValueError, match=r"diagnosis.*alarm_skill.*alarm\.yaml.*missing_tool"):
        registry.validate_tools({"known_tool"})


def test_validate_tools_rejects_duplicate_name_within_agent(tmp_path: Path) -> None:
    _write_skill(tmp_path / "diagnosis" / "one.yaml", "same_skill", [])
    _write_skill(tmp_path / "diagnosis" / "two.yaml", "same_skill", [])

    with pytest.raises(ValueError, match=r"diagnosis.*same_skill.*one\.yaml.*two\.yaml"):
        SkillRegistry(tmp_path).validate_tools(set())


def test_validate_tools_allows_same_name_for_different_agents(tmp_path: Path) -> None:
    _write_skill(tmp_path / "diagnosis" / "skill.yaml", "shared_name", [])
    _write_skill(tmp_path / "knowledge" / "skill.yaml", "shared_name", [])
    SkillRegistry(tmp_path).validate_tools(set())


def test_validate_tools_allows_empty_agent_directory(tmp_path: Path) -> None:
    (tmp_path / "unused_agent").mkdir()
    SkillRegistry(tmp_path).validate_tools(set())


def test_real_skill_catalog_matches_registered_tools() -> None:
    tools = ToolRegistry()
    get_skill_registry().validate_tools(tools.mcp.handlers)
