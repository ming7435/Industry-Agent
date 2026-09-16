"""工业知识检索 Agent，保留 RAG Service 接口。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.validator import KnowledgeDocument, KnowledgeResult


class KnowledgeAgent:
    name = "knowledge"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()

    def search_knowledge(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None) -> KnowledgeResult:
        raw = self.tools.execute("search_knowledge", {"query": query, "limit": limit, "filters": filters or {}})
        return KnowledgeResult(
            query=query,
            documents=[KnowledgeDocument(**item) for item in raw.get("documents", [])],
            source=raw.get("source", "rag-service-compatible"),
        )

    def run(self, task: Any) -> KnowledgeResult:
        if isinstance(task, str):
            query = task
            payload = {}
        else:
            payload = dict(task or {})
            query = str(payload.get("query") or payload.get("user_text") or payload.get("fault") or "工业设备维修")
        return self.search_knowledge(query, int(payload.get("limit", 5)), payload.get("filters"))
