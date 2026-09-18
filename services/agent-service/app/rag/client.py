"""RAG Service 客户端边界。

生产环境通过 HTTP 调用独立 rag-service；本地索引只作为无外部服务时的 Demo 回退。
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Mapping
from urllib.request import Request, urlopen

from .index import RAGIndex, build_default_index


class RAGServiceClient:
    backend = "rag-service"

    def __init__(self, base_url: str | None = None, fallback: RAGIndex | None = None) -> None:
        # Remote access is an explicit application-wiring decision. Keeping a
        # bare client local prevents a previously loaded project .env from
        # changing isolated agent/library behavior; the orchestrator injects
        # RAG_SERVICE_BASE_URL when it builds the running service graph.
        configured_base_url = "" if base_url is None else base_url
        self.base_url = str(configured_base_url).strip().rstrip("/")
        self.timeout = float(os.getenv("RAG_SERVICE_TIMEOUT_SECONDS", "15"))
        self.allow_fallback = os.getenv("RAG_ALLOW_LOCAL_FALLBACK", "true").lower() in {"1", "true", "yes"}
        self.fallback = fallback or build_default_index()

    def search(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None) -> Dict[str, Any]:
        selected_filters = dict(filters or {})
        payload = {
            "query": query,
            "top_n": limit,
            "filters": self._normalize_remote_filters(selected_filters),
        }
        if self.base_url:
            try:
                result = self._normalize_remote_search(self._post("/search", payload), query, selected_filters)
                result.setdefault("backend", "remote-rag-service")
                result.setdefault("connection_status", "connected")
                result.setdefault("degraded", False)
                return result
            except Exception as error:
                if not self.allow_fallback:
                    raise
                result = self.fallback.search(query, limit=limit, filters=filters)
                result["connection_status"] = "remote_unavailable_fallback"
                result["degraded"] = True
                result["remote_base_url"] = self.base_url
                result["warning"] = "%s: %s" % (type(error).__name__, error)
                return result
        result = self.fallback.search(query, limit=limit, filters=filters)
        result["connection_status"] = "local_fallback"
        result["degraded"] = True
        result["remote_base_url"] = ""
        result["warning"] = "RAG_SERVICE_BASE_URL 未配置，当前使用本地演示知识索引。"
        return result

    @staticmethod
    def _normalize_remote_filters(filters: Mapping[str, Any]) -> Dict[str, Any]:
        """Map Agent knowledge filters to fields indexed by the RAG service."""

        corpus_by_type = {
            "alarm": "alarms",
            "case": "cases",
            "sop": "sop",
            "manual": "manuals",
            "bom": "bom",
        }
        result: Dict[str, Any] = {}
        knowledge_type = str(filters.get("knowledge_type") or "").strip().lower()
        if knowledge_type in corpus_by_type:
            result["corpus"] = corpus_by_type[knowledge_type]
        for key in ("corpus", "source_format", "source_name", "project_id", "tenant_id"):
            value = filters.get(key)
            if value not in (None, "", [], {}):
                result[key] = value
        # alarm_code, component and device_id remain in the natural-language
        # query because the current chunk metadata does not index them as
        # top-level filter fields.
        return result

    @staticmethod
    def _normalize_remote_search(
        result: Mapping[str, Any],
        query: str,
        filters: Mapping[str, Any] | None,
    ) -> Dict[str, Any]:
        """Adapt the standalone RAG ``hits`` contract to Agent ``documents``.

        The retrieval service intentionally exposes chunk-oriented fields while
        the Agent tools expose document-oriented fields. Keeping this adapter at
        the HTTP boundary lets both services retain their native contracts.
        """

        payload = dict(result)
        documents = []
        for hit in result.get("hits") or []:
            if not isinstance(hit, Mapping):
                continue
            metadata = dict(hit.get("metadata") or {})
            chunk_id = str(hit.get("chunk_id") or hit.get("id") or "")
            source = str(
                metadata.get("source_name")
                or metadata.get("source_path")
                or hit.get("source")
                or "remote-rag-service"
            )
            documents.append(
                {
                    "document_id": chunk_id,
                    "chunk_id": chunk_id,
                    "title": source,
                    "content": str(hit.get("text") or ""),
                    "source": source,
                    "score": hit.get("score", 0.0),
                    "metadata": metadata,
                }
            )
        payload["query"] = str(result.get("query") or query)
        payload["filters"] = dict(filters or {})
        payload["documents"] = documents
        payload["total"] = len(documents)
        payload["found"] = bool(documents)
        payload["success"] = True
        payload["source"] = "remote-rag-service"
        return payload

    def ingest_jsonl(self, path: str, collection: str = "") -> Dict[str, Any]:
        payload = {"path": path, "collection": collection}
        if self.base_url:
            try:
                return self._post("/ingest", payload)
            except Exception:
                if not self.allow_fallback:
                    raise
        return self.fallback.ingest_jsonl(path, collection=collection)

    def upsert(self, record: Mapping[str, Any], collection: str = "") -> Dict[str, Any]:
        """写入一条经验记录；远程 RAG 不支持时按配置回退到本地索引。"""

        payload = {"record": dict(record), "collection": collection}
        if self.base_url:
            try:
                return self._post("/upsert", payload)
            except Exception:
                if not self.allow_fallback:
                    raise
        loaded = self.fallback.upsert([record], collection=collection)
        return {"loaded": loaded, "backend": self.fallback.backend}

    def fetch_document(self, document_id: str) -> Dict[str, Any]:
        payload = {"document_id": str(document_id or "")}
        if self.base_url:
            try:
                return self._post("/fetch_document", payload)
            except Exception:
                if not self.allow_fallback:
                    raise
        return self.fallback.fetch_document(payload["document_id"])

    def fetch_chunk(self, document_id: str, chunk_id: str = "") -> Dict[str, Any]:
        payload = {"document_id": str(document_id or ""), "chunk_id": str(chunk_id or "")}
        if self.base_url:
            try:
                return self._post("/fetch_chunk", payload)
            except Exception:
                if not self.allow_fallback:
                    raise
        return self.fallback.fetch_chunk(payload["document_id"], payload["chunk_id"])

    def status(self) -> Dict[str, Any]:
        if self.base_url:
            try:
                # The standalone RAG service exposes readiness as /health.
                # Keep the agent-facing status shape while using that public
                # contract instead of relying on a non-existent /status route.
                result = self._get("/health")
                result.setdefault("backend", "remote-rag-service")
                result["connected"] = True
                result["connection_status"] = "connected"
                result["remote_base_url"] = self.base_url
                # HTTP connectivity and dependency readiness are separate
                # concerns. A remote service can be reachable while one of its
                # optional stages (for example the reranker) is unavailable.
                component_keys = ("milvus", "whoosh", "embedding", "reranker", "llm")
                result["degraded"] = not all(bool(result.get(key)) for key in component_keys)
                return result
            except Exception as error:
                if not self.allow_fallback:
                    raise
                return {
                    "backend": "local-rag-fallback",
                    "connected": False,
                    "degraded": True,
                    "connection_status": "remote_unavailable_fallback",
                    "remote_base_url": self.base_url,
                    "warning": "%s: %s" % (type(error).__name__, error),
                    "record_count": self.fallback.count(),
                    "collections": self.fallback.collections(),
                }
        return {
            "backend": "local-rag-fallback",
            "connected": False,
            "degraded": True,
            "connection_status": "local_fallback",
            "remote_base_url": "",
            "warning": "RAG_SERVICE_BASE_URL 未配置，当前使用本地演示知识索引。",
            "record_count": self.fallback.count(),
            "collections": self.fallback.collections(),
        }

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        request = Request(
            self.base_url + path,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        with urlopen(request, timeout=self.timeout) as response:
            value = json.loads(response.read().decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("RAG Service 返回格式错误")
        return value

    def _get(self, path: str) -> Dict[str, Any]:
        request = Request(self.base_url + path, method="GET", headers={"Accept": "application/json"})
        with urlopen(request, timeout=self.timeout) as response:
            value = json.loads(response.read().decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("RAG Service 返回格式错误")
        return value
