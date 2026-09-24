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

        base_definitions = [
            ("fault_analysis", "analyze abnormal event", False),
            ("document_search", "retrieve supporting evidence", False),
            ("drawing_search", "resolve engineering context", False),
            ("repair_planning", "prepare executable repair plan", False),
            ("workorder_create", "create one idempotent work order", True),
        ]
        optional_definitions = [
            ("hypothesis_generation", "generate diagnostic hypotheses", False),
            ("historical_case_search", "retrieve historical cases", False),
            ("evidence_retrieval", "retrieve supporting evidence", False),
            ("bom_query", "resolve BOM context", False),
            ("component_relation", "resolve component relations", False),
            ("repair_plan", "prepare executable repair plan", False),
            ("maintenance_replan", "replan an insufficient maintenance plan", False),
            ("workorder_update", "update an existing work order", False),
            ("quality_review", "review part quality", False),
            ("case_reporting", "compose a case report", False),
            ("experience_retrieval", "retrieve validated experience", False),
            ("experience_learning", "persist validated repair experience", True),
        ]
        definitions = list(base_definitions)
        requested = context.get("required_capabilities")
        requested_set = {str(item) for item in requested} if isinstance(requested, (list, tuple, set)) else set()
        if requested_set:
            definitions = [
                *base_definitions,
                ("quality_inspection", "verify the produced part when requested", False),
                *optional_definitions,
            ]
            known = {item[0]: item for item in definitions}
            definitions = [
                known.get(capability, (capability, "execute requested capability", False))
                for capability in requested
                if str(capability).strip()
            ]
        actions = []
        for capability, reason, side_effect in definitions:
            kwargs: dict[str, Any] = {"reason": reason, "confidence": 0.7, "side_effect": side_effect}
            if side_effect:
                kwargs["idempotency_key"] = (
                    "experience:%s" % event_id
                    if capability == "experience_learning" and event_id
                    else workorder_key
                )
            actions.append(ActionModel.agent(
                agent_for(capability, capability.split("_")[0]),
                payload=payload_for(capability),
                **kwargs,
            ))
        result = Plan(goal=goal, actions=actions, metadata={"event_id": event_id, "idempotency_key": workorder_key})
        self._emit("planner_end", {
            "goal": goal,
            "actions": [action.as_dict() for action in actions],
            "task_id": context.get("task_id", ""),
            "trace_id": context.get("trace_id", ""),
        })
        return result


__all__ = ["Plan", "Planner"]
