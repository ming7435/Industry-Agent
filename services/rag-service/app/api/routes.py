"""RAG 服务的 HTTP 路由。

暴露两个端点：

``POST /search``
    运行在线链路并始终返回 200；降级答案仍然是有效答案。只有在没有任何检索路线可用时，
    才返回 ``503 {"error": "all_dependencies_unavailable"}``。

``GET /health``
    按依赖报告就绪状态。端点自身永不抛出异常：损坏的组件会报告为 ``false``，
    每次解析/探测都受 ``settings.health_probe_timeout_ms`` 限制，避免卡住的存储阻塞健康检查。
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable
from uuid import uuid4

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from loguru import logger

from config.settings import settings

from .deps import (
    get_bm25_retriever,
    get_dense_retriever,
    get_embedder,
    get_llm_client,
    get_pipeline,
    get_reranker,
)
from app.reranker import reranker_error
from .models import ErrorResponse, HealthResponse, SearchRequest, SearchResponse
from .pipeline import SearchPipeline

router = APIRouter()

_PROBE_METHODS: tuple[str, ...] = ("health", "ping", "is_ready")
"""组件可选暴露的就绪探针；没有探针时完成装配即可视为就绪。"""


async def _resolve(loader: Callable[[], Any]) -> Any | None:
    """解析组件，同时避免阻塞事件循环。

    Args:
        loader: 无参数访问器，返回组件或 ``None``。

    Returns:
        组件；组件不可用或解析超过探测预算时返回 ``None``。
    """
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(loader),
            timeout=settings.health_probe_timeout_ms / 1000,
        )
    except TimeoutError:
        logger.warning(
            "health resolution timed out loader={}",
            getattr(loader, "__name__", str(loader)),
        )
        return None
    except Exception as exc:  # noqa: BLE001 - 健康检查不能向外抛出。
        logger.warning(
            "health resolution failed loader={} error_type={}",
            getattr(loader, "__name__", str(loader)),
            type(exc).__name__,
        )
        return None


async def _probe(component: Any) -> bool:
    """检查已解析组件是否能通过自身的就绪探针。

    Args:
        component: 已解析且确定非 ``None`` 的组件。

    Returns:
        组件完成装配，且如果暴露就绪探针则该探针报告健康时返回 ``True``。
    """
    probe: Callable[[], Any] | None = None
    for name in _PROBE_METHODS:
        candidate = getattr(component, name, None)
        if callable(candidate):
            probe = candidate
            break

    if probe is None:
        return True

    try:
        return bool(
            await asyncio.wait_for(
                asyncio.to_thread(probe),
                timeout=settings.health_probe_timeout_ms / 1000,
            )
        )
    except Exception as exc:  # noqa: BLE001 - 不健康是合法结果。
        logger.warning(
            "health probe failed component={} error_type={}",
            type(component).__name__,
            type(exc).__name__,
        )
        return False


async def _ready(loader: Callable[[], Any]) -> bool:
    """解析组件并探测其状态。

    Args:
        loader: 返回组件或 ``None`` 的访问器。

    Returns:
        组件存在且报告健康时返回 ``True``。
    """
    component = await _resolve(loader)
    if component is None:
        return False
    return await _probe(component)


async def _llm_ready() -> bool:
    """报告 DeepSeek 客户端是否可用。

    Returns:
        客户端存在且配置完整（SDK 与 API Key 均可用）时返回 ``True``。这里不发起网络调用，
        因而健康检查保持快速且无额外成本。
    """
    client = await _resolve(get_llm_client)
    return bool(client is not None and getattr(client, "is_configured", False))


@router.post(
    "/search",
    response_model=SearchResponse,
    responses={503: {"model": ErrorResponse, "description": "所有检索依赖均不可用。"}},
    summary="检索证据并生成有依据的诊断答案",
)
async def search(
    request: SearchRequest,
    pipeline: SearchPipeline = Depends(get_pipeline),
) -> SearchResponse | JSONResponse:
    """运行在线检索与生成链路。

    Args:
        request: 查询、元数据过滤条件和期望证据数量。
        pipeline: 作为单例依赖解析得到的编排流水线。

    Returns:
        :class:`SearchResponse`；当 BM25 与稠密路线都无法构建时，返回 ``503`` 负载。

    Raises:
        HTTPException: 仅用于框架级校验问题；依赖失败会写入响应体。
    """
    if not pipeline.has_any_retriever:
        logger.error(
            "search rejected reason=all_dependencies_unavailable pipeline={}",
            type(pipeline).__name__,
        )
        return JSONResponse(
            status_code=503,
            content={"error": "all_dependencies_unavailable"},
        )

    request_id = str(uuid4())
    return await pipeline.search(request, request_id)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="RAG 服务各依赖的就绪状态",
)
async def health() -> HealthResponse:
    """报告所有在线依赖的就绪状态。

    Returns:
        :class:`HealthResponse`，其中标志位永不为 ``null``：损坏或超时的组件会报告为 ``false``。
    """
    whoosh, milvus, embedding, reranker, llm = await asyncio.gather(
        _ready(get_bm25_retriever),
        _ready(get_dense_retriever),
        _ready(get_embedder),
        _ready(get_reranker),
        _llm_ready(),
    )

    report = HealthResponse(
        milvus=milvus,
        whoosh=whoosh,
        embedding=embedding,
        reranker=reranker,
        llm=llm,
        reranker_error=reranker_error() if not reranker else "",
    )
    logger.info(
        "health milvus={} whoosh={} embedding={} reranker={} llm={}",
        report.milvus,
        report.whoosh,
        report.embedding,
        report.reranker,
        report.llm,
    )
    return report
