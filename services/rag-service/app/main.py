"""Service entry point: logging, warm-up, FastAPI application and dev runner.

Run it with either of::

    uvicorn app.main:app --host 0.0.0.0 --port 8000
    python -m app.main

Start-up is intentionally non-blocking. The heavy components (bge-m3 embedder,
bge-reranker-v2-m3) load in a background worker thread, so the HTTP port opens
immediately and ``GET /health`` can be polled while the models come up. A
component that fails to load is reported by ``/health`` and degraded per request
instead of blocking or crashing the process.
"""

from __future__ import annotations

import asyncio
import sys
from contextlib import asynccontextmanager, suppress
from typing import AsyncIterator

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.deps import aclose_dependencies, get_pipeline, resolve_components
from app.api.routes import router
from config.settings import settings

_LOG_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)


def configure_logging() -> None:
    """Install the loguru sink of the service.

    The default handler is replaced so that every stage log line carries the same
    timestamp/level/logger layout. API keys are never part of a log message.
    """
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level.upper(),
        format=_LOG_FORMAT,
        backtrace=False,
        diagnose=False,
        enqueue=False,
    )


def _warm_up_sync() -> dict[str, bool]:
    """Resolve every component and build the pipeline, synchronously.

    Returns:
        Availability flags per component, for the warm-up log line.
    """
    components = resolve_components()
    # Building the pipeline caches it, so the first request does not pay for it.
    get_pipeline()
    return {name: component is not None for name, component in components.items()}


async def warm_up() -> None:
    """Load the retrieval stack in a worker thread.

    Never raises: a failure is logged and surfaced through ``GET /health``.
    """
    try:
        availability = await asyncio.to_thread(_warm_up_sync)
    except Exception as exc:  # noqa: BLE001 - warm-up must not kill the service
        logger.warning(
            "warm-up failed error_type={} error={!r}", type(exc).__name__, exc
        )
        return

    logger.info(
        "warm-up done whoosh={} milvus={} embedding={} reranker={} llm={}",
        availability.get("bm25", False),
        availability.get("dense", False),
        availability.get("embedder", False),
        availability.get("reranker", False),
        availability.get("llm", False),
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage the service lifecycle.

    Args:
        app: The FastAPI application being started.

    Yields:
        Control back to FastAPI once the background warm-up has been scheduled.
    """
    configure_logging()
    logger.info(
        "rag-service starting request_timeout_ms={} rerank_timeout_ms={} llm_timeout_ms={}",
        settings.request_timeout_ms,
        settings.rerank_timeout_ms,
        settings.llm_timeout_ms,
    )

    warm_up_task = asyncio.create_task(warm_up())
    try:
        yield
    finally:
        warm_up_task.cancel()
        with suppress(asyncio.CancelledError):
            await warm_up_task
        await aclose_dependencies()
        logger.info("rag-service stopped")


app = FastAPI(
    title="Industrial Maintenance RAG Service",
    description=(
        "在线检索 + 生成服务：BM25 与 dense 双路检索 → RRF 融合 → bge-reranker-v2-m3 "
        "重排 → 证据组织与引用 → DeepSeek-v4-Flash 生成诊断建议。"
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.service_host,
        port=settings.service_port,
        log_level=settings.log_level.lower(),
    )
