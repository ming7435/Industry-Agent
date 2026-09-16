"""设备日志查询工具。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def get_device_logs(
    device_id: str,
    limit: int = 20,
    log_types: Optional[List[str]] = None,
    **_: Any,
) -> Dict[str, Any]:
    """返回设备近期日志摘要。

    当前先提供 MCP 兼容的本地日志结构，后续可替换为真实 PLC/MES 日志服务。
    """

    normalized_device_id = str(device_id or "").strip()
    if not normalized_device_id:
        return {
            "success": False,
            "found": False,
            "tool": "get_device_logs",
            "source": "device-log-mcp-compatible",
            "data": None,
            "error": {"code": "INVALID_ARGUMENT", "message": "device_id 不能为空"},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    try:
        capped_limit = max(1, min(100, int(limit)))
    except (TypeError, ValueError):
        capped_limit = 20

    requested_types = [str(item) for item in (log_types or []) if str(item).strip()]
    logs = [
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "state_change",
            "level": "info",
            "message": "设备处于自动运行监控状态",
        },
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": "plc_event",
            "level": "info",
            "message": "最近未发现通信中断或安全互锁动作记录",
        },
    ]
    if requested_types:
        logs = [item for item in logs if item["type"] in requested_types] or logs

    logs = logs[:capped_limit]
    return {
        "success": True,
        "found": bool(logs),
        "tool": "get_device_logs",
        "source": "device-log-mcp-compatible",
        "device_id": normalized_device_id,
        "logs": logs,
        "data": {"device_id": normalized_device_id, "logs": logs},
        "error": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
