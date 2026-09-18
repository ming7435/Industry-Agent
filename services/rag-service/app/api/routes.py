"""HTTP routes of the RAG service.

Two endpoints are exposed:

``POST /search``
    Runs the online chain and always answers 200 -- a degraded answer is still an
    answer -- except when *no* retrieval route is usable, which is reported as
    ``503 {"error": "all_dependencies_unavailable"}``.

``GET /health``
    Reports per-dependency readiness. The endpoint never raises: a broken
    component is reported as ``false``, and each resolution/probe is bounded by
    ``settings.health_probe_timeout_ms`` so a hung store cannot hang the probe
    itself.
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
from .models import ErrorResponse, HealthResponse, SearchRequest, SearchResponse
from .pipeline import SearchPipeline

router = APIRouter()

_PROBE_METHODS: tuple[str, ...] = ("health", "ping", "is_ready")
"""Optional readiness hooks a component may expose; otherwise assembly is enough."""


async def _resolve(loader: Callable[[], Any]) -> Any | None:
    """Resolve a component without blocking the event loop.

    Args:
        loader: Zero-argument accessor returning the component or ``None``.

    Returns:
        The component, or ``None`` when it is unavailable or resolution exceeded
        the probe budget.
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
    except Exception as exc:  # noqa: BLE001 - health checks must never raise
        logger.warning(
            "health resolution failed loader={} error_type={}",
            getattr(loader, "__name__", str(loader)),
            type(exc).__name__,
        )
        return None


async def _probe(component: Any) -> bool:
    """Check whether a resolved component answers its readiness hook, if any.

    Args:
        component: Resolved component, already known to be non-``None``.

    Returns:
        ``True`` when the component is assembled and, if it exposes a readiness
        hook, that hook reports healthy.
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
    except Exception as exc:  # noqa: BLE001 - unhealthy is a valid result
        logger.warning(
            "health probe failed component={} error_type={}",
            type(component).__name__,
            type(exc).__name__,
        )
        return False


async def _ready(loader: Callable[[], Any]) -> bool:
    """Resolve a component and probe it.

    Args:
        loader: Accessor returning the component or ``None``.

    Returns:
        ``True`` when the component exists and reports healthy.
    """
    component = await _resolve(loader)
    if component is None:
        return False
    return await _probe(component)


async def _llm_ready() -> bool:
    """Report whether the DeepSeek client is usable.

    Returns:
        ``True`` when the client exists and is configured (SDK plus API key).
        No network call is made, so the health endpoint stays fast and free.
    """
    client = await _resolve(get_llm_client)
    return bool(client is not None and getattr(client, "is_configured", False))


@router.post(
    "/search",
    response_model=SearchResponse,
    responses={503: {"model": ErrorResponse, "description": "All retrieval dependencies unavailable."}},
    summary="Retrieve evidences and generate a grounded diagnostic answer",
)
async def search(
    request: SearchRequest,
    pipeline: SearchPipeline = Depends(get_pipeline),
) -> SearchResponse | JSONResponse:
    """Run the online retrieval + generation chain.

    Args:
        request: Query, metadata filters and desired number of evidences.
        pipeline: The orchestration pipeline, resolved as a singleton dependency.

    Returns:
        A :class:`SearchResponse`; or a ``503`` payload when neither the BM25 nor
        the dense route can be constructed.

    Raises:
        HTTPException: Only for framework-level validation problems; dependency
            failures are reported inside the response body.
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
    summary="Per-dependency readiness of the RAG service",
)
async def health() -> HealthResponse:
    """Report the readiness of every online dependency.

    Returns:
        A :class:`HealthResponse` whose flags are never ``null``: a broken or
        timed-out component is simply reported as ``false``.
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
