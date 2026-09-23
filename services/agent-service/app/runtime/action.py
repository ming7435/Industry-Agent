"""Structured actions emitted by bounded runtime loops."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Literal, Mapping

from pydantic import BaseModel, ConfigDict, Field


class ActionModel(BaseModel):
    """A deterministic, inspectable action emitted by a loop step.

    ``action``/``parameters`` are accepted as wire-compatible aliases for
    callers that already use those names.  The fingerprint intentionally
    includes the idempotency key when supplied so two explicitly distinct
    side-effect operations cannot be conflated by the duplicate guard.
    """

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    kind: Literal["agent", "tool", "final", "replan"] = "agent"
    name: str = Field(alias="action", min_length=1)
    params: dict[str, Any] = Field(default_factory=dict, alias="parameters")
    idempotency_key: str = ""

    @classmethod
    def agent(cls, name: str, params: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(kind="agent", name=name, params=dict(params or {}), **kwargs)

    @classmethod
    def tool(cls, name: str, params: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(kind="tool", name=name, params=dict(params or {}), **kwargs)

    @classmethod
    def final(cls, name: str = "final", params: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(kind="final", name=name, params=dict(params or {}), **kwargs)

    @classmethod
    def replan(cls, name: str, params: Mapping[str, Any] | None = None, **kwargs: Any) -> "ActionModel":
        return cls(kind="replan", name=name, params=dict(params or {}), **kwargs)

    @property
    def fingerprint(self) -> str:
        payload = {
            "kind": self.kind,
            "name": self.name,
            "params": self.params,
            "idempotency_key": self.idempotency_key,
        }
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def as_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "name": self.name,
            "params": dict(self.params),
            "idempotency_key": self.idempotency_key,
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
            if "name" not in payload and "action" not in payload:
                return cls(name="mapping", params=payload)
            return cls.model_validate(payload)
        return cls(name=str(value))


Action = ActionModel

__all__ = ["ActionModel", "Action"]
