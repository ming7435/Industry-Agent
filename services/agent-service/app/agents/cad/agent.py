"""CAD/BOM 工程数据分析 Agent。"""

from __future__ import annotations

from typing import Any

from app.tools.registry import ToolRegistry
from app.contracts import CADResult

from .graph import build_cad_graph
from .schemas import CADQuery


class CADAgent:
    name = "cad"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.graph = build_cad_graph()

    def query_component(self, query: str, device_id: str = "") -> CADResult:
        return self.run({"query": query, "device_id": device_id})

    def query_bom(self, query: str, device_id: str = "") -> CADResult:
        return self.run({"query": query, "device_id": device_id})

    def run(self, task: Any) -> CADResult:
        request = CADQuery.from_payload(task)
        output = self.graph.invoke({"agent": self, "request": request.model_dump(mode="json")})
        result = output.get("result")
        if result is None:
            raise RuntimeError("CAD LangGraph 未生成结果")
        return result
