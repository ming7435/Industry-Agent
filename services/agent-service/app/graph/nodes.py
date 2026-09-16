"""多 Agent 编排节点。"""

from __future__ import annotations

from typing import Any, Dict

from app.a2a import A2AClient, A2AError, KnowledgeRequest, KnowledgeResponse
from app.agents.cad import CADAgent
from app.agents.diagnosis import DiagnosisAgent
from app.agents.experience import ExperienceAgent
from app.agents.knowledge import KnowledgeAgent
from app.agents.maintenance import MaintenanceAgent
from app.agents.quality import QualityAgent
from app.agents.report import ReportAgent
from app.agents.router import RouterAgent
from app.agents.workorder import WorkOrderAgent
from app.harness import AgentHarness
from app.graph.state import AgentState
from app.memory import build_memory_stores
from app.memory.experience import ExperienceExtractor
from app.tools.registry import ToolRegistry
from app.trace import TraceRecorder


def _serialize_agent_result(value: Any) -> Dict[str, Any]:
    """将 Agent 的 Pydantic、数据类或字典结果统一序列化。"""

    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


class OrchestratorNodes:
    """为每个 Agent 创建独立 Harness，统一执行和错误边界。"""

    def __init__(self, diagnosis_agent: DiagnosisAgent | None = None, tools: ToolRegistry | None = None) -> None:
        registry = tools or ToolRegistry()
        self.registry = registry
        self.trace = TraceRecorder()
        self.registry.trace = self.trace
        self.a2a = A2AClient()
        self.short_memory, self.long_memory = build_memory_stores()
        self.experience_extractor = ExperienceExtractor()
        diagnosis_runtime = diagnosis_agent or DiagnosisAgent()
        if hasattr(diagnosis_runtime.tools, "trace"):
            diagnosis_runtime.tools.trace = self.trace
        self.harnesses = {
            "router": AgentHarness(RouterAgent(), trace=self.trace),
            "diagnosis": AgentHarness(diagnosis_runtime, trace=self.trace),
            "knowledge": AgentHarness(KnowledgeAgent(registry), trace=self.trace),
            "cad": AgentHarness(CADAgent(registry), trace=self.trace),
            "maintenance": AgentHarness(MaintenanceAgent(), trace=self.trace),
            "workorder": AgentHarness(WorkOrderAgent(registry), trace=self.trace),
            "quality": AgentHarness(QualityAgent(registry), trace=self.trace),
            "report": AgentHarness(ReportAgent(), trace=self.trace),
            "experience": AgentHarness(
                ExperienceAgent(self.short_memory, self.long_memory, registry.rag),
                trace=self.trace,
            ),
        }
        self.a2a.register("knowledge", self._knowledge_endpoint)

    def trace_records(self) -> list[Dict[str, Any]]:
        return self.trace.list()

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
            documents=payload.get("documents", []),
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

    def route(self, state: AgentState) -> Dict[str, Any]:
        """根据入口类型确定首个业务 Agent；自动异常固定进入诊断。"""

        if state.get("entry") == "trigger":
            return {"route": "diagnosis", "route_result": {"intent": "diagnosis", "target_agent": "diagnosis", "confidence": 1.0, "reason": "设备异常自动触发"}}
        result = self.harnesses["router"].execute_agent(state.get("user_text", ""))
        return {"route": result.intent, "route_result": _serialize_agent_result(result)}

    def diagnosis(self, state: AgentState) -> Dict[str, Any]:
        """执行诊断并在自动异常场景通过 A2A 请求知识证据。"""

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
            query = str(diagnosis.get("diagnosis") or diagnosis.get("summary") or "设备故障维修")
            try:
                output["knowledge"] = self._knowledge_request(state, query)
            except A2AError as error:
                output["errors"] = [str(error)]
        return output

    def knowledge(self, state: AgentState) -> Dict[str, Any]:
        diagnosis = state.get("diagnosis") or {}
        query = str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or state.get("user_text") or "工业设备维修")
        return {"knowledge": self._knowledge_request(state, query)}

    def cad(self, state: AgentState) -> Dict[str, Any]:
        diagnosis = state.get("diagnosis") or {}
        result = self.harnesses["cad"].execute_agent({
            "query": diagnosis.get("fault") or diagnosis.get("summary") or "主轴组件",
            "device_id": diagnosis.get("device_id", ""),
        })
        return {"cad": _serialize_agent_result(result)}

    def maintenance(self, state: AgentState) -> Dict[str, Any]:
        result = self.harnesses["maintenance"].execute_agent({
            "diagnosis": state.get("diagnosis", {}),
            "knowledge": state.get("knowledge", {}),
            "cad": state.get("cad", {}),
        })
        return {"maintenance_plan": _serialize_agent_result(result)}

    def workorder(self, state: AgentState) -> Dict[str, Any]:
        """创建工单；自动异常流程额外模拟执行并完成工单。"""

        result = self.harnesses["workorder"].execute_agent({"plan": state.get("maintenance_plan", {})})
        order = _serialize_agent_result(result)
        if state.get("entry") == "trigger" and order.get("workorder_id"):
            self.registry.update_workorder(order["workorder_id"], status="in_progress")
            order = self.registry.update_workorder(
                order["workorder_id"],
                status="completed",
                execution_mode="local_simulation",
            )
        return {"workorder": order}

    def quality(self, state: AgentState) -> Dict[str, Any]:
        order = state.get("workorder", {})
        workorder_id = str(order.get("workorder_id", ""))
        latest = self.registry.query_workorder(workorder_id) if workorder_id else order
        result = self.harnesses["quality"].execute_agent({"workorder": latest})
        return {"quality": _serialize_agent_result(result)}

    def report(self, state: AgentState) -> Dict[str, Any]:
        result = self.harnesses["report"].execute_agent(state)
        return {"report": _serialize_agent_result(result)}

    def experience(self, state: AgentState) -> Dict[str, Any]:
        result = self.harnesses["experience"].execute_agent({
            "event": state.get("event", {}),
            "diagnosis": state.get("diagnosis", {}),
            "maintenance_plan": state.get("maintenance_plan", {}),
            "workorder": state.get("workorder", {}),
            "quality": state.get("quality", {}),
            "report": state.get("report", {}),
        })
        payload = _serialize_agent_result(result)
        return {
            "experience": payload,
            "memory": {
                "saved": bool(payload.get("memory_saved")),
                "rag_saved": bool(payload.get("rag_saved")),
                "short_backend": self.short_memory.backend,
                "long_backend": self.long_memory.backend,
            },
        }
