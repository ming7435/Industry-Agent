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


def search_filtered_knowledge(
    rag: Any,
    query: str,
    *,
    knowledge_type: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    alarm_code: str = "",
    remove_alarm_code: bool = False,
) -> Dict[str, Any]:
    """共用检索执行；空类型保留语义记忆的原有跨类型检索契约。"""
    selected = dict(filters or {})
    if remove_alarm_code:
        selected.pop("alarm_code", None)
    if knowledge_type:
        selected["knowledge_type"] = knowledge_type
    else:
        selected.pop("knowledge_type", None)
    if alarm_code:
        selected["alarm_code"] = alarm_code
    return search_knowledge(rag, query, limit=limit, filters=selected)
