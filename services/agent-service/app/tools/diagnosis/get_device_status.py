"""设备当前状态查询工具。

工具通过工厂服务的快照接口读取设备状态，并把外部响应归一化成
Diagnosis Agent 可以直接消费的证据结构。接口不可用时返回结构化错误，
这样一次 PLC 查询失败不会直接终止整个诊断循环。
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, Mapping, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.alarm import AlarmCodeParser
from app.monitor.presentation import cycle_state_label


def get_device_status(
    device_id: str,
    base_url: Optional[str] = None,
    timeout: float = 5.0,
) -> Dict[str, Any]:
    """查询设备实时快照并返回标准化状态证据。"""

    normalized_device_id = str(device_id or "").strip()
    if not normalized_device_id:
        return {
            "found": False,
            "success": False,
            "device_id": "",
            "source": "plc-mcp",
            "error": "device_id 不能为空",
        }

    api_base = (
        base_url
        or os.getenv("FACTORY_API_BASE_URL", "http://127.0.0.1:8000")
    ).rstrip("/")
    query = urlencode({"device_id": normalized_device_id})
    request = Request(
        "%s/api/snapshot?%s" % (api_base, query),
        headers={"Accept": "application/json"},
    )

    try:
        with urlopen(request, timeout=float(timeout)) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
        return {
            "found": False,
            "success": False,
            "device_id": normalized_device_id,
            "source": "plc-mcp",
            "error": "设备实时状态接口读取失败：%s" % error,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

    if not isinstance(payload, Mapping):
        return {
            "found": False,
            "success": False,
            "device_id": normalized_device_id,
            "source": "plc-mcp",
            "error": "设备实时状态接口返回格式错误",
        }

    devices = payload.get("devices") or []
    device = next(
        (
            item
            for item in devices
            if isinstance(item, Mapping)
            and str(item.get("device_id") or "") == normalized_device_id
        ),
        None,
    )
    monitor = payload.get("monitor") or {}
    if isinstance(monitor, Mapping) and str(monitor.get("device_id") or "") == normalized_device_id:
        merged: Dict[str, Any] = dict(device or {})
        merged.update(dict(monitor))
        device = merged

    if not isinstance(device, Mapping):
        return {
            "found": False,
            "success": False,
            "device_id": normalized_device_id,
            "status": "unknown",
            "source": "plc-mcp",
            "error": "快照中没有找到设备：%s" % normalized_device_id,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

    summary = payload.get("summary") or {}
    checked_at = (
        device.get("checked_at")
        or device.get("updated_at")
        or summary.get("updated_at")
    ) if isinstance(summary, Mapping) else device.get("checked_at")

    raw_cycle_state = device.get("cycle_state", "")
    parsed_alarm = AlarmCodeParser.parse(
        device.get("alarm_code") or device.get("alarm_message") or device.get("alarm")
    )
    return {
        "found": True,
        "success": True,
        "device_id": normalized_device_id,
        "name": device.get("name", ""),
        "device_type": device.get("device_type", ""),
        "status": device.get("status", "unknown"),
        "mode": device.get("mode", ""),
        "cycle_state": raw_cycle_state,
        "cycle_state_label": cycle_state_label(raw_cycle_state),
        "alarm_code": parsed_alarm.code or None,
        "alarm_label": parsed_alarm.display_text or None,
        "alarm_description": parsed_alarm.description or None,
        "raw_alarm_text": parsed_alarm.raw_text or None,
        "health_score": device.get("health_score"),
        "metrics": dict(device.get("metrics") or {}),
        "metric_details": dict(device.get("metric_details") or {}),
        "equipment_states": dict(device.get("equipment_states") or {}),
        "checked_at": _normalize_timestamp(checked_at),
        "source": "plc-mcp",
    }


def _normalize_timestamp(value: Any) -> str:
    """把工厂常见的毫秒/秒时间戳统一为 ISO 8601。"""

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        try:
            seconds = float(value)
            if seconds > 100_000_000_000:
                seconds /= 1000.0
            return datetime.fromtimestamp(seconds, tz=timezone.utc).isoformat()
        except (OverflowError, OSError, ValueError):
            pass
    if value:
        return str(value)
    return datetime.now(timezone.utc).isoformat()
