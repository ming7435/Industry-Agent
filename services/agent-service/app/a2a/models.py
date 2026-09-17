"""Agent 间调用的结构化请求和响应。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from pydantic import BaseModel, Field


class A2ARequest(BaseModel):
    request_id: str
    task_id: str = ""
    from_agent: str
    to_agent: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class A2AResponse(BaseModel):
    request_id: str
    task_id: str = ""
    from_agent: str
    to_agent: str
    success: bool = True
    error: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DiagnosisRequest(A2ARequest):
    event: Dict[str, Any] = Field(default_factory=dict)
    knowledge_context: Dict[str, Any] = Field(default_factory=dict)


class DiagnosisResponse(A2AResponse):
    diagnosis: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeRequest(A2ARequest):
    query: str
    limit: int = Field(default=5, ge=1, le=50)
    filters: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeResponse(A2AResponse):
    status: str = "completed"
    summary: str = ""
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    possible_causes: List[str] = Field(default_factory=list)
    recommended_checks: List[str] = Field(default_factory=list)
    confidence: float = 0.0
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    backend_status: str = "unknown"
    degraded: bool = False
    warning: str = ""
    source: str = ""


class MaintenanceRequest(A2ARequest):
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    knowledge: Dict[str, Any] = Field(default_factory=dict)
    cad: Dict[str, Any] = Field(default_factory=dict)


class MaintenanceResponse(A2AResponse):
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)


class CADRequest(A2ARequest):
    device_model: str = ""
    component: str = ""
    part_no: str = ""
    query: str = ""
    device_id: str = ""


class CADResponse(A2AResponse):
    status: str = "completed"
    device_id: str = ""
    device_model: str = ""
    component: str = ""
    part_no: str = ""
    drawing_refs: List[str] = Field(default_factory=list)
    location: str = ""
    summary: str = ""
    components: List[Dict[str, Any]] = Field(default_factory=list)
    drawings: List[Dict[str, Any]] = Field(default_factory=list)
    bom_items: List[Dict[str, Any]] = Field(default_factory=list)
    parts: List[Dict[str, Any]] = Field(default_factory=list)
    part_relations: List[Dict[str, Any]] = Field(default_factory=list)
    assembly_relations: List[Dict[str, Any]] = Field(default_factory=list)
    locations: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.0
    validation_findings: List[str] = Field(default_factory=list)
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    stop_reason: str = ""
    backend_status: str = "unknown"
    degraded: bool = False
    source: str = ""
    result: Dict[str, Any] = Field(default_factory=dict)
