"""MES MCP：查询生产状态。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict


def get_production_status(device_id: str = "", **_: Any) -> Dict[str, Any]:
    return {
        "device_id": device_id,
        "line": "A线",
        "status": "running",
        "cycle_state": "processing",
        "source": "MES-MCP-compatible",
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
