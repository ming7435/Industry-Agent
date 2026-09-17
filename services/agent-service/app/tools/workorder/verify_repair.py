"""WorkOrder MCP：验证维修结果。"""

from __future__ import annotations
from typing import Any, Dict


def verify_repair(adapter: Any, **arguments: Any) -> Dict[str, Any]:
    return adapter.verify_repair(**arguments)
