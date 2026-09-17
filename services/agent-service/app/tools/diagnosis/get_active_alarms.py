"""查询设备当前活动报警。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .get_device_status import get_device_status


def get_active_alarms(
    device_id: str,
    base_url: str | None = None,
    device_status: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    status = dict(device_status or get_device_status(device_id=device_id, base_url=base_url))
    alarm_code = status.get("alarm_code")
    alarms = []
    if alarm_code not in (None, "", "None"):
        alarms.append({
            "alarm_code": str(alarm_code),
            "device_id": str(device_id or status.get("device_id") or ""),
            "status": "active",
            "source": status.get("source", "plc-mcp"),
        })
    return {
        "found": bool(status.get("found") or alarms),
        "success": bool(status.get("success", False)),
        "device_id": str(device_id or status.get("device_id") or ""),
        "active_alarms": alarms,
        "alarms": alarms,
        "alarm_code": alarm_code,
        "source": status.get("source", "plc-mcp"),
        "device_status": status,
    }
