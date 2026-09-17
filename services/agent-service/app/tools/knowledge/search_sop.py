"""Knowledge MCP：SOP 检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .search_knowledge import search_knowledge as _search_knowledge


def search_sop(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    selected = {key: value for key, value in dict(filters or {}).items() if key != "alarm_code"}
    return _search_knowledge(rag, query, limit=limit, filters={**selected, "knowledge_type": "sop"})
