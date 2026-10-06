"""RAG 侧的模型服务契约 HTTP 客户端。"""

from __future__ import annotations

import asyncio
import json
import math
import os
from copy import copy
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.llm.prompt import build_messages
from app.retrieval import Hit


class ModelServiceError(RuntimeError):
    def __init__(self, message: str, *, capability: str = "", timed_out: bool = False):
        super().__init__(message)
        self.capability = capability
        self.timed_out = timed_out


def _finite_float(value: Any) -> float:
    """响应中的数值必须是有限数，不能把布尔值或 NaN 当成有效模型输出。"""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ModelServiceError("model-service returned an invalid numeric value")
    return float(value)


class ModelServiceClient:
    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = str(base_url or os.getenv("MODEL_SERVICE_BASE_URL", "")).rstrip("/")
        if not self.base_url:
            raise ModelServiceError("MODEL_SERVICE_BASE_URL is not configured")
        self.timeout = float(os.getenv("MODEL_SERVICE_TIMEOUT_SECONDS", "30"))
        self.last_model_metadata: dict[str, Any] = {}

    def _post(self, path: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._request(path, payload)

    def _request(self, path: str, payload: Mapping[str, Any] | None = None) -> dict[str, Any]:
        capability = {"/v1/embeddings": "embedding", "/v1/rerank": "rerank", "/v1/chat/completions": "chat"}.get(path, "")
        data = None if payload is None else json.dumps(dict(payload), ensure_ascii=False).encode("utf-8")
        request = Request(self.base_url + path, data=data, method="GET" if payload is None else "POST", headers={"Content-Type": "application/json", "Accept": "application/json"})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            # 提供方错误正文可能含密钥、网关地址或原始输入，不传播到 Agent/API 日志。
            error.close()
            raise ModelServiceError("model-service HTTP %s" % error.code, capability=capability) from error
        except (URLError, TimeoutError, OSError, ValueError) as error:
            timed_out = isinstance(error, TimeoutError) or isinstance(getattr(error, "reason", None), TimeoutError)
            raise ModelServiceError("model-service request failed: %s" % type(error).__name__, capability=capability, timed_out=timed_out) from error
        if not isinstance(result, dict):
            raise ModelServiceError("model-service returned invalid JSON", capability=capability)
        if "error" in result:
            raise ModelServiceError("model-service returned an API error", capability=capability)
        return result

    def health(self, capability: str) -> bool:
        """仅 GET 健康观测；配置齐全、未探测及模拟响应均不能标成可达。"""
        report = self._request("/health")
        capabilities = report.get("capabilities")
        status = capabilities.get(capability) if isinstance(capabilities, dict) else None
        return bool(
            isinstance(status, dict)
            and status.get("ready") is True
            and status.get("reachable") is True
            and status.get("synthetic") is False
        )

    def embeddings(self, texts: list[str]) -> list[list[float]]:
        if not isinstance(texts, list) or any(not isinstance(text, str) or not text.strip() for text in texts):
            raise ModelServiceError("embedding inputs must be non-blank text strings")
        if not texts:
            return []
        payload = self._post("/v1/embeddings", {"model": os.getenv("MODEL_EMBEDDING_MODEL", "BAAI/bge-m3"), "input": texts})
        rows = payload.get("data")
        if not isinstance(rows, list) or len(rows) != len(texts):
            raise ModelServiceError("model-service returned an incomplete embedding set")
        vectors: dict[int, list[float]] = {}
        for row in rows:
            if not isinstance(row, dict):
                raise ModelServiceError("model-service returned an invalid embedding row")
            index = row.get("index")
            if type(index) is not int or index < 0 or index >= len(texts) or index in vectors:
                raise ModelServiceError("model-service returned invalid embedding indices")
            vector = row.get("embedding")
            if not isinstance(vector, list) or not vector:
                raise ModelServiceError("model-service returned an empty embedding")
            vectors[index] = [_finite_float(value) for value in vector]
        if len({len(vector) for vector in vectors.values()}) > 1:
            raise ModelServiceError("model-service returned inconsistent embedding dimensions")
        return [vectors[index] for index in range(len(texts))]

    def rerank(self, query: str, hits: list[Hit], top_n: int) -> list[Hit]:
        if not isinstance(query, str) or not query.strip() or type(top_n) is not int or top_n <= 0:
            raise ModelServiceError("rerank requires a non-blank query and positive top_n")
        payload = self._post("/v1/rerank", {"model": os.getenv("MODEL_RERANKER_MODEL", "BAAI/bge-reranker-v2-m3"), "query": query, "documents": [hit.text for hit in hits], "top_n": top_n})
        rows = payload.get("results")
        if not isinstance(rows, list) or not min(len(hits), top_n) <= len(rows) <= len(hits):
            raise ModelServiceError("model-service returned an incomplete rerank set")
        scores: dict[int, float] = {}
        for item in rows:
            if not isinstance(item, dict):
                raise ModelServiceError("model-service returned an invalid rerank row")
            index = item.get("index")
            if type(index) is not int or index < 0 or index >= len(hits) or index in scores:
                raise ModelServiceError("model-service returned invalid rerank indices")
            scores[index] = _finite_float(item.get("relevance_score"))
        # 只保留提供方真正评分的候选，不能给遗漏候选伪造 0 分后参与排序。
        ranked = sorted(scores, key=scores.__getitem__, reverse=True)[:top_n]
        result: list[Hit] = []
        for rank, index in enumerate(ranked, 1):
            value = copy(hits[index])
            value.score = scores[index]
            value.rank = rank
            value.metadata = {**dict(getattr(value, "metadata", None) or {}), "rerank_score": value.score, "stage": "rerank"}
            result.append(value)
        return result

    async def generate(self, query: str, evidence_text: str) -> str:
        if not isinstance(query, str) or not query.strip() or not isinstance(evidence_text, str) or not evidence_text.strip():
            raise ModelServiceError("chat requires a non-blank query and evidence")
        # 迁移到统一 Model Service 后仍保留原工业诊断、中文输出和 [n] 引用约束。
        messages = build_messages(query, evidence_text)
        response = await asyncio.to_thread(self._post, "/v1/chat/completions", {"model": os.getenv("MODEL_CHAT_MODEL", "deepseek-chat"), "messages": messages, "temperature": 0.1})
        try:
            content = response["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as error:
            raise ModelServiceError("model-service chat response is invalid") from error
        if not isinstance(content, str) or not content.strip():
            raise ModelServiceError("model-service returned an empty or non-text answer")
        metadata = response.get("model_metadata") or {}
        if not isinstance(metadata, dict):
            raise ModelServiceError("model-service chat metadata is invalid")
        self.last_model_metadata = dict(metadata)
        return content.strip()


class RemoteEmbedder:
    def __init__(self) -> None:
        self.client = ModelServiceClient()
        self._dimension: int | None = None

    @property
    def is_configured(self) -> bool:
        return bool(self.client.base_url)

    def health(self) -> bool:
        return self.client.health("embedding")

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        values = self.client.embeddings(texts)
        dimensions = {len(vector) for vector in values if vector}
        if len(dimensions) > 1:
            raise ModelServiceError("model-service returned inconsistent embedding dimensions")
        if dimensions:
            self._dimension = next(iter(dimensions))
        return values

    @property
    def dimension(self) -> int | None:
        return self._dimension

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

    def health(self) -> bool:
        return self.client.health("rerank")

    def rerank(self, query: str, hits: list[Hit], top_n: int = 5) -> list[Hit]:
        return self.client.rerank(query, hits, top_n)


class RemoteLLM:
    def __init__(self) -> None:
        self.client = ModelServiceClient()
        self.provider = "deepseek"
        self.model = os.getenv("MODEL_CHAT_MODEL", "deepseek-chat")
        self.last_model_metadata: dict[str, Any] = {}

    @property
    def is_configured(self) -> bool:
        return bool(self.client.base_url)

    def health(self) -> bool:
        return self.client.health("chat")

    async def generate(self, query: str, evidence_text: str) -> str:
        answer = await self.client.generate(query, evidence_text)
        self.last_model_metadata = dict(self.client.last_model_metadata or {})
        return answer


__all__ = ["ModelServiceClient", "ModelServiceError", "RemoteEmbedder", "RemoteReranker", "RemoteLLM"]
