"""Report MCP：持久化结构化报告。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Mapping, MutableMapping


def persist_report(
    store: MutableMapping[str, Dict[str, Any]],
    report: Mapping[str, Any],
    **_: Any,
) -> Dict[str, Any]:
    value = dict(report or {})
    report_id = str(value.get("report_id") or "")
    if not report_id:
        return {"success": False, "persisted": False, "error": "report_id 不能为空", "source": "report-store"}
    saved = {**value, "persisted_at": datetime.now(timezone.utc).isoformat()}
    store[report_id] = saved
    return {"success": True, "persisted": True, "report_id": report_id, "report": saved, "source": "report-store"}
