"""CAD MCP：查询装配关系。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import engineering_components, match_components, relation_for


def query_assembly_relation(component_id: str = "", component: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
    lookup = component_id or part_no or component or query
    components = match_components(lookup, engineering_components())
    relations = [relation_for(item) for item in components]
    return {"query": lookup, "assembly_relations": relations, "source": "assembly-mcp-compatible"}
