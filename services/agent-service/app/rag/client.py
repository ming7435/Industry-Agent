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
        self.base_url = (base_url or os.getenv("RAG_SERVICE_BASE_URL", "")).strip().rstrip("/")
        self.timeout = float(os.getenv("RAG_SERVICE_TIMEOUT_SECONDS", "15"))
        self.allow_fallback = os.getenv("RAG_ALLOW_LOCAL_FALLBACK", "true").lower() in {"1", "true", "yes"}
        self.fallback = fallback or build_default_index()

    def search(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None) -> Dict[str, Any]:
        payload = {"query": query, "limit": limit, "filters": dict(filters or {})}
        if self.base_url:
            try:
                return self._post("/search", payload)
            except Exception:
                if not self.allow_fallback:
                    raise
        return self.fallback.search(query, limit=limit, filters=filters)

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

    def status(self) -> Dict[str, Any]:
        if self.base_url:
            try:
                return self._get("/status")
            except Exception:
                if not self.allow_fallback:
                    raise
        return {
            "backend": "local-rag-fallback",
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
