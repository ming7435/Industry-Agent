"""Process-wide dependency singletons exposed as FastAPI dependencies.

Design rules:

* **Lazy.** Nothing is imported or constructed at module import time, so a
  missing or broken offline component cannot prevent the process from starting.
* **Failure-tolerant.** A construction failure is logged and cached as ``None``;
  request handlers translate that into the matching degradation, and only a
  fully unavailable retrieval layer becomes an HTTP 503.
* **Thread-safe.** Double-checked locking around a module-level cache. The lock
  is re-entrant because the pipeline singleton resolves the component singletons
  from inside its own factory; the accessors are called from the event loop, from
  startup warm-up tasks and potentially from worker threads.
* **Adapter-friendly.** The offline retrievers are built with a no-argument call
  when their constructor supports it; if they require parameters, the values are
  taken from :mod:`config.settings` by *name* (see
  :func:`_matching_kwargs`). That absorbs the constructor-shape difference
  without hard-coding a guess.
"""

from __future__ import annotations

import asyncio
import inspect
from threading import RLock
from typing import Any, Callable

from loguru import logger

from config.settings import settings

from .pipeline import SearchPipeline

_MISSING = object()

_instances: dict[str, Any] = {}
# Re-entrant: the pipeline factory resolves the component singletons while it
# already holds the lock, so a plain Lock would deadlock on the first /search.
_lock = RLock()


def _matching_kwargs(target: Any, candidates: dict[str, Any]) -> dict[str, Any]:
    """Select the candidate arguments accepted by a callable's signature.

    Args:
        target: Class or function whose signature is inspected.
        candidates: Possible keyword arguments, keyed by parameter name.

    Returns:
        The subset of ``candidates`` accepted by ``target`` (variadic parameters
        are ignored, ``None`` values are dropped).
    """
    try:
        parameters = inspect.signature(target).parameters
    except (TypeError, ValueError):
        return {}

    selected: dict[str, Any] = {}
    for name, value in candidates.items():
        if value is None:
            continue
        parameter = parameters.get(name)
        if parameter is None:
            continue
        if parameter.kind in (parameter.VAR_POSITIONAL, parameter.VAR_KEYWORD):
            continue
        selected[name] = value
    return selected


def _instantiate(cls: Any, candidates: dict[str, Any], what: str) -> Any:
    """Instantiate an offline component, tolerating both constructor shapes.

    Args:
        cls: Class to construct.
        candidates: Settings-derived keyword arguments accepted by ``cls``.
        what: Component name used in the error message.

    Returns:
        The constructed component.

    Raises:
        TypeError: If the class needs parameters that are not available in the
            candidate pool.
    """
    try:
        return cls()
    except TypeError as exc:
        kwargs = _matching_kwargs(cls, candidates)
        if not kwargs:
            raise TypeError(
                f"cannot construct {what}: constructor needs arguments that are "
                f"not present in settings ({exc})"
            ) from exc
        logger.warning(
            "constructing {} with explicit settings kwargs={}", what, sorted(kwargs)
        )
        return cls(**kwargs)


def _singleton(key: str, factory: Callable[[], Any], description: str) -> Any:
    """Return the cached component for ``key``, creating it once.

    Args:
        key: Cache key.
        factory: Zero-argument callable building the component.
        description: Human-readable component name used in log messages.

    Returns:
        The component, or ``None`` when it could not be created. ``None`` is
        cached, so a broken component is not retried on every request.
    """
    cached = _instances.get(key, _MISSING)
    if cached is not _MISSING:
        return cached

    with _lock:
        cached = _instances.get(key, _MISSING)
        if cached is not _MISSING:
            return cached

        try:
            value = factory()
        except Exception as exc:  # noqa: BLE001 - any failure degrades, never 500
            logger.warning(
                "{} unavailable error_type={} error={}",
                description,
                type(exc).__name__,
                exc,
            )
            value = None

        _instances[key] = value
        return value


def _create_bm25() -> Any:
    """Build the Whoosh BM25 retriever.

    Returns:
        A ``BM25Retriever`` instance.

    Raises:
        ImportError: If ``app.whoosh.retriever`` is not importable.
        TypeError: If the constructor cannot be satisfied.
    """
    from app.whoosh.retriever import BM25Retriever

    collection_names = settings.milvus_search_collections
    return _instantiate(
        BM25Retriever,
        {
            "index_dir": settings.whoosh_index_dir,
            "index_path": settings.whoosh_index_dir,
            "path": settings.whoosh_index_dir,
            "collection_names": collection_names,
        },
        what="BM25Retriever",
    )


def _create_dense() -> Any:
    """Build the Milvus dense retriever.

    Returns:
        A ``DenseRetriever`` instance.

    Raises:
        ImportError: If ``app.milvus.retriever`` is not importable.
        TypeError: If the constructor cannot be satisfied.
    """
    from app.milvus.retriever import DenseRetriever

    collection_names = settings.milvus_search_collections
    return _instantiate(
        DenseRetriever,
        {
            "uri": settings.milvus_uri,
            "host": settings.milvus_host,
            "port": settings.milvus_port,
            "collection_names": collection_names,
            "dim": settings.embedding_dim,
            "embedding_dim": settings.embedding_dim,
        },
        what="DenseRetriever",
    )


def _create_embedder() -> Any:
    """Build the bge-m3 embedder through the offline factory.

    Returns:
        The singleton returned by ``app.embedding.model.get_embedder``.

    Raises:
        ImportError: If ``app.embedding.model`` is not importable.
        TypeError: If the factory cannot be satisfied.
    """
    from app.embedding.model import get_embedder as get_embedder_model

    try:
        return get_embedder_model()
    except TypeError as exc:
        raise TypeError(f"cannot construct embedder: {exc}") from exc


def _create_reranker() -> Any:
    """Build the cross-encoder reranker.

    Returns:
        A ``Reranker`` instance, or ``None`` when the model cannot be loaded
        (the offline loader already logs and swallows the reason).
    """
    from app.reranker import get_reranker as get_reranker_model

    return get_reranker_model()


def _create_llm() -> Any:
    """Build the DeepSeek client.

    Returns:
        An :class:`app.llm.client.LLMClient`. It is created even when the API key
        is missing: the client then reports itself as unavailable, which surfaces
        as ``degrade_reason="llm_timeout"`` per request instead of a hard error.
    """
    from app.llm import LLMClient

    return LLMClient()


# ---------------------------------------------------------------------------
# FastAPI dependency providers
# ---------------------------------------------------------------------------
def get_bm25_retriever() -> Any:
    """Return the Whoosh BM25 retriever singleton.

    Returns:
        The retriever, or ``None`` when it could not be built.
    """
    return _singleton("bm25", _create_bm25, "whoosh bm25 retriever")


def get_dense_retriever() -> Any:
    """Return the Milvus dense retriever singleton.

    Returns:
        The retriever, or ``None`` when it could not be built.
    """
    return _singleton("dense", _create_dense, "milvus dense retriever")


def get_embedder() -> Any:
    """Return the bge-m3 embedder singleton.

    Returns:
        The embedder, or ``None`` when it could not be built.
    """
    return _singleton("embedder", _create_embedder, "bge-m3 embedder")


def get_reranker() -> Any:
    """Return the reranker singleton.

    Returns:
        The reranker, or ``None`` when it could not be loaded. The service stays
        usable in that state (``reranker_unavailable`` degradation).
    """
    return _singleton("reranker", _create_reranker, "bge-reranker-v2-m3")


def get_llm_client() -> Any:
    """Return the DeepSeek client singleton.

    Returns:
        The client, or ``None`` when it could not be built at all.
    """
    return _singleton("llm", _create_llm, "deepseek llm client")


def get_pipeline() -> SearchPipeline:
    """Return the orchestration pipeline singleton.

    The pipeline captures the component singletons on first use; call
    :func:`reset_dependencies` to rebuild it after an environment fix.

    Returns:
        The shared :class:`~app.api.pipeline.SearchPipeline`.
    """
    return _singleton(
        "pipeline",
        lambda: SearchPipeline(
            bm25=get_bm25_retriever(),
            dense=get_dense_retriever(),
            embedder=get_embedder(),
            reranker=get_reranker(),
            llm=get_llm_client(),
        ),
        "search pipeline",
    )


def resolve_components() -> dict[str, Any]:
    """Resolve every component and report what is available.

    Returns:
        Mapping of component name to the resolved instance (possibly ``None``),
        with the keys ``bm25``, ``dense``, ``embedder``, ``reranker`` and ``llm``.
    """
    return {
        "bm25": get_bm25_retriever(),
        "dense": get_dense_retriever(),
        "embedder": get_embedder(),
        "reranker": get_reranker(),
        "llm": get_llm_client(),
    }


def reset_dependencies() -> None:
    """Drop every cached singleton so the next access rebuilds it.

    Intended for operational recovery (index rebuilt, GPU freed, key rotated).
    """
    with _lock:
        _instances.clear()
    logger.info("dependency singletons reset")


async def aclose_dependencies() -> None:
    """Release the resources held by the singletons.

    Only the HTTP-owning components need explicit closing; the retrievers and
    the embedder release their handles through garbage collection. Errors are
    logged, never raised, so shutdown always completes.
    """
    llm = _instances.get("llm")
    if llm is None:
        return

    for name in ("aclose", "close"):
        closer = getattr(llm, name, None)
        if not callable(closer):
            continue
        try:
            result = closer()
            if asyncio.iscoroutine(result):
                await result
        except Exception as exc:  # noqa: BLE001 - shutdown must not fail
            logger.debug("closing llm client failed error_type={}", type(exc).__name__)
        return
