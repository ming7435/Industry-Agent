"""Unified Agent boundary used by the Runtime dispatcher.

The existing Agent implementations keep their domain-specific ``run`` methods.
This module adds a small, stable boundary around those methods so Runtime code
does not need to know each Agent's result model.
"""

from __future__ import annotations

from typing import Any, Mapping

from pydantic import BaseModel, ConfigDict, Field


class AgentResult(BaseModel):
    """Canonical result exchanged between Runtime and any Agent."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    success: bool = True
    output: dict[str, Any] = Field(default_factory=dict)
    evidence: list[Any] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    next_actions: list[dict[str, Any]] = Field(default_factory=list)

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


__all__ = ["AgentResult", "BaseAgent"]
