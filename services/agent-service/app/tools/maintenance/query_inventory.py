"""Inventory MCP：查询库存。"""

from __future__ import annotations

from typing import Any, Dict
from .query_spare_part import query_spare_part


def query_inventory(query: str, device_id: str = "", **arguments: Any) -> Dict[str, Any]:
    result = query_spare_part(query=query, device_id=device_id, **arguments)
    result["stock"] = list(result.get("parts") or [])
    return result
