"""多 Agent 编排节点。"""

from __future__ import annotations

from typing import Any, Dict

from app.a2a import A2AClient, A2AError, CADRequest, CADResponse, KnowledgeRequest, KnowledgeResponse
from app.agents.diagnosis import DiagnosisAgent
from app.agents.registry import build_agent_registry
from app.experience import ExperienceLearningModule
from app.graph.state import AgentState
from app.harness import AgentHarness
from app.memory import build_memory_stores
from app.tools.registry import ToolRegistry
from app.tools.workorder import WorkOrderService
from app.trace import TraceRecorder


def _serialize_agent_result(value: Any) -> Dict[str, Any]:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


class OrchestratorNodes:
    """为七个核心 Agent 创建 Harness，并暴露业务模块节点。"""

    def __init__(self, diagnosis_agent: DiagnosisAgent | None = None, tools: ToolRegistry | None = None) -> None:
        registry = tools or ToolRegistry()
        self.registry = registry
        self.trace = TraceRecorder()
        self.registry.trace = self.trace
        self.a2a = A2AClient()
        self.short_memory, self.long_memory = build_memory_stores()
        self.workorder_service = WorkOrderService(registry)
        self.experience_module = ExperienceLearningModule(
            self.short_memory,
            self.long_memory,
            registry.rag,
            trace=self.trace,
        )
        diagnosis_runtime = diagnosis_agent or DiagnosisAgent(knowledge_provider=self._diagnosis_knowledge_request)
        if getattr(diagnosis_runtime, "knowledge_provider", None) is None:
            diagnosis_runtime.knowledge_provider = self._diagnosis_knowledge_request
        if hasattr(diagnosis_runtime.tools, "trace"):
            diagnosis_runtime.tools.trace = self.trace
        agents = build_agent_registry(tools=registry, diagnosis=diagnosis_runtime)
        self.harnesses = {name: AgentHarness(agent, trace=self.trace) for name, agent in agents.items()}
        self.a2a.register("knowledge", self._knowledge_endpoint)
        self.a2a.register("cad", self._cad_endpoint)

    def trace_records(self) -> list[Dict[str, Any]]:
        return self.trace.list()

    def _node_start(self, name: str, state: AgentState) -> None:
        self.trace.record(type="node", name=name, event="node_started", task_id=state.get("task_id", ""))

    def _finish(self, name: str, state: AgentState, payload: Dict[str, Any]) -> Dict[str, Any]:
        self.trace.record(type="node", name=name, event="node_completed", task_id=state.get("task_id", ""), keys=list(payload))
        return payload

    def _knowledge_endpoint(self, request: KnowledgeRequest) -> KnowledgeResponse:
        result = self.harnesses["knowledge"].execute_agent({
            "query": request.query,
            "limit": request.limit,
            "filters": request.filters,
        })
        payload = _serialize_agent_result(result)
        return KnowledgeResponse(
            request_id=request.request_id,
            task_id=request.task_id,
            from_agent="knowledge",
            to_agent=request.from_agent,
            status=payload.get("status", "completed"),
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
        )

    def _knowledge_request(self, state: AgentState, query: str) -> Dict[str, Any]:
        response = self.a2a.request(
            KnowledgeRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                from_agent="diagnosis",
                to_agent="knowledge",
                query=query,
            ),
            KnowledgeResponse,
        )
        return response.model_dump(mode="json")

    def _cad_endpoint(self, request: CADRequest) -> CADResponse:
        result = self.harnesses["cad"].execute_agent(request.model_dump(mode="json"))
        payload = _serialize_agent_result(result)
        return CADResponse(
            request_id=request.request_id,
            task_id=request.task_id,
            from_agent="cad",
            to_agent=request.from_agent,
            success=payload.get("status") == "completed",
            status=payload.get("status", "insufficient_engineering_data"),
            device_id=payload.get("device_id", request.device_id),
            device_model=payload.get("device_model", request.device_model),
            component=payload.get("component", request.component),
            part_no=payload.get("part_no", request.part_no),
            drawing_refs=payload.get("drawing_refs", []),
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
        )

    def _cad_request(self, state: AgentState, query: str, from_agent: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        values = dict(context or {})
        response = self.a2a.request(
            CADRequest(
                request_id=self.a2a.new_request_id(),
                task_id=state.get("task_id", ""),
                from_agent=from_agent,
                to_agent="cad",
                device_id=str(values.get("device_id") or (state.get("context") or {}).get("device_id") or ""),
                device_model=str(values.get("device_model") or (state.get("context") or {}).get("device_model") or ""),
                component=str(values.get("component") or ""),
                part_no=str(values.get("part_no") or ""),
                query=query,
            ),
            CADResponse,
        )
        return response.result or response.model_dump(mode="json")

    def _diagnosis_knowledge_request(self, event: Dict[str, Any], query: str) -> Dict[str, Any]:
        """Diagnosis Agent 使用的 Knowledge A2A 入口。"""

        task_id = str(event.get("task_id") or "")
        response = self.a2a.request(
            KnowledgeRequest(
                request_id=self.a2a.new_request_id(),
                task_id=task_id,
                from_agent="diagnosis",
                to_agent="knowledge",
                query=query,
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
        result = self.harnesses["diagnosis"].execute_agent(event)
        output = {"diagnosis": _serialize_agent_result(result)}
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
        result = self.harnesses["maintenance"].execute_agent({
            "query": state.get("user_text", ""),
            "user_text": state.get("user_text", ""),
            "device_id": (state.get("context") or {}).get("device_id", ""),
            "diagnosis": state.get("diagnosis", {}),
            "knowledge": state.get("knowledge", {}),
            "cad": cad,
        })
        return self._finish("maintenance", state, {"maintenance_plan": _serialize_agent_result(result)})

    def workorder(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("workorder", state)
        if state.get("route") in {"workorder_action", "workorder_query"} and state.get("entry") != "trigger":
            action = dict(state.get("context") or {})
            action.setdefault("action", "query")
            result = self.workorder_service.execute_action(action)
            order = _serialize_agent_result(result) if result is not None else {}
        else:
            existing = state.get("workorder") or {}
            if state.get("entry") == "trigger" and existing.get("workorder_id"):
                workorder_id = str(existing["workorder_id"])
                self.workorder_service.update(workorder_id, status="in_progress")
                order = self.workorder_service.mark_repair_completed(
                    workorder_id,
                    feedback="自动异常流程已完成现场维修模拟",
                )
            else:
                result = self.workorder_service.create_from_plan(state.get("maintenance_plan", {}))
                order = _serialize_agent_result(result)
            if state.get("entry") == "trigger" and order.get("workorder_id"):
                order = self.workorder_service.get(order["workorder_id"])
        return self._finish("workorder", state, {"workorder": order})

    def quality(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("quality", state)
        order = state.get("workorder", {})
        workorder_id = str(order.get("workorder_id", ""))
        latest = self.workorder_service.get(workorder_id) if workorder_id else order
        result = _serialize_agent_result(self.harnesses["quality"].execute_agent({"workorder": latest}))
        if workorder_id:
            if result.get("passed"):
                latest = self.workorder_service.close(workorder_id)
            else:
                latest = self.workorder_service.reopen(workorder_id)
            result["workorder"] = latest
        return self._finish("quality", state, {"quality": result, "workorder": latest})

    def report(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("report", state)
        result = self.harnesses["report"].execute_agent(state)
        return self._finish("report", state, {"report": _serialize_agent_result(result)})

    def experience(self, state: AgentState) -> Dict[str, Any]:
        self._node_start("experience", state)
        result = self.experience_module.learn({
            "event": state.get("event", {}),
            "diagnosis": state.get("diagnosis", {}),
            "maintenance_plan": state.get("maintenance_plan", {}),
            "workorder": state.get("quality", {}).get("workorder") or state.get("workorder", {}),
            "quality": state.get("quality", {}),
            "report": state.get("report", {}),
        })
        payload = _serialize_agent_result(result)
        return self._finish("experience", state, {
            "experience": payload,
            "memory": {
                "saved": bool(payload.get("memory_saved")),
                "rag_saved": bool(payload.get("rag_saved")),
                "short_backend": self.short_memory.backend,
                "long_backend": self.long_memory.backend,
            },
        })
