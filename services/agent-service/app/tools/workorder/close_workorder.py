"""WorkOrder MCP：关闭维修工单。"""

from __future__ import annotations
from typing import Any, Dict


def close_workorder(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.close_workorder(**arguments)
