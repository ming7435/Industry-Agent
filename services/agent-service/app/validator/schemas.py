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
    intent: Literal[
        "diagnosis",
        "knowledge",
        "cad",
        "maintenance",
        "quality",
        "report",
        "workorder",
        "memory",
        "workorder_action",
        "workorder_query",
        "unknown",
        "need_more_context",
    ]
    target_agent: str
    confidence: float = Field(ge=0, le=1)
    reason: str
    entities: Dict[str, Any] = Field(default_factory=dict)
    target_input: Dict[str, Any] = Field(default_factory=dict)
    validation_findings: List[str] = Field(default_factory=list)


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
    confidence_details: Dict[str, Any] = Field(default_factory=dict)
    documents: List[KnowledgeDocument] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)
    total: int = 0
    backend_status: str = "unknown"
    degraded: bool = False
    warning: str = ""
    source: str = "rag-service-compatible"
    validation_findings: List[str] = Field(default_factory=list)
    stop_reason: str = ""
    retrieval_trace: List[Dict[str, Any]] = Field(default_factory=list)


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
    request_id: str = ""
    device_id: str = ""
    device_model: str = ""
    query: str
    status: Literal["completed", "insufficient_engineering_data", "error"] = "completed"
    query_type: str = "component"
    component: str = ""
    part_no: str = ""
    # 兼容旧版字符串图纸编号，同时允许新的结构化图纸引用。
    drawing_refs: List[Any] = Field(default_factory=list)
    drawing_ref_details: List[Dict[str, Any]] = Field(default_factory=list)
    viewer_context: Dict[str, Any] = Field(default_factory=lambda: {
        "model_url": "",
        "mesh_id": "",
        "mesh_name": "",
        "location": "",
        "default_view": "",
    })
    location: str = ""
    summary: str = ""
    components: List[CADComponent] = Field(default_factory=list)
    drawings: List[Dict[str, Any]] = Field(default_factory=list)
    bom_items: List[Dict[str, Any]] = Field(default_factory=list)
    parts: List[Dict[str, Any]] = Field(default_factory=list)
    part_relations: List[Dict[str, Any]] = Field(default_factory=list)
    assembly_relations: List[Dict[str, Any]] = Field(default_factory=list)
    locations: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0, le=1)
    total: int = 0
    source: str = "cad-mcp-compatible"
    validation_findings: List[str] = Field(default_factory=list)
    steps: List[Dict[str, Any]] = Field(default_factory=list)
    stop_reason: str = ""
    backend_status: str = "unknown"
    degraded: bool = False
    warning: str = ""


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
    target_part: Dict[str, Any] = Field(default_factory=lambda: {
        "part_no": "",
        "part_name": "",
        "component": "",
    })
    engineering_context: Dict[str, Any] = Field(default_factory=lambda: {
        "drawing_refs": [],
        "drawing_ref_details": [],
        "viewer_context": {},
    })
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
    inventory_status: Dict[str, Any] = Field(default_factory=dict)
    part_availability: Dict[str, Any] = Field(default_factory=dict)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    memory_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    validation_findings: List[str] = Field(default_factory=list)
    risk_level: str = "medium"
    workorder_ready: bool = False
    workorder_draft: Dict[str, Any] = Field(default_factory=dict)


class WorkOrder(BaseModel):
    workorder_id: str
    device_id: str
    status: Literal["open", "in_progress", "completed", "closed"] = "open"
    title: str
    plan_id: str = ""
    steps: List[str] = Field(default_factory=list)
    repair_target: Dict[str, Any] = Field(default_factory=lambda: {
        "part_no": "",
        "part_name": "",
        "component": "",
    })
    drawing_context: Dict[str, Any] = Field(default_factory=lambda: {
        "drawing_url": "",
        "model_url": "",
        "mesh_name": "",
        "location": "",
    })
    alarm_code: str = ""
    diagnosis_context: Dict[str, Any] = Field(default_factory=dict)
    assignee: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkOrderResultView(BaseModel):
    action: str = ""
    success: bool = False
    workorder_id: str = ""
    status: str = ""
    priority: str = "normal"
    assignee: str = ""
    workorder: Dict[str, Any] = Field(default_factory=dict)
    items: List[Dict[str, Any]] = Field(default_factory=list)
    candidates: List[Dict[str, Any]] = Field(default_factory=list)
    dispatch_context: Dict[str, Any] = Field(default_factory=dict)
    validation_findings: List[str] = Field(default_factory=list)
    stop_reason: str = ""
    error: str = ""


class QualityResult(BaseModel):
    """质量检测结果。

    ``repair_acceptance`` 字段保留旧维修验收契约；生产质检使用零件和检测项字段。
    """

    workorder_id: str = ""
    inspection_type: Literal["part_quality", "repair_acceptance"] = "part_quality"
    part_id: str = ""
    part_no: str = ""
    part_name: str = ""
    batch_id: str = ""
    production_order_id: str = ""
    device_id: str = ""
    passed: bool = False
    status: Literal["pass", "fail", "review"] = "fail"
    recent_acceptance_status: Literal["PASSED", "FAILED", "REVIEW"] = "REVIEW"
    device_recovered: bool = False
    alarm_cleared: bool = False
    parameters_recovered: bool = False
    workorder_compliance: bool = False
    sop_compliant: bool = False
    sop_compliance: bool = False
    qualified: bool = False
    quality_grade: str = ""
    inspection_items: List[Dict[str, Any]] = Field(default_factory=list)
    measurements: Dict[str, Any] = Field(default_factory=dict)
    specifications: Dict[str, Any] = Field(default_factory=dict)
    defects: List[Dict[str, Any]] = Field(default_factory=list)
    failed_checks: List[str] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    recommendation: str = ""
    findings: List[str] = Field(default_factory=list)
    stop_reason: str = ""
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReportResult(BaseModel):
    report_id: str
    report_type: Literal[
        "diagnosis_report",
        "maintenance_report",
        "quality_report",
        "incident_report",
        "full_case_report",
        "diagnosis",
        "maintenance",
        "quality",
        "daily",
    ]
    title: str
    summary: str
    status: Literal["completed", "incomplete", "error"] = "completed"
    sections: Dict[str, Any] = Field(default_factory=dict)
    source_refs: List[Dict[str, Any]] = Field(default_factory=list)
    validation_findings: List[str] = Field(default_factory=list)
    persisted: bool = False
    file_path: str = ""
    stop_reason: str = ""
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
    alarm_code: str = ""
    diagnosis: str = ""
    treatment: str = ""
    duration_seconds: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
