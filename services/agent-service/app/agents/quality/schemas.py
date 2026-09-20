"""Quality Agent 的输入和 LangGraph 状态契约。"""

from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class QualityQuery(BaseModel):
    inspection_type: str = "part_quality"
    action: str = "inspect_part"
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
    part_id: str = ""
    part_no: str = ""
    part_name: str = ""
    batch_id: str = ""
    production_order_id: str = ""
    part: Dict[str, Any] = Field(default_factory=dict)
    inspection_plan: Dict[str, Any] = Field(default_factory=dict)
    measurements: Dict[str, Any] = Field(default_factory=dict)
    inspection_results: List[Dict[str, Any]] = Field(default_factory=list)
    specifications: Dict[str, Any] = Field(default_factory=dict)
    production_context: Dict[str, Any] = Field(default_factory=dict)

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
        if not values.get("inspection_type") or (
            values.get("inspection_type") == "part_quality"
            and (values.get("action") == "verify_repair" or values.get("workorder_id") or order)
            and not (values.get("part_id") or values.get("part_no") or values.get("part"))
        ):
            values["inspection_type"] = "repair_acceptance" if (values.get("workorder_id") or order) else "part_quality"
        values.setdefault("workorder_id", str(order.get("workorder_id") or ""))
        values.setdefault("device_id", str(order.get("device_id") or ""))
        part = values.get("part") or {}
        if hasattr(part, "model_dump"):
            part = part.model_dump(mode="json")
        values["part"] = dict(part)
        for key in ("part_id", "part_no", "part_name", "batch_id", "production_order_id", "device_id"):
            if not values.get(key) and part.get(key):
                values[key] = str(part[key])
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
    inspection_type: str
    part: Dict[str, Any]
    inspection_plan: Dict[str, Any]
    dimension_check: Dict[str, Any]
    appearance_check: Dict[str, Any]
    material_check: Dict[str, Any]
    function_check: Dict[str, Any]
    process_check: Dict[str, Any]
