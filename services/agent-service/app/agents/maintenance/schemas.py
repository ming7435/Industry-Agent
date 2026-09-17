"""Maintenance Agent 的内部请求契约。"""

from __future__ import annotations

from typing import Any, Dict

from pydantic import BaseModel, Field


class MaintenanceQuery(BaseModel):
    task_id: str = ""
    trace_id: str = ""
    device_id: str = ""
    user_text: str = ""
    query: str = ""
    diagnosis_result: Dict[str, Any] = Field(default_factory=dict)
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    knowledge: Dict[str, Any] = Field(default_factory=dict)
    cad: Dict[str, Any] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_payload(cls, payload: Any) -> "MaintenanceQuery":
        if isinstance(payload, cls):
            return payload
        if isinstance(payload, str):
            return cls(query=payload, user_text=payload)
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        values = dict(payload or {})
        if not values.get("diagnosis") and values.get("diagnosis_result"):
            values["diagnosis"] = values["diagnosis_result"]
        if not values.get("diagnosis_result") and values.get("diagnosis"):
            values["diagnosis_result"] = values["diagnosis"]
        if not values.get("query"):
            values["query"] = values.get("user_text") or values.get("fault") or "设备维修"
        return cls(**values)

