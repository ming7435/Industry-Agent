from __future__ import annotations

from typing import Any, Dict
from pydantic import BaseModel, Field


class PartQualityRequest(BaseModel):
    part_no: str = ""
    part_name: str = ""
    batch_id: str = ""
    production_order_id: str = ""
    device_id: str = ""
    part: Dict[str, Any] = Field(default_factory=dict)
    inspection_plan: Dict[str, Any] = Field(default_factory=dict)
    measurements: Dict[str, Any] = Field(default_factory=dict)
    specifications: Dict[str, Any] = Field(default_factory=dict)
    production_context: Dict[str, Any] = Field(default_factory=dict)


class QualityCheckRequest(BaseModel):
    target_type: str = "workorder"
    target_id: str = Field(min_length=1)
    workorder_id: str = ""
    part_id: str = ""
    part_no: str = ""
    batch_id: str = ""
    production_order_id: str = ""
    inspection_type: str = ""
    score: float | None = Field(default=None, ge=0, le=100)
    result: str = ""
    findings: list[str] = Field(default_factory=list)
    items: list[Dict[str, Any]] = Field(default_factory=list)
    reviewer: str = ""
    risk_level: str = "R1"


class QualityAppealRequest(BaseModel):
    reason: str = Field(min_length=1)
    evidence: list[Dict[str, Any]] = Field(default_factory=list)
    applicant: str = ""
