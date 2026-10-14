"""Knowledge MCP：历史故障案例检索工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from .search_knowledge import search_filtered_knowledge


def search_fault_cases(
    rag: Any,
    query: str,
    limit: int = 5,
    filters: Mapping[str, Any] | None = None,
    generate_answer: bool = True,
    **_: Any,
) -> Dict[str, Any]:
    return search_filtered_knowledge(rag, query, knowledge_type="case", limit=limit, filters=filters, remove_alarm_code=True, generate_answer=generate_answer)
