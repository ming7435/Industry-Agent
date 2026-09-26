"""Unified Agent boundary used by the Runtime dispatcher.

The existing Agent implementations keep their domain-specific ``run`` methods.
This module adds a small, stable boundary around those methods so Runtime code
does not need to know each Agent's result model.
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable, Mapping

from pydantic import BaseModel, ConfigDict, Field


class AgentResult(BaseModel):
    """Canonical result exchanged between Runtime and any Agent."""

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
    """Small common interface implemented by all existing business Agents."""

    name = "agent"
    capabilities: tuple[str, ...] = ()

    def execute(self, task: Any) -> AgentResult:
        return AgentResult.from_value(self.run(task))

    def run(self, task: Any) -> Any:  # pragma: no cover - concrete Agents override
        raise NotImplementedError

    def validate(self, task: Any) -> list[str]:
        """Return boundary validation findings without running business logic."""

        return []

    def trace(self, event: str, payload: Mapping[str, Any] | None = None) -> None:
        """Optional hook for concrete Agents; Runtime owns canonical tracing."""

        return None


def trace_skill_node(
    agent_name: str,
    node_name: str,
    node: Callable[[Mapping[str, Any]], Mapping[str, Any]],
    *,
    skill_step: str | None = None,
) -> Callable[[Mapping[str, Any]], dict[str, Any]]:
    """Attach real Graph-node execution to an existing Skill step.

    This is deliberately a small wrapper, not a Skill interpreter: the
    existing Graph node still owns its domain behavior and routing.
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
        registry = get_skill_registry()
        definitions = [skill for name in selected if (skill := registry.get(agent_name, str(name))) is not None]
        if not definitions:
            definitions = registry.select(agent_name, request)
        # Domain Graphs pass this binding beside their node declarations. The
        # base wrapper remains unaware of domain node names and aliases.
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
                    state_change={"skill": skill_name, "step": step_id, "mapped": bool(match), "input_keys": sorted(current)},
                keys=["skill", "step", "mapped", "input_keys"], tool_name="", latency=0.0, error="",
            )
        try:
            output = dict(node(state))
        except Exception as error:
            if trace is not None:
                trace.record(
                    type="agent_step", name=node_name, node=node_name, agent=agent_name,
                    event="step_failed", task_id=task_id, trace_id=trace_id,
                    state_change={"skill": skill_name, "step": step_id, "error": str(error)},
                    keys=["skill", "step", "error"], tool_name="", latency=0.0, error=str(error),
                )
            raise
        record = {
            "step_id": step_id,
            "skill": skill_name,
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
                state_change={"skill": skill_name, "step": step_id, "mapped": bool(match), "output_keys": record["output_keys"]},
                keys=["skill", "step", "mapped", "output_keys"], tool_name="", latency=0.0, error="",
            )
        return output

    return wrapped


__all__ = ["AgentResult", "BaseAgent", "trace_skill_node"]
