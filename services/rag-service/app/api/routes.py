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
import inspect
import os
import json
from pathlib import Path
from time import perf_counter
from typing import Any, Callable
from uuid import uuid4

from fastapi import APIRouter, Body, HTTPException
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
from .models import DocumentIngestRequest, DocumentUpsertRequest, ErrorResponse, HealthResponse, HitModel, LatencyBreakdown, SearchRequest, SearchResponse
from .documents import get_document_store
from .pipeline import SearchPipeline
from app.retrieval import Hit
from .indexing import UnifiedExperienceIndexer
from app.corpus import normalize_corpus

router = APIRouter()

_PROBE_METHODS: tuple[str, ...] = ("health", "ping", "is_ready")
"""Optional readiness hooks a component may expose; otherwise assembly is enough."""


def _validate_ingest_path(raw_path: str) -> Path:
    """限制 HTTP 入库只能读取配置根目录下的 JSONL 文件。"""

    root = settings.rag_allowed_ingest_path
    path = settings.resolve_service_path(raw_path)
    try:
        path.relative_to(root)
    except ValueError as error:
        raise HTTPException(status_code=403, detail="ingest path is outside the allowed root") from error
    if not path.is_file():
        raise HTTPException(status_code=404, detail="ingest file not found")
    if path.suffix.casefold() != ".jsonl":
        raise HTTPException(status_code=415, detail="only .jsonl ingest files are supported")
    try:
        size = path.stat().st_size
    except OSError as error:
        raise HTTPException(status_code=404, detail="ingest file not found") from error
    if size > settings.rag_ingest_max_bytes:
        raise HTTPException(status_code=413, detail="ingest file exceeds the configured size limit")
    return path


async def _invoke(loader: Callable[[], Any]) -> Any:
    """同步构造/探针卸载到线程，异步返回值在事件循环内真正等待。"""
    if inspect.iscoroutinefunction(loader):
        return await loader()
    value = await asyncio.to_thread(loader)
    return await value if inspect.isawaitable(value) else value


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
            _invoke(loader),
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
                _invoke(probe),
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
    """只读取 Model Service 的能力观测，不主动调用收费生成接口。"""
    return await _ready(get_llm_client)


@router.post(
    "/search",
    response_model=SearchResponse,
    responses={503: {"model": ErrorResponse, "description": "All retrieval dependencies unavailable."}},
    summary="Retrieve evidences and generate a grounded diagnostic answer",
)
async def search(
    request: SearchRequest,
) -> SearchResponse | JSONResponse:
    """Run the online retrieval + generation chain.

    Args:
        request: Query, metadata filters and desired number of evidences.

    Returns:
        A :class:`SearchResponse`; or a ``503`` payload when neither the BM25 nor
        the dense route can be constructed.

    Raises:
        HTTPException: Only for framework-level validation problems; dependency
            failures are reported inside the response body.
    """
    started = perf_counter()
    request_id = str(uuid4())

    async def within_budget(loader: Callable[[], Any]) -> Any:
        remaining = settings.request_timeout_ms / 1000 - (perf_counter() - started)
        if remaining <= 0:
            raise TimeoutError
        return await asyncio.wait_for(_invoke(loader), timeout=remaining)

    document_failed = False
    try:
        # FastAPI 同步 Depends 虽然会卸载构造，但其耗时不属于原管道预算。
        # 这里从构造开始计时，并将相同起点交给后续检索/生成。
        pipeline = await within_budget(get_pipeline)
        try:
            document_hits = await within_budget(
                lambda: get_document_store().search(request.query, request.top_n, request.filters)
            )
        except TimeoutError:
            raise
        except Exception as error:
            document_hits = []
            document_failed = True
            logger.warning("request_id={} document store unavailable error_type={}", request_id, type(error).__name__)
    except TimeoutError:
        return SearchResponse(
            request_id=request_id,
            degraded=True,
            degrade_reason="request_timeout",
            latency_ms=LatencyBreakdown(total=round((perf_counter() - started) * 1000)),
        )
    supplemental_hits = [
        Hit(
            chunk_id=str(item.get("chunk_id") or ""),
            text=str(item.get("text") or ""),
            score=float(item.get("score") or 0.0),
            source="experience-store",
            metadata=dict(item.get("metadata") or {}),
        )
        for item in document_hits
        if str(item.get("chunk_id") or "").strip()
    ]
    if not pipeline.has_any_retriever and not document_hits:
        logger.error(
            "search rejected reason=all_dependencies_unavailable pipeline={}",
            type(pipeline).__name__,
        )
        return JSONResponse(
            status_code=503,
            content={"error": "all_dependencies_unavailable"},
        )

    response = await pipeline.search(request, request_id, supplemental_hits=supplemental_hits, started_at=started)
    if document_failed:
        response.degraded = True
        response.degrade_reason = response.degrade_reason or "document_store_unavailable"
    return response


def _hit_matches_filters(hit: HitModel, filters: dict[str, Any]) -> bool:
    metadata = dict(hit.metadata or {})
    for key, expected in (filters or {}).items():
        if expected in (None, "", [], {}):
            continue
        actual = metadata.get(key)
        if key in {"collection", "corpus"}:
            actual = metadata.get("collection") if key == "collection" else metadata.get("corpus") or metadata.get("knowledge_type") or metadata.get("collection")
            if key == "corpus":
                actual = normalize_corpus(actual)
                expected = normalize_corpus(expected) if not isinstance(expected, (list, tuple, set)) else expected
        if isinstance(expected, (list, tuple, set)):
            if str(actual or "").casefold() not in {str(item).casefold() for item in expected}:
                return False
        elif str(expected).casefold() != str(actual or "").casefold():
            return False
    return True


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
    store = get_document_store()
    previous = store.get(request.document_id) or {}
    previous_ids = {str(item.get("chunk_id") or "") for item in previous.get("chunks") or [] if item.get("chunk_id")}
    current_ids = {str(item.get("chunk_id") or f"{request.document_id}:{index}") for index, item in enumerate(request.chunks or [{"chunk_id": f"{request.document_id}:0"}])}
    index_result = UnifiedExperienceIndexer(
        enable_whoosh=True if os.getenv("RAG_TEST_FAIL_WHOOSH", "").lower() in {"1", "true", "yes"} else None,
    ).upsert(request, stale_chunk_ids=previous_ids - current_ids)
    backends = dict(index_result.get("backends") or {})
    try:
        document = store.upsert(
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
    metadata_saved = bool(backends.get("metadata", {}).get("success"))
    # 元数据和 BM25 可用时允许本地检索继续工作；Milvus/向量路径失败只把
    # pipeline 标为 degraded，不能把已经持久化的经验伪装成未写入。
    hard_index_failure = any(
        name != "milvus" and item.get("required") and not item.get("success")
        for name, item in backends.items()
    )
    success = metadata_saved and not hard_index_failure
    return {
        "success": success,
        "pipeline_ready": bool(index_result.get("pipeline_ready")) and metadata_saved,
        "metadata_saved": metadata_saved,
        "bm25_indexed": bool(backends.get("whoosh", {}).get("success")),
        "dense_indexed": bool(backends.get("milvus", {}).get("success")),
        "backends": backends,
        "document": document,
        "loaded": 1 if success else 0,
    }


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
    path = _validate_ingest_path(request.path)
    loaded = 0
    errors: list[str] = []
    store = get_document_store()
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not raw_line.strip():
            continue
        try:
            record = json.loads(raw_line)
            if not isinstance(record, dict):
                raise ValueError("record must be an object")
            document_id = str(record.get("document_id") or record.get("experience_id") or record.get("id") or "")
            content = str(record.get("content") or record.get("text") or "")
            metadata = dict(record.get("metadata") or {})
            metadata.update({key: value for key, value in record.items() if key not in {"document_id", "experience_id", "id", "content", "text", "metadata", "chunks"}})
            store.upsert(document_id, content, metadata, request.collection or str(record.get("collection") or ""), record.get("chunks"))
            loaded += 1
        except Exception as error:
            errors.append("line %d: %s" % (line_number, error))
    success = loaded > 0 and not errors
    return {
        "success": success,
        "backends": {"metadata": {"success": success, "loaded": loaded, **({"errors": errors} if errors else {})}},
        "path": str(path),
        "collection": request.collection,
        "loaded": loaded,
        "errors": errors,
    }


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
