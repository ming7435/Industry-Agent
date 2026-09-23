"""Inventory MCP：查询备件库存。"""

from __future__ import annotations

from typing import Any, Dict


def query_spare_part(query: str, device_id: str = "", **_: Any) -> Dict[str, Any]:
    parts: list[dict[str, Any]] = [
        {"part_id": "TEMP-PT100", "part_no": "TS-PT100-008", "name": "PT100温度传感器", "stock": 3, "available": True, "device_id": device_id},
        {"part_id": "COOLANT-PUMP", "part_no": "CP-TC820-015", "name": "主轴冷却泵", "stock": 2, "available": True, "device_id": device_id},
        {"part_id": "SPINDLE-BEARING", "part_no": "SP-BEARING-6208", "name": "主轴轴承", "stock": 1, "available": True, "device_id": device_id},
    ]
    matched = [
        item
        for item in parts
        if any(str(term) in item["name"] or str(term) in item["part_id"] for term in str(query).split())
    ]
    return {"query": query, "parts": matched or parts, "source": "inventory-mcp-compatible"}
