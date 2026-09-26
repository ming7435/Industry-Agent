"""Provider selection and deterministic test mode for Model Service."""

from __future__ import annotations

import hashlib
import json
import os
import time
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .base import ProviderError


class _FakeProvider:
    name = "fake"

    @staticmethod
    def chat(payload: Mapping[str, Any]) -> dict[str, Any]:
        messages = list(payload.get("messages") or [])
        user = next((str(item.get("content") or "") for item in reversed(messages) if isinstance(item, Mapping) and item.get("role") == "user"), "")
        system = " ".join(str(item.get("content") or "") for item in messages if isinstance(item, Mapping) and item.get("role") == "system")
        content = "[fake-model] " + user[:500]
        if "诊断智能体" in system:
            content = json.dumps({
                "summary": "设备异常需要检查", "diagnosis": "依据事件与工具证据，检查报警关联部件",
                "confidence": 0.7, "next_action": "核对维修手册与工程图纸",
                "evidence": ["报警定义和事件快照"], "recommendation": "按维修方案复核后处理",
            }, ensure_ascii=False)
        return {
            "id": "fake-chat-" + hashlib.sha1(user.encode("utf-8")).hexdigest()[:12],
            "object": "chat.completion",
            "model": str(payload.get("model") or "fake-chat"),
            "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
        }

    @staticmethod
    def embeddings(payload: Mapping[str, Any]) -> dict[str, Any]:
        raw = payload.get("input") or []
        inputs = [raw] if isinstance(raw, str) else list(raw)
        vectors = []
        for value in inputs:
            digest = hashlib.sha256(str(value).encode("utf-8")).digest()
            base = [round((byte / 255.0) * 2 - 1, 6) for byte in digest]
            vectors.append((base * ((1024 + len(base) - 1) // len(base)))[:1024])
        return {"object": "list", "model": str(payload.get("model") or "fake-embedding"), "data": [{"object": "embedding", "index": i, "embedding": vector} for i, vector in enumerate(vectors)]}

    @staticmethod
    def rerank(payload: Mapping[str, Any]) -> dict[str, Any]:
        query = str(payload.get("query") or "").lower()
        documents = list(payload.get("documents") or [])
        results = []
        for index, document in enumerate(documents):
            text = str(document).lower()
            score = sum(1 for token in query.split() if token and token in text) / max(1, len(query.split()))
            results.append({"index": index, "relevance_score": float(score)})
        results.sort(key=lambda item: item["relevance_score"], reverse=True)
        return {"model": str(payload.get("model") or "fake-reranker"), "results": results[: int(payload.get("top_n") or len(results))]}


class _OpenAICompatibleProvider:
    def __init__(self, name: str, base_url: str, api_key: str, model: str, embedding_model: str, reranker_model: str) -> None:
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.embedding_model = embedding_model
        self.reranker_model = reranker_model

    def _post(self, path: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            raise ProviderError("%s API key is not configured" % self.name)
        request = Request(
            self.base_url + path,
            data=json.dumps(dict(payload), ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={"Authorization": "Bearer " + self.api_key, "Content-Type": "application/json", "Accept": "application/json"},
        )
        attempts = max(1, min(5, int(os.getenv("MODEL_PROVIDER_MAX_ATTEMPTS", "2"))))
        timeout = float(os.getenv("MODEL_PROVIDER_TIMEOUT_SECONDS", "30"))
        for attempt in range(attempts):
            try:
                with urlopen(request, timeout=timeout) as response:
                    value = json.loads(response.read().decode("utf-8"))
                break
            except HTTPError as error:
                detail = error.read().decode("utf-8", errors="replace")[:500]
                if error.code not in {408, 429, 500, 502, 503, 504} or attempt + 1 >= attempts:
                    raise ProviderError("%s provider HTTP %s: %s" % (self.name, error.code, detail)) from error
            except (URLError, TimeoutError, OSError) as error:
                if attempt + 1 >= attempts:
                    raise ProviderError("%s provider request failed: %s" % (self.name, error)) from error
            except ValueError as error:
                raise ProviderError("%s provider returned invalid JSON: %s" % (self.name, error)) from error
            time.sleep(min(0.5, 0.05 * (2 ** attempt)))
        if not isinstance(value, dict):
            raise ProviderError("%s provider returned invalid JSON" % self.name)
        return value

    def chat(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        requested_model = str(payload.get("model") or "").strip()
        # Agent/RAG clients use ``deepseek-chat`` as their generic contract
        # default.  When the configured chat provider is SiliconFlow that
        # model name is not valid there, so resolve it to the provider's
        # configured model instead of forwarding a foreign provider name.
        if not requested_model or (self.name == "siliconflow" and requested_model == "deepseek-chat"):
            requested_model = self.model
        return self._post("/chat/completions", {**dict(payload), "model": requested_model})

    def embeddings(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._post("/embeddings", {**dict(payload), "model": payload.get("model") or self.embedding_model})

    def rerank(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._post("/rerank", {**dict(payload), "model": payload.get("model") or self.reranker_model})


class ModelGateway:
    """Resolve one explicit provider; fake mode is deterministic and local."""

    def __init__(self) -> None:
        mode = os.getenv("MODEL_PROVIDER", "fake").strip().lower()
        if mode in {"fake", "test", "ci"}:
            self.chat_provider: Any = _FakeProvider()
            self.aux_provider: Any = self.chat_provider
        elif mode in {"remote", "deepseek", "siliconflow"}:
            siliconflow = _OpenAICompatibleProvider(
                "siliconflow",
                os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1"),
                os.getenv("SILICONFLOW_API_KEY", ""),
                os.getenv("SILICONFLOW_CHAT_MODEL")
                or os.getenv("SILICONFLOW_VISION_MODEL")
                or "deepseek-ai/DeepSeek-V4-Flash",
                os.getenv("SILICONFLOW_EMBEDDING_MODEL", "BAAI/bge-m3"),
                os.getenv("SILICONFLOW_RERANKER_MODEL", "BAAI/bge-reranker-v2-m3"),
            )
            deepseek = _OpenAICompatibleProvider(
                "deepseek",
                os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"),
                os.getenv("DEEPSEEK_API_KEY", ""),
                os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                "",
                "",
            )
            chat_provider = os.getenv("MODEL_CHAT_PROVIDER", "deepseek").strip().lower()
            self.chat_provider = siliconflow if chat_provider in {"siliconflow", "sf"} else deepseek
            self.aux_provider = siliconflow
        else:
            raise ProviderError("unsupported MODEL_PROVIDER: %s" % mode)

    @property
    def name(self) -> str:
        if self.chat_provider is self.aux_provider:
            return str(self.chat_provider.name)
        return "%s+%s" % (self.chat_provider.name, self.aux_provider.name)

    def chat(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return dict(self.chat_provider.chat(payload))

    def embeddings(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return dict(self.aux_provider.embeddings(payload))

    def rerank(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return dict(self.aux_provider.rerank(payload))

    def vision(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        if self.chat_provider is self.aux_provider:
            return dict(self.chat_provider.chat(payload))
        return dict(self.aux_provider.chat({**dict(payload), "model": os.getenv("SILICONFLOW_VISION_MODEL", "Qwen/Qwen2.5-VL-72B-Instruct")}))


__all__ = ["ModelGateway"]
