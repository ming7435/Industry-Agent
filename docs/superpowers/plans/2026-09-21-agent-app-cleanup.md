# Agent App Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove proven migration remnants from the Agent app and reject invalid active Skill tool references during container startup.

**Architecture:** Preserve every required capability at its current replacement path, remove only old cache directories and superseded root Skill YAML files, and add catalog validation at the composition root. `SkillRegistry` owns catalog integrity rules while `AgentContainer` supplies the concrete registered tool names.

**Tech Stack:** Python 3.12, PyYAML, pytest, FastAPI service composition

**Spec:** `docs/superpowers/specs/2026-09-21-agent-app-cleanup.md`

## Global Constraints

- Limit runtime source changes to `services/agent-service/app`.
- Preserve alarm, experience, trace, contract, monitor, closure, work order, and agent capabilities.
- Keep `services/agent-service/app/runtime/ARCHITECTURE_AUDIT.md`.
- Do not modify or commit the user's existing root `README.md` change.
- Push the completed commit to GitHub only; do not push Gitee.

## Review Focus

- A Skill references one unavailable tool: startup reports the agent, Skill, YAML path, and tool name.
- Two YAML files for the same agent declare the same Skill name: validation rejects the duplicate.
- Different agents reuse a Skill name: validation permits it because names are scoped by agent.
- An agent directory has no YAML files: validation does not invent an error for an unused empty directory.
- The production catalog contains 32 Skills and all tools match the Tool Registry: startup validation succeeds.

---

### Task 1: Active Skill catalog validation

**Files:**
- Modify: `services/agent-service/app/skills/registry.py`
- Modify: `services/agent-service/app/runtime/container.py`
- Create: `services/agent-service/tests/test_skill_registry.py`

**Interfaces:**
- Consumes: `SkillRegistry.list(agent: str)`, `ToolRegistry.mcp.handlers: dict[str, Callable]`
- Produces: `SkillRegistry.validate_tools(available_tools: Iterable[str]) -> None`

- [ ] **Step 1: Write failing validation tests**

```python
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
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `cd services/agent-service && python -m pytest -q -p no:cacheprovider tests/test_skill_registry.py`

Expected: FAIL because `SkillRegistry` has no `validate_tools` method.

- [ ] **Step 3: Implement catalog validation**

Add `Iterable` to the typing imports and implement this method in `SkillRegistry`:

```python
def validate_tools(self, available_tools: Iterable[str]) -> None:
    """Validate names and tool references in active per-agent Skill files."""

    registered = {str(name) for name in available_tools}
    findings: list[str] = []
    directories = sorted(
        path
        for path in self.root.iterdir()
        if path.is_dir() and not path.name.startswith((".", "__"))
    )
    for directory in directories:
        paths_by_name: dict[str, str] = {}
        for skill in self.list(directory.name):
            previous_path = paths_by_name.get(skill.name)
            if previous_path:
                findings.append(
                    "agent=%s duplicate skill=%s files=%s,%s"
                    % (skill.agent, skill.name, previous_path, skill.path)
                )
            else:
                paths_by_name[skill.name] = skill.path

            missing = sorted(set(skill.tools) - registered)
            if missing:
                findings.append(
                    "agent=%s skill=%s file=%s missing tools=%s"
                    % (skill.agent, skill.name, skill.path, ",".join(missing))
                )

    if findings:
        raise ValueError("Invalid Skill catalog:\n" + "\n".join(sorted(findings)))
```

- [ ] **Step 4: Enable fail-fast startup validation**

In `AgentContainer.__init__`, after constructing `ToolRegistry`, call:

```python
get_skill_registry().validate_tools(registry.mcp.handlers)
```

Import `get_skill_registry` from `app.skills`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `cd services/agent-service && python -m pytest -q -p no:cacheprovider tests/test_skill_registry.py`

Expected: 5 passed.

### Task 2: Remove migrated remnants

**Files:**
- Delete: `services/agent-service/app/skills/cad_skill.yaml`
- Delete: `services/agent-service/app/skills/diagnosis_skill.yaml`
- Delete: `services/agent-service/app/skills/knowledge_skill.yaml`
- Delete: `services/agent-service/app/skills/maintenance_skill.yaml`
- Delete: `services/agent-service/app/skills/quality_skill.yaml`
- Delete: `services/agent-service/app/skills/report_skill.yaml`
- Delete: `services/agent-service/app/skills/router_skill.yaml`
- Remove ignored cache directories below `services/agent-service/app`, including the empty migration remnants `alarm`, `experience`, `trace`, and `validator`.

**Interfaces:**
- Consumes: replacement modules documented in the design specification.
- Produces: one canonical implementation path per retained capability and one active Skill configuration layout.

- [ ] **Step 1: Delete only the confirmed remnants**

Use PowerShell `Remove-Item -LiteralPath` for the seven tracked YAML files. Resolve and verify the absolute app path before recursively removing ignored `__pycache__` directories and the four cache only migration directories.

- [ ] **Step 2: Verify the active catalog after deletion**

Run: `cd services/agent-service && python -m pytest -q -p no:cacheprovider tests/test_skill_registry.py`

Expected: 5 passed and the real catalog validation test confirms all active Skills map to registered tools.

### Task 3: Full verification and delivery

**Files:**
- Inspect: all changed files from Tasks 1 and 2
- Preserve: `README.md`

**Interfaces:**
- Consumes: completed cleanup and validation changes.
- Produces: verified Git commit pushed to GitHub branch `architecture-lvmingyang`.

- [ ] **Step 1: Run the full service suite**

Run: `cd services/agent-service && python -m pytest -q -p no:cacheprovider`

Expected: all existing tests plus the five new Skill validation tests pass.

- [ ] **Step 2: Inspect the exact diff and status**

Run: `git diff --check && git status --short && git diff -- services/agent-service/app services/agent-service/tests/test_skill_registry.py docs/superpowers`

Expected: no whitespace errors; only planned changes plus the pre-existing uncommitted `README.md` appear.

- [ ] **Step 3: Commit without README**

Stage only the plan, spec, Agent app changes, and Skill registry test. Commit with:

```text
refactor(agent-service): remove migrated skill remnants
```

- [ ] **Step 4: Push GitHub and verify branch state**

Push `architecture-lvmingyang` to the GitHub remote, then confirm the remote branch points to the new commit. Do not push the Gitee remote.
