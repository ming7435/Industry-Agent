"""面向现有 Agent 能力的确定性、只规划不执行的 Planner。"""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256
import json
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
        """兼容将计划项称作步骤的旧调用方。"""

        return list(self.actions)

    def as_dict(self) -> dict[str, Any]:
        return {
            "goal": self.goal,
            "actions": [action.as_dict() for action in self.actions],
            "metadata": dict(self.metadata),
        }


class Planner:
    """将目标映射为有界 Action，不调用 Agent 或工具。"""

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
        if event_id:
            revision = max(1, int(context.get("event_revision") or (event.get("event_revision") if isinstance(event, Mapping) else 1) or 1))
            workorder_key = "monitor:%s" % event_id
            event_values = event if isinstance(event, Mapping) else {}
            tenant_id = str(context.get("tenant_id") or event_values.get("tenant_id") or "").strip()
            device_id = str(context.get("device_id") or event_values.get("device_id") or "").strip()
            if tenant_id or device_id:
                scope = json.dumps([tenant_id, device_id], ensure_ascii=False, separators=(",", ":"))
                workorder_key += ":%s" % sha256(scope.encode("utf-8")).hexdigest()[:16]
            if revision > 1:
                workorder_key += ":r%s" % revision
        else:
            business_context = {key: value for key, value in context.items() if key not in {"task_id", "trace_id"}}
            identity = json.dumps([goal, business_context], ensure_ascii=False, sort_keys=True, default=str)
            workorder_key = "plan:%s" % sha256(identity.encode("utf-8")).hexdigest()[:16]
        payload = {"goal": goal, **context}

        def agent_for(capability: str, fallback: str) -> str:
            matches = self.capabilities.find(capability)
            return matches[0] if matches else fallback

        def payload_for(capability: str) -> dict[str, Any]:
            return {**payload, "required_capability": capability}

        base_definitions = self.capabilities.default_capabilities()
        definitions = list(base_definitions)
        requested = context.get("required_capabilities")
        requested_set = {str(item) for item in requested} if isinstance(requested, (list, tuple, set)) else set()
        if requested_set:
            definitions = [
                str(capability).strip()
                for capability in requested
                if str(capability).strip()
            ]
        actions = []
        for capability in definitions:
            canonical = self.capabilities.canonical_name(capability)
            reason = self.capabilities.reason_for(capability, "execute requested capability")
            side_effect = self.capabilities.side_effect_for(capability)
            kwargs: dict[str, Any] = {"reason": reason, "confidence": 0.7, "side_effect": side_effect}
            if side_effect:
                kwargs["idempotency_key"] = (
                    "experience:%s" % workorder_key
                    if canonical == "experience_learning" and event_id
                    else workorder_key
                    if canonical == "workorder_create"
                    else "%s:%s" % (canonical, event_id or workorder_key)
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
