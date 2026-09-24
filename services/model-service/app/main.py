"""HTTP model gateway. Business prompts and decisions stay outside this service."""

from __future__ import annotations

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
    return {"status": "ok", "service": "model-service", "provider": gateway.name, "ready": True}


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
