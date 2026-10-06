"""模型服务的提供方选择和确定性测试模式。"""

from __future__ import annotations

import hashlib
import json
import math
import os
import time
from datetime import datetime, timezone
from threading import Lock
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
        timeout = float(os.getenv("MODEL_PROVIDER_TIMEOUT_SECONDS", "90"))
        for attempt in range(attempts):
            try:
                with urlopen(request, timeout=timeout) as response:
                    value = json.loads(response.read().decode("utf-8"))
                break
            except HTTPError as error:
                # 上游正文可能回显 Authorization、密钥或业务上下文，不能对外透传。
                error.close()
                if error.code not in {408, 429, 500, 502, 503, 504} or attempt + 1 >= attempts:
                    raise ProviderError("%s provider HTTP %s" % (self.name, error.code)) from None
            except (URLError, TimeoutError, OSError) as error:
                if attempt + 1 >= attempts:
                    raise ProviderError("%s provider request failed (%s)" % (self.name, type(error).__name__)) from None
            except ValueError as error:
                raise ProviderError("%s provider returned invalid JSON" % self.name) from None
            time.sleep(min(0.5, 0.05 * (2 ** attempt)))
        if not isinstance(value, dict):
            raise ProviderError("%s provider returned invalid JSON" % self.name)
        return value

    def resolved_model(self, payload: Mapping[str, Any], capability: str) -> str:
        requested_model = str(payload.get("model") or "").strip()
        # Agent/RAG 客户端使用 ``deepseek-chat`` 作为通用契约默认值。
        # 当对话提供方是 SiliconFlow 时，该名称可能不是有效的模型名，
        # 因此改写为提供方配置的模型，不把其他提供方的名称直接转发。
        defaults = {"embedding": self.embedding_model, "rerank": self.reranker_model}
        if capability in defaults:
            return requested_model or defaults[capability]
        if not requested_model or (self.name == "siliconflow" and requested_model == "deepseek-chat"):
            return self.model
        return requested_model

    def chat(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._post("/chat/completions", {**dict(payload), "model": self.resolved_model(payload, "chat")})

    def embeddings(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._post("/embeddings", {**dict(payload), "model": self.resolved_model(payload, "embedding")})

    def rerank(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._post("/rerank", {**dict(payload), "model": self.resolved_model(payload, "rerank")})


class ModelGateway:
    """保持显式提供方；根据真实业务调用观测能力，不用健康检查生成内容。"""

    def __init__(self) -> None:
        mode = os.getenv("MODEL_PROVIDER", "fake").strip().lower()
        if mode in {"fake", "test", "ci"}:
            environment = os.getenv("APP_ENV", "development").strip().lower()
            if environment in {"prod", "production"}:
                raise ProviderError("fake model provider is forbidden in production")
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
                os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
                os.getenv("DEEPSEEK_API_KEY", ""),
                os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
                "",
                "",
            )
            chat_provider = os.getenv("MODEL_CHAT_PROVIDER", "deepseek").strip().lower()
            if chat_provider not in {"deepseek", "siliconflow", "sf"}:
                raise ProviderError("unsupported MODEL_CHAT_PROVIDER")
            self.chat_provider = siliconflow if chat_provider in {"siliconflow", "sf"} else deepseek
            self.aux_provider = siliconflow
        else:
            raise ProviderError("unsupported MODEL_PROVIDER: %s" % mode)
        self.vision_model = "fake-chat" if self.aux_provider.name == "fake" else (os.getenv("SILICONFLOW_VISION_MODEL", "").strip() or "Qwen/Qwen2.5-VL-72B-Instruct")
        self._observation_lock = Lock()
        self._observations: dict[tuple[str, str, str], dict[str, Any]] = {}

    @property
    def name(self) -> str:
        """返回对话模型提供方名称。

        健康检查中的 ``provider`` 只代表聊天模型，避免把向量和重排
        提供方误报成 DeepSeek 的回退模型。辅助提供方通过
        :attr:`aux_name` 单独暴露。
        """

        return str(self.chat_provider.name)

    @property
    def aux_name(self) -> str:
        """返回向量、重排和视觉能力使用的辅助提供方名称。"""

        return str(self.aux_provider.name)

    def chat(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._invoke(self.chat_provider.chat, payload, "chat", self.chat_provider)

    def embeddings(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._invoke(self.aux_provider.embeddings, payload, "embedding", self.aux_provider)

    def rerank(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        return self._invoke(self.aux_provider.rerank, payload, "rerank", self.aux_provider)

    def vision(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        # 聊天与视觉提供方即使相同，也必须选择独立视觉模型，不能落到纯聊天路由。
        return self._invoke(self.aux_provider.chat, {**dict(payload), "model": self.vision_model}, "vision", self.aux_provider)

    def _invoke(self, function: Any, payload: Mapping[str, Any], capability: str, provider: Any) -> dict[str, Any]:
        model = provider.resolved_model(payload, capability) if hasattr(provider, "resolved_model") else str(payload.get("model") or "fake-" + capability)
        try:
            response = function(payload)
            self._validate_response(response, payload, capability)
        except ProviderError as error:
            self._observe(provider.name, capability, model, False, type(error).__name__)
            raise
        self._observe(provider.name, capability, model, True)
        return self._with_metadata(response, payload, capability, provider)

    def _observe(self, provider: str, capability: str, model: str, success: bool, error: str = "") -> None:
        with self._observation_lock:
            self._observations[(provider, capability, model)] = {"reachable": success, "last_error": error,
                "checked_at": datetime.now(timezone.utc).isoformat(), "monotonic": time.monotonic()}

    def capability_status(self, provider: Any, capability: str, model: str) -> dict[str, Any]:
        synthetic = provider.name == "fake"
        configured = not synthetic and bool(getattr(provider, "api_key", "")) and bool(model)
        with self._observation_lock:
            observation = dict(self._observations.get((provider.name, capability, model)) or {})
        fresh = bool(observation) and time.monotonic() - observation["monotonic"] <= 300
        reachable = "synthetic" if synthetic else "unavailable" if not configured else observation["reachable"] if fresh else "stale" if observation else "not_probed"
        return {"ready": not synthetic and configured and reachable is True, "configured": configured,
            "reachable": reachable, "provider": provider.name, "model": model, "capability": capability,
            "synthetic": synthetic, "checked_at": observation.get("checked_at", ""), "last_error": observation.get("last_error", "")}

    @staticmethod
    def _validate_response(response: Any, payload: Mapping[str, Any], capability: str) -> None:
        """成功 HTTP 但缺少真实输出也必须拒绝，不能伪造模型可达或结果。"""
        valid = isinstance(response, Mapping)
        if valid and capability in {"chat", "vision"}:
            choices = response.get("choices")
            valid = isinstance(choices, list) and bool(choices) and isinstance(choices[0], Mapping)
            message = choices[0].get("message") if valid else None
            valid = isinstance(message, Mapping) and (isinstance(message.get("content"), str) and bool(message["content"].strip()) or
                isinstance(message.get("tool_calls"), list) and bool(message["tool_calls"]) and all(
                    isinstance(call, Mapping) and isinstance(call.get("function"), Mapping) and bool(call["function"].get("name"))
                    for call in message["tool_calls"]))
        elif valid and capability == "embedding":
            raw = payload.get("input")
            count = 1 if isinstance(raw, str) else len(raw or [])
            data = response.get("data")
            valid = isinstance(data, list) and len(data) == count and count > 0
            indices, dimensions = set(), set()
            for item in data if valid else []:
                if not isinstance(item, Mapping) or type(item.get("index")) is not int or item["index"] in indices or not 0 <= item["index"] < count:
                    valid = False
                    break
                vector = item.get("embedding")
                if not isinstance(vector, list) or not vector or not all(type(value) in (int, float) and math.isfinite(value) for value in vector):
                    valid = False
                    break
                indices.add(item["index"])
                dimensions.add(len(vector))
            valid = valid and len(dimensions) == 1
        elif valid and capability == "rerank":
            data = response.get("results")
            count = len(payload.get("documents") or [])
            top_n = payload.get("top_n", 5)
            valid = type(top_n) is int and top_n > 0 and isinstance(data, list) and min(top_n, count) <= len(data) <= count
            indices = set()
            for item in data if valid else []:
                if not isinstance(item, Mapping) or type(item.get("index")) is not int or item["index"] in indices or not 0 <= item["index"] < count or type(item.get("relevance_score")) not in (int, float) or not math.isfinite(item["relevance_score"]):
                    valid = False
                    break
                indices.add(item["index"])
        if not valid:
            raise ProviderError("provider returned invalid %s response" % capability)

    @staticmethod
    def _with_metadata(response: Mapping[str, Any], payload: Mapping[str, Any], capability: str, provider: Any) -> dict[str, Any]:
        value = dict(response or {})
        requested = str(payload.get("model") or "")
        actual = str(value.get("model") or requested or getattr(provider, "model", "") or provider.name)
        provider_name = str(getattr(provider, "name", "unknown"))
        value["model_metadata"] = {
            "provider": provider_name,
            "requested_model": requested or actual,
            "actual_model": actual,
            "capability": capability,
            "synthetic": provider_name == "fake",
        }
        return value


__all__ = ["ModelGateway"]
