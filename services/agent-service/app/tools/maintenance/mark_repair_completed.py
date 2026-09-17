"""WorkOrder MCP：标记维修完成。"""

from __future__ import annotations
from typing import Any, Dict


def mark_repair_completed(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.mark_repair_completed(**arguments)
