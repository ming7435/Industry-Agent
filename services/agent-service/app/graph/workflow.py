"""用户入口和自动异常入口共用的 LangGraph Orchestrator。"""

from __future__ import annotations

from typing import Any, Dict
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from app.agents.diagnosis import DiagnosisAgent
from app.graph.nodes import OrchestratorNodes
from app.graph.state import AgentState
from app.runtime.container import AgentContainer
from app.tools.registry import ToolRegistry


class AgentOrchestrator:
    def __init__(self, diagnosis_agent: DiagnosisAgent | None = None, tools: ToolRegistry | None = None) -> None:
        self.container = AgentContainer(diagnosis_agent=diagnosis_agent, tools=tools)
        self.nodes = OrchestratorNodes(self.container)
        graph = StateGraph(AgentState)
        for name in ("route", "diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "workorder_action", "workorder_query", "memory", "report"):
            graph.add_node(name, getattr(self.nodes, name))
        graph.add_edge(START, "route")
        graph.add_conditional_edges("route", lambda state: state.get("route", "unknown"), {
            "diagnosis": "diagnosis",
            "knowledge": "knowledge",
            "cad": "cad",
            "maintenance": "maintenance",
            "workorder": "workorder",
            "quality": "quality",
            "report": "report",
            "memory": "memory",
            "workorder_action": "workorder_action",
            "workorder_query": "workorder_query",
            "need_more_context": END,
            "unknown": END,
        })
        graph.add_conditional_edges("diagnosis", self._after_diagnosis, {"knowledge": "knowledge", "report": "report"})
        graph.add_conditional_edges("knowledge", self._after_knowledge, {"cad": "cad", "report": "report"})
        graph.add_conditional_edges("cad", self._after_cad, {"maintenance": "maintenance", "report": "report"})
        graph.add_conditional_edges("maintenance", self._after_maintenance, {"workorder": "workorder", "report": "report", "blocked": END})
        graph.add_edge("quality", "report")
        # 自动异常主链路在派单后进入等待维修，关闭工单时再由运行时触发学习和报告。
        graph.add_edge("workorder", END)
        graph.add_edge("workorder_action", END)
        graph.add_edge("workorder_query", END)
        graph.add_edge("report", END)
        self.graph = graph.compile()

    @staticmethod
    def _after_diagnosis(state: AgentState) -> str:
        return "knowledge" if state.get("entry") == "trigger" else "report"

    @staticmethod
    def _after_knowledge(state: AgentState) -> str:
        return "cad" if state.get("entry") == "trigger" else "report"

    @staticmethod
    def _after_cad(state: AgentState) -> str:
        return "maintenance" if state.get("entry") == "trigger" else "report"

    @staticmethod
    def _after_maintenance(state: AgentState) -> str:
        if state.get("status") == "blocked_insufficient_evidence":
            return "blocked"
        return "workorder" if state.get("entry") == "trigger" else "report"

    def run_user(self, user_text: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        return self._execute_graph({"entry": "user", "user_text": user_text, "context": context or {}})

    def run_abnormal_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        return self._execute_graph({"entry": "trigger", "event": dict(event), "user_text": ""})

    def _execute_graph(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        state: AgentState = {
            "task_id": "TASK-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-" + uuid4().hex[:12].upper(),
            "errors": [],
            **payload,
        }
        result = dict(self.graph.invoke(state))
        result["trace"] = self.container.trace.list(
            trace_id=state["trace_id"],
            task_id=state["task_id"],
        )
        return result


def build_orchestrator(diagnosis_agent: DiagnosisAgent | None = None, tools: ToolRegistry | None = None) -> AgentOrchestrator:
    return AgentOrchestrator(diagnosis_agent=diagnosis_agent, tools=tools)
