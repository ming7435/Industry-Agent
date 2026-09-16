"""MES 工单 Agent。"""

from __future__ import annotations

from typing import Any

from app.tools.registry import ToolRegistry
from app.validator import MaintenancePlan, WorkOrder


class WorkOrderAgent:
    name = "workorder"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()

    def create(self, plan: Any) -> WorkOrder:
        payload = plan.model_dump() if isinstance(plan, MaintenancePlan) else dict(plan or {})
        diagnosis = payload.get("diagnosis") or {}
        device_id = str(diagnosis.get("device_id") or payload.get("device_id") or "unknown")
        raw = self.tools.execute("create_workorder", {
            "device_id": device_id,
            "title": "设备维修：%s" % (diagnosis.get("fault") or "设备异常"),
            "plan_id": payload.get("plan_id", ""),
            "steps": payload.get("repair_steps", []),
        })
        return WorkOrder(**raw)

    def update(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> WorkOrder:
        return WorkOrder(**self.tools.execute("update_workorder", {"workorder_id": workorder_id, "status": status, **fields}))

    def query(self, workorder_id: str) -> WorkOrder | None:
        raw = self.tools.execute("query_workorder", {"workorder_id": workorder_id})
        return WorkOrder(**raw) if raw.get("found", True) else None

    def close(self, workorder_id: str) -> WorkOrder:
        return WorkOrder(**self.tools.execute("close_workorder", {"workorder_id": workorder_id}))

    def run(self, task: Any) -> WorkOrder | None:
        payload = dict(task or {})
        action = payload.get("action", "create")
        if action == "query":
            return self.query(str(payload["workorder_id"]))
        if action == "update":
            return self.update(str(payload["workorder_id"]), str(payload.get("status", "in_progress")))
        if action == "close":
            return self.close(str(payload["workorder_id"]))
        return self.create(payload.get("plan") or payload)
