"""HTTP 模型网关；业务提示词和决策逻辑保留在本服务之外。"""

from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .providers import ModelGateway, ProviderError


class ChatRequest(BaseModel):
    model: str = ""
    messages: list[dict[str, Any]] = Field(default_factory=list)
    temperature: float = 0.1
    max_tokens: int | None = None
    tools: list[dict[str, Any]] = Field(default_factory=list)
    tool_choice: Any = None


class EmbeddingRequest(BaseModel):
    model: str = ""
    input: str | list[str]


class RerankRequest(BaseModel):
    model: str = ""
    query: str
    documents: list[str] = Field(default_factory=list)
    top_n: int = 5


app = FastAPI(title="Industry Agent Model Service", version="1.0.0")
gateway = ModelGateway()


@app.get("/health")
def health() -> dict[str, Any]:
    synthetic = gateway.name == "fake"
    def capability(provider: Any, name: str, model: str) -> dict[str, Any]:
        configured = not synthetic and bool(getattr(provider, "api_key", "")) and bool(model)
        return {
            # 配置齐全不等于远端已可达；健康检查不主动调用收费生成接口，
            # 因此只能报告 not_probed，不能把未探测的能力标成 ready。
            "ready": False,
            "configured": configured,
            "reachable": "not_probed" if configured else ("synthetic" if synthetic else "unavailable"),
            "provider": getattr(provider, "name", "unknown"),
            "model": model,
            "capability": name,
            "synthetic": synthetic,
        }
    chat_model = getattr(gateway.chat_provider, "model", "fake-chat")
    embedding_model = getattr(gateway.aux_provider, "embedding_model", "fake-embedding")
    rerank_model = getattr(gateway.aux_provider, "reranker_model", "fake-reranker")
    vision_model = os.getenv("SILICONFLOW_VISION_MODEL", "") or getattr(gateway.aux_provider, "model", "")
    return {
        "status": "ok",
        "service": "model-service",
        # provider 专指聊天模型，当前为 DeepSeek 官方接口。
        "provider": gateway.name,
        "chat_provider": gateway.name,
        # 向量/重排仍可使用独立的 SiliconFlow，不会参与聊天请求。
        "aux_provider": gateway.aux_name,
        "ready": False,
        "capabilities": {
            "chat": capability(gateway.chat_provider, "chat", chat_model),
            "embedding": capability(gateway.aux_provider, "embedding", embedding_model),
            "rerank": capability(gateway.aux_provider, "rerank", rerank_model),
            "vision": capability(gateway.aux_provider, "vision", vision_model),
        },
    }


def _call(function: Any, payload: BaseModel) -> dict[str, Any]:
    try:
        return function(payload.model_dump(exclude_none=True))
    except ProviderError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/v1/chat/completions")
def chat(request: ChatRequest) -> dict[str, Any]:
    return _call(gateway.chat, request)


@app.post("/v1/embeddings")
def embeddings(request: EmbeddingRequest) -> dict[str, Any]:
    return _call(gateway.embeddings, request)


@app.post("/v1/rerank")
def rerank(request: RerankRequest) -> dict[str, Any]:
    return _call(gateway.rerank, request)


@app.post("/v1/vision")
def vision(request: ChatRequest) -> dict[str, Any]:
    return _call(gateway.vision, request)
