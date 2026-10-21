"""智能体 Markdown 技能文档注册表。

目录约定::

    app/skills/{agent_name}/{skill_name}/SKILL.md
    app/skills/{agent_name}/{skill_name}/references/*.md
    app/skills/{agent_name}/{skill_name}/scripts/run.py

目录包是当前布局：``SKILL.md`` 只保留模型每次都要看到的触发、流程、输出和停止条件，
业务规则、证据边界、输入输出契约放在 ``references/``，由 ``read_skill_reference`` 按需读取。
兼容旧的扁平 ``app/skills/{agent_name}/*.md``，两种布局可并存，便于逐个迁移。
"""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from hashlib import sha256
import json

from dataclasses import dataclass, field
from pathlib import Path
from threading import RLock
from typing import Any, Iterable, List, Mapping, TYPE_CHECKING

import yaml

if TYPE_CHECKING:
    from app.runtime.action import StepDefinition


SKILLS_ROOT = Path(__file__).resolve().parent
SKILL_DOCUMENT_NAME = "SKILL.md"
REFERENCE_DIRECTORY_NAME = "references"
REFERENCE_TOOL_NAME = "read_skill_reference"


@dataclass(frozen=True)
class SkillReference:
    """SKILL.md 之外的按需参考文档。

    正文不进入模型上下文；模型显式调用 ``read_skill_reference`` 时才返回，
    因此技能保持渐进披露，同时所有规则仍可审计。
    """

    name: str
    title: str
    when: str
    order: int
    document: str
    path: str

    def observation(self) -> dict[str, Any]:
        return {"name": self.name, "title": self.title, "order": self.order,
                "fingerprint": sha256(self.document.encode("utf-8")).hexdigest()}


@dataclass(frozen=True)
class SkillDefinition:
    """从 Markdown 文档加载的一个 Skill 定义。"""

    agent: str
    name: str
    version: str = "1.0"
    goal: str = ""
    trigger: str = "default"
    triggers: tuple[str, ...] = ()
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
    aliases: tuple[str, ...] = ()
    references: tuple[SkillReference, ...] = ()
    layout: str = "flat"

    def reference(self, name: str) -> SkillReference | None:
        normalized = str(name or "").strip().lower()
        return next((item for item in self.references if item.name.lower() == normalized), None)

    @property
    def reference_names(self) -> tuple[str, ...]:
        return tuple(item.name for item in self.references)

    @classmethod
    def from_payload(
        cls,
        agent: str,
        payload: Mapping[str, Any],
        path: Path,
        document: str = "",
        references: Iterable[SkillReference] = (),
        layout: str = "flat",
    ) -> "SkillDefinition":
        name = str(payload.get("name") or path.stem)
        return cls(
            agent=agent,
            name=name,
            aliases=_as_strings(payload.get("aliases")),
            version=str(payload.get("version") or "1.0"),
            goal=str(payload.get("goal") or ""),
            trigger=str(payload.get("trigger") or "default"),
            triggers=_as_strings(payload.get("triggers")),
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
            references=tuple(references),
            layout=layout,
        )

    @property
    def conditions(self) -> tuple[str, ...]:
        """多触发条件取或；未声明时保持旧 trigger 行为。"""
        return self.triggers or (self.trigger,)

    @property
    def is_always(self) -> bool:
        return any(value.strip().lower() == 'always' for value in self.conditions)

    @property
    def is_default(self) -> bool:
        return any(value.strip().lower() in {'', 'default'} for value in self.conditions)

    def matches(self, context: Mapping[str, Any], text: str) -> bool:
        return any(_trigger_matches(value, context, text) for value in self.conditions)

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

    def observation(self) -> dict[str, Any]:
        """从真正加载的对象取语义指纹，不事后读取可能已更新的文件。"""
        canonical = json.dumps({'metadata': dict(self.metadata), 'document': self.document,
                                'references': [item.observation() for item in self.references],
                                'version': self.version, 'goal': self.goal},
                               sort_keys=True, ensure_ascii=False, default=str)
        return {'agent': self.agent, 'skill': self.name, 'skill_version': self.version,
                'skill_fingerprint': sha256(canonical.encode('utf-8')).hexdigest(),
                'declared_steps': [step.id for step in self.normalized_steps()]}

    def execute_tool_step(
        self,
        step_id: str,
        tools: Any,
        arguments: Mapping[str, Any],
        *,
        context: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """按 Markdown 的结构化步骤调度工具，不在节点中硬编码工具名称。

        步骤必须是工具步骤，工具必须属于本技能权限；失败向调用方返回，
        不自动重试可能已经产生文件或其他副作用的操作。
        """
        matches = [step for step in self.normalized_steps() if step.id == step_id]
        if len(matches) != 1 or matches[0].type != "tool":
            raise ValueError("Skill %s 缺少唯一的工具步骤：%s" % (self.name, step_id))
        step = matches[0]
        if not step.tool or step.tool not in self.tools:
            raise PermissionError("Skill %s 未授权工具：%s" % (self.name, step.tool))
        values = dict(arguments)
        missing = [key for key in step.required_inputs if key not in values or values[key] is None or values[key] == ""]
        if missing:
            raise ValueError("Skill 工具步骤缺少必需输入：%s" % ", ".join(missing))
        execution_context = {
            **dict(context or {}), "agent": self.agent, "skill": self.name,
            "skills": [self.name], "step": step.id, "allowed_tools": [step.tool],
        }
        result = tools.execute(step.tool, values, context=execution_context)
        if not isinstance(result, Mapping):
            raise ValueError("Skill 工具返回体必须是结构化对象")
        return dict(result)


class SkillRegistry:
    """加载、查询和组合所有 Agent Skills。"""

    def __init__(self, root: Path | None = None) -> None:
        self.root = root or SKILLS_ROOT
        self._cache: dict[str, tuple[SkillDefinition, ...]] = {}
        self._signatures: dict[str, tuple[Any, ...]] = {}
        self._lock = RLock()

    def list(self, agent: str) -> list[SkillDefinition]:
        agent = str(agent).strip().lower()
        if not agent or agent.startswith('.') or any(char in agent for char in '/\\'):
            raise ValueError("无效的 Agent 技能目录")
        with self._lock:
            directory = self.root / agent
            paths = _discover_skill_paths(directory)
            signature = tuple(_source_signature(path) for path in paths)
            if self._signatures.get(agent) == signature:
                return list(self._cache[agent])
            definitions: List[SkillDefinition] = []
            for path in paths:
                if not path.resolve().is_relative_to(self.root.resolve()):
                    raise ValueError("技能文档不能位于注册目录外")
                payload, document = _load_markdown_skill(path)
                references, layout = _load_references(path)
                definitions.append(
                    SkillDefinition.from_payload(agent, payload, path, document, references, layout)
                )
            # 完整加载后才交换缓存，损坏的文件不能发布为部分成功目录。
            self._cache[agent] = tuple(definitions)
            self._signatures[agent] = signature
            return list(self._cache[agent])

    def source_files(self, agent: str) -> list[Path]:
        """返回构成该 Agent 技能目录的全部文件，供依赖哈希和只读审计使用。"""

        agent = str(agent).strip().lower()
        paths: list[Path] = []
        for document in _discover_skill_paths(self.root / agent):
            paths.append(document)
            if document.name == SKILL_DOCUMENT_NAME:
                paths.extend(sorted((document.parent / REFERENCE_DIRECTORY_NAME).glob("*.md")))
        return paths

    def find(self, name: str) -> SkillDefinition | None:
        """按技能名在全部 Agent 目录中查找；同名跨 Agent 时返回第一个并保持目录顺序。"""

        target = str(name or "").strip()
        if not target:
            return None
        for directory in sorted(self.root.iterdir()):
            if not directory.is_dir() or directory.name.startswith((".", "__")):
                continue
            for skill in self.list(directory.name):
                if target == skill.name or target in skill.aliases:
                    return skill
        return None

    def invalidate(self, agent: str) -> None:
        """更新完成后使本进程在下次读取时重新加载。"""
        with self._lock:
            self._signatures.pop(agent, None)

    def get(self, agent: str, name: str) -> SkillDefinition | None:
        result = next((item for item in self.list(agent) if name == item.name or name in item.aliases), None)
        _observe_skills([result] if result else [])
        return result

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
                for name in (skill.name, *skill.aliases):
                    previous_path = paths_by_name.get(name)
                    if previous_path:
                        findings.append(
                            "agent=%s duplicate skill=%s files=%s,%s"
                            % (skill.agent, name, previous_path, skill.path)
                        )
                    else:
                        paths_by_name[name] = skill.path

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
        未指定名称时才按 trigger 匹配或回退；显式未知/空名称不授权默认 Skill。
        """

        available = self.list(agent)
        context = context or {}
        if names is not None:
            selected = []
            seen = set()
            for name in names:
                item = self.get(agent, str(name))
                if item is not None and item.name not in seen:
                    selected.append(item)
                    seen.add(item.name)
            return selected

        text = " ".join(
            str(value) for value in context.values() if value
        ).lower()
        specialized = [
            item for item in available
            if not item.is_always and any(
                _trigger_matches(condition, context, text)
                for condition in item.conditions
                if condition.strip().lower() not in {"", "default", "always"}
            )
        ]
        if specialized:
            result = [
                item for item in available
                if item in specialized or item.is_always
            ]
            _observe_skills(result)
            return result
        fallback = [
            item for item in available
            if item.is_default or item.is_always
        ]
        result = fallback or available[:1]
        _observe_skills(result)
        return result

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

    return _parse_markdown_skill(path.read_bytes().decode("utf-8"), path)


def _discover_skill_paths(directory: Path) -> list[Path]:
    """发现目录包 ``{skill}/SKILL.md`` 与兼容的扁平 ``{skill}.md``。

    两种布局可以并存，便于逐个迁移；返回值是每个技能的唯一文档入口。
    """

    if not directory.is_dir():
        return []
    paths: list[Path] = []
    for entry in sorted(directory.iterdir()):
        if entry.is_dir():
            document = entry / SKILL_DOCUMENT_NAME
            if document.is_file():
                paths.append(document)
        elif entry.suffix.lower() == ".md" and entry.is_file():
            paths.append(entry)
    return paths


def _source_signature(path: Path) -> tuple[Any, ...]:
    """目录包的文件指纹包含 references，参考文档变化必须让缓存失效。"""

    if path.name != SKILL_DOCUMENT_NAME:
        return (str(path), path.stat().st_mtime_ns, path.stat().st_size)
    files = [path, *sorted((path.parent / REFERENCE_DIRECTORY_NAME).glob("*.md"))]
    return tuple((str(item), item.stat().st_mtime_ns, item.stat().st_size) for item in files)


def _load_references(document_path: Path) -> tuple[tuple["SkillReference", ...], str]:
    """加载目录包的按需参考文档；扁平文档没有 references。"""

    if document_path.name != SKILL_DOCUMENT_NAME:
        return (), "flat"
    directory = document_path.parent / REFERENCE_DIRECTORY_NAME
    references: list[SkillReference] = []
    if directory.is_dir():
        for path in sorted(directory.glob("*.md")):
            payload, body = _parse_markdown_skill(path.read_bytes().decode("utf-8"), path)
            references.append(
                SkillReference(
                    name=str(payload.get("name") or path.stem).strip().lower(),
                    title=str(payload.get("title") or _first_heading(body) or path.stem),
                    when=str(payload.get("when") or payload.get("description") or "").strip(),
                    order=int(payload.get("order") or 100),
                    document=body,
                    path=str(path),
                )
            )
    references.sort(key=lambda item: (item.order, item.name))
    names = [item.name for item in references]
    if len(names) != len(set(names)):
        raise ValueError("参考文档名称重复：%s" % document_path)
    return tuple(references), "directory"


def _first_heading(document: str) -> str:
    return next((line.lstrip("# ").strip() for line in document.splitlines() if line.startswith("# ")), "")


def _parse_markdown_skill(text: str, path: Path) -> tuple[Mapping[str, Any], str]:
    """解析同一文件快照，避免修订编号与正文来自不同的读取。"""
    text = text.lstrip("\ufeff")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"Skill Markdown 缺少 YAML Front Matter: {path}")

    closing_index = next(
        (index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---"),
        None,
    )
    if closing_index is None:
        raise ValueError(f"Skill Markdown 的 YAML Front Matter 未闭合: {path}")

    try:
        payload = yaml.safe_load("\n".join(lines[1:closing_index])) or {}
    except yaml.YAMLError as error:
        raise ValueError("Skill Markdown 的结构化说明无法解析") from error
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
    if normalized == "production_modeling":
        # 查询文字不能自行激活建模工具；建模分支必须有明确操作类型。
        return context.get("operation") == "production_modeling"
    if normalized == "maintenance_evidence":
        # 仅结构化维修检索意图可补充混合资料源；普通报警文本不扩大工具范围。
        return context.get("purpose") == "maintenance"
    if normalized in {'learn', 'search', 'recent'} and context.get('action'):
        # 检索文本可描述“学习”，不能因此选择写入路径的 Skill。
        return str(context['action']).strip().lower() == normalized
    if normalized in {'closure', 'trace'} and context.get('report_type'):
        report_type = str(context['report_type']).strip().lower()
        if normalized == 'closure':
            return report_type in {'closure', 'closure_report', 'full_case_report'}
        return report_type in {'trace', 'trace_report'}
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
_TRIAL_REGISTRY = ContextVar('expert_trial_registry', default=None)
_SKILL_OBSERVER = ContextVar('skill_loop_observer', default=None)


@contextmanager
def skill_observation_scope(callback):
    """只有实际 Harness 作用域启用，只读记录选择，不干预业务循环。"""
    token = _SKILL_OBSERVER.set((callback, set(), {}))
    try:
        yield
    finally:
        _SKILL_OBSERVER.reset(token)


def _observe_skills(definitions):
    observer = _SKILL_OBSERVER.get()
    if observer is None or _SKILL_OBSERVATION_PAUSED.get():
        return
    callback, seen, loaded = observer
    for definition in definitions:
        loaded[(definition.agent, definition.name)] = definition
        snapshot = definition.observation()
        key = (snapshot['agent'], snapshot['skill'], snapshot['skill_fingerprint'])
        if key not in seen:
            seen.add(key)
            callback(snapshot)


_SKILL_OBSERVATION_PAUSED = ContextVar('skill_loop_mapping_only', default=False)


@contextmanager
def skill_mapping_scope():
    """节点映射是元数据查询，不是业务重新选择或重新加载正文。"""
    token = _SKILL_OBSERVATION_PAUSED.set(True)
    try:
        yield
    finally:
        _SKILL_OBSERVATION_PAUSED.reset(token)


def observed_definition(agent, name):
    observer = _SKILL_OBSERVER.get()
    return observer[2].get((agent, name)) if observer else None


@contextmanager
def skill_registry_scope(registry):
    """把草稿限制在当前故障链路，不能污染其它并发任务。"""
    token = _TRIAL_REGISTRY.set(registry)
    try:
        yield
    finally:
        _TRIAL_REGISTRY.reset(token)


def get_skill_registry() -> SkillRegistry:
    return _TRIAL_REGISTRY.get() or _REGISTRY


__all__ = ["SkillDefinition", "SkillReference", "SkillRegistry", "get_skill_registry",
           "SKILL_DOCUMENT_NAME", "REFERENCE_DIRECTORY_NAME", "REFERENCE_TOOL_NAME"]
