"""QMS MCP：检查维修步骤是否符合 SOP。"""

from __future__ import annotations

from typing import Any, Callable, Dict


def check_sop(search: Callable[..., Dict[str, Any]], workorder_id: str = "", query: str = "维修步骤", **_: Any) -> Dict[str, Any]:
    result = search(query, limit=3, filters={"knowledge_type": "sop"})
    return {"workorder_id": workorder_id, "passed": bool(result.get("documents")), "documents": result.get("documents", []), "source": result.get("source", "")}
