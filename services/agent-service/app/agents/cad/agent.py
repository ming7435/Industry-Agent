"""CAD/BOM 工程数据分析 Agent。"""

from __future__ import annotations

from typing import Any

from app.tools.registry import ToolRegistry
from app.validator import CADComponent, CADResult


class CADAgent:
    name = "cad"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()

    def query_component(self, query: str, device_id: str = "") -> CADResult:
        raw = self.tools.execute("query_cad", {"query": query, "device_id": device_id})
        return CADResult(
            query=query,
            components=[CADComponent(**item) for item in raw.get("components", [])],
            source=raw.get("source", "cad-mcp-compatible"),
        )

    def query_bom(self, query: str, device_id: str = "") -> CADResult:
        return self.query_component(query, device_id)

    def run(self, task: Any) -> CADResult:
        payload = {"query": task} if isinstance(task, str) else dict(task or {})
        return self.query_component(
            str(payload.get("query") or payload.get("fault") or "主轴组件"),
            str(payload.get("device_id") or ""),
        )
