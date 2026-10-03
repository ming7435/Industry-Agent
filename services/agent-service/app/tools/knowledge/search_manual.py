"""Knowledge MCP：维修手册检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .search_knowledge import search_filtered_knowledge


def search_manual(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    return search_filtered_knowledge(rag, query, knowledge_type="manual", limit=limit, filters=filters, remove_alarm_code=True)
