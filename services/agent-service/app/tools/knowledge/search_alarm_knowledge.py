"""Knowledge MCP：报警知识检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .search_knowledge import search_knowledge as _search_knowledge


def search_alarm_knowledge(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    alarm_code: str = "",
    **_: Any,
) -> Dict[str, Any]:
    values = {**dict(filters or {}), "knowledge_type": "alarm"}
    if alarm_code:
        values["alarm_code"] = alarm_code
    return _search_knowledge(rag, query, limit=limit, filters=values)
