"""RAG Service 客户端边界。

生产环境通过 HTTP 调用独立 rag-service；本地索引只作为无外部服务时的 Demo 回退。
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Mapping
from urllib.request import Request, urlopen

from .index import RAGIndex, build_default_index


_KNOWN_CONTROLLER_TRANSLATIONS = (
    ("Pointer with value zero is freed: {hex}", "控制器检测到空指针被释放（底层软件指针异常）"),
    ("Wrong memory pointer is freed: {hex}", "控制器检测到错误内存指针被释放（底层软件内存异常）"),
    ("The pointer value is 0", "控制器检测到指针值为 0（底层软件指针异常）"),
    ("An error occurred in controller software.", "控制器软件发生错误。"),
    ("Power off and restart the controller.", "关闭并重新启动控制器。"),
    ("Update the controller software.", "升级控制器软件。"),
    ("Contact ELITE ROBOTS after-sales service for assistance.", "联系设备厂家售后服务。"),
)


def _operator_text(value: Any) -> str:
    """Translate known low-level controller messages at the read boundary."""

    text = str(value or "")
    for source, target in _KNOWN_CONTROLLER_TRANSLATIONS:
        text = text.replace(source, target)
    return text


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
        explicit_fallback = os.getenv("RAG_ALLOW_LOCAL_FALLBACK")
        if explicit_fallback is None:
            self.allow_fallback = os.getenv("APP_ENV", "development").strip().lower() not in {"prod", "production"}
        else:
            self.allow_fallback = explicit_fallback.lower() in {"1", "true", "yes"}
        self.fallback = fallback or build_default_index()

    def search(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None) -> Dict[str, Any]:
        selected_filters = dict(filters or {})
        payload = {
            "query": self._build_remote_query(query, selected_filters),
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
                result = self._humanize_result(self.fallback.search(query, limit=limit, filters=self._fallback_filters(selected_filters)))
                result["connection_status"] = "remote_unavailable_fallback"
                result["degraded"] = True
                result["remote_base_url"] = self.base_url
                result["warning"] = "%s: %s" % (type(error).__name__, error)
                return result
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        result = self._humanize_result(self.fallback.search(query, limit=limit, filters=self._fallback_filters(selected_filters)))
        result["connection_status"] = "local_fallback"
        result["degraded"] = True
        result["remote_base_url"] = ""
        result["warning"] = "RAG_SERVICE_BASE_URL 未配置，当前使用本地演示知识索引。"
        return result

    @staticmethod
    def _humanize_result(result: Dict[str, Any]) -> Dict[str, Any]:
        """Keep legacy/local indexed documents readable without re-ingestion."""

        payload = dict(result or {})
        documents = []
        for item in payload.get("documents") or []:
            document = dict(item)
            raw_content = str(document.get("content") or "")
            document.setdefault("raw_content", raw_content)
            document["content"] = _operator_text(raw_content)
            documents.append(document)
        payload["documents"] = documents
        return payload

    @staticmethod
    def _build_remote_query(query: str, filters: Mapping[str, Any]) -> str:
        """Put structured identifiers into the remote natural-language query.

        The standalone RAG API filters by corpus, while alarm/component fields
        are carried in chunk metadata. Including them in the query preserves
        exact-code recall without changing the RAG service contract.
        """
        text = str(query or "").strip()
        additions = []
        for key, label in (("alarm_code", "报警码"), ("error_code", "故障码"), ("component", "部件"), ("device_id", "设备")):
            value = str(filters.get(key) or "").strip()
            if value and value.lower() not in text.lower():
                additions.append(f"{label} {value}")
        return " ".join([text, *additions]).strip()

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
        # The active machine is the hard retrieval boundary. Alarm/component
        # identifiers remain query hints because older repair records may not
        # have those metadata fields populated; hard-filtering them would hide
        # valid procedures for the same machine.
        for key in ("device_id", "device_model"):
            value = filters.get(key)
            if value not in (None, "", [], {}):
                result[key] = value
        return result

    def _fallback_filters(self, filters: Mapping[str, Any]) -> Dict[str, Any]:
        """Keep machine scope when the local fallback index has that metadata.

        The bundled demo index predates device metadata. In that degraded mode
        the device ID remains in the query text, while remote RAG still applies
        the hard metadata boundary.
        """

        selected = {
            key: value
            for key, value in dict(filters or {}).items()
            if key not in {"alarm_code", "error_code", "component"}
            and value not in (None, "", [], {})
        }
        records = getattr(self.fallback, "_records", {})
        has_device_metadata = any(str(item.get("device_id") or "").strip() for item in records.values())
        if not has_device_metadata:
            selected.pop("device_id", None)
            selected.pop("device_model", None)
        return selected

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
            corpus_to_type = {
                "alarms": "alarm",
                "cases": "case",
                "manuals": "manual",
                "sop": "sop",
                "bom": "bom",
            }
            if not metadata.get("knowledge_type") and metadata.get("corpus") in corpus_to_type:
                metadata["knowledge_type"] = corpus_to_type[metadata["corpus"]]
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
                    "content": _operator_text(hit.get("text") or ""),
                    "raw_content": str(hit.get("text") or ""),
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
                return self._post("/documents/ingest", payload)
            except Exception:
                if not self.allow_fallback:
                    raise
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        return self.fallback.ingest_jsonl(path, collection=collection)

    def upsert(self, record: Mapping[str, Any], collection: str = "") -> Dict[str, Any]:
        """写入一条经验记录；远程 RAG 不支持时按配置回退到本地索引。"""

        payload = {"record": dict(record), "collection": collection}
        if self.base_url:
            try:
                normalized = dict(record)
                normalized.setdefault("document_id", str(normalized.get("experience_id") or normalized.get("id") or ""))
                normalized.setdefault("content", str(normalized.get("content") or ""))
                normalized.setdefault("metadata", {key: value for key, value in normalized.items() if key not in {"content", "document_id"}})
                normalized["collection"] = collection or normalized.get("collection") or "maint_fault_events"
                return self._post("/documents/upsert", normalized)
            except Exception:
                if not self.allow_fallback:
                    raise
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        loaded = self.fallback.upsert([record], collection=collection)
        return {"loaded": loaded, "backend": self.fallback.backend}

    def fetch_document(self, document_id: str) -> Dict[str, Any]:
        payload = {"document_id": str(document_id or "")}
        if self.base_url:
            try:
                return self._get("/documents/%s" % payload["document_id"])
            except Exception:
                if not self.allow_fallback:
                    raise
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        return self.fallback.fetch_document(payload["document_id"])

    def fetch_chunk(self, document_id: str, chunk_id: str = "") -> Dict[str, Any]:
        payload = {"document_id": str(document_id or ""), "chunk_id": str(chunk_id or "")}
        if self.base_url:
            try:
                return self._get("/documents/%s/chunks/%s" % (payload["document_id"], payload["chunk_id"]))
            except Exception:
                if not self.allow_fallback:
                    raise
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
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
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
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
