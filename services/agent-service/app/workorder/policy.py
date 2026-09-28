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
    plan = plan or {}
    raw_confidence = diagnosis.get("confidence")
    try:
        confidence = float(raw_confidence)
    except (TypeError, ValueError):
        confidence = 0.0
    threshold = auto_workorder_min_confidence()
    if confidence < threshold:
        return False, "诊断置信度 %.2f 低于自动派单门槛 %.2f" % (confidence, threshold)
    required, reason = maintenance_decision(diagnosis, event, plan)
    if not required:
        return False, reason
    if plan.get("workorder_ready") is not True:
        return False, "维修方案尚未达到工单就绪条件"
    return True, "诊断置信度和维修必要性均满足自动派单条件"


__all__ = ["auto_workorder_decision", "auto_workorder_min_confidence", "maintenance_decision"]
