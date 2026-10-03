"""Knowledge MCP：语义记忆检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .search_knowledge import search_filtered_knowledge


def search_semantic_memory(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    return search_filtered_knowledge(rag, query, knowledge_type="", limit=limit, filters=filters, remove_alarm_code=True)
