"""公共 RAG API 契约的 Pydantic v2 模型。

这些结构与约定的 HTTP 契约一一对应：

``POST /search``  ->  :class:`SearchRequest` / :class:`SearchResponse`
``GET  /health``  ->  :class:`HealthResponse`

:class:`LatencyBreakdown` 使用调用方期望的精确阶段键（``bm25`` / ``dense`` / ``fusion`` /
``rerank`` / ``llm`` / ``total``），单位均为毫秒，因此无需解析日志也能分析一次请求。
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SearchRequest(BaseModel):
    """``POST /search`` 的请求体。"""

    model_config = ConfigDict(extra="ignore")

    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="操作员输入的自然语言故障描述。",
        examples=["注塑机报 E-204 液压压力低，怎么处理？"],
    )
    filters: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "可选 metadata 过滤条件，会转发给两条检索路线，例如 "
            '{"device_model": "XS-320", "error_code": "E-204"}。'
        ),
    )
    top_n: int = Field(
        default=5,
        ge=1,
        le=50,
        description="融合和重排后保留的证据数量。",
    )

    @field_validator("query")
    @classmethod
    def _normalize_query(cls, value: str) -> str:
        """去除查询首尾空白，并拒绝空输入。

        Args:
            value: 客户端提供的原始查询字符串。

        Returns:
            去除首尾空白后的查询。

        Raises:
            ValueError: 去除空白后查询为空时抛出。
        """
        stripped = value.strip()
        if not stripped:
            raise ValueError("query must not be blank")
        return stripped

    @field_validator("filters")
    @classmethod
    def _drop_empty_filters(cls, value: dict[str, Any]) -> dict[str, Any]:
        """丢弃 ``None`` 过滤值，避免下推到存储层。

        Args:
            value: 原始过滤映射。

        Returns:
            不含 ``None`` 值的新映射。
        """
        return {key: item for key, item in value.items() if item is not None}


class HitModel(BaseModel):
    """API 返回的一条已检索分块。"""

    model_config = ConfigDict(extra="ignore")

    chunk_id: str = Field(..., description="分块标识。")
    text: str = Field(..., description="分块内容。")
    score: float = Field(
        ...,
        description="相关性分数：重排后为重排分数，否则为 RRF 分数。",
    )
    source: str = Field(
        ...,
        description=(
            '胜出的路线；两条路线都命中时为 "fusion"。通常为 bm25 / dense / fusion 之一，'
            "也可能是检索器报告的离线语料名称。"
        ),
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="检索台账字段：rrf_detail、fusion_score、rerank_score、stage。",
    )


class LatencyBreakdown(BaseModel):
    """单次请求的分阶段延迟，单位为毫秒。"""

    model_config = ConfigDict(extra="ignore")

    bm25: int = Field(default=0, description="Whoosh/BM25 路线延迟。")
    dense: int = Field(default=0, description="Milvus/稠密路线延迟。")
    fusion: int = Field(default=0, description="RRF 延迟。")
    rerank: int = Field(default=0, description="重排延迟。")
    llm: int = Field(default=0, description="DeepSeek 生成延迟。")
    total: int = Field(default=0, description="端到端请求延迟。")


class SearchResponse(BaseModel):
    """``POST /search`` 的响应。"""

    model_config = ConfigDict(extra="ignore")

    request_id: str = Field(..., description="请求的 UUID4，会回显到每条日志。")
    hits: list[HitModel] = Field(
        default_factory=list,
        description="最终证据，最佳结果在前。所有检索器都失败时为空。",
    )
    evidence_text: str = Field(
        default="",
        description="提供给 LLM 的引用格式证据上下文。",
    )
    answer: str = Field(
        default="",
        description="生成的诊断答案。LLM 阶段降级时为空，此时 ``hits`` 仍会填充。",
    )
    degraded: bool = Field(
        default=False,
        description="链路中是否有任何阶段以降级模式运行。",
    )
    degrade_reason: str = Field(
        default="",
        description=(
            "降级原因：dense_timeout / bm25_timeout / all_retrievers_failed / "
            "rerank_timeout / reranker_unavailable / embedding_unavailable / "
            "milvus_unavailable / whoosh_unavailable / llm_timeout / request_timeout。"
            "未降级时为空。"
        ),
    )
    latency_ms: LatencyBreakdown = Field(
        default_factory=LatencyBreakdown,
        description="本次请求的分阶段延迟。",
    )


class HealthResponse(BaseModel):
    """``GET /health`` 的响应。"""

    model_config = ConfigDict(extra="ignore")

    milvus: bool = Field(..., description="稠密路线（Milvus）可用性。")
    whoosh: bool = Field(..., description="BM25 路线（Whoosh）可用性。")
    embedding: bool = Field(..., description="bge-m3 嵌入器可用性。")
    reranker: bool = Field(..., description="bge-reranker 可用性。")
    llm: bool = Field(..., description="DeepSeek 客户端配置状态。")
    reranker_error: str = Field(
        default="",
        description="重排器不可用时的详细加载失败信息。",
    )


class ErrorResponse(BaseModel):
    """错误响应体，例如 HTTP 503。"""

    model_config = ConfigDict(extra="ignore")

    error: str = Field(..., description="机器可读错误码。")
