"""Inventory MCP：查询备件可用性。"""

from __future__ import annotations

from typing import Any, Dict
from .query_spare_part import query_spare_part


def query_part_availability(query: str, device_id: str = "", part_no: str = "", **arguments: Any) -> Dict[str, Any]:
    lookup = part_no or query
    result = query_spare_part(query=lookup, device_id=device_id, **arguments)
    parts = list(result.get("parts") or [])
    return {"query": lookup, "device_id": device_id, "available": any(int(item.get("stock") or 0) > 0 for item in parts), "parts": parts, "source": "inventory-mcp-compatible"}
