"""WorkOrder Agent：只负责编排工单生命周期，不诊断、不制定维修方案、不做质检。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.workorder import WorkOrderService
from app.agents.base import BaseAgent

from .graph import build_workorder_graph
from .schemas import WorkOrderQuery, WorkOrderResult
from .validator import WorkOrderAgentValidator


class WorkOrderAgent(BaseAgent):
    name = "workorder"
    capabilities = ("workorder_create", "workorder_query", "workorder_update")

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
        if not key or key not in self._idempotency:
            return None
        # 缓存仅存定位，不用创建时未派工的旧快照覆盖数据库中的实际负责人。
        cached = self._idempotency[key]
        return self.service.get(cached['workorder_id'])

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
        directory = self._safe_tool("query_technicians", {"device_id": device_id, "component": component, "priority": priority})
        if directory.get('success') is False or not isinstance(directory.get('items'), list):
            return {'device_id': device_id, 'candidates': [],
                    'personnel_query_error': '对应设备负责人员查询失败，请稍后重试'}
        candidates = directory['items']
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
        device_id = str(context.get('device_id') or '')
        candidates = [dict(item) for item in context.get('candidates') or []
                      if device_id and item.get('technician_id') and item.get('registered') is True
                      and item.get('available') is True and item.get('online') is True
                      and item.get('primary_device_id') == device_id]
        for item in candidates:
            item['dispatch_score'] = 100
            item['dispatch_reasons'] = ['该设备已登录且可用的登记负责人']
        return sorted(candidates, key=lambda item: (int(item.get('workload') or 0), str(item['technician_id'])))

    def execute_action(self, request: Mapping[str, Any]) -> Any:
        return self.service.execute_action(request)

    def _safe_tool(self, name: str, arguments: Mapping[str, Any]) -> dict[str, Any]:
        try:
            return self.tools.execute(name, arguments)
        except Exception as error:
            return {"items": [], "success": False, "error": str(error)}
