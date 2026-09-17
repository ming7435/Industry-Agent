"""WorkOrder MCP：获取单个维修工单。"""

from __future__ import annotations
from typing import Any, Dict


def get_workorder(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.get_workorder(**arguments)
