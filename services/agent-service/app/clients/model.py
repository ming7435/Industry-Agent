"""Agent-side client for the Model Service contract."""

from __future__ import annotations

import json
import os
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class ModelServiceError(RuntimeError):
    """Normalized model gateway transport error."""


class ModelServiceClient:
    provider = "model-service"

    def __init__(self, base_url: str | None = None, model: str | None = None) -> None:
        self.base_url = str(base_url or os.getenv("MODEL_SERVICE_BASE_URL", "")).rstrip("/")
        self.model = str(model or os.getenv("MODEL_CHAT_MODEL", "deepseek-chat"))
        self.timeout = float(os.getenv("MODEL_SERVICE_TIMEOUT_SECONDS", "90"))

    @property
    def available(self) -> bool:
        return bool(self.base_url)

    def chat(self, messages: list[Mapping[str, Any]], tools: list[Mapping[str, Any]] | None = None, tool_choice: Any = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"model": self.model, "messages": [dict(item) for item in messages]}
        if tools:
            payload["tools"] = [dict(item) for item in tools]
        if tool_choice is not None:
            payload["tool_choice"] = tool_choice
        return self._post("/v1/chat/completions", payload)

    def embeddings(self, inputs: str | list[str], model: str = "") -> dict[str, Any]:
        return self._post("/v1/embeddings", {"model": model or "BAAI/bge-m3", "input": inputs})

    def rerank(self, query: str, documents: list[str], top_n: int = 5, model: str = "") -> dict[str, Any]:
        return self._post("/v1/rerank", {"model": model or "BAAI/bge-reranker-v2-m3", "query": query, "documents": documents, "top_n": top_n})

    def _post(self, path: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        if not self.base_url:
            raise ModelServiceError("MODEL_SERVICE_BASE_URL is not configured")
        request = Request(self.base_url + path, data=json.dumps(dict(payload), ensure_ascii=False).encode("utf-8"), method="POST", headers={"Content-Type": "application/json", "Accept": "application/json"})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                value = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:500]
            raise ModelServiceError("model-service HTTP %s: %s" % (error.code, detail)) from error
        except (URLError, TimeoutError, OSError, ValueError) as error:
            raise ModelServiceError("model-service request failed: %s" % error) from error
        if not isinstance(value, dict):
            raise ModelServiceError("model-service returned invalid JSON")
        return value


__all__ = ["ModelServiceClient", "ModelServiceError"]
