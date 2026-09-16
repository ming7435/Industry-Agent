"""工业知识检索 Agent，负责生成可追踪 Evidence Pack。"""

from __future__ import annotations

import re
from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.validator import KnowledgeDocument, KnowledgeResult


_ALARM_CODE_RE = re.compile(r"\b[A-Z]?\d{3,6}\b", re.IGNORECASE)


class KnowledgeAgent:
    name = "knowledge"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()

    def search_knowledge(
        self,
        query: str,
        limit: int = 5,
        filters: Mapping[str, Any] | None = None,
        required_sources: list[str] | None = None,
    ) -> KnowledgeResult:
        query = str(query or "").strip()
        query_type = self._classify_query(query, filters or {}, required_sources or [])
        selected_filters = self._build_filters(query, query_type, filters or {})
        raw = self.tools.execute("search_knowledge", {"query": query, "limit": limit, "filters": selected_filters})
        documents = self._deduplicate_documents(raw.get("documents", []))
        status = "completed" if documents else "insufficient_evidence"
        evidence = self._evidence_from_documents(documents)
        confidence = self._confidence(documents, required_sources or [])
        return KnowledgeResult(
            query=query,
            status=status,
            query_type=query_type,
            summary=self._summary(query, documents, status),
            evidence=evidence,
            possible_causes=self._possible_causes(documents),
            recommended_checks=self._recommended_checks(documents),
            confidence=confidence,
            documents=documents,
            sources=self._sources(documents),
            filters=selected_filters,
            total=len(documents),
            backend_status=raw.get("connection_status", "unknown"),
            degraded=bool(raw.get("degraded", False)),
            warning=str(raw.get("warning") or ""),
            source=raw.get("source", "rag-service-compatible"),
        )

    def run(self, task: Any) -> KnowledgeResult:
        if isinstance(task, str):
            query = task
            payload = {}
        else:
            payload = dict(task or {})
            query = str(payload.get("query") or payload.get("user_text") or payload.get("fault") or "工业设备维修")
        return self.search_knowledge(
            query,
            int(payload.get("limit", 5)),
            payload.get("filters"),
            payload.get("required_sources") or payload.get("required_knowledge_types") or [],
        )

    @staticmethod
    def _classify_query(query: str, filters: Mapping[str, Any], required_sources: list[str]) -> str:
        text = " ".join([query, " ".join(str(item) for item in required_sources), " ".join(str(value) for value in filters.values())]).lower()
        if filters.get("alarm_code") or _ALARM_CODE_RE.search(query):
            return "alarm"
        if any(token in text for token in ("sop", "步骤", "规程", "作业指导", "怎么检查")):
            return "sop"
        if any(token in text for token in ("案例", "历史", "经验", "case")):
            return "case"
        if any(token in text for token in ("bom", "零件", "物料", "part")):
            return "engineering"
        return "hybrid"

    @staticmethod
    def _build_filters(query: str, query_type: str, filters: Mapping[str, Any]) -> dict[str, Any]:
        selected = {key: value for key, value in dict(filters or {}).items() if value not in (None, "", [])}
        if query_type == "alarm" and not selected.get("alarm_code"):
            match = _ALARM_CODE_RE.search(query)
            if match:
                selected["alarm_code"] = match.group(0).upper()
        if query_type == "sop" and not selected.get("knowledge_type"):
            selected["knowledge_type"] = "sop"
        if query_type == "case" and not selected.get("knowledge_type"):
            selected["knowledge_type"] = "case"
        return selected

    @staticmethod
    def _deduplicate_documents(items: list[Mapping[str, Any]]) -> list[KnowledgeDocument]:
        best: dict[str, Mapping[str, Any]] = {}
        for item in items:
            key = str(item.get("document_id") or "%s|%s" % (item.get("title"), item.get("source")))
            previous = best.get(key)
            if previous is None or float(item.get("score") or 0) > float(previous.get("score") or 0):
                best[key] = item
        ordered = sorted(best.values(), key=lambda value: float(value.get("score") or 0), reverse=True)
        return [KnowledgeDocument(**item) for item in ordered]

    @staticmethod
    def _evidence_from_documents(documents: list[KnowledgeDocument]) -> list[dict[str, Any]]:
        evidence = []
        for doc in documents:
            evidence.append({
                "document_id": doc.document_id,
                "title": doc.title,
                "source": doc.source,
                "score": doc.score,
                "collection": doc.metadata.get("collection", ""),
                "knowledge_type": doc.metadata.get("knowledge_type", ""),
                "component": doc.metadata.get("component", ""),
            })
        return evidence

    @staticmethod
    def _summary(query: str, documents: list[KnowledgeDocument], status: str) -> str:
        if status != "completed":
            return "未检索到与“%s”直接相关的可追踪知识证据。" % query
        titles = "、".join(doc.title for doc in documents[:3])
        return "检索到 %s 条相关知识证据：%s。" % (len(documents), titles)

    @staticmethod
    def _possible_causes(documents: list[KnowledgeDocument]) -> list[str]:
        causes = []
        for doc in documents:
            metadata = doc.metadata
            for key in ("cause", "symptom", "description"):
                value = str(metadata.get(key) or "").strip()
                if value and value not in causes:
                    causes.append(value)
        return causes[:5]

    @staticmethod
    def _recommended_checks(documents: list[KnowledgeDocument]) -> list[str]:
        checks = []
        for doc in documents:
            raw = doc.metadata.get("checks") or doc.metadata.get("remedy") or doc.metadata.get("safe_action")
            values = raw if isinstance(raw, list) else [raw]
            for value in values:
                text = str(value or "").strip()
                if text and text not in checks:
                    checks.append(text)
        if not checks:
            for doc in documents[:3]:
                if doc.content and doc.content not in checks:
                    checks.append(doc.content)
        return checks[:6]

    @staticmethod
    def _sources(documents: list[KnowledgeDocument]) -> list[str]:
        sources = []
        for doc in documents:
            if doc.source and doc.source not in sources:
                sources.append(doc.source)
        return sources

    @staticmethod
    def _confidence(documents: list[KnowledgeDocument], required_sources: list[str]) -> float:
        if not documents:
            return 0.0
        best = max(doc.score for doc in documents)
        source_bonus = 0.05 if required_sources else 0.0
        diversity_bonus = min(0.1, 0.02 * len({doc.metadata.get("knowledge_type", "") for doc in documents}))
        return round(min(1.0, best + source_bonus + diversity_bonus), 4)
