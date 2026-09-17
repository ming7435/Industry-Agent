"""CAD MCP：查询 CAD 部件与图纸。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import drawing_for, engineering_components, match_components


def query_cad(query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
    components = engineering_components()
    lookup = part_no or component or query
    matched = match_components(lookup, components)
    return {"query": lookup, "device_id": device_id, "components": matched, "drawings": [drawing_for(item) for item in matched], "source": "cad-mcp-compatible"}
