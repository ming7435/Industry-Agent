"""WorkOrder MCP：查询工单列表。"""

from __future__ import annotations
from typing import Any, Dict


def list_workorders(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.list_workorders(**arguments)
