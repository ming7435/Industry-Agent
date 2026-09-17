"""Report MCP：把已有 Trace 压缩成报告可引用的摘要。"""

from __future__ import annotations

from collections import Counter
from typing import Any, Dict, Iterable, Mapping


def get_trace_summary(
    trace: Iterable[Mapping[str, Any]] | None = None,
    trace_id: str = "",
    **_: Any,
) -> Dict[str, Any]:
    records = [dict(item) for item in trace or [] if isinstance(item, Mapping)]
    type_counts = Counter(str(item.get("type") or "unknown") for item in records)
    names = {
        item_type: sorted({str(item.get("name") or "") for item in records if item.get("type") == item_type and item.get("name")})
        for item_type in type_counts
    }
    return {
        "found": bool(records),
        "success": True,
        "trace_id": trace_id,
        "summary": {"record_count": len(records), "type_counts": dict(type_counts), "names": names},
        "source": "trace",
    }
