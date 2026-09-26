"""Quality Agent 的生产零件质检输入和图状态契约。"""

from __future__ import annotations

from typing import Any, Dict, List, TypedDict

from pydantic import BaseModel, Field


class QualityQuery(BaseModel):
    inspection_type: str = "part_quality"
    action: str = "inspect_part"
    task_id: str = ""
    trace_id: str = ""
    device_id: str = ""
    event_id: str = ""
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
        part = values.get("part") or {}
        if hasattr(part, "model_dump"):
            part = part.model_dump(mode="json")
        values["part"] = dict(part)
        for key in ("part_id", "part_no", "part_name", "batch_id", "production_order_id", "device_id"):
            if not values.get(key) and part.get(key):
                values[key] = str(part[key])
        values["inspection_type"] = "part_quality"
        values["action"] = "inspect_part"
        return cls(**values)


class QualityWorkflowState(TypedDict, total=False):
    """Quality LangGraph 节点之间传递的运行时状态。"""

    agent: Any
    active_agent: str
    current_step: str
    step_history: list[dict[str, Any]]
    completed_steps: list[dict[str, Any]]
    failed_steps: list[dict[str, Any]]
    request: Dict[str, Any]
    active_skill: str
    active_skills: List[str]
    allowed_tools: List[str]
    decision: Dict[str, Any]
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
