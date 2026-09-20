"""WorkOrder Agent：只负责编排工单生命周期，不诊断、不制定维修方案、不做质检。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.workorder import WorkOrderService

from .graph import build_workorder_graph
from .schemas import WorkOrderQuery, WorkOrderResult


class WorkOrderAgent:
    name = "workorder"

    def __init__(self, tools: ToolRegistry | None = None, service: WorkOrderService | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.service = service or WorkOrderService(self.tools)
        self.graph = build_workorder_graph()
        self._idempotency: dict[str, dict[str, Any]] = {}

    def run(self, task: Any) -> WorkOrderResult:
        output = self.graph.invoke({"agent": self, "request": task if isinstance(task, Mapping) else {"action": "query", "workorder_id": str(task or "")}})
        result = output.get("result")
        if result is None:
            raise RuntimeError("WorkOrder LangGraph 未生成结果")
        return result

    @staticmethod
    def normalize_request(payload: Any) -> dict[str, Any]:
        return WorkOrderQuery.from_payload(payload).model_dump(mode="json")

    def find_idempotent(self, request: Mapping[str, Any]) -> dict[str, Any] | None:
        key = str(request.get("idempotency_key") or "")
        return dict(self._idempotency[key]) if key and key in self._idempotency else None

    def remember_idempotent(self, request: Mapping[str, Any], order: Mapping[str, Any]) -> None:
        key = str(request.get("idempotency_key") or "")
        if key and order.get("workorder_id"):
            self._idempotency[key] = dict(order)

    def collect_dispatch_context(self, plan: Mapping[str, Any], order: Mapping[str, Any]) -> dict[str, Any]:
        device_id = str(order.get("device_id") or plan.get("device_id") or (plan.get("diagnosis") or {}).get("device_id") or "")
        component = str((plan.get("target_part") or {}).get("component") or plan.get("repair_target") or "")
        candidates = self._safe_tool("query_technicians", {"device_id": device_id, "component": component, "priority": ""}).get("items", [])
        shift = self._safe_tool("query_shift", {"device_id": device_id})
        availability = self._safe_tool("query_team_availability", {"device_id": device_id, "component": component})
        return {"device_id": device_id, "component": component, "shift": shift, "availability": availability, "candidates": candidates}

    def execute_action(self, request: Mapping[str, Any]) -> Any:
        action = str(request.get("action") or "query")
        workorder_id = str(request.get("workorder_id") or "")
        if action in {"query", "get"}:
            return self.service.get(workorder_id) if workorder_id else {"items": self.service.list(device_id=str(request.get("device_id") or ""), status=str(request.get("status") or ""))}
        if action == "assign":
            return self.service.assign(workorder_id, str(request.get("assignee") or ""))
        if action == "update":
            return self.service.update(workorder_id, str(request.get("status") or "in_progress"), assignee=str(request.get("assignee") or ""))
        if action == "submit_feedback":
            feedback = request.get("repair_feedback")
            return self.service.submit_repair_feedback(workorder_id, str(feedback.get("feedback") if isinstance(feedback, Mapping) else feedback or ""))
        if action == "mark_repair_completed":
            feedback = request.get("repair_feedback")
            return self.service.mark_repair_completed(workorder_id, str(feedback.get("feedback") if isinstance(feedback, Mapping) else feedback or ""))
        if action == "close":
            return self.service.close(workorder_id)
        if action == "reopen":
            return self.service.reopen(workorder_id)
        return self.service.create_from_plan(request.get("maintenance_plan") or request.get("plan") or request)

    def _safe_tool(self, name: str, arguments: Mapping[str, Any]) -> dict[str, Any]:
        try:
            return self.tools.execute(name, arguments)
        except Exception as error:
            return {"items": [], "success": False, "error": str(error)}
