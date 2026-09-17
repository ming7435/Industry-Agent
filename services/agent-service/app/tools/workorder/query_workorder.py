"""WorkOrder MCP：查询维修工单。"""

from __future__ import annotations
from typing import Any, Dict

from .get_workorder import get_workorder


def query_workorder(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return get_workorder(adapter, **arguments)
