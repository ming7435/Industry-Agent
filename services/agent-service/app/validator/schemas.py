"""多 Agent 共享的 Pydantic 契约。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class AgentTask(BaseModel):
    task_id: str
    user_text: str = ""
    event: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)


class RouteResult(BaseModel):
    intent: Literal["diagnosis", "knowledge", "maintenance", "report", "workorder", "quality", "experience", "unknown"]
    target_agent: str
    confidence: float = Field(ge=0, le=1)
    reason: str


class KnowledgeDocument(BaseModel):
    document_id: str
    title: str
    content: str
    source: str
    score: float = Field(ge=0, le=1)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeResult(BaseModel):
    query: str
    documents: List[KnowledgeDocument] = Field(default_factory=list)
    source: str = "rag-service-compatible"


class CADComponent(BaseModel):
    component_id: str
    name: str
    position: str = ""
    assembly_relation: str = ""
    quantity: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CADResult(BaseModel):
    query: str
    components: List[CADComponent] = Field(default_factory=list)
    source: str = "cad-mcp-compatible"


class DiagnosisView(BaseModel):
    device_id: str
    fault: str
    cause: str
    severity: str
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    evidence: List[str] = Field(default_factory=list)
    recommendation: str = ""
    raw: Dict[str, Any] = Field(default_factory=dict)


class MaintenancePlan(BaseModel):
    plan_id: str
    diagnosis: DiagnosisView
    repair_steps: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    parts: List[str] = Field(default_factory=list)
    safety: List[str] = Field(default_factory=list)
    estimated_time: str = ""
    source_documents: List[str] = Field(default_factory=list)
    cad_components: List[str] = Field(default_factory=list)


class WorkOrder(BaseModel):
    workorder_id: str
    device_id: str
    status: Literal["open", "in_progress", "completed", "closed"] = "open"
    title: str
    plan_id: str = ""
    steps: List[str] = Field(default_factory=list)
    assignee: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QualityResult(BaseModel):
    workorder_id: str
    passed: bool
    device_recovered: bool
    alarm_cleared: bool
    sop_compliant: bool
    findings: List[str] = Field(default_factory=list)
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReportResult(BaseModel):
    report_id: str
    report_type: Literal["diagnosis", "maintenance", "quality", "daily"]
    title: str
    summary: str
    sections: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ExperienceResult(BaseModel):
    """工单完成后沉淀的可检索维修经验。"""

    experience_id: str
    device_id: str
    title: str
    content: str
    passed: bool
    source_workorder: str = ""
    source_report: str = ""
    collection: str = "maint_fault_events"
    memory_saved: bool = False
    rag_saved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
