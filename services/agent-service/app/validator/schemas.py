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
    intent: Literal["diagnosis", "knowledge", "cad", "maintenance", "quality", "report", "workorder_action", "unknown"]
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
    status: Literal["completed", "insufficient_evidence", "error"] = "completed"
    query_type: str = "hybrid"
    summary: str = ""
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    possible_causes: List[str] = Field(default_factory=list)
    recommended_checks: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0, le=1)
    documents: List[KnowledgeDocument] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)
    total: int = 0
    backend_status: str = "unknown"
    degraded: bool = False
    warning: str = ""
    source: str = "rag-service-compatible"


class CADComponent(BaseModel):
    component_id: str
    name: str
    part_no: str = ""
    position: str = ""
    assembly_relation: str = ""
    drawing_ref: str = ""
    quantity: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CADResult(BaseModel):
    query: str
    status: Literal["completed", "insufficient_engineering_data", "error"] = "completed"
    query_type: str = "component"
    summary: str = ""
    components: List[CADComponent] = Field(default_factory=list)
    drawings: List[Dict[str, Any]] = Field(default_factory=list)
    bom_items: List[Dict[str, Any]] = Field(default_factory=list)
    assembly_relations: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0, le=1)
    total: int = 0
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
    repair_target: str = ""
    repair_steps: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    parts: List[str] = Field(default_factory=list)
    safety: List[str] = Field(default_factory=list)
    required_tools: List[str] = Field(default_factory=list)
    required_parts: List[str] = Field(default_factory=list)
    safety_requirements: List[str] = Field(default_factory=list)
    pre_checks: List[str] = Field(default_factory=list)
    post_checks: List[str] = Field(default_factory=list)
    estimated_time: str = ""
    estimated_duration: int = 0
    source_documents: List[str] = Field(default_factory=list)
    cad_components: List[str] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    validation_findings: List[str] = Field(default_factory=list)
    risk_level: str = "medium"
    workorder_ready: bool = False


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
