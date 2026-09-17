"""Knowledge MCP：统一知识检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def search_knowledge(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    """通过 RAG 服务执行通用知识检索。"""

    return rag.search(query, limit=limit, filters=filters)
