"""WorkOrder MCP：提交工单草案。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict


def submit_workorder_draft(**arguments: Any) -> Dict[str, Any]:
    return {"draft_id": "WOD-" + datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"), "submitted": True, "source": "workorder-draft-local", **dict(arguments)}
