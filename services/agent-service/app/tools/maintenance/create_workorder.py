"""WorkOrder MCP：创建维修工单。"""

from __future__ import annotations
from typing import Any, Dict


def create_workorder(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.create_workorder(**arguments)
