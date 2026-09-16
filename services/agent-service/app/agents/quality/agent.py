"""维修质量验证 Agent。"""

from __future__ import annotations

from typing import Any

from app.tools.registry import ToolRegistry
from app.validator import QualityResult


class QualityAgent:
    name = "quality"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()

    def verify_repair(self, workorder_id: str, device_id: str = "") -> QualityResult:
        raw = self.tools.execute("verify_repair", {"workorder_id": workorder_id, "device_id": device_id})
        return QualityResult(**raw)

    def run(self, task: Any) -> QualityResult:
        payload = dict(task or {})
        order = payload.get("workorder") or payload
        return self.verify_repair(str(order.get("workorder_id", "")), str(order.get("device_id", "")))
