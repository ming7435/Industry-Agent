"""用于编排和 Agent 提供方的类型化 A2A 请求构造。"""
from __future__ import annotations
from typing import Any, Dict, Mapping
from .client import A2AClient
from .models import (
    CADRequest, CADResponse, DiagnosisRequest, DiagnosisResponse,
    KnowledgeRequest, KnowledgeResponse, MaintenanceRequest, MaintenanceResponse,
    QualityRequest, QualityResponse, WorkOrderRequest, WorkOrderResponse,
    MemoryRequest, MemoryResponse,
)

class A2ARequests:
    def __init__(self, client: A2AClient) -> None:
        self.a2a = client

    def retrieve_knowledge(self, state: Mapping[str, Any], query: str) -> Dict[str, Any]:
        context = state.get("context") or {}
        return self._knowledge_a2a(
            state.get("task_id", ""),
            "diagnosis" if state.get("entry") == "trigger" else "router",
            query,
            filters=context.get("knowledge_filters") or {},
            trace_id=state.get("trace_id", ""),
            device_id=str(context.get("device_id") or ""),
            alarm_code=str(context.get("alarm_code") or ""),
            component=str(context.get("component") or ""),
            required_sources=list(context.get("required_sources") or []),
        )

    def _knowledge_a2a(
        self,
        task_id: str,
        from_agent: str,
        query: str,
        filters: Dict[str, Any] | None = None,
        trace_id: str = "",
        device_id: str = "",
        alarm_code: str = "",
        component: str = "",
        required_sources: list[str] | None = None,
    ) -> Dict[str, Any]:
        response = self.a2a.request(
            KnowledgeRequest(
                request_id=self.a2a.new_request_id(),
                task_id=task_id,
                trace_id=trace_id,
                from_agent=from_agent,
                to_agent="knowledge",
                action="retrieve_evidence",
                query=query,
                filters=filters or {},
                source_agent=from_agent,
                device_id=device_id,
                alarm_code=alarm_code,
                component=component,
                required_sources=list(required_sources or []),
            ),
            KnowledgeResponse,
        )
        return response.model_dump(mode="json")

    def request_knowledge_for_maintenance(self, context: Mapping[str, Any], query: str) -> Dict[str, Any]:
        return self._knowledge_a2a(
            str(context.get("task_id") or ""),
            "maintenance",
            query,
            {"knowledge_type": "sop"},
            trace_id=str(context.get("trace_id") or ""),
            device_id=str(context.get("device_id") or ""),
            component=str(context.get("component") or ""),
            required_sources=["sop"],
        )

    def request_cad_for_maintenance(self, context: Mapping[str, Any], query: str) -> Dict[str, Any]:
        return self._cad_a2a(str(context.get("task_id") or ""), "maintenance", query, context)

    # Compatibility aliases for integrations written against the original
    # provider injection names. New Runtime code should use the public methods.
    def _maintenance_knowledge_request(self, context: Mapping[str, Any], query: str) -> Dict[str, Any]:
        return self.request_knowledge_for_maintenance(context, query)

    def _maintenance_cad_request(self, context: Mapping[str, Any], query: str) -> Dict[str, Any]:
        return self.request_cad_for_maintenance(context, query)

    def retrieve_cad(self, state: Mapping[str, Any], query: str, from_agent: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        return self._cad_a2a(state.get("task_id", ""), from_agent, query, context or state.get("context") or {})

    def _cad_a2a(self, task_id: str, from_agent: str, query: str, context: Mapping[str, Any] | None = None) -> Dict[str, Any]:
        values = dict(context or {})
        response = self.a2a.request(
            CADRequest(
                request_id=self.a2a.new_request_id(),
                task_id=task_id,
                from_agent=from_agent,
                to_agent="cad",
                trace_id=str(values.get("trace_id") or ""),
                action="retrieve_engineering_context",
                device_id=str(values.get("device_id") or ""),
                device_model=str(values.get("device_model") or ""),
                component=str(values.get("component") or ""),
                part_no=str(values.get("part_no") or ""),
                query=query,
            ),
            CADResponse,
        )
        return response.result or response.model_dump(mode="json")

    def create_maintenance_plan(
        self,
        state: Mapping[str, Any],
        diagnosis: Dict[str, Any],
        knowledge: Dict[str, Any],
        cad: Dict[str, Any],
    ) -> Dict[str, Any]:
        context = state.get("context") or {}
        source_agent = "diagnosis" if state.get("entry") == "trigger" else "router"
        response = self.a2a.request(
            MaintenanceRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                trace_id=state.get("trace_id", ""),
                from_agent=source_agent,
                to_agent="maintenance",
                action="create_repair_plan",
                device_id=str(context.get("device_id") or diagnosis.get("device_id") or ""),
                user_text=state.get("user_text", ""),
                diagnosis_result=diagnosis,
                constraints={"need_workorder": state.get("entry") == "trigger"},
                diagnosis=diagnosis,
                knowledge=knowledge,
                cad=cad,
                memory=state.get("memory") or {},
            ),
            MaintenanceResponse,
        )
        return response.maintenance_plan

    def inspect_quality(
        self,
        state: Mapping[str, Any],
        from_agent: str = "router",
        quality_payload: Mapping[str, Any] | None = None,
    ) -> Dict[str, Any]:
        context = state.get("context") or {}
        values = {**context, **dict(quality_payload or {})}
        part = dict(values.get("part") or context.get("part") or {})
        response = self.a2a.request(
            QualityRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                trace_id=state.get("trace_id", ""),
                from_agent=from_agent,
                to_agent="quality",
                action="inspect_part",
                inspection_type="part_quality",
                device_id=str(part.get("device_id") or values.get("device_id") or context.get("device_id") or ""),
                part_id=str(part.get("part_id") or values.get("part_id") or context.get("part_id") or ""),
                part_no=str(part.get("part_no") or values.get("part_no") or context.get("part_no") or ""),
                part_name=str(part.get("part_name") or values.get("part_name") or ""),
                batch_id=str(part.get("batch_id") or values.get("batch_id") or ""),
                production_order_id=str(part.get("production_order_id") or values.get("production_order_id") or ""),
                part=part,
                inspection_plan=dict(values.get("inspection_plan") or {}),
                measurements=dict(values.get("measurements") or {}),
                inspection_results=list(values.get("inspection_results") or []),
                specifications=dict(values.get("specifications") or {}),
                production_context=dict(values.get("production_context") or {}),
            ),
            QualityResponse,
        )
        return dict(response.quality_result or {})

    def execute_workorder(
        self,
        state: Mapping[str, Any],
        action: str = "create",
        workorder: Mapping[str, Any] | None = None,
        from_agent: str | None = None,
    ) -> Dict[str, Any]:
        context = state.get("context") or {}
        plan = dict(context.get("maintenance_plan") or state.get("maintenance_plan") or {})
        order = dict(workorder or state.get("workorder") or {})
        response = self.a2a.request(
            WorkOrderRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                trace_id=state.get("trace_id", ""),
                from_agent=from_agent or ("maintenance" if action == "create" else "quality" if action in {"close", "reopen"} else "router"),
                to_agent="workorder",
                action=action,
                workorder_id=str(order.get("workorder_id") or context.get("workorder_id") or ""),
                device_id=str(order.get("device_id") or context.get("device_id") or ""),
                maintenance_plan=plan,
                workorder=order,
                repair_feedback=state.get("repair_feedback") or {},
                repair_verification=state.get("repair_verification") or order.get("repair_verification") or {},
                status=str(order.get("status") or ""),
                assignee=str(context.get("assignee") or ""),
                fault_level=str((state.get("diagnosis") or {}).get("severity") or plan.get("risk_level") or ""),
                idempotency_key=str(context.get("idempotency_key") or state.get("task_id") or ""),
                event_id=str(context.get("event_id") or (state.get("event") or {}).get("event_id") or plan.get("event_id") or ""),
                diagnosis_snapshot=dict(context.get("diagnosis_snapshot") or state.get("diagnosis") or plan.get("diagnosis") or {}),
                maintenance_plan_snapshot=dict(context.get("maintenance_plan_snapshot") or plan),
                closure_reason=str(context.get("closure_reason") or order.get("closure_reason") or ""),
                priority=str(context.get("priority") or plan.get("priority") or "normal"),
                risk_level=str(context.get("risk_level") or plan.get("risk_level") or ""),
                source=str(context.get("source") or plan.get("source") or ""),
            ),
            WorkOrderResponse,
        )
        return response.workorder_result or response.payload

    def access_memory(
        self,
        state: Mapping[str, Any],
        action: str = "search",
        query: str = "",
        from_agent: str | None = None,
    ) -> Dict[str, Any]:
        context = state.get("context") or {}
        response = self.a2a.request(
            MemoryRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                trace_id=state.get("trace_id", ""),
                from_agent=from_agent or ("report" if action == "learn" else "router"),
                to_agent="memory",
                action=action,
                device_id=str(context.get("device_id") or (state.get("diagnosis") or {}).get("device_id") or ""),
                device_model=str(context.get("device_model") or (state.get("diagnosis") or {}).get("device_model") or ""),
                alarm_code=str(context.get("alarm_code") or (state.get("diagnosis") or {}).get("alarm_code") or ""),
                component=str(context.get("component") or (state.get("diagnosis") or {}).get("component") or ""),
                fault_type=str(context.get("fault_type") or (state.get("diagnosis") or {}).get("fault_type") or ""),
                part_no=str(context.get("part_no") or (state.get("diagnosis") or {}).get("part_no") or ""),
                query=query or str(state.get("user_text") or ""),
                diagnosis=state.get("diagnosis") or {},
                maintenance_plan=state.get("maintenance_plan") or {},
                workorder=state.get("workorder") or {},
                repair_feedback=state.get("repair_feedback") or {},
                repair_verification=state.get("repair_verification") or {},
                quality=state.get("quality") or {},
                report=state.get("report") or {},
            ),
            MemoryResponse,
        )
        return response.memory_result or response.payload

    def diagnose(self, state: Mapping[str, Any], event: Dict[str, Any]) -> Dict[str, Any]:
        request = DiagnosisRequest(
            request_id=self.a2a.new_request_id(),
            task_id=state.get("task_id", ""),
            trace_id=state.get("trace_id", ""),
            from_agent="router",
            to_agent="diagnosis",
            action="diagnose_event",
            event={**event, "task_id": state.get("task_id", ""), "trace_id": state.get("trace_id", "")},
        )
        response = self.a2a.request(request, DiagnosisResponse)
        return response.diagnosis

    def request_knowledge_for_diagnosis(self, event: Mapping[str, Any], query: str) -> Dict[str, Any]:
        """Public Knowledge provider used by Diagnosis Agent."""

        task_id = str(event.get("task_id") or "")
        response = self.a2a.request(
            KnowledgeRequest(
                request_id=self.a2a.new_request_id(),
                task_id=task_id,
                trace_id=str(event.get("trace_id") or ""),
                from_agent="diagnosis",
                to_agent="knowledge",
                query=query,
                source_agent="diagnosis",
                device_id=str(event.get("device_id") or ""),
                alarm_code=str(event.get("alarm_code") or ""),
                component=str(event.get("component") or ""),
                required_sources=list(event.get("required_sources") or []),
            ),
            KnowledgeResponse,
        )
        return response.model_dump(mode="json")

    def _diagnosis_knowledge_request(self, event: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Compatibility alias for the original injected provider name."""

        return self.request_knowledge_for_diagnosis(event, query)
