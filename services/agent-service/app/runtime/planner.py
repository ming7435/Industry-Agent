"""Deterministic, non-executing Planner for existing Agent capabilities."""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
from typing import Any, Callable, Mapping

from .action import ActionModel
from .capability import CapabilityRegistry, build_capability_registry


@dataclass(frozen=True)
class Plan:
    goal: str
    actions: list[ActionModel] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def steps(self) -> list[ActionModel]:
        """Compatibility alias for callers that call plan items steps."""

        return list(self.actions)

    def as_dict(self) -> dict[str, Any]:
        return {
            "goal": self.goal,
            "actions": [action.as_dict() for action in self.actions],
            "metadata": dict(self.metadata),
        }


class Planner:
    """Map a goal to bounded Actions without invoking an Agent or Tool."""

    def __init__(
        self,
        capabilities: CapabilityRegistry | None = None,
        trace: Callable[[str, dict[str, Any]], Any] | None = None,
    ) -> None:
        self.capabilities = capabilities or build_capability_registry()
        self.trace = trace

    def _emit(self, event: str, payload: Mapping[str, Any]) -> None:
        if self.trace is not None:
            self.trace(event, dict(payload))

    def plan(self, goal: str, context: Mapping[str, Any] | None = None) -> Plan:
        goal = str(goal or "").strip()
        if not goal:
            raise ValueError("goal must not be blank")
        context = dict(context or {})
        self._emit("planner_start", {
            "goal": goal,
            "context": context,
            "task_id": context.get("task_id", ""),
            "trace_id": context.get("trace_id", ""),
        })

        event = context.get("event")
        event_id = str(context.get("event_id") or (event.get("event_id") if isinstance(event, Mapping) else "") or "").strip()
        workorder_key = "monitor:%s" % event_id if event_id else "plan:%s" % sha256(goal.encode("utf-8")).hexdigest()[:16]
        payload = {"goal": goal, **context}

        def agent_for(capability: str, fallback: str) -> str:
            matches = self.capabilities.find(capability)
            return matches[0] if matches else fallback

        def payload_for(capability: str) -> dict[str, Any]:
            return {**payload, "required_capability": capability}

        actions = [
            ActionModel.agent(agent_for("fault_analysis", "diagnosis"), payload=payload_for("fault_analysis"), reason="analyze abnormal event", confidence=0.7),
            ActionModel.agent(agent_for("document_search", "knowledge"), payload=payload_for("document_search"), reason="retrieve supporting evidence", confidence=0.7),
            ActionModel.agent(agent_for("drawing_search", "cad"), payload=payload_for("drawing_search"), reason="resolve engineering context", confidence=0.7),
            ActionModel.agent(agent_for("repair_planning", "maintenance"), payload=payload_for("repair_planning"), reason="prepare executable repair plan", confidence=0.7),
            ActionModel.agent(
                agent_for("workorder_create", "workorder"),
                payload=payload_for("workorder_create"),
                reason="create one idempotent work order",
                confidence=0.7,
                side_effect=True,
                idempotency_key=workorder_key,
            ),
        ]
        result = Plan(goal=goal, actions=actions, metadata={"event_id": event_id, "idempotency_key": workorder_key})
        self._emit("planner_end", {
            "goal": goal,
            "actions": [action.as_dict() for action in actions],
            "task_id": context.get("task_id", ""),
            "trace_id": context.get("trace_id", ""),
        })
        return result


__all__ = ["Plan", "Planner"]
