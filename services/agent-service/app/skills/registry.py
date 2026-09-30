"""智能体 Markdown 技能文档注册表。

目录约定::

    app/skills/{agent_name}/*.md

每个 Markdown 文档是一个独立 Skill：YAML Front Matter 保存运行时需要的结构化字段，
正文保存面向维护人员的说明。运行时通过 ``select`` 选择一个或多个 Skill，再合并工具
和步骤，避免一个 Agent 被一个 master skill 文件限制。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, List, Mapping, TYPE_CHECKING

import yaml

if TYPE_CHECKING:
    from app.runtime.action import StepDefinition


SKILLS_ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True)
class SkillDefinition:
    """从 Markdown 文档加载的一个 Skill 定义。"""

    agent: str
    name: str
    version: str = "1.0"
    goal: str = ""
    trigger: str = "default"
    steps: tuple[Any, ...] = ()
    tools: tuple[str, ...] = ()
    required_inputs: tuple[str, ...] = ()
    optional_inputs: tuple[str, ...] = ()
    required_evidence: tuple[str, ...] = ()
    stop_conditions: tuple[str, ...] = ()
    failure_policy: str = "stop"
    output_schema: Mapping[str, Any] = field(default_factory=dict)
    metadata: Mapping[str, Any] = field(default_factory=dict)
    document: str = ""
    path: str = ""

    @classmethod
    def from_payload(
        cls,
        agent: str,
        payload: Mapping[str, Any],
        path: Path,
        document: str = "",
    ) -> "SkillDefinition":
        name = str(payload.get("name") or path.stem)
        return cls(
            agent=agent,
            name=name,
            version=str(payload.get("version") or "1.0"),
            goal=str(payload.get("goal") or ""),
            trigger=str(payload.get("trigger") or "default"),
            steps=tuple(payload.get("steps") or []),
            tools=tuple(str(item) for item in payload.get("tools") or payload.get("allowed_tools") or []),
            required_inputs=tuple(str(item) for item in payload.get("required_inputs") or []),
            optional_inputs=tuple(str(item) for item in payload.get("optional_inputs") or []),
            required_evidence=_as_strings(payload.get("required_evidence")),
            stop_conditions=_as_strings(payload.get("stop_conditions")),
            failure_policy=str(payload.get("failure_policy") or "stop"),
            output_schema=dict(payload.get("output_schema") or {}) if isinstance(payload.get("output_schema"), Mapping) else {},
            metadata=dict(payload),
            document=document,
            path=str(path),
        )

    def normalized_steps(self) -> list["StepDefinition"]:
        """将旧版字符串步骤和新版映射步骤归一为可执行的统一结构。"""

        # 延迟导入：app.runtime.__init__ 负责组装 Agent 容器，而 Agent Graph 模块在包导入期间也会加载此 Registry。
        from app.runtime.action import StepDefinition

        normalized: list[StepDefinition] = []
        for index, raw in enumerate(self.steps):
            step = StepDefinition.coerce(raw)
            # Skill 级默认值只在结构化步骤未覆盖时生效，确保精简的 Front Matter 仍有意义。
            if not step.required_inputs and self.required_inputs:
                step = step.model_copy(update={"required_inputs": list(self.required_inputs)})
            if not step.failure_policy or step.failure_policy == "stop":
                step = step.model_copy(update={"failure_policy": self.failure_policy})
            if not step.id:
                step = step.model_copy(update={"id": "step-%s" % index})
            normalized.append(step)
        return normalized


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
            for path in sorted(directory.glob("*.md")) if directory.is_dir() else []:
                payload, document = _load_markdown_skill(path)
                definitions.append(SkillDefinition.from_payload(agent, payload, path, document))
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
        names: List[str] | tuple[str, ...] | None = None,
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
        specialized = [
            item for item in available
            if item.trigger.strip().lower() not in {"", "default", "always"}
            and _trigger_matches(item.trigger, context, text)
        ]
        if specialized:
            return [
                item for item in available
                if item in specialized or item.trigger.strip().lower() == "always"
            ]
        fallback = [
            item for item in available
            if item.trigger.strip().lower() in {"", "default", "always"}
        ]
        return fallback or available[:1]

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
            for step in skill.normalized_steps():
                if step.id and step.id not in steps:
                    steps.append(step.id)
        return steps


def _as_strings(value: Any) -> tuple[str, ...]:
    if isinstance(value, str):
        return (value,)
    if isinstance(value, (list, tuple, set)):
        return tuple(str(item) for item in value if str(item).strip())
    return ()


def _load_markdown_skill(path: Path) -> tuple[Mapping[str, Any], str]:
    """读取 Skill Markdown，并分离 YAML Front Matter 与说明正文。"""

    text = path.read_text(encoding="utf-8").lstrip("\ufeff")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"Skill Markdown 缺少 YAML Front Matter: {path}")

    closing_index = next(
        (index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---"),
        None,
    )
    if closing_index is None:
        raise ValueError(f"Skill Markdown 的 YAML Front Matter 未闭合: {path}")

    payload = yaml.safe_load("\n".join(lines[1:closing_index])) or {}
    if not isinstance(payload, Mapping):
        raise ValueError(f"Skill Markdown Front Matter 必须是映射: {path}")

    document = "\n".join(lines[closing_index + 1 :]).strip()
    if not document:
        raise ValueError(f"Skill Markdown 缺少说明正文: {path}")
    return payload, document


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
