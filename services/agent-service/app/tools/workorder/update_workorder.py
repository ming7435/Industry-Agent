"""WorkOrder MCP：更新维修工单。"""

from __future__ import annotations
from typing import Any, Dict


def update_workorder(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.update_workorder(**arguments)
