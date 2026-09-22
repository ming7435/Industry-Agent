"""MES 工单 MCP 适配器。

这里保存的是演示环境的本地 MES 适配实现；生产环境可以由 McpClient
通过 MCP_WORKORDER_URL/MCP_MES_URL 转发到真实 MES，而业务层无需改变。
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Mapping
from uuid import uuid4


class WorkOrderMcpAdapter:
    """提供工单工具所需的最小 MES 操作集合。"""

    VALID_STATUSES = {"open", "in_progress", "completed", "closed", "rejected", "timeout"}

    def __init__(self) -> None:
        self._orders: Dict[str, Dict[str, Any]] = {}
        self._idempotency_index: Dict[str, str] = {}

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_workorder(
        self,
        device_id: str,
        title: str,
        plan_id: str = "",
        steps: list[str] | None = None,
        repair_target: Dict[str, Any] | None = None,
        drawing_context: Dict[str, Any] | None = None,
        alarm_code: str = "",
        diagnosis_context: Dict[str, Any] | None = None,
        priority: str = "normal",
        risk_level: str = "",
        source: str = "",
        idempotency_key: str = "",
        event_id: str = "",
        diagnosis_snapshot: Mapping[str, Any] | None = None,
        maintenance_plan_snapshot: Mapping[str, Any] | None = None,
        **_: Any,
    ) -> Dict[str, Any]:
        key = str(idempotency_key or "").strip()
        if key:
            existing_id = self._idempotency_index.get(key)
            if existing_id and existing_id in self._orders:
                return dict(self._orders[existing_id])
        now = self._now()
        order = {
            "workorder_id": "WO-" + uuid4().hex[:10].upper(),
            "device_id": device_id,
            "status": "open",
            "title": title,
            "plan_id": plan_id,
            "steps": steps or [],
            "repair_target": dict(repair_target or {}),
            "drawing_context": dict(drawing_context or {}),
            "alarm_code": alarm_code,
            "diagnosis_context": dict(diagnosis_context or {}),
            "repair_feedback": {},
            "repair_verification": {},
            "status_history": [],
            "events": [],
            "priority": priority or "normal",
            "risk_level": risk_level,
            "source": source,
            "idempotency_key": key,
            "event_id": str(event_id or ""),
            "diagnosis_snapshot": dict(diagnosis_snapshot or {}),
            "maintenance_plan_snapshot": dict(maintenance_plan_snapshot or {}),
            "created_at": now,
            "updated_at": now,
        }
        self._orders[order["workorder_id"]] = order
        if key:
            self._idempotency_index[key] = order["workorder_id"]
        self._record_event(order, "created", "", "open", {})
        return dict(order)

    def update_workorder(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> Dict[str, Any]:
        if status not in self.VALID_STATUSES:
            raise ValueError("无效工单状态：%s" % status)
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        previous_status = str(order.get("status") or "")
        order.update(fields)
        order["status"] = status
        order["updated_at"] = self._now()
        if status == "in_progress" and not order.get("started_at"):
            order["started_at"] = order["updated_at"]
        if status == "completed":
            order["completed_at"] = order["updated_at"]
        if status == "closed":
            order["closed_at"] = order["updated_at"]
        if status != previous_status or fields:
            self._record_event(order, "status_changed" if status != previous_status else "updated", previous_status, status, fields)
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
        previous = str(order.get("assignee") or "")
        order["assignee"] = assignee
        order["updated_at"] = self._now()
        self._record_event(order, "assigned", str(order.get("status") or ""), str(order.get("status") or ""), {"from": previous, "to": assignee})
        return dict(order)

    def submit_repair_feedback(self, workorder_id: str, feedback: Any = "", **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        normalized = self._normalize_feedback(feedback)
        order["repair_feedback"] = normalized
        order["updated_at"] = self._now()
        self._record_event(order, "repair_feedback_submitted", str(order.get("status") or ""), str(order.get("status") or ""), normalized)
        return dict(order)

    def get_repair_feedback(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            return {"found": False, "success": False, "workorder_id": workorder_id, "repair_feedback": "", "complete": False, "source": "mes-mcp"}
        feedback = self._normalize_feedback(order.get("repair_feedback"))
        return {
            "found": True,
            "success": True,
            "workorder_id": workorder_id,
            "repair_feedback": feedback,
            "feedback": feedback.get("feedback", ""),
            "complete": bool(feedback.get("feedback") or feedback.get("summary") or feedback.get("result")),
            "source": "mes-mcp",
        }

    def mark_repair_completed(self, workorder_id: str, feedback: Any = "", repair_verification: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        normalized = self._normalize_feedback(feedback) if feedback else self._normalize_feedback(order.get("repair_feedback"))
        verification = dict(repair_verification or {})
        verification.setdefault("passed", True)
        verification.setdefault("status", "verified")
        verification.setdefault("feedback", normalized.get("feedback") or normalized.get("summary") or normalized.get("result") or "")
        verification.setdefault("operator", normalized.get("operator") or "")
        verification.setdefault("duration_seconds", normalized.get("duration_seconds"))
        verification.setdefault("verified_at", self._now())
        return self.update_workorder(
            workorder_id,
            status="completed",
            repair_feedback=normalized,
            repair_verification=verification,
        )

    def close_workorder(self, workorder_id: str, reason: str = "", **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        if str(order.get("status") or "") != "completed":
            raise ValueError("工单必须先完成维修（completed）后才能关闭")
        return self.update_workorder(workorder_id, status="closed", closure_reason=reason)

    def reopen_workorder(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        return self.update_workorder(workorder_id, status="open")

    @staticmethod
    def _normalize_feedback(feedback: Any) -> Dict[str, Any]:
        if isinstance(feedback, Mapping):
            return {str(key): value for key, value in feedback.items()}
        value = str(feedback or "").strip()
        return {"feedback": value} if value else {}

    def _record_event(
        self,
        order: Dict[str, Any],
        action: str,
        from_status: str,
        to_status: str,
        payload: Mapping[str, Any],
    ) -> None:
        event = {
            "event_id": "WO-EVT-" + uuid4().hex[:12].upper(),
            "workorder_id": order["workorder_id"],
            "action": action,
            "from_status": from_status,
            "to_status": to_status,
            "payload": dict(payload or {}),
            "created_at": self._now(),
        }
        order.setdefault("events", []).append(event)
        order.setdefault("status_history", []).append(event)

    def query_technicians(self, device_id: str = "", component: str = "", priority: str = "", **_: Any) -> Dict[str, Any]:
        items = [
            {"technician_id": "TECH-001", "name": "张工", "skills": ["主轴", "电气", "冷却系统"], "area": "A区", "shift": "白班", "workload": 1, "available": True},
            {"technician_id": "TECH-002", "name": "李工", "skills": ["机械", "轴承", "振动"], "area": "B区", "shift": "白班", "workload": 2, "available": True},
            {"technician_id": "TECH-003", "name": "王工", "skills": ["PLC", "伺服", "报警诊断"], "area": "A区", "shift": "白班", "workload": 0, "available": True},
        ]
        if component:
            matched = [item for item in items if any(str(component).lower() in str(skill).lower() or str(skill).lower() in str(component).lower() for skill in item["skills"])]
            if matched:
                items = matched + [item for item in items if item not in matched]
        items.sort(key=lambda item: (not item["available"], item["workload"]))
        return {"success": True, "items": items, "total": len(items), "device_id": device_id, "priority": priority}

    def query_technician_skills(self, technician_id: str = "", **_: Any) -> Dict[str, Any]:
        items = self.query_technicians()["items"]
        return {"success": True, "items": [{"technician_id": item["technician_id"], "skills": item["skills"]} for item in items if not technician_id or item["technician_id"] == technician_id]}

    def query_technician_workload(self, technician_id: str = "", **_: Any) -> Dict[str, Any]:
        items = self.query_technicians()["items"]
        return {"success": True, "items": [{"technician_id": item["technician_id"], "workload": item["workload"]} for item in items if not technician_id or item["technician_id"] == technician_id]}

    def query_shift(self, **_: Any) -> Dict[str, Any]:
        return {"success": True, "shift": "白班", "start": "08:00", "end": "20:00"}

    def query_team_availability(self, **_: Any) -> Dict[str, Any]:
        return {"success": True, "available": True, "team": "设备维修一组", "available_count": 3}

    @property
    def orders(self) -> Dict[str, Dict[str, Any]]:
        return {key: dict(value) for key, value in self._orders.items()}
