"""Agent 间调用的结构化请求和响应。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from pydantic import BaseModel, Field, model_validator


def _response_message_id() -> str:
    return "A2A-RESP-" + uuid4().hex[:12].upper()


class A2ARequest(BaseModel):
    """统一 A2A Request。

    request_id/from_agent/to_agent 保留为内部兼容字段；message_id、source_agent、
    target_agent 通过 ``to_protocol_dict`` 输出为设计文档中的协议字段。
    """

    request_id: str
    message_id: str = ""
    task_id: str = ""
    trace_id: str = ""
    from_agent: str
    to_agent: str
    source_agent: str = ""
    target_agent: str = ""
    action: str = "invoke"
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="after")
    def sync_protocol_names(self) -> "A2ARequest":
        self.message_id = self.message_id or self.request_id
        self.source_agent = self.source_agent or self.from_agent
        self.target_agent = self.target_agent or self.to_agent
        return self

    def to_protocol_dict(self) -> Dict[str, Any]:
        data = self.model_dump(mode="json")
        base_fields = {
            "request_id", "message_id", "task_id", "trace_id", "from_agent", "to_agent",
            "source_agent", "target_agent", "action", "created_at", "payload",
        }
        payload = dict(data.get("payload") or {})
        payload.update({key: value for key, value in data.items() if key not in base_fields})
        return {
            "message_id": self.message_id,
            "task_id": self.task_id,
            "trace_id": self.trace_id,
            "source_agent": self.source_agent,
            "target_agent": self.target_agent,
            "action": self.action,
            "payload": payload,
        }


class A2AResponse(BaseModel):
    """统一 A2A Response，reply_to 必须关联原始 Request.message_id。"""

    request_id: str
    message_id: str = Field(default_factory=_response_message_id)
    reply_to: str = ""
    task_id: str = ""
    trace_id: str = ""
    from_agent: str
    to_agent: str
    source_agent: str = ""
    target_agent: str = ""
    status: str = "completed"
    success: bool = True
    error: str = ""
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="after")
    def sync_protocol_names(self) -> "A2AResponse":
        self.source_agent = self.source_agent or self.from_agent
        self.target_agent = self.target_agent or self.to_agent
        return self

    def to_protocol_dict(self) -> Dict[str, Any]:
        data = self.model_dump(mode="json")
        base_fields = {
            "request_id", "message_id", "reply_to", "task_id", "trace_id", "from_agent", "to_agent",
            "source_agent", "target_agent", "status", "success", "error", "created_at", "payload",
        }
        payload = dict(data.get("payload") or {})
        payload.update({key: value for key, value in data.items() if key not in base_fields})
        return {
            "message_id": self.message_id,
            "reply_to": self.reply_to,
            "task_id": self.task_id,
            "trace_id": getattr(self, "trace_id", ""),
            "source_agent": self.source_agent,
            "target_agent": self.target_agent,
            "status": self.status,
            "payload": payload,
        }


class DiagnosisRequest(A2ARequest):
    event: Dict[str, Any] = Field(default_factory=dict)
    knowledge_context: Dict[str, Any] = Field(default_factory=dict)


class DiagnosisResponse(A2AResponse):
    diagnosis: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeRequest(A2ARequest):
    query: str
    limit: int = Field(default=5, ge=1, le=50)
    filters: Dict[str, Any] = Field(default_factory=dict)
    source_agent: str = ""
    device_id: str = ""
    query_type: str = "hybrid"
    alarm_code: str = ""
    component: str = ""
    required_sources: List[str] = Field(default_factory=list)


class KnowledgeResponse(A2AResponse):
    status: str = "completed"
    query_type: str = "hybrid"
    summary: str = ""
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    possible_causes: List[str] = Field(default_factory=list)
    recommended_checks: List[str] = Field(default_factory=list)
    confidence: float = 0.0
    confidence_details: Dict[str, Any] = Field(default_factory=dict)
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    backend_status: str = "unknown"
    degraded: bool = False
    warning: str = ""
    source: str = ""
    filters: Dict[str, Any] = Field(default_factory=dict)
    total: int = 0
    validation_findings: List[str] = Field(default_factory=list)
    stop_reason: str = ""


class MaintenanceRequest(A2ARequest):
    device_id: str = ""
    diagnosis_result: Dict[str, Any] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    user_text: str = ""
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    knowledge: Dict[str, Any] = Field(default_factory=dict)
    cad: Dict[str, Any] = Field(default_factory=dict)
    quality_result: Dict[str, Any] = Field(default_factory=dict)


class MaintenanceResponse(A2AResponse):
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)
    workorder_draft: Dict[str, Any] = Field(default_factory=dict)


class QualityRequest(A2ARequest):
    workorder_id: str = ""
    device_id: str = ""
    diagnosis_result: Dict[str, Any] = Field(default_factory=dict)
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)
    repair_feedback: Dict[str, Any] | str = Field(default_factory=dict)
    workorder: Dict[str, Any] = Field(default_factory=dict)
    pre_metrics: Dict[str, Any] = Field(default_factory=dict)
    post_metrics: Dict[str, Any] = Field(default_factory=dict)
    manage_workorder: bool = True


class QualityResponse(A2AResponse):
    quality_result: Dict[str, Any] = Field(default_factory=dict)
    passed: bool = False
    rework_required: bool = False
    validation_findings: List[str] = Field(default_factory=list)
    stop_reason: str = ""


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
    drawing_refs: List[Any] = Field(default_factory=list)
    drawing_ref_details: List[Dict[str, Any]] = Field(default_factory=list)
    viewer_context: Dict[str, Any] = Field(default_factory=dict)
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
