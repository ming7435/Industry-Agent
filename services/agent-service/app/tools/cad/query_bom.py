"""CAD MCP：查询 BOM。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import bom_for, engineering_components, match_components


def query_bom(query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
    lookup = part_no or component or query
    components = match_components(lookup, engineering_components())
    items = [bom_for(item) for item in components]
    return {"query": lookup, "device_id": device_id, "components": components, "bom_items": items, "source": "bom-mcp-compatible"}
