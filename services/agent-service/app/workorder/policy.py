"""诊断进入维修工单前的确定性业务门禁。"""

from __future__ import annotations

import os
from typing import Any, Mapping


def auto_workorder_min_confidence() -> float:
    """读取自动派单最低诊断置信度，默认 0.80。"""

    raw = os.getenv("AUTO_WORKORDER_MIN_CONFIDENCE", "0.80")
    try:
        return min(1.0, max(0.0, float(raw)))
    except (TypeError, ValueError):
        return 0.80


def _as_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "y", "是", "需要"}:
            return True
        if normalized in {"false", "0", "no", "n", "否", "不需要"}:
            return False
    return None


def maintenance_decision(
    diagnosis: Mapping[str, Any] | None = None,
    event: Mapping[str, Any] | None = None,
    plan: Mapping[str, Any] | None = None,
) -> tuple[bool, str]:
    """判断异常是否需要维修。

    显式业务字段优先；没有显式结论时只对高风险/故障级别开放维修，
    普通提示、未知等级和单纯趋势波动不会自动创建工单。
    """

    diagnosis = diagnosis or {}
    event = event or {}
    plan = plan or {}
    sources = (plan, diagnosis, event, diagnosis.get("alarm_definition") or {})
    for source in sources:
        for key in ("maintenance_required", "requires_maintenance"):
            value = _as_bool(source.get(key)) if isinstance(source, Mapping) else None
            if value is not None:
                return value, "业务字段%s" % ("要求维修" if value else "判定无需维修")

    severity = " ".join(
        str(source.get("severity") or source.get("risk_level") or "")
        for source in sources
        if isinstance(source, Mapping)
    ).strip().lower()
    if any(token in severity for token in ("critical", "fatal", "fault", "high", "严重", "高级", "故障")):
        return True, "异常等级达到维修门槛"
    return False, "异常等级未达到维修门槛，先观察或继续诊断"


def auto_workorder_decision(
    diagnosis: Mapping[str, Any] | None,
    plan: Mapping[str, Any] | None,
    event: Mapping[str, Any] | None = None,
) -> tuple[bool, str]:
    """判断自动触发的维修方案是否可以进入工单派发。"""

    diagnosis = diagnosis or {}
    # DiagnosisView 将扩展证据与安全标记保存在 raw；显式外层字段优先。
    raw = diagnosis.get("raw")
    if isinstance(raw, Mapping):
        diagnosis = {**raw, **diagnosis}
    plan = plan or {}
    raw_confidence = diagnosis.get("confidence")
    try:
        confidence = float(raw_confidence)
    except (TypeError, ValueError):
        confidence = 0.0
    threshold = auto_workorder_min_confidence()
    if any(source.get("synthetic") is True for source in (diagnosis, plan) if isinstance(source, Mapping)):
        return False, "诊断或维修方案标记为 synthetic，禁止自动派单"
    if diagnosis.get("requires_human_review") is True:
        return False, "诊断要求人工复核，禁止自动派单"
    if confidence < threshold:
        return False, "诊断置信度 %.2f 低于自动派单门槛 %.2f" % (confidence, threshold)
    evidence_status = str(diagnosis.get("evidence_status") or "").strip().lower()
    if evidence_status in {"", "insufficient", "pending", "unknown", "blocked"}:
        return False, "诊断证据不足，禁止自动派单"
    if diagnosis.get("evidence_validated") is False or diagnosis.get("validated") is False:
        return False, "诊断证据尚未通过校验，禁止自动派单"
    required, reason = maintenance_decision(diagnosis, event, plan)
    if not required:
        return False, reason
    if plan.get("workorder_ready") is not True:
        return False, "维修方案尚未达到工单就绪条件"
    return True, "诊断置信度和维修必要性均满足自动派单条件"


def disposition_decision(
    diagnosis: Mapping[str, Any] | None = None,
    event: Mapping[str, Any] | None = None,
    plan: Mapping[str, Any] | None = None,
) -> tuple[str, str]:
    """给异常分配后续处置类型，但不直接控制设备。"""

    diagnosis = diagnosis or {}
    event = event or {}
    plan = plan or {}
    allowed = {"no_action", "monitor_only", "operator_check", "maintenance_required", "emergency_stop"}
    for source in (plan, diagnosis, event):
        value = str(source.get("disposition") or "").strip().lower() if isinstance(source, Mapping) else ""
        if value in allowed:
            return value, "业务输入明确指定处置类型"
    required, reason = maintenance_decision(diagnosis, event, plan)
    confidence = diagnosis.get("confidence")
    try:
        low_confidence = confidence is not None and float(confidence) < auto_workorder_min_confidence()
    except (TypeError, ValueError):
        low_confidence = True
    severity = " ".join(str(source.get("severity") or source.get("risk_level") or "") for source in (event, diagnosis, plan)).lower()
    if any(token in severity for token in ("critical", "fatal", "紧急", "危急")):
        return "emergency_stop", "异常等级达到紧急处置门槛，等待人工确认设备控制"
    if required and low_confidence:
        return "operator_check", "需要维修但诊断置信度不足，必须人工确认"
    if required:
        return "maintenance_required", reason
    if low_confidence:
        return "operator_check", "证据不足，先由操作员核查"
    return "no_action" if not diagnosis and not event and not plan else "monitor_only", reason


__all__ = ["auto_workorder_decision", "auto_workorder_min_confidence", "maintenance_decision", "disposition_decision"]
