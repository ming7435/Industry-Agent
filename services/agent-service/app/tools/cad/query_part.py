"""CAD MCP：查询工程零件。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import engineering_components, match_components


def query_part(query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
    lookup = part_no or component or query
    components = match_components(lookup, engineering_components())
    return {"query": lookup, "device_id": device_id, "parts": components, "source": "part-mcp-compatible"}
