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
    chat_model = getattr(gateway.chat_provider, "model", "fake-chat")
    embedding_model = getattr(gateway.aux_provider, "embedding_model", "fake-embedding")
    rerank_model = getattr(gateway.aux_provider, "reranker_model", "fake-reranker")
    capabilities = {
        "chat": gateway.capability_status(gateway.chat_provider, "chat", chat_model),
        "embedding": gateway.capability_status(gateway.aux_provider, "embedding", embedding_model),
        "rerank": gateway.capability_status(gateway.aux_provider, "rerank", rerank_model),
        "vision": gateway.capability_status(gateway.aux_provider, "vision", gateway.vision_model),
    }
    return {
        "status": "ok",
        "service": "model-service",
        # provider 专指聊天模型，当前为 DeepSeek 官方接口。
        "provider": gateway.name,
        "chat_provider": gateway.name,
        # 向量/重排仍可使用独立的 SiliconFlow，不会参与聊天请求。
        "aux_provider": gateway.aux_name,
        # 不做收费探测；只读近期真实业务调用的观测，视觉能力单独报告。
        "ready": all(capabilities[name]["ready"] for name in ("chat", "embedding", "rerank")),
        "capabilities": capabilities,
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
