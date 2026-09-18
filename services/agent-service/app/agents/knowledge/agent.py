"""工业知识检索 Agent，负责生成可追踪 Evidence Pack。"""

from __future__ import annotations

import re
from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.validator import KnowledgeDocument, KnowledgeResult

from .graph import build_knowledge_graph


_ALARM_CODE_RE = re.compile(r"\b[A-Z]?\d{3,6}\b", re.IGNORECASE)


class KnowledgeAgent:
    name = "knowledge"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.graph = build_knowledge_graph()

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
        payload = {"query": task} if isinstance(task, str) else dict(task or {})
        output = self.graph.invoke({"agent": self, "request": payload})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Knowledge LangGraph 未生成结果")
        return result

    @staticmethod
    def _classify_query(query: str, filters: Mapping[str, Any], required_sources: list[str]) -> str:
        text = " ".join([query, " ".join(str(item) for item in required_sources), " ".join(str(value) for value in filters.values())]).lower()
        if filters.get("alarm_code") or _ALARM_CODE_RE.search(query):
            return "alarm"
        if any(token in text for token in ("manual", "手册", "维修手册")):
            return "manual"
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
        if query_type == "manual" and not selected.get("knowledge_type"):
            selected["knowledge_type"] = "manual"
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
                "content": doc.content,
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
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values

    @staticmethod
    def _confidence(documents: list[KnowledgeDocument], required_sources: list[str]) -> float:
        if not documents:
            return 0.0
        best = max(doc.score for doc in documents)
        source_bonus = 0.05 if required_sources else 0.0
        diversity_bonus = min(0.1, 0.02 * len({doc.metadata.get("knowledge_type", "") for doc in documents}))
        return round(min(1.0, best + source_bonus + diversity_bonus), 4)

    @classmethod
    def _confidence_from_documents(cls, documents: list[Mapping[str, Any]], required_sources: list[str]) -> float:
        normalized = cls._deduplicate_documents(documents)
        return cls._confidence(normalized, required_sources)

    def _build_result(
        self,
        request: Mapping[str, Any],
        query: str,
        query_type: str,
        documents: list[Mapping[str, Any]],
        evidence: list[Mapping[str, Any]],
        status: str,
        observations: list[Mapping[str, Any]],
        validation_findings: list[str],
    ) -> KnowledgeResult:
        normalized = self._deduplicate_documents(documents)
        required_sources = list(request.get("required_sources") or [])
        confidence = self._confidence(normalized, required_sources)
        raw_results = [item.get("result") or {} for item in observations if isinstance(item, Mapping)]
        backend_status = next((str(item.get("connection_status")) for item in raw_results if item.get("connection_status")), "unknown")
        source = next((str(item.get("source")) for item in raw_results if item.get("source")), "rag-service-compatible")
        warning_items = [str(item.get("warning")) for item in raw_results if item.get("warning")]
        warning_items.extend(str(item.get("error")) for item in observations if item.get("error"))
        degraded = any(bool(item.get("degraded")) for item in raw_results)
        summary = self._summary(query, normalized, status)
        if validation_findings and status != "completed":
            summary += " 当前结果不满足所需证据覆盖条件。"
        return KnowledgeResult(
            query=query,
            status=status,
            query_type=query_type,
            summary=summary,
            evidence=[dict(item) for item in evidence],
            possible_causes=self._possible_causes(normalized),
            recommended_checks=self._recommended_checks(normalized),
            confidence=confidence,
            documents=normalized,
            sources=self._sources(normalized),
            filters=dict(request.get("filters") or {}),
            total=len(normalized),
            backend_status=backend_status,
            degraded=degraded,
            warning="；".join(self._dedupe(warning_items)),
            source=source,
            validation_findings=list(validation_findings),
            stop_reason="evidence_ready" if status == "completed" else "insufficient_evidence",
            retrieval_trace=[dict(item) for item in observations],
        )
