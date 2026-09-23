"""Canonical action contract for every Runtime-selected operation."""

from __future__ import annotations

from enum import Enum
import hashlib
import json
from typing import Any, Mapping
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ActionType(str, Enum):
    TOOL = "TOOL"
    AGENT = "AGENT"
    FINAL = "FINAL"
    REPLAN = "REPLAN"
    WAIT = "WAIT"


class ActionModel(BaseModel):
    """Runtime's only action representation, with legacy input support."""

    model_config = ConfigDict(extra="allow")

    action_id: str = Field(default_factory=lambda: "ACT-" + uuid4().hex[:16].upper(), min_length=1)
    action_type: ActionType = ActionType.AGENT
    target: str = Field(min_length=1)
    reason: str = ""
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    payload: dict[str, Any] = Field(default_factory=dict)
    side_effect: bool = False
    idempotency_key: str = ""
    cost: float = Field(default=1.0, ge=0.0)

    @model_validator(mode="before")
    @classmethod
    def _accept_legacy_shape(cls, value: Any) -> Any:
        if not isinstance(value, Mapping):
            return value
        values = dict(value)
        kind = values.pop("kind", None)
        name = values.pop("name", None)
        params = values.pop("params", values.pop("parameters", None))
        legacy_action = values.pop("action", None)
        if "action_type" not in values and kind is not None:
            values["action_type"] = str(kind).upper()
        elif "action_type" in values:
            raw_action_type = values["action_type"]
            values["action_type"] = raw_action_type if isinstance(raw_action_type, ActionType) else str(raw_action_type).upper()
        if "target" not in values:
            values["target"] = name or legacy_action
        if "payload" not in values and params is not None:
            values["payload"] = dict(params)
        return values

    @property
    def kind(self) -> str:
        return self.action_type.value.lower()

    @property
    def name(self) -> str:
        return self.target

    @property
    def params(self) -> dict[str, Any]:
        return dict(self.payload)

    @classmethod
    def agent(cls, target: str, payload: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(action_type=ActionType.AGENT, target=target, payload=dict(payload or {}), **kwargs)

    @classmethod
    def tool(cls, target: str, payload: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(action_type=ActionType.TOOL, target=target, payload=dict(payload or {}), **kwargs)

    @classmethod
    def final(cls, target: str = "final", payload: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(action_type=ActionType.FINAL, target=target, payload=dict(payload or {}), **kwargs)

    @classmethod
    def replan(cls, target: str, payload: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(action_type=ActionType.REPLAN, target=target, payload=dict(payload or {}), **kwargs)

    @classmethod
    def wait(cls, target: str = "wait", payload: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(action_type=ActionType.WAIT, target=target, payload=dict(payload or {}), **kwargs)

    @property
    def fingerprint(self) -> str:
        canonical = json.dumps(
            {
                "action_type": self.action_type.value,
                "target": self.target,
                "payload": self.payload,
                "side_effect": self.side_effect,
                "idempotency_key": self.idempotency_key,
            },
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
            default=str,
        )
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def as_dict(self) -> dict[str, Any]:
        return {
            "action_id": self.action_id,
            "action_type": self.action_type.value,
            "target": self.target,
            "reason": self.reason,
            "confidence": self.confidence,
            "payload": dict(self.payload),
            "side_effect": self.side_effect,
            "idempotency_key": self.idempotency_key,
            "cost": self.cost,
            "fingerprint": self.fingerprint,
        }

    @classmethod
    def coerce(cls, value: Any) -> "ActionModel | None":
        if value is None or value == "":
            return None
        if isinstance(value, cls):
            return value
        if isinstance(value, Mapping):
            payload = dict(value)
            if not any(key in payload for key in ("target", "name", "action")):
                return cls.agent("mapping", payload)
            return cls.model_validate(payload)
        return cls.agent(str(value))


Action = ActionModel

__all__ = ["ActionType", "ActionModel", "Action"]
