"""CAD MCP：关系查询兼容入口。"""

from __future__ import annotations

from typing import Any, Dict

from .get_component_location import get_component_location
from .query_assembly_relation import query_assembly_relation


def query_relation(**arguments: Any) -> Dict[str, Any]:
    result = query_assembly_relation(**arguments)
    result["relations"] = list(result.get("assembly_relations") or [])
    result["locations"] = get_component_location(**arguments).get("locations", [])
    return result
