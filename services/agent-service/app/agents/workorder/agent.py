"""WorkOrder Agent：只负责编排工单生命周期，不诊断、不制定维修方案、不做质检。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.workorder import WorkOrderService

from .graph import build_workorder_graph
from .schemas import WorkOrderQuery, WorkOrderResult
from .validator import WorkOrderAgentValidator


class WorkOrderAgent:
    name = "workorder"

    def __init__(self, tools: ToolRegistry | None = None, service: WorkOrderService | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.service = service or WorkOrderService(self.tools)
        self.graph = build_workorder_graph()
        # Demo 当前使用进程内幂等；生产多实例部署应迁移到 Redis/DB
        # 唯一键，避免服务重启或横向扩容后重复创建工单。
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

    def collect_dispatch_context(self, plan: Mapping[str, Any], order: Mapping[str, Any], request: Mapping[str, Any] | None = None) -> dict[str, Any]:
        request = request or {}
        device_id = str(order.get("device_id") or plan.get("device_id") or (plan.get("diagnosis") or {}).get("device_id") or "")
        target_part = plan.get("target_part") or plan.get("repair_target") or {}
        component = str((target_part.get("component") or "") if isinstance(target_part, Mapping) else target_part or "")
        priority = WorkOrderAgentValidator.priority(request, plan)
        area = str(order.get("area") or plan.get("area") or request.get("area") or "")
        candidates = self._safe_tool("query_technicians", {"device_id": device_id, "component": component, "priority": priority}).get("items", [])
        enriched: list[dict[str, Any]] = []
        for candidate in candidates:
            item = dict(candidate)
            technician_id = str(item.get("technician_id") or item.get("name") or "")
            skills = self._safe_tool("query_technician_skills", {"technician_id": technician_id}).get("items", [])
            workload = self._safe_tool("query_technician_workload", {"technician_id": technician_id}).get("items", [])
            if skills and isinstance(skills[0], Mapping):
                item["skills"] = list(skills[0].get("skills") or item.get("skills") or [])
            if workload and isinstance(workload[0], Mapping):
                item["workload"] = workload[0].get("workload", item.get("workload", 0))
            enriched.append(item)
        shift = self._safe_tool("query_shift", {"device_id": device_id})
        availability = self._safe_tool("query_team_availability", {"device_id": device_id, "component": component})
        return {
            "device_id": device_id,
            "component": component,
            "area": area,
            "priority": priority,
            "shift": shift,
            "availability": availability,
            "candidates": enriched,
        }

    @staticmethod
    def rank_candidates(context: Mapping[str, Any], request: Mapping[str, Any], plan: Mapping[str, Any]) -> list[dict[str, Any]]:
        availability = context.get("availability") or {}
        shift = context.get("shift") or {}
        current_shift = str(shift.get("shift") or shift.get("name") or "")
        team_available = bool(availability.get("available", True))
        priority = str(context.get("priority") or WorkOrderAgentValidator.priority(request, plan))
        ranked: list[dict[str, Any]] = []
        for candidate in context.get("candidates") or []:
            item = dict(candidate)
            score, reasons = WorkOrderAgentValidator.score_candidate(
                item,
                component=str(context.get("component") or ""),
                area=str(context.get("area") or ""),
                current_shift=current_shift,
                team_available=team_available,
                priority=priority,
            )
            item["dispatch_score"] = score
            item["dispatch_reasons"] = reasons
            ranked.append(item)
        return sorted(ranked, key=lambda item: (-int(item.get("dispatch_score") or 0), int(item.get("workload") or 0), str(item.get("technician_id") or "")))

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
