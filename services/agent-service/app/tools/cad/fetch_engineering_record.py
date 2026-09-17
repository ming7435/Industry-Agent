"""CAD MCP：获取完整工程记录。"""

from __future__ import annotations

from typing import Any, Dict
from .get_component_location import get_component_location
from .query_assembly_relation import query_assembly_relation
from .query_bom import query_bom
from .query_cad import query_cad


def fetch_engineering_record(**arguments: Any) -> Dict[str, Any]:
    query = str(arguments.get("query") or arguments.get("component") or arguments.get("part_no") or "")
    device_id = str(arguments.get("device_id") or "")
    raw = query_cad(query=query, device_id=device_id)
    raw["bom_items"] = query_bom(query=query, device_id=device_id).get("bom_items", [])
    raw["assembly_relations"] = query_assembly_relation(query=query).get("assembly_relations", [])
    raw["locations"] = get_component_location(query=query).get("locations", [])
    raw["source"] = "document-cad-service-local"
    return raw
