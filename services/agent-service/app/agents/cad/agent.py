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

    def production_modeling(self, **options: Any) -> Any:
        """原建模 API 和有界队列复用本 Agent 的真实建模图分支。"""
        from .modeling_service import CADModelingService

        return CADModelingService(agent=self, **options)

    def run_modeling(self, design_id: str, service: Any, request: Any) -> dict[str, Any]:
        """已登记任务进入图；不能从用户正文构造可信工具作用域。"""
        from uuid import uuid4
        from app.tools.cad.generate_3d_model import modeling_task_scope

        saved_request = service.get(design_id)["request"]
        context = {"agent": "cad", "node": "model_3d", "run_type": "cad_modeling",
            "agent_run_id": "AGENT-RUN-" + uuid4().hex}
        with modeling_task_scope(service, design_id, request), self.tools.trace_context(
            task_id=design_id, trace_id=design_id, context=context,
        ):
            output = self.graph.invoke({
                "agent": self, "operation": "production_modeling",
                "request": {**saved_request, "design_id": design_id, "task_id": design_id,
                    "trace_id": design_id, "operation": "production_modeling"},
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
