"""Deterministic safety policy for automatic simulator machine controls."""

from __future__ import annotations

from typing import Any

from .models import AlertLevel, MonitorStatus


def result_requires_emergency_stop(result: Any) -> bool:
    """Return whether a monitor result is a confirmed severe machine fault."""

    status = getattr(result, "status", None)
    if status == MonitorStatus.FAULT or str(status).lower().rstrip(".") in {"fault", "monitorstatus.fault"}:
        return True
    for observation in getattr(result, "observations", ()) or ():
        level = getattr(observation, "alert_level", None)
        if level == AlertLevel.HIGH or str(level).lower().rstrip(".") in {"high", "alertlevel.high"}:
            return True
    sample = getattr(result, "current_sample", None)
    sample_status = str(getattr(sample, "status", "") or "").lower()
    return sample_status in {"fault", "failed", "emergency_stop", "e_stop", "offline"}
