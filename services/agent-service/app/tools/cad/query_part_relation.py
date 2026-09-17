"""CAD MCP：查询零件关系。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import engineering_components, match_components, relation_for


def query_part_relation(part_no: str = "", component_id: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
    lookup = part_no or component_id or query
    components = match_components(lookup, engineering_components())
    relations = [relation_for(item) for item in components]
    return {"query": lookup, "relations": relations, "source": "cad-relation-mcp-compatible"}
