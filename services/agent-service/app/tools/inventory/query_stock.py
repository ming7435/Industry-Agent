"""Inventory MCP：查询库存余量。"""

from __future__ import annotations

from typing import Any, Dict

from .query_inventory import query_inventory


def query_stock(query: str, device_id: str = "", **arguments: Any) -> Dict[str, Any]:
    return query_inventory(query=query, device_id=device_id, **arguments)
