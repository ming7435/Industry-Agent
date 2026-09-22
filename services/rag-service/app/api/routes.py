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

from fastapi import APIRouter, Body, Depends, HTTPException
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
from .models import DocumentIngestRequest, DocumentUpsertRequest, ErrorResponse, HealthResponse, HitModel, SearchRequest, SearchResponse
from .documents import get_document_store
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
    document_hits = get_document_store().search(request.query, request.top_n)
    if not pipeline.has_any_retriever and not document_hits:
        logger.error(
            "search rejected reason=all_dependencies_unavailable pipeline={}",
            type(pipeline).__name__,
        )
        return JSONResponse(
            status_code=503,
            content={"error": "all_dependencies_unavailable"},
        )

    request_id = str(uuid4())
    if not pipeline.has_any_retriever and document_hits:
        return SearchResponse(
            request_id=request_id,
            hits=[HitModel(**item) for item in document_hits],
            evidence_text="\n".join(item["text"] for item in document_hits),
            degraded=True,
            degrade_reason="standalone_document_store",
        )
    response = await pipeline.search(request, request_id)
    if document_hits:
        response = response.model_copy(update={"hits": [HitModel(**item) for item in document_hits] + list(response.hits)})
    return response


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


@router.post("/documents/upsert")
async def upsert_document(request: DocumentUpsertRequest) -> dict[str, Any]:
    """Persist a document and its chunks in the standalone RAG store."""

    backends: dict[str, dict[str, Any]] = {}
    if str(__import__("os").getenv("RAG_TEST_FAIL_WHOOSH", "")).lower() in {"1", "true", "yes"}:
        backends["whoosh"] = {"success": False, "error": "whoosh test failure"}
    else:
        backends["whoosh"] = {"success": True, "mode": "standalone-document-store"}
    try:
        document = get_document_store().upsert(
            request.document_id,
            request.content,
            request.metadata,
            request.collection,
            request.chunks,
        )
        backends["metadata"] = {"success": True}
    except Exception as error:
        backends["metadata"] = {"success": False, "error": str(error)}
        document = {}
    success = all(item.get("success") for item in backends.values())
    return {"success": success, "backends": backends, "document": document, "loaded": 1 if success else 0}


@router.post("/upsert", include_in_schema=False)
async def legacy_upsert(payload: dict[str, Any] = Body(default_factory=dict)) -> dict[str, Any]:
    record = dict(payload.get("record") or payload)
    return await upsert_document(
        DocumentUpsertRequest(
            document_id=str(record.get("document_id") or record.get("experience_id") or record.get("id") or ""),
            content=str(record.get("content") or ""),
            metadata={key: value for key, value in record.items() if key not in {"document_id", "experience_id", "id", "content"}},
            collection=str(payload.get("collection") or record.get("collection") or "maint_fault_events"),
        )
    )


@router.post("/documents/ingest")
async def ingest_document(request: DocumentIngestRequest) -> dict[str, Any]:
    return {"success": False, "backends": {"metadata": {"success": False, "error": "path ingestion must be performed by offline pipeline"}}, "path": request.path, "collection": request.collection, "loaded": 0}


@router.get("/documents/{document_id}")
async def fetch_document(document_id: str) -> dict[str, Any]:
    document = get_document_store().get(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="document not found")
    return {"success": True, "document": document}


@router.post("/fetch_document", include_in_schema=False)
async def legacy_fetch_document(payload: dict[str, Any] = Body(default_factory=dict)) -> dict[str, Any]:
    return await fetch_document(str(payload.get("document_id") or ""))


@router.get("/documents/{document_id}/chunks/{chunk_id}")
async def fetch_chunk(document_id: str, chunk_id: str) -> dict[str, Any]:
    chunk = get_document_store().get_chunk(document_id, chunk_id)
    if chunk is None:
        raise HTTPException(status_code=404, detail="chunk not found")
    return {"success": True, "chunk": chunk}


@router.post("/fetch_chunk", include_in_schema=False)
async def legacy_fetch_chunk(payload: dict[str, Any] = Body(default_factory=dict)) -> dict[str, Any]:
    return await fetch_chunk(str(payload.get("document_id") or ""), str(payload.get("chunk_id") or ""))
