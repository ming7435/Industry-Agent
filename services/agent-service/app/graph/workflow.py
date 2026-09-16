"""用户入口和自动异常入口共用的 LangGraph Orchestrator。"""

from __future__ import annotations

from typing import Any, Dict
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from app.agents.diagnosis import DiagnosisAgent
from app.graph.nodes import OrchestratorNodes
from app.graph.state import AgentState
from app.tools.registry import ToolRegistry


class AgentOrchestrator:
    def __init__(self, diagnosis_agent: DiagnosisAgent | None = None, tools: ToolRegistry | None = None) -> None:
        self.nodes = OrchestratorNodes(diagnosis_agent=diagnosis_agent, tools=tools)
        graph = StateGraph(AgentState)
        graph.add_node("route", self.nodes.route)
        graph.add_node("diagnosis", self.nodes.diagnosis)
        graph.add_node("knowledge", self.nodes.knowledge)
        graph.add_node("cad", self.nodes.cad)
        graph.add_node("maintenance", self.nodes.maintenance)
        graph.add_node("workorder", self.nodes.workorder)
        graph.add_node("quality", self.nodes.quality)
        graph.add_node("report", self.nodes.report)
        graph.add_node("experience", self.nodes.experience)
        graph.add_edge(START, "route")
        graph.add_conditional_edges("route", lambda state: state.get("route", "unknown"), {
            "diagnosis": "diagnosis", "knowledge": "knowledge", "maintenance": "maintenance",
            "workorder": "workorder", "quality": "quality", "report": "report", "experience": "experience", "unknown": END,
        })
        graph.add_conditional_edges("diagnosis", self._after_diagnosis, {"knowledge": "knowledge", "report": "report"})
        graph.add_conditional_edges("knowledge", self._after_knowledge, {"cad": "cad", "report": "report"})
        graph.add_edge("cad", "maintenance")
        graph.add_edge("maintenance", "workorder")
        graph.add_edge("workorder", "quality")
        graph.add_edge("quality", "report")
        graph.add_conditional_edges("report", self._after_report, {"experience": "experience", "end": END})
        graph.add_edge("experience", END)
        self.graph = graph.compile()

    @staticmethod
    def _after_diagnosis(state: AgentState) -> str:
        return "knowledge" if state.get("entry") == "trigger" else "report"

    @staticmethod
    def _after_knowledge(state: AgentState) -> str:
        return "cad" if state.get("entry") == "trigger" else "report"

    @staticmethod
    def _after_report(state: AgentState) -> str:
        return "experience" if state.get("entry") == "trigger" else "end"

    def run_user(self, user_text: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        return self._execute_graph({"entry": "user", "user_text": user_text, "context": context or {}})

    def run_abnormal_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        return self._execute_graph({"entry": "trigger", "event": dict(event), "user_text": ""})

    def _execute_graph(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """创建一次带任务标识的状态并执行编排图。"""

        state: AgentState = {
            "task_id": "TASK-" + uuid4().hex[:12].upper(),
            "trace_id": "TRACE-" + uuid4().hex[:12].upper(),
            "errors": [],
            **payload,
        }
        result = dict(self.graph.invoke(state))
        # Trace 与业务结果一起返回，方便接口层定位每个 Agent 节点。
        result["trace"] = self.nodes.trace_records()
        return result


def build_orchestrator(diagnosis_agent: DiagnosisAgent | None = None, tools: ToolRegistry | None = None) -> AgentOrchestrator:
    """创建用户提问和自动异常共用的编排器。"""

    return AgentOrchestrator(diagnosis_agent=diagnosis_agent, tools=tools)
