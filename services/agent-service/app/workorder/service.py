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
        alarm_code = str(
            diagnosis.get("alarm_code")
            or payload.get("alarm_code")
            or ""
        )
        raw = self.tools.execute("create_workorder", {
            "device_id": str(diagnosis.get("device_id") or payload.get("device_id") or "unknown"),
            "title": str(payload.get("title") or "设备维修：%s" % (diagnosis.get("fault") or "设备异常")),
            "plan_id": payload.get("plan_id", ""),
            "steps": payload.get("repair_steps", []),
            "repair_target": dict(payload.get("target_part") or payload.get("repair_target_detail") or {}),
            "drawing_context": self._drawing_context(payload.get("engineering_context") or {}),
            "alarm_code": alarm_code,
            "diagnosis_context": {
                "summary": diagnosis.get("summary", ""),
                "diagnosis": diagnosis.get("diagnosis") or diagnosis.get("fault", ""),
                "recommendation": diagnosis.get("recommendation", ""),
            },
        })
        return WorkOrder(**raw)

    def create(self, device_id: str, title: str, plan_id: str = "", steps: list[str] | None = None, assignee: str = "", repair_target: Mapping[str, Any] | None = None, drawing_context: Mapping[str, Any] | None = None, alarm_code: str = "", diagnosis_context: Mapping[str, Any] | None = None) -> dict[str, Any]:
        order = self.tools.execute("create_workorder", {
            "device_id": device_id,
            "title": title,
            "plan_id": plan_id,
            "steps": steps or [],
            "repair_target": dict(repair_target or {}),
            "drawing_context": dict(drawing_context or {}),
            "alarm_code": alarm_code,
            "diagnosis_context": dict(diagnosis_context or {}),
        })
        if assignee:
            order = self.assign(str(order["workorder_id"]), assignee)
        return order

    @staticmethod
    def _drawing_context(engineering_context: Mapping[str, Any]) -> dict[str, str]:
        context = dict(engineering_context or {})
        nested_context = context.get("drawing_context")
        if isinstance(nested_context, Mapping):
            context = {**dict(nested_context), **context}
        viewer = dict(context.get("viewer_context") or {})
        refs = list(context.get("drawing_ref_details") or context.get("drawing_refs") or [])
        first = refs[0] if refs else {}
        drawing_url = str(context.get("drawing_url") or "")
        if not drawing_url and isinstance(first, Mapping):
            drawing_url = str(first.get("drawing_url") or "")
        return {
            "drawing_url": drawing_url,
            "model_url": str(context.get("model_url") or viewer.get("model_url") or ""),
            "mesh_name": str(context.get("mesh_name") or viewer.get("mesh_name") or ""),
            "location": str(context.get("location") or viewer.get("location") or ""),
        }

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

    def execute_action(self, task: Mapping[str, Any]) -> dict[str, Any] | WorkOrder | None:
        action = str(task.get("action") or "create")
        workorder_id = str(task.get("workorder_id", ""))
        if action in {"query", "get"}:
            if not workorder_id:
                return {"items": self.list(device_id=str(task.get("device_id") or ""), status=str(task.get("status") or ""))}
            raw = self.get(workorder_id)
            return WorkOrder(**raw) if raw.get("found", True) else None
        if action == "assign":
            return self.assign(workorder_id, str(task.get("assignee") or ""))
        if action == "update":
            return self.update(workorder_id, str(task.get("status", "in_progress")), assignee=str(task.get("assignee") or ""))
        if action == "submit_feedback":
            feedback = task.get("repair_feedback")
            return self.submit_repair_feedback(workorder_id, str(feedback.get("feedback") if isinstance(feedback, Mapping) else feedback or ""))
        if action == "mark_repair_completed":
            feedback = task.get("repair_feedback")
            return self.mark_repair_completed(workorder_id, str(feedback.get("feedback") if isinstance(feedback, Mapping) else feedback or ""))
        if action == "close":
            return self.close(workorder_id)
        if action == "reopen":
            return self.reopen(workorder_id)
        return self.create_from_plan(task.get("maintenance_plan") or task.get("plan") or task)
