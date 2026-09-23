"""Report Agent 的输入和状态契约。"""

from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class ReportQuery(BaseModel):
    report_type: str = ""
    task_id: str = ""
    trace_id: str = ""
    device_id: str = ""
    event_id: str = ""
    workorder_id: str = ""
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)
    workorder: Dict[str, Any] = Field(default_factory=dict)
    repair_feedback: Dict[str, Any] = Field(default_factory=dict)
    repair_verification: Dict[str, Any] = Field(default_factory=dict)
    quality: Dict[str, Any] = Field(default_factory=dict)
    knowledge: Dict[str, Any] = Field(default_factory=dict)
    event: Dict[str, Any] = Field(default_factory=dict)
    trace: List[Dict[str, Any]] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)
    persist: bool = True

    @classmethod
    def from_payload(cls, payload: Any) -> "ReportQuery":
        if isinstance(payload, cls):
            return payload
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        values = dict(payload or {}) if isinstance(payload, dict) else {}
        for key in ("diagnosis", "maintenance_plan", "workorder", "repair_feedback", "repair_verification", "quality", "knowledge", "event"):
            value = values.get(key)
            dump = getattr(value, "model_dump", None)
            if callable(dump):
                values[key] = dump(mode="json")
            elif value and not isinstance(value, dict):
                values[key] = dict(value)
        values["trace"] = [dict(item) for item in values.get("trace") or [] if isinstance(item, dict)]
        values.setdefault("workorder_id", str((values.get("workorder") or {}).get("workorder_id") or ""))
        context = dict(values.get("context") or {})
        values.setdefault("device_id", str((values.get("diagnosis") or {}).get("device_id") or (values.get("workorder") or {}).get("device_id") or context.get("device_id") or ""))
        values.setdefault("report_type", str(context.get("report_type") or ""))
        return cls(**values)
