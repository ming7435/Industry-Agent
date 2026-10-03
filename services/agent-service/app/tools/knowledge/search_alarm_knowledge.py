"""Knowledge MCP：报警知识检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .search_knowledge import search_filtered_knowledge


def search_alarm_knowledge(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    alarm_code: str = "",
    **_: Any,
) -> Dict[str, Any]:
    return search_filtered_knowledge(rag, query, knowledge_type="alarm", limit=limit, filters=filters, alarm_code=alarm_code)
