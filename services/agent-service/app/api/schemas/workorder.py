from __future__ import annotations

from typing import Any, Dict
from pydantic import BaseModel, Field


class WorkOrderCreateRequest(BaseModel):
    device_id: str = Field(default="unknown", min_length=1)
    title: str = Field(default="设备维修工单", min_length=1)
    plan_id: str = ""
    steps: list[str] = Field(default_factory=list)
    assignee: str = ""
    repair_target: Dict[str, Any] = Field(default_factory=dict)
    drawing_context: Dict[str, Any] = Field(default_factory=dict)
    alarm_code: str = ""
    diagnosis_context: Dict[str, Any] = Field(default_factory=dict)
    priority: str = "normal"
    risk_level: str = ""
    source: str = "manual"
    idempotency_key: str = ""


class WorkOrderActionRequest(BaseModel):
    action: str = Field(default="update", pattern="^(assign|update|submit_feedback|mark_repair_completed|close|reopen)$")
    status: str = "in_progress"
    assignee: str = ""
    feedback: str = ""
    repair_feedback: Dict[str, Any] | str = Field(default_factory=dict)
    repair_verification: Dict[str, Any] = Field(default_factory=dict)


class RepairFeedbackRequest(BaseModel):
    feedback: str = Field(min_length=1)
    result: str = ""
    operator: str = ""
    duration_seconds: float | None = Field(default=None, ge=0)
    verification: Dict[str, Any] = Field(default_factory=dict)
