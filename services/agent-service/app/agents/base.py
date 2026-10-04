"""Runtime dispatcher 使用的统一 Agent 边界。

现有 Agent 实现保留各自领域的 ``run`` 方法。本模块在这些方法外增加小而稳定的边界，
让 Runtime 代码无需了解每个 Agent 的结果模型。
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable, Mapping

from pydantic import BaseModel, ConfigDict, Field


class AgentResult(BaseModel):
    """Runtime 与各 Agent 之间交换的标准结果。"""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    success: bool = True
    output: dict[str, Any] = Field(default_factory=dict)
    evidence: list[Any] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    next_actions: list[dict[str, Any]] = Field(default_factory=list)
    observations: list[Any] = Field(default_factory=list)
    validation: dict[str, Any] = Field(default_factory=dict)
    step_history: list[dict[str, Any]] = Field(default_factory=list)

    @classmethod
    def from_value(cls, value: Any, *, success: bool = True) -> "AgentResult":
        if isinstance(value, cls):
            return value
        if hasattr(value, "model_dump"):
            value = value.model_dump(mode="json")
        elif hasattr(value, "to_dict"):
            value = value.to_dict()
        elif isinstance(value, Mapping):
            value = dict(value)
        else:
            value = {"value": value}

        evidence = value.get("evidence")
        if not isinstance(evidence, list):
            evidence = []
            for key in ("evidence_ids", "documents", "components", "parts"):
                items = value.get(key)
                if isinstance(items, list):
                    evidence.extend(items)
        next_actions = value.get("next_actions") or value.get("actions") or []
        if not isinstance(next_actions, list):
            next_actions = []
        try:
            confidence = max(0.0, min(1.0, float(value.get("confidence") or 0.0)))
        except (TypeError, ValueError):
            confidence = 0.0
        return cls(
            success=bool(value.get("success", success)),
            output=dict(value),
            evidence=list(evidence),
            confidence=confidence,
            next_actions=[item for item in next_actions if isinstance(item, Mapping)],
            observations=list(value.get("observations") or []),
            validation=dict(value.get("validation") or {}) if isinstance(value.get("validation"), Mapping) else {},
            step_history=[item for item in (value.get("step_history") or value.get("steps") or []) if isinstance(item, Mapping)],
        )


class BaseAgent:
    """现有业务 Agent 共同实现的简洁接口。"""

    name = "agent"
    capabilities: tuple[str, ...] = ()

    def execute(self, task: Any) -> AgentResult:
        return AgentResult.from_value(self.run(task))

    def run(self, task: Any) -> Any:  # pragma: no cover - 由具体 Agent 重写
        raise NotImplementedError

    def validate(self, task: Any) -> list[str]:
        """返回边界校验结果，不执行业务逻辑。"""

        return []

    def trace(self, event: str, payload: Mapping[str, Any] | None = None) -> None:
        """供具体 Agent 按需实现的钩子；标准追踪由 Runtime 负责。"""

        return None


def trace_skill_node(
    agent_name: str,
    node_name: str,
    node: Callable[[Mapping[str, Any]], Mapping[str, Any]],
    *,
    skill_step: str | None = None,
) -> Callable[[Mapping[str, Any]], dict[str, Any]]:
    """将现有 Skill 步骤与实际的 Graph 节点执行关联起来。

    此处仅做轻量封装，不负责解释 Skill；领域行为和路由仍由原有 Graph 节点负责。
    """

    @wraps(node)
    def wrapped(state: Mapping[str, Any]) -> dict[str, Any]:
        from app.skills import get_skill_registry

        current = dict(state)
        agent = current.get("agent")
        request = current.get("request") or current.get("task") or current.get("event") or {}
        request = request if isinstance(request, Mapping) else {}
        task_id = str(current.get("task_id") or request.get("task_id") or "")
        trace_id = str(current.get("trace_id") or request.get("trace_id") or "")
        selected = current.get("active_skills") or []
        if isinstance(selected, str):
            selected = [selected]
        requested_skills = list(selected)
        registry = get_skill_registry()
        # 显式空值或未知技能保持未映射；只有未声明选择时才按上下文匹配。
        definitions = registry.select(
            agent_name, request,
            names=requested_skills if "active_skills" in current else None,
        )
        # 领域 Graph 会在节点声明旁传入该绑定；基础包装器不感知领域节点名称和别名。
        skill_step_id = str(skill_step or node_name)
        match = next(
            ((skill, step) for skill in definitions for step in skill.normalized_steps() if step.id == skill_step_id),
            None,
        )
        skill_name = match[0].name if match else ""
        step_id = match[1].id if match else skill_step_id
        started_at = datetime.now(timezone.utc).isoformat()
        trace = getattr(agent, "runtime_trace", None) or getattr(getattr(agent, "tools", None), "trace", None)
        if trace is not None:
            trace.record(
                type="agent_step", name=node_name, node=node_name, agent=agent_name,
                event="step_started", task_id=task_id, trace_id=trace_id,
                state_change={"skill": skill_name, "requested_skills": requested_skills, "step": step_id, "mapped": bool(match), "input_keys": sorted(current)},
                keys=["skill", "requested_skills", "step", "mapped", "input_keys"], tool_name="", latency=0.0, error="",
            )
        try:
            output = dict(node(state))
        except Exception as error:
            if trace is not None:
                trace.record(
                    type="agent_step", name=node_name, node=node_name, agent=agent_name,
                    event="step_failed", task_id=task_id, trace_id=trace_id,
                    state_change={"skill": skill_name, "requested_skills": requested_skills, "step": step_id, "error": str(error)},
                    keys=["skill", "requested_skills", "step", "error"], tool_name="", latency=0.0, error=str(error),
                )
            raise
        record = {
            "step_id": step_id,
            "skill": skill_name,
            "requested_skills": requested_skills,
            "started_at": started_at,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "status": "completed",
            "input_keys": sorted(current),
            "output_keys": sorted(output),
            "tool": "",
            "error": "",
        }
        output["active_agent"] = agent_name
        output["current_step"] = step_id
        output["step_history"] = [*list(current.get("step_history") or []), record]
        output["completed_steps"] = [*list(current.get("completed_steps") or []), record]
        if trace is not None:
            trace.record(
                type="agent_step", name=node_name, node=node_name, agent=agent_name,
                event="step_completed", task_id=task_id, trace_id=trace_id,
                state_change={"skill": skill_name, "requested_skills": requested_skills, "step": step_id, "mapped": bool(match), "output_keys": record["output_keys"]},
                keys=["skill", "requested_skills", "step", "mapped", "output_keys"], tool_name="", latency=0.0, error="",
            )
        return output

    return wrapped


def prepare_skill_node(
    agent_name: str,
    initialize: Callable[[Mapping[str, Any]], Mapping[str, Any]],
    load_skill: Callable[[Mapping[str, Any]], Mapping[str, Any]],
    *,
    skill_steps: Mapping[str, str] | None = None,
) -> Callable[[Mapping[str, Any]], dict[str, Any]]:
    """合并图调度入口，仍逐条记录真实初始化和 Skill 加载操作。"""
    steps = skill_steps or {}
    initialize_node = trace_skill_node(agent_name, "initialize", initialize, skill_step=steps.get("initialize"))
    load_node = trace_skill_node(agent_name, "load_skill", load_skill, skill_step=steps.get("load_skill"))

    def prepare(state: Mapping[str, Any]) -> dict[str, Any]:
        updates = initialize_node(state)
        if updates.get("route") == "load_skill":
            updates.update(load_node({**state, **updates}))
        return updates

    return prepare


def chain_nodes(
    *nodes: Callable[[Mapping[str, Any]], Mapping[str, Any]],
    stop_routes: tuple[str, ...] = (),
) -> Callable[[Mapping[str, Any]], dict[str, Any]]:
    """顺序组合已带日志的子操作；显式门禁提前停止，异常不重试。"""

    def run(state: Mapping[str, Any]) -> dict[str, Any]:
        updates: dict[str, Any] = {}
        for node in nodes:
            updates.update(node({**state, **updates}))
            if updates.get("route") in stop_routes:
                break
        return updates

    return run


def result_node(
    final: Callable[[Mapping[str, Any]], Mapping[str, Any]],
    fallback: Callable[[Mapping[str, Any]], Mapping[str, Any]],
) -> Callable[[Mapping[str, Any]], dict[str, Any]]:
    """统一结果节点入口，仅执行当前路径的真实成功或回退操作。"""

    def finish(state: Mapping[str, Any]) -> dict[str, Any]:
        node = fallback if state.get("route") == "fallback" else final
        return dict(node(state))

    return finish


__all__ = ["AgentResult", "BaseAgent", "trace_skill_node", "prepare_skill_node", "chain_nodes", "result_node"]
