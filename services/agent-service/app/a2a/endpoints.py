"""将 Agent 执行器绑定到类型化本地 A2A 端点。"""
from __future__ import annotations
from typing import Any, Dict
from app.common.serialization import _serialize_agent_result
from .client import A2AClient
from .models import (
    CADRequest, CADResponse, DiagnosisRequest, DiagnosisResponse,
    KnowledgeRequest, KnowledgeResponse, MaintenanceRequest, MaintenanceResponse,
    QualityRequest, QualityResponse, WorkOrderRequest, WorkOrderResponse,
    MemoryRequest, MemoryResponse,
)

class A2AEndpoints:
    def __init__(self, harnesses: dict[str, Any]) -> None:
        self.harnesses = harnesses

    def register(self, client: A2AClient) -> None:
        for name in ("diagnosis", "knowledge", "cad", "maintenance", "quality", "workorder", "memory"):
            client.register(name, getattr(self, f"_{name}_endpoint"))

    def _diagnosis_endpoint(self, request: DiagnosisRequest) -> DiagnosisResponse:
        event = dict(request.event)
        event.setdefault("task_id", request.task_id)
        event.setdefault("trace_id", request.trace_id)
        result = self.harnesses["diagnosis"].execute_agent(event)
        payload = _serialize_agent_result(result)
        return DiagnosisResponse(
            request_id=request.request_id,
            reply_to=request.message_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            from_agent="diagnosis",
            to_agent=request.from_agent,
            status="completed",
            success=True,
            diagnosis=payload,
            payload=payload,
        )

    def _knowledge_endpoint(self, request: KnowledgeRequest) -> KnowledgeResponse:
        result = self.harnesses["knowledge"].execute_agent({
            "query": request.query,
            "limit": request.limit,
            "filters": request.filters,
            "task_id": request.task_id,
            "trace_id": request.trace_id,
            "device_id": request.device_id,
            "query_type": request.query_type,
            "alarm_code": request.alarm_code,
            "component": request.component,
            "required_sources": request.required_sources,
        })
        payload = _serialize_agent_result(result)
        return KnowledgeResponse(
            request_id=request.request_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            reply_to=request.message_id,
            from_agent="knowledge",
            to_agent=request.from_agent,
            status=payload.get("status", "completed"),
            query_type=payload.get("query_type", request.query_type),
            summary=payload.get("summary", ""),
            evidence=payload.get("evidence", []),
            possible_causes=payload.get("possible_causes", []),
            recommended_checks=payload.get("recommended_checks", []),
            confidence=payload.get("confidence", 0.0),
            confidence_details=payload.get("confidence_details", {}),
            documents=payload.get("documents", []),
            sources=payload.get("sources", []),
            backend_status=payload.get("backend_status", "unknown"),
            degraded=payload.get("degraded", False),
            warning=payload.get("warning", ""),
            source=payload.get("source", ""),
            filters=payload.get("filters", request.filters),
            total=payload.get("total", 0),
            validation_findings=payload.get("validation_findings", []),
            stop_reason=payload.get("stop_reason", ""),
            payload=payload,
        )

    def _cad_endpoint(self, request: CADRequest) -> CADResponse:
        result = self.harnesses["cad"].execute_agent(request.model_dump(mode="json"))
        payload = _serialize_agent_result(result)
        return CADResponse(
            request_id=request.request_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            reply_to=request.message_id,
            from_agent="cad",
            to_agent=request.from_agent,
            success=payload.get("status") == "completed",
            status=payload.get("status", "insufficient_engineering_data"),
            device_id=payload.get("device_id", request.device_id),
            device_model=payload.get("device_model", request.device_model),
            component=payload.get("component", request.component),
            part_no=payload.get("part_no", request.part_no),
            drawing_refs=payload.get("drawing_refs", []),
            drawing_ref_details=payload.get("drawing_ref_details", []),
            viewer_context=payload.get("viewer_context", {}),
            location=payload.get("location", ""),
            summary=payload.get("summary", ""),
            components=payload.get("components", []),
            drawings=payload.get("drawings", []),
            bom_items=payload.get("bom_items", []),
            parts=payload.get("parts", []),
            part_relations=payload.get("part_relations", []),
            assembly_relations=payload.get("assembly_relations", []),
            locations=payload.get("locations", []),
            evidence=payload.get("evidence", []),
            confidence=payload.get("confidence", 0.0),
            validation_findings=payload.get("validation_findings", []),
            steps=payload.get("steps", []),
            stop_reason=payload.get("stop_reason", ""),
            backend_status=payload.get("backend_status", "unknown"),
            degraded=payload.get("degraded", False),
            source=payload.get("source", ""),
            result=payload,
            payload=payload,
        )

    def _maintenance_endpoint(self, request: MaintenanceRequest) -> MaintenanceResponse:
        result = self.harnesses["maintenance"].execute_agent(request.model_dump(mode="json"))
        payload = _serialize_agent_result(result)
        return MaintenanceResponse(
            request_id=request.request_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            reply_to=request.message_id,
            from_agent="maintenance",
            to_agent=request.from_agent,
            success=bool(payload.get("workorder_ready")),
            maintenance_plan=payload,
            workorder_draft=payload.get("workorder_draft", {}),
            payload=payload,
        )

    def _quality_endpoint(self, request: QualityRequest) -> QualityResponse:
        result = self.harnesses["quality"].execute_agent(request.model_dump(mode="json"))
        payload = _serialize_agent_result(result)
        passed = bool(payload.get("passed"))
        return QualityResponse(
            request_id=request.request_id,
            reply_to=request.message_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            from_agent="quality",
            to_agent=request.from_agent,
            status="completed",
            success=True,
            quality_result=payload,
            inspection_type=str(payload.get("inspection_type") or request.inspection_type),
            passed=passed,
            qualified=bool(payload.get("qualified", passed)),
            defects=list(payload.get("defects") or []),
            rework_required=not passed,
            validation_findings=list(payload.get("findings") or payload.get("validation_findings") or []),
            stop_reason=str(payload.get("stop_reason") or ""),
            payload=payload,
        )

    def _workorder_endpoint(self, request: WorkOrderRequest) -> WorkOrderResponse:
        result = self.harnesses["workorder"].execute_agent(request.model_dump(mode="json"))
        payload = _serialize_agent_result(result)
        return WorkOrderResponse(
            request_id=request.request_id,
            reply_to=request.message_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            from_agent="workorder",
            to_agent=request.from_agent,
            status=payload.get("status", ""),
            success=bool(payload.get("success")),
            workorder_result=payload,
            workorder=payload.get("workorder", {}),
            validation_findings=payload.get("validation_findings", []),
            stop_reason=payload.get("stop_reason", ""),
            payload=payload,
        )

    def _memory_endpoint(self, request: MemoryRequest) -> MemoryResponse:
        result = self.harnesses["memory"].execute_agent(request.model_dump(mode="json"))
        payload = _serialize_agent_result(result)
        return MemoryResponse(
            request_id=request.request_id,
            reply_to=request.message_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            from_agent="memory",
            to_agent=request.from_agent,
            status="completed" if payload.get("success") else "insufficient_evidence",
            success=bool(payload.get("success")),
            memory_result=payload,
            items=payload.get("items", []),
            experience=payload.get("experience", {}),
            validation_findings=payload.get("validation_findings", []),
            stop_reason=payload.get("stop_reason", ""),
            payload=payload,
        )
