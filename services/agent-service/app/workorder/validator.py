"""工单业务输入和状态校验。"""

from __future__ import annotations

from typing import Any, Mapping


class WorkOrderValidator:
    VALID_STATUSES = {"open", "in_progress", "completed", "closed", "rejected", "timeout"}

    @classmethod
    def validate_status(cls, status: str) -> str:
        value = str(status or "").strip()
        if value not in cls.VALID_STATUSES:
            raise ValueError("无效工单状态：%s" % value)
        return value

    @staticmethod
    def validate_plan(plan: Mapping[str, Any]) -> None:
        if not isinstance(plan, Mapping):
            raise TypeError("维修计划必须是对象")
        if not (plan.get("device_id") or (plan.get("diagnosis") or {}).get("device_id")):
            raise ValueError("维修计划缺少 device_id")

    @staticmethod
    def can_learn(order: Mapping[str, Any], repair_feedback: Any) -> bool:
        """经验沉淀只依赖已关闭工单和有效维修反馈。"""
        feedback = repair_feedback or order.get("repair_feedback")
        if isinstance(feedback, Mapping):
            valid = any(
                str(feedback.get(key) or "").strip()
                for key in ("feedback", "summary", "result", "content", "repair_feedback")
            )
        else:
            valid = bool(str(feedback or "").strip())
        return order.get("status") == "closed" and valid
