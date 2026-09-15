"""设备历史趋势查询工具。"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Iterable, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


METRIC_ALIASES = {
    "temperature": "spindle_temperature_c",
    "vibration": "spindle_vibration_rms",
    "rpm": "spindle_rpm",
}


def get_device_history(
    device_id: str,
    metric_keys: Optional[Iterable[str]] = None,
    limit: int = 20,
    base_url: Optional[str] = None,
) -> Dict[str, Any]:
    """读取设备过去一段时间的指标采样，并返回适合 Agent 分析的序列。"""

    device_id = str(device_id or "").strip()
    try:
        limit = max(3, min(120, int(limit)))
    except (TypeError, ValueError):
        limit = 20
    requested = [
        METRIC_ALIASES.get(str(item).strip(), str(item).strip())
        for item in (metric_keys or [])
        if str(item).strip()
    ]
    api_base = (base_url or os.getenv("FACTORY_API_BASE_URL", "http://127.0.0.1:8000")).rstrip("/")
    query = urlencode({"limit": limit})
    request = Request(
        "%s/api/devices/%s/metrics?%s" % (api_base, quote(device_id, safe=""), query),
        headers={"Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=8.0) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        return {
            "found": False,
            "device_id": device_id,
            "metric_keys": requested,
            "history": [],
            "series": {},
            "source": "device_history_api",
            "error": "设备历史接口读取失败：%s" % error,
        }

    raw_history = payload.get("history") if isinstance(payload, dict) else []
    raw_history = raw_history if isinstance(raw_history, list) else []
    available_keys = set()
    for item in raw_history:
        if isinstance(item, dict):
            available_keys.update((item.get("metrics") or {}).keys())
    keys = requested or sorted(available_keys)
    history: List[Dict[str, Any]] = []
    series: Dict[str, List[Dict[str, Any]]] = {key: [] for key in keys}
    for item in raw_history[-limit:]:
        if not isinstance(item, dict):
            continue
        metrics = item.get("metrics") or {}
        timestamp = item.get("timestamp") or item.get("updated_at")
        point = {
            "timestamp": timestamp,
            "metrics": {key: metrics.get(key) for key in keys if key in metrics},
        }
        if point["metrics"]:
            history.append(point)
            for key, value in point["metrics"].items():
                series.setdefault(key, []).append({"timestamp": timestamp, "value": value})

    return {
        "found": bool(history),
        "device_id": device_id,
        "metric_keys": keys,
        "sample_count": len(history),
        "history": history,
        "series": series,
        "metric_definitions": payload.get("metric_definitions", {}) if isinstance(payload, dict) else {},
        "source": "device_history_api",
    }
