"""CAD/BOM 工程数据分析 Agent。"""

from __future__ import annotations

from typing import Any

from app.tools.registry import ToolRegistry
from app.contracts import CADResult
from app.agents.base import BaseAgent

from .graph import build_cad_graph
from .schemas import CADQuery


class CADAgent(BaseAgent):
    name = "cad"
    capabilities = ("bom_query", "drawing_search", "component_relation")

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.graph = build_cad_graph()

    def query_component(self, query: str, device_id: str = "") -> CADResult:
        return self.run({"query": query, "device_id": device_id})

    def query_bom(self, query: str, device_id: str = "") -> CADResult:
        return self.run({"query": query, "device_id": device_id})

    def run_buildcad(self, prompt: str, *, run_id: str, client: Any, model: Any = None,
                     action: str = "preview", design_id: str = "") -> dict[str, Any]:
        """只进入一个建模节点；远程能力由已授权的 MCP 连接提供。"""
        context = {"agent": "cad", "node": "model_3d", "run_type": "cad_modeling", "agent_run_id": run_id}
        with self.tools.trace_context(task_id=run_id, trace_id=run_id, context=context):
            output = self.graph.invoke({
                "agent": self, "operation": "production_modeling",
                "buildcad_client": client, "model_client": model,
                "request": {"prompt": prompt, "task_id": run_id, "trace_id": run_id,
                    "operation": "production_modeling", "action": action, "design_id": design_id},
            })
        result = output.get("result")
        if not isinstance(result, dict):
            raise RuntimeError("CAD 建模节点未生成结构化结果")
        return {**result, "execution": {**output.get("modeling_execution", {}),
            "step_history": list(output.get("step_history") or [])}}

    def run_freecad(self, prompt: str, *, run_id: str, client: Any,
                    model: Any = None, spec: dict[str, Any] | None = None) -> dict[str, Any]:
        """本地建模复用 CAD 图、建模节点及技能工具调度。"""
        context = {"agent": "cad", "node": "model_3d", "run_type": "cad_modeling", "agent_run_id": run_id}
        with self.tools.trace_context(task_id=run_id, trace_id=run_id, context=context):
            output = self.graph.invoke({
                "agent": self, "operation": "production_modeling",
                "freecad_client": client, "model_client": model,
                "request": {"prompt": prompt, "task_id": run_id, "trace_id": run_id,
                    "operation": "production_modeling", "provider": "freecad", "spec": spec},
            })
        result = output.get("result")
        if not isinstance(result, dict):
            raise RuntimeError("CAD 建模节点未生成结构化结果")
        return {**result, "execution": {**output.get("modeling_execution", {}),
            "step_history": list(output.get("step_history") or [])}}

    def run(self, task: Any) -> CADResult:
        request = CADQuery.from_payload(task)
        output = self.graph.invoke({"agent": self, "request": request.model_dump(mode="json")})
        result = output.get("result")
        if result is None:
            raise RuntimeError("CAD LangGraph 未生成结果")
        return result
