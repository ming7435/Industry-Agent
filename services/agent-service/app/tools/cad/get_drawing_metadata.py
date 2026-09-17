"""CAD MCP：查询图纸元数据。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import drawing_for, engineering_components, match_components


def get_drawing_metadata(component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
    lookup = component_id or part_no or query
    components = match_components(lookup, engineering_components())
    drawings = [drawing_for(item) for item in components]
    return {"query": lookup, "drawings": drawings, "source": "drawing-metadata-mcp-compatible"}
