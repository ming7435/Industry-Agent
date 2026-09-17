"""MES 工单 MCP 适配器。

这里保存的是演示环境的本地 MES 适配实现；生产环境可以由 McpClient
通过 MCP_WORKORDER_URL/MCP_MES_URL 转发到真实 MES，而业务层无需改变。
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict
from uuid import uuid4


class WorkOrderMcpAdapter:
    """提供工单工具所需的最小 MES 操作集合。"""

    VALID_STATUSES = {"open", "in_progress", "completed", "closed"}

    def __init__(self) -> None:
        self._orders: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_workorder(
        self,
        device_id: str,
        title: str,
        plan_id: str = "",
        steps: list[str] | None = None,
        **_: Any,
    ) -> Dict[str, Any]:
        now = self._now()
        order = {
            "workorder_id": "WO-" + uuid4().hex[:10].upper(),
            "device_id": device_id,
            "status": "open",
            "title": title,
            "plan_id": plan_id,
            "steps": steps or [],
            "created_at": now,
            "updated_at": now,
        }
        self._orders[order["workorder_id"]] = order
        return dict(order)

    def update_workorder(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> Dict[str, Any]:
        if status not in self.VALID_STATUSES:
            raise ValueError("无效工单状态：%s" % status)
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        order.update(fields)
        order["status"] = status
        order["updated_at"] = self._now()
        return dict(order)

    def get_workorder(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        return dict(order) if order else {"found": False, "workorder_id": workorder_id}

    def list_workorders(self, device_id: str = "", status: str = "", **_: Any) -> Dict[str, Any]:
        values = [
            dict(order)
            for order in self._orders.values()
            if (not device_id or order.get("device_id") == device_id)
            and (not status or order.get("status") == status)
        ]
        return {"items": values, "total": len(values)}

    def assign_workorder(self, workorder_id: str, assignee: str = "", **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        order["assignee"] = assignee
        order["updated_at"] = self._now()
        return dict(order)

    def submit_repair_feedback(self, workorder_id: str, feedback: str = "", **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        order["repair_feedback"] = feedback
        order["updated_at"] = self._now()
        return dict(order)

    def get_repair_feedback(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            return {"found": False, "success": False, "workorder_id": workorder_id, "repair_feedback": "", "complete": False, "source": "mes-mcp"}
        feedback = str(order.get("repair_feedback") or "").strip()
        return {
            "found": True,
            "success": True,
            "workorder_id": workorder_id,
            "repair_feedback": feedback,
            "feedback": feedback,
            "complete": bool(feedback),
            "source": "mes-mcp",
        }

    def mark_repair_completed(self, workorder_id: str, feedback: str = "", **_: Any) -> Dict[str, Any]:
        return self.update_workorder(
            workorder_id,
            status="completed",
            repair_feedback=feedback,
        )

    def close_workorder(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        return self.update_workorder(workorder_id, status="closed")

    def reopen_workorder(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        return self.update_workorder(workorder_id, status="open")

    def verify_repair(self, workorder_id: str, device_id: str = "", **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id, {})
        passed = order.get("status") in {"completed", "closed"}
        return {
            "workorder_id": workorder_id,
            "device_id": device_id or order.get("device_id", ""),
            "passed": passed,
            "device_recovered": passed,
            "alarm_cleared": passed,
            "sop_compliant": True,
            "findings": ["工单状态已完成" if passed else "工单仍未完成"],
        }

    @property
    def orders(self) -> Dict[str, Dict[str, Any]]:
        return {key: dict(value) for key, value in self._orders.items()}
