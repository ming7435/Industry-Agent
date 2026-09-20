"""Quality Agent 的输入和 LangGraph 状态契约。"""

from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class QualityQuery(BaseModel):
    task_id: str = ""
    trace_id: str = ""
    workorder_id: str = ""
    device_id: str = ""
    event_id: str = ""
    diagnosis_result: Dict[str, Any] = Field(default_factory=dict)
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)
    repair_feedback: Dict[str, Any] | str = Field(default_factory=dict)
    workorder: Dict[str, Any] = Field(default_factory=dict)
    pre_metrics: Dict[str, Any] = Field(default_factory=dict)
    post_metrics: Dict[str, Any] = Field(default_factory=dict)
    manage_workorder: bool = False

    @classmethod
    def from_payload(cls, payload: Any) -> "QualityQuery":
        if isinstance(payload, cls):
            return payload
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        values = dict(payload or {})
        raw_order = values.get("workorder")
        if hasattr(raw_order, "model_dump"):
            values["workorder"] = raw_order.model_dump(mode="json")
        elif raw_order:
            values["workorder"] = dict(raw_order)
        order = values.get("workorder") or {}
        values.setdefault("workorder_id", str(order.get("workorder_id") or ""))
        values.setdefault("device_id", str(order.get("device_id") or ""))
        if not values.get("diagnosis") and values.get("diagnosis_result"):
            values["diagnosis"] = values["diagnosis_result"]
        return cls(**values)


class QualityGraphState(dict):
    """仅作为文档化状态类型，实际图使用 TypedDict 以兼容 LangGraph。"""

    request: Dict[str, Any]
    active_skill: str
    allowed_tools: List[str]
    workorder: Dict[str, Any]
    repair_feedback: Dict[str, Any]
    repair_check: Dict[str, Any]
    workorder_check: Dict[str, Any]
    device_status: Dict[str, Any]
    active_alarms: Dict[str, Any]
    alarm_check: Dict[str, Any]
    parameter_check: Dict[str, Any]
    sop_check: Dict[str, Any]
    validation_findings: List[str]
    result: Any
    route: str
    stop_reason: str
