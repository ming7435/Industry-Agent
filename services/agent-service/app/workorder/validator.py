"""工单业务输入和状态校验。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

from .policy import maintenance_decision


class WorkOrderValidator:
    VALID_STATUSES = {"open", "in_progress", "awaiting_verification", "completed", "closed", "rejected", "timeout"}
    STATUS_TRANSITIONS = {
        "open": {"open", "in_progress", "rejected", "timeout"},
        "in_progress": {"in_progress", "awaiting_verification", "rejected", "timeout"},
        "awaiting_verification": {"awaiting_verification", "completed", "in_progress"},
        "completed": {"completed", "closed", "in_progress"},
        "closed": {"closed", "open"},
        "rejected": {"rejected", "open"},
        "timeout": {"timeout", "open"},
    }

    @classmethod
    def validate_status(cls, status: str) -> str:
        value = str(status or "").strip()
        if value not in cls.VALID_STATUSES:
            raise ValueError("无效工单状态：%s" % value)
        return value

    @classmethod
    def validate_transition(cls, previous: str, target: str) -> tuple[str, str]:
        previous_value = cls.validate_status(previous)
        target_value = cls.validate_status(target)
        if target_value not in cls.STATUS_TRANSITIONS.get(previous_value, set()):
            raise ValueError("非法工单状态迁移：%s -> %s" % (previous_value, target_value))
        return previous_value, target_value

    @staticmethod
    def maintenance_required(plan: Mapping[str, Any]) -> bool:
        required, _ = maintenance_decision(
            diagnosis=plan.get("diagnosis") if isinstance(plan.get("diagnosis"), Mapping) else {},
            event=plan.get("event") if isinstance(plan.get("event"), Mapping) else {},
            plan=plan,
        )
        return required

    @staticmethod
    def validate_plan(plan: Mapping[str, Any]) -> None:
        if not isinstance(plan, Mapping):
            raise TypeError("维修计划必须是对象")
        if not (plan.get("device_id") or (plan.get("diagnosis") or {}).get("device_id")):
            raise ValueError("维修计划缺少 device_id")

    @staticmethod
    def verification_passed(order: Mapping[str, Any], repair_feedback: Any = None) -> bool:
        """判断维修后的明确验证是否通过。

        维修反馈与维修验证分别记录：反馈描述技术人员完成的工作；
        只有验证结果明确为通过，已完成的工单才能进入关闭和学习环节。
        """
        value = order.get("repair_verification")
        if not isinstance(value, Mapping) or not value:
            feedback = repair_feedback if isinstance(repair_feedback, Mapping) else order.get("repair_feedback")
            nested = feedback.get("verification") if isinstance(feedback, Mapping) else None
            value = nested if isinstance(nested, Mapping) else {}
        if value.get("passed") is not True or value.get("source") != "device_recovery":
            return False
        recovery = value.get("device_recovery")
        checks = value.get("checks")
        if not isinstance(recovery, Mapping) or not isinstance(checks, Mapping):
            return False
        required_checks = ("device_identity", "operational", "alarms_clear", "metrics_available")
        if any(checks.get(key) is not True for key in required_checks):
            return False
        if not _recovery_is_fresh(recovery):
            return False
        status = str(value.get("status") or "verified").strip().lower()
        return status not in {"failed", "rejected", "invalid"}

    @classmethod
    def build_repair_verification(
        cls,
        order: Mapping[str, Any],
        device_recovery: Mapping[str, Any] | None,
        feedback: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """根据设备实时恢复快照生成维修验证，不接受客户端 passed=true 作为证据。"""

        recovery = dict(device_recovery or {})
        expected_device = str(order.get("device_id") or "")
        actual_device = str(recovery.get("device_id") or "")
        status = str(recovery.get("status") or recovery.get("control_state") or "").strip().lower()
        active_alarms = recovery.get("active_alarms") or recovery.get("alarms") or []
        alarm_code = str(recovery.get("alarm_code") or "").strip()
        metrics = recovery.get("metrics") or recovery.get("metric_details") or {}
        fault_evidence = recovery.get("fault_evidence") if isinstance(recovery.get("fault_evidence"), Mapping) else {}
        checks = {
            "device_identity": bool(expected_device and actual_device == expected_device),
            "operational": status in {"running", "idle", "ready", "standby", "normal", "completed"}
            or (status in {"stopped", "paused"} and recovery.get("restart_requested") is True),
            "alarms_clear": not alarm_code and not active_alarms and not bool(fault_evidence.get("active")),
            "metrics_available": isinstance(metrics, Mapping) and bool(metrics),
            "recovery_fresh": _recovery_is_fresh(recovery),
        }
        passed = all(checks.values())
        return {
            "passed": passed,
            "status": "verified" if passed else "failed",
            "source": "device_recovery",
            "device_recovery": recovery,
            "checks": checks,
            "feedback": str((feedback or {}).get("feedback") or (feedback or {}).get("result") or ""),
            "verified_at": recovery.get("checked_at") or recovery.get("timestamp") or recovery.get("updated_at") or "",
            "validation_findings": [] if passed else [key for key, value in checks.items() if not value],
        }

    @classmethod
    def can_close(cls, order: Mapping[str, Any]) -> bool:
        """已完成的工单必须通过明确验证后才能关闭。"""
        return str(order.get("status") or "") == "completed" and cls.verification_passed(order)

    @staticmethod
    def can_learn(order: Mapping[str, Any], repair_feedback: Any) -> bool:
        """写入 Memory/RAG 前须确认工单已关闭、反馈有效且验证通过。"""
        feedback = repair_feedback or order.get("repair_feedback")
        if isinstance(feedback, Mapping):
            valid = any(
                str(feedback.get(key) or "").strip()
                for key in ("feedback", "summary", "result", "content", "repair_feedback")
            )
        else:
            valid = bool(str(feedback or "").strip())
        return order.get("status") == "closed" and valid and WorkOrderValidator.verification_passed(order, feedback)


def _parse_timestamp(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _recovery_is_fresh(recovery: Mapping[str, Any]) -> bool:
    """只依据设备快照的明确时间/过期标记判断新鲜度，不猜测工业阈值。"""

    if any(recovery.get(key) is True for key in ("stale", "expired", "is_stale")):
        return False
    checked_at = _parse_timestamp(recovery.get("checked_at") or recovery.get("timestamp") or recovery.get("updated_at"))
    if checked_at is None:
        return False
    expires_at = _parse_timestamp(recovery.get("expires_at"))
    return expires_at is None or expires_at > datetime.now(timezone.utc)
