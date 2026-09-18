"""Knowledge MCP：维修手册检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .search_knowledge import search_knowledge as _search_knowledge


def search_manual(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    selected = {
        key: value
        for key, value in dict(filters or {}).items()
        if key not in {"alarm_code", "knowledge_type"}
    }
    selected["knowledge_type"] = "manual"
    return _search_knowledge(rag, query, limit=limit, filters=selected)
