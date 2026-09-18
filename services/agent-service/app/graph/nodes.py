"""多 Agent 编排节点。"""

from __future__ import annotations

from time import perf_counter
import os
from typing import Any, Dict, Mapping
from uuid import uuid4

from app.a2a import (
    A2AClient, A2AError, CADRequest, CADResponse, DiagnosisRequest, DiagnosisResponse,
    KnowledgeRequest, KnowledgeResponse, MaintenanceRequest, MaintenanceResponse,
    QualityRequest, QualityResponse,
)
from app.agents.diagnosis import DiagnosisAgent
from app.agents.registry import build_agent_registry
from app.experience import ExperienceLearningModule
from app.graph.state import AgentState
from app.harness import AgentHarness
from app.memory import build_memory_stores
from app.tools.registry import ToolRegistry
from app.trace import TraceRecorder
from app.workorder import WorkOrderService


def _serialize_agent_result(value: Any) -> Dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


class OrchestratorNodes:
    """为七个核心 Agent 创建 Harness，并暴露业务模块节点。"""

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
            quality_knowledge_provider=self._quality_knowledge_request,
        )
        self.harnesses = {name: AgentHarness(agent, trace=self.trace) for name, agent in agents.items()}
        self.a2a.register("diagnosis", self._diagnosis_endpoint)
        self.a2a.register("knowledge", self._knowledge_endpoint)
        self.a2a.register("cad", self._cad_endpoint)
        self.a2a.register("maintenance", self._maintenance_endpoint)
        self.a2a.register("quality", self._quality_endpoint)

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
            "quality_rework": "maintenance",
            "workorder_action": "workorder",
            "workorder_query": "workorder",
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

    def _quality_knowledge_request(self, context: Mapping[str, Any], query: str) -> Dict[str, Any]:
        return self._knowledge_a2a(
            str(context.get("task_id") or ""),
            "quality",
            query,
            {"knowledge_type": "sop"},
            trace_id=str(context.get("trace_id") or ""),
            device_id=str(context.get("device_id") or ""),
            component=str(context.get("component") or ""),
            required_sources=["sop"],
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
        quality: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        context = state.get("context") or {}
        quality_result = dict(quality or {})
        is_rework = bool(quality_result) and not bool(quality_result.get("passed"))
        source_agent = "quality" if is_rework else ("diagnosis" if state.get("entry") == "trigger" else "router")
        response = self.a2a.request(
            MaintenanceRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                trace_id=state.get("trace_id", ""),
                from_agent=source_agent,
                to_agent="maintenance",
                action="create_repair_plan" if not is_rework else "rework_repair_plan",
                device_id=str(context.get("device_id") or diagnosis.get("device_id") or ""),
                user_text=state.get("user_text", ""),
                diagnosis_result=diagnosis,
                constraints={"need_workorder": state.get("entry") == "trigger", "rework": is_rework},
                diagnosis=diagnosis,
                knowledge=knowledge,
                cad=cad,
                quality_result=quality_result,
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
            passed=passed,
            rework_required=not passed,
            validation_findings=list(payload.get("findings") or payload.get("validation_findings") or []),
            stop_reason=str(payload.get("stop_reason") or ""),
            payload=payload,
        )

    def _quality_request(self, state: AgentState, workorder: Dict[str, Any]) -> Dict[str, Any]:
        context = state.get("context") or {}
        response = self.a2a.request(
            QualityRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                trace_id=state.get("trace_id", ""),
                from_agent="router",
                to_agent="quality",
                action="verify_repair",
                workorder_id=str(workorder.get("workorder_id") or ""),
                device_id=str(workorder.get("device_id") or context.get("device_id") or ""),
                diagnosis_result=state.get("diagnosis") or {},
                diagnosis=state.get("diagnosis") or {},
                maintenance_plan=state.get("maintenance_plan") or {},
                workorder=workorder,
                manage_workorder=True,
            ),
            QualityResponse,
        )
        return response.quality_result

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
        if state.get("entry") == "trigger":
            diagnosis = output["diagnosis"]
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
        cad = state.get("cad") or {}
        if not cad:
            diagnosis = state.get("diagnosis") or {}
            context = state.get("context") or {}
            query = str(diagnosis.get("fault") or diagnosis.get("summary") or context.get("query") or state.get("user_text") or "设备维修")
            cad = self._cad_request(state, query, "maintenance", context=context)
        plan = self._maintenance_request(
            state,
            state.get("diagnosis", {}),
            state.get("knowledge", {}),
            cad,
            quality=state.get("quality") or {},
        )
        payload = {"maintenance_plan": plan}
        if state.get("entry") == "trigger":
            existing = state.get("workorder") or {}
            if existing.get("workorder_id"):
                workorder_id = str(existing["workorder_id"])
                self.workorder_service.update(workorder_id, status="in_progress")
                order = self.workorder_service.mark_repair_completed(
                    workorder_id,
                    feedback="自动异常流程已完成现场维修模拟",
                )
            else:
                order = _serialize_agent_result(self.workorder_service.create_from_plan(plan))
                if order.get("workorder_id"):
                    order = self.workorder_service.mark_repair_completed(
                        str(order["workorder_id"]),
                        feedback="自动异常流程已完成现场维修模拟",
                    )
            if order.get("workorder_id"):
                order = self.workorder_service.get(order["workorder_id"])
            payload["workorder"] = order
        return self._finish("maintenance", state, payload)

    def workorder_action(self, state: AgentState) -> Dict[str, Any]:
        """执行 Router 已确认的工单业务动作，保持工单不属于 Agent。"""

        self._node_start("workorder_action", state)
        route = state.get("route_result") or {}
        target_input = dict(route.get("target_input") or state.get("context") or {})
        action = str(target_input.get("action") or "update").lower()
        workorder_id = str(target_input.get("workorder_id") or "")
        try:
            if action == "create":
                order = self.workorder_service.create(
                    device_id=str(target_input.get("device_id") or "unknown"),
                    title=str(target_input.get("title") or "设备维修工单"),
                    plan_id=str(target_input.get("plan_id") or ""),
                    steps=list(target_input.get("steps") or []),
                    assignee=str(target_input.get("assignee") or ""),
                    repair_target=target_input.get("repair_target") or target_input.get("target_part") or {},
                    drawing_context=target_input.get("drawing_context") or target_input.get("engineering_context") or {},
                )
            elif action == "assign":
                order = self.workorder_service.assign(workorder_id, str(target_input.get("assignee") or ""))
            elif action == "close":
                order = self.workorder_service.close(workorder_id)
            elif action == "reopen":
                order = self.workorder_service.reopen(workorder_id)
            else:
                order = self.workorder_service.update(
                    workorder_id,
                    status=str(target_input.get("status") or "in_progress"),
                    assignee=str(target_input.get("assignee") or ""),
                )
            return self._finish("workorder_action", state, {
                "workorder": _serialize_agent_result(order),
                "status": "completed",
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
            order = self.workorder_service.get(workorder_id) if workorder_id else {
                "items": self.workorder_service.list(
                    device_id=str(target_input.get("device_id") or ""),
                    status=str(target_input.get("status") or ""),
                ),
            }
            return self._finish("workorder_query", state, {
                "workorder": _serialize_agent_result(order),
                "status": "completed" if order.get("found", True) else "not_found",
            })
        except Exception as error:
            return self._finish("workorder_query", state, {
                "status": "error",
                "errors": [str(error)],
                "workorder": {"workorder_id": workorder_id},
            })

    def quality(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("quality", state)
        order = state.get("workorder", {})
        workorder_id = str(order.get("workorder_id", ""))
        latest = self.workorder_service.get(workorder_id) if workorder_id else order
        result = self._quality_request(state, latest)
        if workorder_id:
            latest = self.workorder_service.get(workorder_id)
            result["workorder"] = latest
        return self._finish("quality", state, {"quality": result, "workorder": latest})

    def quality_workorder(self, workorder_id: str) -> Dict[str, Any]:
        """通过统一 A2A 入口对独立工单执行质检，并沉淀通过后的经验。"""

        order = self.workorder_service.get(workorder_id)
        state: AgentState = {
            "entry": "user",
            "task_id": "TASK-QUALITY-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-QUALITY-" + uuid4().hex[:12].upper(),
            "context": {"device_id": str(order.get("device_id") or "")},
            "diagnosis": {},
            "maintenance_plan": {},
        }
        quality = self._quality_request(state, order)
        latest = self.workorder_service.get(workorder_id)
        quality["workorder"] = latest
        if quality.get("passed"):
            experience = _serialize_agent_result(self.experience_module.learn({
                "workorder": latest,
                "quality": quality,
            }))
            quality["experience"] = experience
        return quality

    def quality_rework(self, state: AgentState) -> Dict[str, Any]:
        """质量校验不通过时，通过 Quality -> Maintenance A2A 生成返工方案。"""

        self._node_start("quality_rework", state)
        plan = self._maintenance_request(
            state,
            state.get("diagnosis") or {},
            state.get("knowledge") or {},
            state.get("cad") or {},
            quality=state.get("quality") or {},
        )
        return self._finish(
            "quality_rework",
            state,
            {"maintenance_plan": plan, "rework_via": "quality->maintenance"},
        )

    def report(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("report", state)
        result = self.harnesses["report"].execute_agent(state)
        report = _serialize_agent_result(result)
        payload = {"report": report}
        if state.get("entry") == "trigger":
            experience = _serialize_agent_result(self.experience_module.learn({
                "event": state.get("event", {}),
                "diagnosis": state.get("diagnosis", {}),
                "maintenance_plan": state.get("maintenance_plan", {}),
                "workorder": state.get("quality", {}).get("workorder") or state.get("workorder", {}),
                "quality": state.get("quality", {}),
                "report": report,
            }))
            payload["experience"] = experience
            payload["memory"] = {
                "saved": bool(experience.get("memory_saved")),
                "rag_saved": bool(experience.get("rag_saved")),
                "short_backend": self.short_memory.backend,
                "long_backend": self.long_memory.backend,
            }
        return self._finish("report", state, payload)
