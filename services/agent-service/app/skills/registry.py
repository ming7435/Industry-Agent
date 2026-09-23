"""Agent Skill Registry。

目录约定::

    app/skills/{agent_name}/*.yaml

每个 YAML 是一个独立 Skill。运行时通过 ``select`` 选择一个或多个 Skill，
再合并工具和步骤，避免一个 Agent 被一个 master skill 文件限制。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, List, Mapping

import yaml


SKILLS_ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True)
class SkillDefinition:
    """从 YAML 加载的一个 Skill 定义。"""

    agent: str
    name: str
    version: str = "1.0"
    goal: str = ""
    trigger: str = "default"
    steps: tuple[str, ...] = ()
    tools: tuple[str, ...] = ()
    required_inputs: tuple[str, ...] = ()
    optional_inputs: tuple[str, ...] = ()
    metadata: Mapping[str, Any] = field(default_factory=dict)
    path: str = ""

    @classmethod
    def from_payload(cls, agent: str, payload: Mapping[str, Any], path: Path) -> "SkillDefinition":
        name = str(payload.get("name") or path.stem)
        return cls(
            agent=agent,
            name=name,
            version=str(payload.get("version") or "1.0"),
            goal=str(payload.get("goal") or ""),
            trigger=str(payload.get("trigger") or "default"),
            steps=tuple(str(item) for item in payload.get("steps") or []),
            tools=tuple(str(item) for item in payload.get("tools") or payload.get("allowed_tools") or []),
            required_inputs=tuple(str(item) for item in payload.get("required_inputs") or []),
            optional_inputs=tuple(str(item) for item in payload.get("optional_inputs") or []),
            metadata=dict(payload),
            path=str(path),
        )


class SkillRegistry:
    """加载、查询和组合所有 Agent Skills。"""

    def __init__(self, root: Path | None = None) -> None:
        self.root = root or SKILLS_ROOT
        self._cache: dict[str, tuple[SkillDefinition, ...]] = {}

    def list(self, agent: str) -> list[SkillDefinition]:
        agent = str(agent).strip().lower()
        if agent not in self._cache:
            directory = self.root / agent
            definitions: List[SkillDefinition] = []
            for path in sorted(directory.glob("*.yaml")) if directory.is_dir() else []:
                payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
                if not isinstance(payload, Mapping):
                    raise ValueError(f"Skill YAML must be a mapping: {path}")
                definitions.append(SkillDefinition.from_payload(agent, payload, path))
            self._cache[agent] = tuple(definitions)
        return list(self._cache[agent])

    def get(self, agent: str, name: str) -> SkillDefinition | None:
        return next((item for item in self.list(agent) if item.name == name), None)

    def validate_tools(self, available_tools: Iterable[str]) -> None:
        """校验活动 Skill 的名称和工具引用。"""

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

    def select(
        self,
        agent: str,
        context: Mapping[str, Any] | None = None,
        names: list[str] | tuple[str, ...] | None = None,
    ) -> List[SkillDefinition]:
        """选择多个 Skill。

        显式 ``names`` 优先；没有显式名称时按简单 trigger 规则匹配，
        最后保证至少返回一个 default Skill。
        """

        available = self.list(agent)
        context = context or {}
        if names:
            selected = [item for name in names if (item := self.get(agent, str(name)))]
            if selected:
                return selected

        text = " ".join(
            "%s %s" % (key, value)
            for key, value in context.items()
        ).lower()
        selected = [item for item in available if _trigger_matches(item.trigger, context, text)]
        if selected:
            return selected
        return [item for item in available if item.trigger == "default"][:1] or available[:1]

    @staticmethod
    def merge_tools(skills: List[SkillDefinition]) -> List[str]:
        tools: List[str] = []
        for skill in skills:
            for tool in skill.tools:
                if tool and tool not in tools:
                    tools.append(tool)
        return tools

    @staticmethod
    def merge_steps(skills: List[SkillDefinition]) -> List[str]:
        steps: List[str] = []
        for skill in skills:
            for step in skill.steps:
                if step and step not in steps:
                    steps.append(step)
        return steps


def _trigger_matches(trigger: str, context: Mapping[str, Any], text: str) -> bool:
    normalized = trigger.strip().lower()
    if normalized in {"", "default", "always"}:
        return True
    if normalized in {"exists(alarm_code)", "alarm_code_or_exact_code"}:
        return bool(context.get("alarm_code")) or any(token in text for token in ("报警", "alarm", "故障码"))
    if normalized in {"no_alarm_code", "without_alarm_code"}:
        return not context.get("alarm_code") and not any(token in text for token in ("报警", "alarm", "故障码"))
    if normalized in {"multiple_abnormal_metrics", "multiple_metrics"}:
        metrics = context.get("abnormal_metrics") or context.get("metrics") or []
        return isinstance(metrics, (list, tuple)) and len(metrics) > 1
    if normalized in {"trend_or_repeated_abnormality", "case_or_history"}:
        return any(token in text for token in ("trend", "趋势", "重复", "持续", "历史", "案例", "case"))
    if normalized in {"severity == critical", "critical"}:
        return str(context.get("severity") or "").lower() in {"critical", "fatal", "严重"}
    if normalized in {"sop_or_repair_steps", "sop"}:
        return any(token in text for token in ("sop", "步骤", "规程", "怎么修", "怎么检查"))
    if normalized in {"manual", "manual_search"}:
        return any(token in text for token in ("manual", "手册", "说明书"))
    if normalized in {"part_or_component", "part_search"}:
        return bool(context.get("part_no") or context.get("component")) or any(token in text for token in ("零件", "部件", "part", "bom"))
    if normalized in {"part_quality", "production_part_quality"}:
        return bool(context.get("part_id") or context.get("part_no") or context.get("batch_id") or context.get("production_order_id")) or any(token in text for token in ("零件质量", "质量检测", "尺寸检测", "外观检测", "成品质检", "零件质检"))
    if normalized in {"repair_plan", "fault_requires_repair"}:
        return any(token in text for token in ("维修", "修复", "repair", "故障"))
    return normalized in text


_REGISTRY = SkillRegistry()


def get_skill_registry() -> SkillRegistry:
    return _REGISTRY


__all__ = ["SkillDefinition", "SkillRegistry", "get_skill_registry"]
