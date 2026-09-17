"""Knowledge Agent 的检索类工具。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


class KnowledgeRetrievalTools:
    """统一 RAG 检索入口，并为不同知识类型提供稳定过滤器。"""

    def search_knowledge(
        self,
        query: str,
        limit: int = 5,
        filters: Mapping[str, Any] | None = None,
        **_: Any,
    ) -> Dict[str, Any]:
        return self.rag.search(query, limit=limit, filters=filters)

    def search_alarm_knowledge(
        self,
        query: str,
        limit: int = 5,
        filters: Mapping[str, Any] | None = None,
        alarm_code: str = "",
        **_: Any,
    ) -> Dict[str, Any]:
        values = {**dict(filters or {}), "knowledge_type": "alarm"}
        if alarm_code:
            values["alarm_code"] = alarm_code
        return self.search_knowledge(query, limit=limit, filters=values)

    def search_sop(
        self,
        query: str,
        limit: int = 5,
        filters: Mapping[str, Any] | None = None,
        **_: Any,
    ) -> Dict[str, Any]:
        selected = {key: value for key, value in dict(filters or {}).items() if key != "alarm_code"}
        return self.search_knowledge(query, limit=limit, filters={**selected, "knowledge_type": "sop"})

    def search_manual(
        self,
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
        return self.search_knowledge(query, limit=limit, filters=selected)

    def search_fault_cases(
        self,
        query: str,
        limit: int = 5,
        filters: Mapping[str, Any] | None = None,
        **_: Any,
    ) -> Dict[str, Any]:
        selected = {key: value for key, value in dict(filters or {}).items() if key != "alarm_code"}
        return self.search_knowledge(query, limit=limit, filters={**selected, "knowledge_type": "case"})

    def search_semantic_memory(
        self,
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
        return self.search_knowledge(query, limit=limit, filters=selected)
