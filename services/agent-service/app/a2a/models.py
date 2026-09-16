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
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    source: str = ""


class MaintenanceRequest(A2ARequest):
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    knowledge: Dict[str, Any] = Field(default_factory=dict)
    cad: Dict[str, Any] = Field(default_factory=dict)


class MaintenanceResponse(A2AResponse):
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)


class CADRequest(A2ARequest):
    query: str
    device_id: str = ""


class CADResponse(A2AResponse):
    result: Dict[str, Any] = Field(default_factory=dict)
