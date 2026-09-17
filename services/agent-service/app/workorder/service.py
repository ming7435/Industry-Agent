"""工单业务服务，不属于 Agent。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.validator import MaintenancePlan, WorkOrder

from .validator import WorkOrderValidator


class WorkOrderService:
    """将维修工单动作收敛为可被 API、Graph 和其他 Agent 复用的服务。"""

    def __init__(self, tools: ToolRegistry) -> None:
        self.tools = tools

    def create_from_plan(self, plan: Any) -> WorkOrder:
        payload = plan.model_dump() if isinstance(plan, MaintenancePlan) else dict(plan or {})
        WorkOrderValidator.validate_plan(payload)
        diagnosis = payload.get("diagnosis") or {}
        raw = self.tools.execute("create_workorder", {
            "device_id": str(diagnosis.get("device_id") or payload.get("device_id") or "unknown"),
            "title": "设备维修：%s" % (diagnosis.get("fault") or "设备异常"),
            "plan_id": payload.get("plan_id", ""),
            "steps": payload.get("repair_steps", []),
        })
        return WorkOrder(**raw)

    def create(self, device_id: str, title: str, plan_id: str = "", steps: list[str] | None = None, assignee: str = "") -> dict[str, Any]:
        order = self.tools.execute("create_workorder", {
            "device_id": device_id,
            "title": title,
            "plan_id": plan_id,
            "steps": steps or [],
        })
        if assignee:
            order = self.assign(str(order["workorder_id"]), assignee)
        return order

    def update(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> dict[str, Any]:
        return self.tools.execute("update_workorder", {
            "workorder_id": workorder_id,
            "status": WorkOrderValidator.validate_status(status),
            **fields,
        })

    def get(self, workorder_id: str) -> dict[str, Any]:
        return self.tools.execute("get_workorder", {"workorder_id": workorder_id})

    def list(self, device_id: str = "", status: str = "") -> list[dict[str, Any]]:
        return list(self.tools.execute("list_workorders", {"device_id": device_id, "status": status}).get("items", []))

    def assign(self, workorder_id: str, assignee: str) -> dict[str, Any]:
        return self.tools.execute("assign_workorder", {"workorder_id": workorder_id, "assignee": assignee})

    def submit_repair_feedback(self, workorder_id: str, feedback: str) -> dict[str, Any]:
        return self.tools.execute("submit_repair_feedback", {"workorder_id": workorder_id, "feedback": feedback})

    def mark_repair_completed(self, workorder_id: str, feedback: str = "") -> dict[str, Any]:
        return self.tools.execute("mark_repair_completed", {"workorder_id": workorder_id, "feedback": feedback})

    def close(self, workorder_id: str) -> dict[str, Any]:
        return self.tools.execute("close_workorder", {"workorder_id": workorder_id})

    def reopen(self, workorder_id: str) -> dict[str, Any]:
        return self.tools.execute("reopen_workorder", {"workorder_id": workorder_id})

    def verify_repair(self, workorder_id: str, device_id: str = "") -> dict[str, Any]:
        return self.tools.execute("verify_repair", {"workorder_id": workorder_id, "device_id": device_id})

    def execute_action(self, task: Mapping[str, Any]) -> dict[str, Any] | WorkOrder | None:
        action = str(task.get("action", "create"))
        workorder_id = str(task.get("workorder_id", ""))
        if action in {"query", "get"}:
            raw = self.get(workorder_id)
            return WorkOrder(**raw) if raw.get("found", True) else None
        if action == "update":
            return self.update(workorder_id, str(task.get("status", "in_progress")))
        if action == "close":
            return self.close(workorder_id)
        return self.create_from_plan(task.get("plan") or task)
