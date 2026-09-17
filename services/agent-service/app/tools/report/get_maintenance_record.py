"""Report MCP：读取已有维修计划记录。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def get_maintenance_record(
    record: Mapping[str, Any] | None = None,
    plan: Mapping[str, Any] | None = None,
    plan_id: str = "",
    **_: Any,
) -> Dict[str, Any]:
    value = dict(record or plan or {})
    return {
        "found": bool(value),
        "success": True,
        "record": value,
        "plan_id": str(value.get("plan_id") or plan_id),
        "source": "maintenance-record",
    }
