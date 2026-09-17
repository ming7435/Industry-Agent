"""WorkOrder MCP：重新打开维修工单。"""

from __future__ import annotations
from typing import Any, Dict


def reopen_workorder(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.reopen_workorder(**arguments)
