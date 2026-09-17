"""WorkOrder MCP：派工。"""

from __future__ import annotations
from typing import Any, Dict


def assign_workorder(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.assign_workorder(**arguments)
