"""Pydantic v2 models of the public RAG API contract.

The shapes mirror the agreed HTTP contract one-to-one:

``POST /search``  ->  :class:`SearchRequest` / :class:`SearchResponse`
``GET  /health``  ->  :class:`HealthResponse`

:class:`LatencyBreakdown` uses the exact stage keys the callers expect
(``bm25`` / ``dense`` / ``fusion`` / ``rerank`` / ``llm`` / ``total``), all in
milliseconds, so a request can be profiled without parsing log lines.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SearchRequest(BaseModel):
    """Body of ``POST /search``."""

    model_config = ConfigDict(extra="ignore")

    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Natural-language fault description of the operator.",
        examples=["注塑机报 E-204 液压压力低，怎么处理？"],
    )
    filters: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Optional metadata filters forwarded to both retriever routes, e.g. "
            '{"device_model": "XS-320", "error_code": "E-204"}.'
        ),
    )
    top_n: int = Field(
        default=5,
        ge=1,
        le=50,
        description="Number of evidences kept after fusion and reranking.",
    )

    @field_validator("query")
    @classmethod
    def _normalize_query(cls, value: str) -> str:
        """Strip the query and reject blank input.

        Args:
            value: Raw query string provided by the client.

        Returns:
            The query without leading/trailing whitespace.

        Raises:
            ValueError: If the query is empty after stripping.
        """
        stripped = value.strip()
        if not stripped:
            raise ValueError("query must not be blank")
        return stripped

    @field_validator("filters")
    @classmethod
    def _drop_empty_filters(cls, value: dict[str, Any]) -> dict[str, Any]:
        """Drop ``None`` filter values so they are not pushed down to the stores.

        Args:
            value: Raw filter mapping.

        Returns:
            A new mapping without ``None`` values.
        """
        return {key: item for key, item in value.items() if item is not None}


class HitModel(BaseModel):
    """One retrieved chunk as returned by the API."""

    model_config = ConfigDict(extra="ignore")

    chunk_id: str = Field(..., description="Identifier of the chunk.")
    text: str = Field(..., description="Chunk content.")
    score: float = Field(
        ...,
        description="Relevance score: rerank score when reranked, RRF score otherwise.",
    )
    source: str = Field(
        ...,
        description=(
            'Winning route, or "fusion" for chunks both routes agreed on. '
            "Always one of: bm25 / dense / fusion (and the offline corpus name "
            "when the retriever reports it)."
        ),
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Retrieval bookkeeping: rrf_detail, fusion_score, rerank_score, stage."
        ),
    )


class LatencyBreakdown(BaseModel):
    """Per-stage latencies of one request, in milliseconds."""

    model_config = ConfigDict(extra="ignore")

    bm25: int = Field(default=0, description="Whoosh/BM25 leg latency.")
    dense: int = Field(default=0, description="Milvus/dense leg latency.")
    fusion: int = Field(default=0, description="RRF latency.")
    rerank: int = Field(default=0, description="Reranking latency.")
    llm: int = Field(default=0, description="DeepSeek generation latency.")
    total: int = Field(default=0, description="End-to-end request latency.")


class SearchResponse(BaseModel):
    """Response of ``POST /search``."""

    model_config = ConfigDict(extra="ignore")

    request_id: str = Field(..., description="UUID4 of the request, echoed in every log line.")
    hits: list[HitModel] = Field(
        default_factory=list,
        description="Final evidences, best first. Empty when all retrievers failed.",
    )
    evidence_text: str = Field(
        default="",
        description="Citation-formatted evidence context supplied to the LLM.",
    )
    answer: str = Field(
        default="",
        description=(
            "Generated diagnostic answer. Empty when the LLM stage degraded, in "
            "which case ``hits`` is still populated."
        ),
    )
    degraded: bool = Field(
        default=False,
        description="Whether any stage of the chain ran in degraded mode.",
    )
    degrade_reason: str = Field(
        default="",
        description=(
            "Reason of the degradation: dense_timeout / bm25_timeout / "
            "all_retrievers_failed / rerank_timeout / reranker_unavailable / "
            "embedding_unavailable / milvus_unavailable / whoosh_unavailable / "
            "llm_timeout / request_timeout. Empty when not degraded."
        ),
    )
    latency_ms: LatencyBreakdown = Field(
        default_factory=LatencyBreakdown,
        description="Per-stage latency of this request.",
    )


class HealthResponse(BaseModel):
    """Response of ``GET /health``."""

    model_config = ConfigDict(extra="ignore")

    milvus: bool = Field(..., description="Dense route (Milvus) availability.")
    whoosh: bool = Field(..., description="BM25 route (Whoosh) availability.")
    embedding: bool = Field(..., description="bge-m3 embedder availability.")
    reranker: bool = Field(..., description="bge-reranker availability.")
    llm: bool = Field(..., description="DeepSeek client configuration state.")
    reranker_error: str = Field(
        default="",
        description="Detailed reranker load failure when reranker is unavailable.",
    )


class ErrorResponse(BaseModel):
    """Body of an error response, e.g. HTTP 503."""

    model_config = ConfigDict(extra="ignore")

    error: str = Field(..., description="Machine-readable error code.")


class DocumentUpsertRequest(BaseModel):
    document_id: str = Field(..., min_length=1)
    content: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)
    collection: str = "maint_fault_events"
    chunks: list[dict[str, Any]] = Field(default_factory=list)


class DocumentIngestRequest(BaseModel):
    path: str = Field(..., min_length=1)
    collection: str = ""
