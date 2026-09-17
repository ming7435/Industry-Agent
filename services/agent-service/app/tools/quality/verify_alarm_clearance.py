"""确定性验证维修后报警是否清除。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def verify_alarm_clearance(
    device_status: Mapping[str, Any] | None = None,
    active_alarms: Mapping[str, Any] | None = None,
    repair_check: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    status = dict(device_status or {})
    alarms = list((active_alarms or {}).get("active_alarms") or (active_alarms or {}).get("alarms") or [])
    alarm_code = status.get("alarm_code")
    if alarms or alarm_code not in (None, "", "None"):
        return {"passed": False, "alarm_cleared": False, "active_alarms": alarms, "alarm_code": alarm_code, "source": "qms-mcp"}
    if status.get("found") is False or status.get("success") is False:
        fallback = bool((repair_check or {}).get("alarm_cleared"))
        return {"passed": fallback, "alarm_cleared": fallback, "active_alarms": [], "source": "qms-mcp", "degraded": True}
    return {"passed": True, "alarm_cleared": True, "active_alarms": [], "source": "qms-mcp"}
