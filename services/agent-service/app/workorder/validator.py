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
    def verification_passed(order: Mapping[str, Any], repair_feedback: Any = None) -> bool:
        """Return whether an explicit post-repair verification passed.

        Verification is deliberately separate from repair feedback.  Feedback
        describes what the technician did; only a positive verification record
        is allowed to move a completed order through the close and learning
        gates.
        """
        value = order.get("repair_verification")
        if not isinstance(value, Mapping) or not value:
            feedback = repair_feedback if isinstance(repair_feedback, Mapping) else order.get("repair_feedback")
            nested = feedback.get("verification") if isinstance(feedback, Mapping) else None
            value = nested if isinstance(nested, Mapping) else {}
        if value.get("passed") is not True:
            return False
        status = str(value.get("status") or "verified").strip().lower()
        return status not in {"failed", "rejected", "invalid"}

    @classmethod
    def can_close(cls, order: Mapping[str, Any]) -> bool:
        """A completed order may close only after explicit verification."""
        return str(order.get("status") or "") == "completed" and cls.verification_passed(order)

    @staticmethod
    def can_learn(order: Mapping[str, Any], repair_feedback: Any) -> bool:
        """Memory/RAG admission requires close, feedback, and verification."""
        feedback = repair_feedback or order.get("repair_feedback")
        if isinstance(feedback, Mapping):
            valid = any(
                str(feedback.get(key) or "").strip()
                for key in ("feedback", "summary", "result", "content", "repair_feedback")
            )
        else:
            valid = bool(str(feedback or "").strip())
        return order.get("status") == "closed" and valid and WorkOrderValidator.verification_passed(order, feedback)
