"""多 Agent 编排节点。"""

from __future__ import annotations

from time import perf_counter
import os
from typing import Any, Dict, Mapping
from uuid import uuid4

from app.a2a import (
    A2AClient, A2AError, CADRequest, CADResponse, DiagnosisRequest, DiagnosisResponse,
    KnowledgeRequest, KnowledgeResponse, MaintenanceRequest, MaintenanceResponse,
    QualityRequest, QualityResponse, WorkOrderRequest, WorkOrderResponse,
    MemoryRequest, MemoryResponse,
)
from app.agents.diagnosis import DiagnosisAgent
from app.agents.registry import build_agent_registry
from app.memory import ExperienceLearningModule
from app.graph.state import AgentState
from app.harness import AgentHarness
from app.memory import build_memory_stores
from app.tools.registry import ToolRegistry
from app.harness import TraceRecorder
from app.workorder import WorkOrderService
from app.workorder.validator import WorkOrderValidator
from app.closure import ClosureService


def _serialize_agent_result(value: Any) -> Dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


class OrchestratorNodes:
    """为九个核心 Agent 创建 Harness，并暴露业务模块节点。"""

    def __init__(self, diagnosis_agent: DiagnosisAgent | None = None, tools: ToolRegistry | None = None) -> None:
        registry = tools or ToolRegistry(rag_base_url=os.getenv("RAG_SERVICE_BASE_URL", ""))
        self.registry = registry
        self.trace = TraceRecorder()
        self._node_started_at: dict[tuple[str, str], float] = {}
        self._node_snapshots: dict[tuple[str, str], dict[str, Any]] = {}
        self.registry.trace = self.trace
        self.a2a = A2AClient(trace=self.trace)
        self.short_memory, self.long_memory = build_memory_stores()
        self.workorder_service = WorkOrderService(registry)
        self.closure_service = ClosureService(trace=self.trace)
        self.experience_module = ExperienceLearningModule(
            self.short_memory,
            self.long_memory,
            registry.rag,
            trace=self.trace,
        )
        # Diagnosis must share the orchestrator's registry so its tool calls
        # use the same remote RAG, PLC/MCP adapters, and trace recorder.
        diagnosis_runtime = diagnosis_agent or DiagnosisAgent(
            tools=registry,
            knowledge_provider=self._diagnosis_knowledge_request,
        )
        if getattr(diagnosis_runtime, "knowledge_provider", None) is None:
            diagnosis_runtime.knowledge_provider = self._diagnosis_knowledge_request
        if hasattr(diagnosis_runtime.tools, "trace"):
            diagnosis_runtime.tools.trace = self.trace
        agents = build_agent_registry(
            tools=registry,
            diagnosis=diagnosis_runtime,
            maintenance_knowledge_provider=self._maintenance_knowledge_request,
            maintenance_cad_provider=self._maintenance_cad_request,
            workorder_service=self.workorder_service,
            experience_module=self.experience_module,
        )
        self.harnesses = {name: AgentHarness(agent, trace=self.trace) for name, agent in agents.items()}
        self.a2a.register("diagnosis", self._diagnosis_endpoint)
        self.a2a.register("knowledge", self._knowledge_endpoint)
        self.a2a.register("cad", self._cad_endpoint)
        self.a2a.register("maintenance", self._maintenance_endpoint)
        self.a2a.register("quality", self._quality_endpoint)
        self.a2a.register("workorder", self._workorder_endpoint)
        self.a2a.register("memory", self._memory_endpoint)

    def trace_records(self) -> list[Dict[str, Any]]:
        return self.trace.list()

    def _node_start(self, name: str, state: AgentState) -> None:
        task_id = str(state.get("task_id", ""))
        key = (task_id, name)
        self._node_started_at[key] = perf_counter()
        self._node_snapshots[key] = dict(state)
        self.trace.record(
            type="node", name=name, node=name, agent=self._node_agent(name),
            event="node_started", task_id=task_id, state_change={},
            tool_name="", latency=0.0, error="",
        )

    def _finish(self, name: str, state: AgentState, payload: Dict[str, Any]) -> Dict[str, Any]:
        task_id = str(state.get("task_id", ""))
        key = (task_id, name)
        started = self._node_started_at.pop(key, perf_counter())
        before = self._node_snapshots.pop(key, {})
        changed = [field for field in set(before) | set(payload) if before.get(field) != payload.get(field)]
        self.trace.record(
            type="node", name=name, node=name, agent=self._node_agent(name),
            event="node_completed", task_id=task_id, keys=list(payload),
            state_change={"changed_keys": sorted(changed), "output_keys": list(payload)},
            tool_name="", latency=perf_counter() - started,
            error="; ".join(str(item) for item in payload.get("errors", []) if item),
        )
        return payload

    @staticmethod
    def _node_agent(name: str) -> str:
        return {
            "route": "router",
            "diagnosis": "diagnosis",
            "knowledge": "knowledge",
            "cad": "cad",
            "maintenance": "maintenance",
            "quality": "quality",
            "workorder": "workorder",
            "workorder_action": "workorder",
            "workorder_query": "workorder",
            "memory": "memory",
            "report": "report",
        }.get(name, name)

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

    def _knowledge_request(self, state: AgentState, query: str) -> Dict[str, Any]:
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

    def _maintenance_knowledge_request(self, context: Mapping[str, Any], query: str) -> Dict[str, Any]:
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

    def _maintenance_cad_request(self, context: Mapping[str, Any], query: str) -> Dict[str, Any]:
        return self._cad_a2a(str(context.get("task_id") or ""), "maintenance", query, context)

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

    def _cad_request(self, state: AgentState, query: str, from_agent: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
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

    def _maintenance_request(
        self,
        state: AgentState,
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

    def _quality_request(
        self,
        state: AgentState,
        from_agent: str = "router",
        quality_payload: Mapping[str, Any] | None = None,
        persist: bool = False,
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
        result = dict(response.quality_result or {})
        if persist and (result.get("part_id") or result.get("part_no")):
            check = self.closure_service.record_part_quality(
                {
                    "part_id": result.get("part_id") or values.get("part_id") or "",
                    "part_no": result.get("part_no") or values.get("part_no") or "",
                    "part_name": result.get("part_name") or values.get("part_name") or "",
                    "batch_id": result.get("batch_id") or values.get("batch_id") or "",
                    "production_order_id": result.get("production_order_id") or values.get("production_order_id") or "",
                    "result": "passed" if bool(result.get("passed") or result.get("qualified")) else "failed",
                    "score": result.get("score") or result.get("quality_score"),
                    "findings": list(result.get("findings") or result.get("defects") or result.get("failed_checks") or []),
                    "items": list(result.get("inspection_items") or []),
                    "reviewer": str(values.get("reviewer") or "quality-agent"),
                    "risk_level": str(values.get("risk_level") or "R1"),
                },
                operator=str(values.get("reviewer") or "quality-agent"),
            )
            result["quality_check_id"] = check["quality_check_id"]
        return result

    def _workorder_request(
        self,
        state: AgentState,
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
                closure_reason=str(context.get("closure_reason") or order.get("closure_reason") or ""),
                priority=str(context.get("priority") or plan.get("priority") or "normal"),
                risk_level=str(context.get("risk_level") or plan.get("risk_level") or ""),
                source=str(context.get("source") or plan.get("source") or ""),
            ),
            WorkOrderResponse,
        )
        return response.workorder_result or response.payload

    def _memory_request(
        self,
        state: AgentState,
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

    def execute_workorder(self, action: str, payload: Mapping[str, Any] | None = None, from_agent: str = "router") -> Dict[str, Any]:
        """API/事件入口：所有工单业务动作都通过 WorkOrder Agent。"""

        values = dict(payload or {})
        values["action"] = action
        if action == "create" and not values.get("maintenance_plan"):
            values["maintenance_plan"] = {
                "device_id": values.get("device_id") or "unknown",
                "title": values.get("title") or "设备维修工单",
                "plan_id": values.get("plan_id") or "",
                "repair_steps": list(values.get("steps") or []),
                "target_part": dict(values.get("repair_target") or {}),
                "engineering_context": dict(values.get("drawing_context") or {}),
                "alarm_code": values.get("alarm_code") or "",
                "diagnosis": {"device_id": values.get("device_id") or "unknown", "fault": values.get("title") or "设备异常", **dict(values.get("diagnosis_context") or {})},
                "workorder_ready": True,
                "priority": values.get("priority") or "normal",
                "risk_level": values.get("risk_level") or "",
                "source": values.get("source") or "manual",
                "idempotency_key": values.get("idempotency_key") or "",
            }
        state: AgentState = {
            "entry": "user",
            "task_id": "TASK-WO-API-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-WO-API-" + uuid4().hex[:12].upper(),
            "context": values,
            "workorder": dict(values.get("workorder") or {}),
            "repair_feedback": values.get("repair_feedback") or {},
            "repair_verification": dict(values.get("verification") or values.get("repair_verification") or {}),
        }
        result = self._workorder_request(state, action=action, workorder=values.get("workorder"), from_agent=from_agent)
        if action == "close":
            order = dict(result.get("workorder") or {})
            feedback = order.get("repair_feedback") or values.get("repair_feedback") or {}
            if order.get("status") == "closed" and WorkOrderValidator.can_learn(order, feedback):
                learning_state: AgentState = {
                    **state,
                    "workorder": order,
                    "repair_feedback": feedback,
                    "repair_verification": dict(order.get("repair_verification") or {}),
                    "diagnosis": dict(values.get("diagnosis") or {}),
                    "maintenance_plan": dict(values.get("maintenance_plan") or {}),
                }
                try:
                    result["memory_result"] = self._memory_request(
                        learning_state,
                        action="learn",
                        from_agent="workorder",
                    )
                except Exception as error:
                    result["memory_result"] = {
                        "success": False,
                        "error": str(error),
                        "stop_reason": "memory_learning_failed",
                    }
        return result

    def execute_memory(self, action: str, payload: Mapping[str, Any] | None = None, from_agent: str = "router") -> Dict[str, Any]:
        """API/事件入口：所有经验检索和学习动作都通过 Memory Agent。"""

        values = dict(payload or {})
        state: AgentState = {
            "entry": "user",
            "task_id": "TASK-MEMORY-API-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-MEMORY-API-" + uuid4().hex[:12].upper(),
            "context": values,
            "user_text": str(values.get("query") or ""),
            "diagnosis": dict(values.get("diagnosis") or {}),
            "maintenance_plan": dict(values.get("maintenance_plan") or {}),
            "workorder": dict(values.get("workorder") or {}),
            "repair_feedback": values.get("repair_feedback") or {},
            "quality": dict(values.get("quality") or {}),
            "report": dict(values.get("report") or {}),
        }
        return self._memory_request(state, action=action, query=str(values.get("query") or ""), from_agent=from_agent)

    def _diagnosis_request(self, state: AgentState, event: Dict[str, Any]) -> Dict[str, Any]:
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

    def _diagnosis_knowledge_request(self, event: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Diagnosis Agent 使用的 Knowledge A2A 入口。"""

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

    def route(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("route", state)
        if state.get("entry") == "trigger":
            payload = {"route": "diagnosis", "route_result": {"intent": "diagnosis", "target_agent": "diagnosis", "confidence": 1.0, "reason": "设备异常自动触发"}}
        else:
            result = self.harnesses["router"].execute_agent({
                "user_text": state.get("user_text", ""),
                "context": state.get("context", {}),
            })
            route_result = _serialize_agent_result(result)
            context = {**dict(state.get("context") or {}), **dict(route_result.get("target_input") or {})}
            payload = {"route": result.intent, "route_result": route_result, "context": context}
        return self._finish("route", state, payload)

    def diagnosis(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("diagnosis", state)
        event = dict(state.get("event") or {})
        if not event:
            event = {
                "event_id": "USER-" + state["task_id"],
                "device_id": "unknown",
                "event_type": "user_question",
                "severity": "unknown",
                "abnormal_metrics": [],
                "realtime_snapshot": {},
                "timestamp": state.get("task_id", ""),
            }
        output = {"diagnosis": self._diagnosis_request(state, event)}
        diagnosis = output["diagnosis"]
        memory_query = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or event.get("event_type") or "设备维修经验")
        try:
            memory = self._memory_request(
                {**state, "diagnosis": diagnosis, "context": {**dict(state.get("context") or {}), **event}},
                action="search",
                query=memory_query,
                from_agent="diagnosis",
            )
            output["memory"] = memory
            output["memory_result"] = memory
        except A2AError as error:
            output["errors"] = [str(error)]
        if state.get("entry") == "trigger":
            a2a_tool = next(
                (
                    item
                    for item in diagnosis.get("tool_calls", [])
                    if item.get("name") == "search_knowledge" and item.get("source") == "a2a"
                ),
                None,
            )
            if a2a_tool:
                output["knowledge"] = a2a_tool.get("result") or {}
            else:
                query = str(diagnosis.get("diagnosis") or diagnosis.get("summary") or "设备故障维修")
                try:
                    output["knowledge"] = self._knowledge_request(state, query)
                except A2AError as error:
                    output["errors"] = [str(error)]
        return self._finish("diagnosis", state, output)

    def knowledge(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("knowledge", state)
        if state.get("knowledge"):
            return self._finish("knowledge", state, {"knowledge": state["knowledge"]})
        diagnosis = state.get("diagnosis") or {}
        query = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or state.get("user_text") or "工业设备维修")
        return self._finish("knowledge", state, {"knowledge": self._knowledge_request(state, query)})

    def cad(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("cad", state)
        diagnosis = state.get("diagnosis") or {}
        context = state.get("context") or {}
        query = str(diagnosis.get("fault") or diagnosis.get("summary") or context.get("query") or state.get("user_text") or "主轴组件")
        from_agent = "diagnosis" if state.get("entry") == "trigger" else "router"
        result = self._cad_request(state, query, from_agent, context={**context, "device_id": diagnosis.get("device_id") or context.get("device_id", "")})
        return self._finish("cad", state, {"cad": result})

    def maintenance(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("maintenance", state)
        diagnosis = state.get("diagnosis") or {}
        context = state.get("context") or {}
        cad = state.get("cad") or {}
        if not cad:
            query = str(diagnosis.get("fault") or diagnosis.get("summary") or context.get("query") or state.get("user_text") or "设备维修")
            cad = self._cad_request(state, query, "maintenance", context=context)
        memory_query = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or context.get("query") or "设备维修经验")
        memory = state.get("memory") or {}
        try:
            memory = self._memory_request(
                {**state, "diagnosis": diagnosis, "context": {**dict(context), "device_id": diagnosis.get("device_id") or context.get("device_id", "")}},
                action="search",
                query=memory_query,
                from_agent="maintenance",
            )
        except A2AError as error:
            memory = {"success": False, "validation_findings": [str(error)], "items": []}
        planning_state = {**state, "memory": memory}
        plan = self._maintenance_request(
            planning_state,
            state.get("diagnosis", {}),
            state.get("knowledge", {}),
            cad,
        )
        payload = {"maintenance_plan": plan, "memory": memory, "memory_result": memory}
        if state.get("entry") == "trigger":
            payload["workorder"] = {}
        return self._finish("maintenance", state, payload)

    def workorder(self, state: AgentState) -> Dict[str, Any]:
        """Maintenance 完成后创建并派工；后续维修由外部反馈入口驱动。"""

        self._node_start("workorder", state)
        result = self._workorder_request(state, action="create", from_agent="maintenance")
        return self._finish("workorder", state, {
            "workorder_result": result,
            "workorder": result.get("workorder", {}),
            "pending_workorder_id": result.get("workorder_id", ""),
            "status": "waiting_repair" if result.get("success") else "workorder_error",
        })

    def memory(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("memory", state)
        route = state.get("route_result") or {}
        query = str((route.get("target_input") or {}).get("query") or state.get("user_text") or "")
        result = self._memory_request(state, action="search", query=query, from_agent="router")
        return self._finish("memory", state, {"memory_result": result, "memory": result, "status": "completed" if result.get("success") else "insufficient_evidence"})

    def workorder_action(self, state: AgentState) -> Dict[str, Any]:
        """执行 Router 已确认的工单动作，统一转交 WorkOrder Agent。"""

        self._node_start("workorder_action", state)
        route = state.get("route_result") or {}
        target_input = dict(route.get("target_input") or state.get("context") or {})
        action = str(target_input.get("action") or "update").lower()
        workorder_id = str(target_input.get("workorder_id") or "")
        try:
            enriched = {**target_input, "action": action, "workorder_id": workorder_id}
            if action == "create":
                enriched["maintenance_plan"] = enriched.get("maintenance_plan") or state.get("maintenance_plan") or {
                    "device_id": enriched.get("device_id") or "unknown",
                    "diagnosis": state.get("diagnosis") or {},
                    "repair_steps": list(enriched.get("steps") or []),
                    "workorder_ready": True,
                    "target_part": enriched.get("repair_target") or enriched.get("target_part") or {},
                    "engineering_context": enriched.get("drawing_context") or enriched.get("engineering_context") or {},
                }
            result = self._workorder_request({**state, "context": enriched}, action=action, from_agent="router")
            return self._finish("workorder_action", state, {
                "workorder_result": result,
                "workorder": result.get("workorder", {}),
                "status": "completed" if result.get("success") else "error",
            })
        except Exception as error:
            return self._finish("workorder_action", state, {
                "status": "error",
                "errors": [str(error)],
                "workorder": {"workorder_id": workorder_id, "action": action},
            })

    def workorder_query(self, state: AgentState) -> Dict[str, Any]:
        """查询工单业务结果并写回共享 AgentState。"""

        self._node_start("workorder_query", state)
        route = state.get("route_result") or {}
        target_input = dict(route.get("target_input") or state.get("context") or {})
        workorder_id = str(target_input.get("workorder_id") or "")
        try:
            result = self._workorder_request({**state, "context": target_input}, action="query", workorder={"workorder_id": workorder_id}, from_agent="router")
            return self._finish("workorder_query", state, {
                "workorder_result": result,
                "workorder": result.get("workorder", result),
                "status": "completed" if result.get("success", True) else "not_found",
            })
        except Exception as error:
            return self._finish("workorder_query", state, {
                "status": "error",
                "errors": [str(error)],
                "workorder": {"workorder_id": workorder_id},
            })

    def quality(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("quality", state)
        route = state.get("route_result") or {}
        target_input = dict(route.get("target_input") or state.get("context") or {})
        result = self._quality_request(state, from_agent="router", quality_payload=target_input, persist=True)
        return self._finish("quality", state, {"quality": result})


    def report(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("report", state)
        result = self.harnesses["report"].execute_agent(state)
        report = _serialize_agent_result(result)
        payload = {"report": report}
        if state.get("entry") == "trigger":
            memory_result = self._memory_request({**state, "report": report}, action="learn")
            payload["experience"] = memory_result.get("experience", {})
            payload["memory"] = memory_result
        return self._finish("report", state, payload)
