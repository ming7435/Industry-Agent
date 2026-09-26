"""Canonical action contract for every Runtime-selected operation."""

from __future__ import annotations

from enum import Enum
import hashlib
import json
from typing import Any, Literal, Mapping
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ActionType(str, Enum):
    TOOL = "TOOL"
    AGENT = "AGENT"
    FINAL = "FINAL"
    REPLAN = "REPLAN"
    WAIT = "WAIT"


class StepDefinition(BaseModel):
    """Normalized executable unit derived from an Agent Skill.

    Skills historically stored steps as strings.  The Runtime uses this
    richer shape internally while keeping every field optional so old
    catalogs and callers remain valid.
    """

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    id: str = Field(min_length=1)
    type: Literal["normalize", "reason", "tool", "observe", "transform", "validate", "branch", "persist"] = "reason"
    description: str = ""
    required_inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    tool: str = ""
    required: bool = True
    preconditions: list[str] = Field(default_factory=list)
    success_conditions: list[str] = Field(default_factory=list)
    failure_policy: str = "stop"
    timeout_seconds: float | None = None
    max_retries: int | None = None
    evidence_type: str = ""

    @property
    def step_id(self) -> str:
        """Compatibility name used by trace and Graph consumers."""

        return self.id

    @classmethod
    def coerce(cls, value: Any, *, default_type: str = "reason") -> "StepDefinition":
        if isinstance(value, cls):
            return value
        if isinstance(value, Mapping):
            payload = dict(value)
            payload.setdefault("id", payload.get("step_id") or payload.get("name") or "step")
            payload.setdefault("type", default_type)
            return cls.model_validate(payload)
        return cls(id=str(value), type=default_type)


class Observation(BaseModel):
    """A normalized observation collected during one Runtime step."""

    model_config = ConfigDict(extra="allow")

    observation_id: str = ""
    step_id: str = ""
    tool: str = ""
    source: str = ""
    type: str = "observation"
    subject: str = ""
    facts: dict[str, Any] = Field(default_factory=dict)
    valid: bool = True
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    evidence_ids: list[str] = Field(default_factory=list)
    raw: Any = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def _accept_legacy_shape(cls, value: Any) -> Any:
        if not isinstance(value, Mapping):
            return value
        payload = dict(value)
        payload.setdefault("observation_id", payload.get("id") or payload.get("observation") or "")
        payload.setdefault("type", payload.get("kind") or payload.get("observation_type") or "observation")
        if "facts" not in payload and isinstance(payload.get("value"), Mapping):
            payload["facts"] = dict(payload["value"])
        return payload

    @property
    def kind(self) -> str:
        return self.type

    @property
    def value(self) -> Any:
        return self.facts or self.raw


class Evidence(BaseModel):
    """A traceable evidence item shared by Agents and Evaluators."""

    model_config = ConfigDict(extra="allow")

    evidence_id: str = ""
    observation_id: str = ""
    source: str = ""
    type: str = ""
    content: Any = None
    supports: list[str] = Field(default_factory=list)
    contradicts: list[str] = Field(default_factory=list)
    strength: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def _accept_legacy_shape(cls, value: Any) -> Any:
        if not isinstance(value, Mapping):
            return value
        payload = dict(value)
        payload.setdefault("evidence_id", payload.get("id") or "")
        return payload

    @property
    def id(self) -> str:
        return self.evidence_id


class ValidationResult(BaseModel):
    """Granular validation output used by Agent steps and Runtime."""

    model_config = ConfigDict(extra="allow")

    passed: bool = False
    checks: dict[str, bool] | list[dict[str, Any]] = Field(default_factory=dict)
    findings: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    recommended_action: dict[str, Any] | str = Field(default_factory=dict)

    @property
    def missing_evidence(self) -> list[str]:
        return list(self.missing)


class StepResult(BaseModel):
    """Uniform result for one fine-grained execution step."""

    model_config = ConfigDict(extra="allow")

    success: bool = False
    status: str = "completed"
    output: dict[str, Any] = Field(default_factory=dict)
    observations: list[Observation] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)
    validation: ValidationResult = Field(default_factory=ValidationResult)
    next_actions: list[dict[str, Any]] = Field(default_factory=list)
    error: str = ""


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

    @property
    def required_capability(self) -> str:
        """Capability required by this action, if it is an Agent action."""

        return str(self.payload.get("required_capability") or "").strip()

    @property
    def skill(self) -> str:
        return str(self.payload.get("skill") or "").strip()

    @property
    def step(self) -> str:
        return str(self.payload.get("step") or self.payload.get("current_step") or "").strip()

    @property
    def allowed_tools(self) -> list[str]:
        values = self.payload.get("allowed_tools") or []
        if isinstance(values, str):
            values = [values]
        return [str(item) for item in values if str(item).strip()]

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

__all__ = [
    "ActionType",
    "ActionModel",
    "Action",
    "StepDefinition",
    "Observation",
    "Evidence",
    "ValidationResult",
    "StepResult",
]
