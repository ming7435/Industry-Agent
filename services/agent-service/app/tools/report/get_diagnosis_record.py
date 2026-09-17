"""Report MCP：读取已有诊断记录，不重新执行诊断。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def get_diagnosis_record(
    record: Mapping[str, Any] | None = None,
    event: Mapping[str, Any] | None = None,
    event_id: str = "",
    **_: Any,
) -> Dict[str, Any]:
    value = dict(record or {})
    if not value and event and event.get("diagnosis"):
        value = dict(event.get("diagnosis") or {})
    return {
        "found": bool(value),
        "success": True,
        "record": value,
        "event_id": str(value.get("event_id") or event_id),
        "source": "diagnosis-record",
    }
