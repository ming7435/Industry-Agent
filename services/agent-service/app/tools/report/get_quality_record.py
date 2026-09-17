"""Report MCP：读取已有质检记录。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def get_quality_record(
    record: Mapping[str, Any] | None = None,
    quality: Mapping[str, Any] | None = None,
    workorder_id: str = "",
    **_: Any,
) -> Dict[str, Any]:
    value = dict(record or quality or {})
    return {
        "found": bool(value),
        "success": True,
        "record": value,
        "workorder_id": str(value.get("workorder_id") or workorder_id),
        "source": "quality-record",
    }
