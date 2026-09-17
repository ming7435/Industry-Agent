"""CAD MCP：查询部件安装位置。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import engineering_components, match_components


def get_component_location(component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
    lookup = component_id or part_no or query
    components = match_components(lookup, engineering_components())
    return {
        "query": lookup,
        "locations": [
            {"component_id": item["component_id"], "part_no": item["part_no"], "location": item["position"], "drawing_ref": item["drawing_ref"]}
            for item in components
        ],
        "source": "component-location-mcp-compatible",
    }
