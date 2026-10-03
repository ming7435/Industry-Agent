"""CAD MCP：查询装配关系。"""

from __future__ import annotations

from typing import Any, Dict

from .engineering_data import component_relations


def query_assembly_relation(component_id: str = "", component: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
    lookup = component_id or part_no or component or query
    relations = component_relations(lookup)
    return {"query": lookup, "assembly_relations": relations, "source": "assembly-mcp-compatible"}
