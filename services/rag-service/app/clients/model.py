"""RAG-side HTTP client for the Model Service contract."""

from __future__ import annotations

import asyncio
import json
import os
from copy import copy
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.retrieval import Hit


class ModelServiceError(RuntimeError):
    pass


class ModelServiceClient:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = str(base_url or os.getenv("MODEL_SERVICE_BASE_URL", "")).rstrip("/")
        if not self.base_url:
            raise ModelServiceError("MODEL_SERVICE_BASE_URL is not configured")
        self.timeout = float(os.getenv("MODEL_SERVICE_TIMEOUT_SECONDS", "30"))

    def _post(self, path: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        request = Request(self.base_url + path, data=json.dumps(dict(payload), ensure_ascii=False).encode("utf-8"), method="POST", headers={"Content-Type": "application/json", "Accept": "application/json"})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:500]
            raise ModelServiceError("model-service HTTP %s: %s" % (error.code, detail)) from error
        except (URLError, TimeoutError, OSError, ValueError) as error:
            raise ModelServiceError("model-service request failed: %s" % error) from error
        if not isinstance(result, dict):
            raise ModelServiceError("model-service returned invalid JSON")
        return result

    def embeddings(self, texts: list[str]) -> list[list[float]]:
        payload = self._post("/v1/embeddings", {"model": os.getenv("MODEL_EMBEDDING_MODEL", "BAAI/bge-m3"), "input": texts})
        rows = sorted(list(payload.get("data") or []), key=lambda item: int(item.get("index", 0)))
        return [[float(value) for value in row.get("embedding") or []] for row in rows]

    def rerank(self, query: str, hits: list[Hit], top_n: int) -> list[Hit]:
        payload = self._post("/v1/rerank", {"model": os.getenv("MODEL_RERANKER_MODEL", "BAAI/bge-reranker-v2-m3"), "query": query, "documents": [hit.text for hit in hits], "top_n": top_n})
        scores = {int(item.get("index", -1)): float(item.get("relevance_score", 0.0)) for item in payload.get("results") or []}
        ranked = sorted(enumerate(hits), key=lambda pair: scores.get(pair[0], 0.0), reverse=True)[:top_n]
        result: list[Hit] = []
        for rank, (index, hit) in enumerate(ranked, 1):
            value = copy(hit)
            value.score = scores.get(index, 0.0)
            value.rank = rank
            value.metadata = {**dict(getattr(hit, "metadata", None) or {}), "rerank_score": value.score, "stage": "rerank"}
            result.append(value)
        return result

    async def generate(self, query: str, evidence_text: str) -> str:
        messages = [
            {"role": "system", "content": "Use only supplied industrial evidence and state uncertainty."},
            {"role": "user", "content": "Query: %s\nEvidence:\n%s" % (query, evidence_text)},
        ]
        response = await asyncio.to_thread(self._post, "/v1/chat/completions", {"model": os.getenv("MODEL_CHAT_MODEL", "deepseek-chat"), "messages": messages, "temperature": 0.1})
        try:
            return str(response["choices"][0]["message"].get("content") or "").strip()
        except (KeyError, IndexError, TypeError) as error:
            raise ModelServiceError("model-service chat response is invalid") from error


class RemoteEmbedder:
    def __init__(self) -> None:
        self.client = ModelServiceClient()

    @property
    def is_configured(self) -> bool:
        return bool(self.client.base_url)

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return self.client.embeddings(texts)

    def embed_query(self, query: str) -> list[float]:
        values = self.embed_texts([query])
        if not values:
            raise ModelServiceError("model-service returned no embedding")
        return values[0]


class RemoteReranker:
    def __init__(self) -> None:
        self.client = ModelServiceClient()

    @property
    def is_configured(self) -> bool:
        return bool(self.client.base_url)

    def rerank(self, query: str, hits: list[Hit], top_n: int = 5) -> list[Hit]:
        return self.client.rerank(query, hits, top_n)


class RemoteLLM:
    def __init__(self) -> None:
        self.client = ModelServiceClient()

    @property
    def is_configured(self) -> bool:
        return bool(self.client.base_url)

    async def generate(self, query: str, evidence_text: str) -> str:
        return await self.client.generate(query, evidence_text)


__all__ = ["ModelServiceClient", "ModelServiceError", "RemoteEmbedder", "RemoteReranker", "RemoteLLM"]
