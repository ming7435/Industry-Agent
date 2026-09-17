"""WorkOrder MCP：提交维修反馈。"""

from __future__ import annotations
from typing import Any, Dict


def submit_repair_feedback(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.submit_repair_feedback(**arguments)
