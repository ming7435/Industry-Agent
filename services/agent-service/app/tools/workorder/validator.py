"""工单业务输入和状态校验。"""

from __future__ import annotations

from typing import Any, Mapping


class WorkOrderValidator:
    VALID_STATUSES = {"open", "in_progress", "completed", "closed"}

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
    def can_learn(order: Mapping[str, Any], quality: Mapping[str, Any]) -> bool:
        return order.get("status") == "closed" and bool(quality.get("passed"))
