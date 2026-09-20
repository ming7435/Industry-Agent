"""Lazy, failure-tolerant singleton loader for the SiliconFlow reranker."""

from __future__ import annotations

from threading import Lock

from loguru import logger

from config.settings import settings

from .model import SiliconFlowReranker

_reranker: SiliconFlowReranker | None = None
_loaded = False
_last_error = ""
_reranker_lock = Lock()


def get_reranker() -> SiliconFlowReranker | None:
    """Return the process-wide reranker, loading it on first use."""
    global _reranker, _loaded, _last_error

    if _loaded:
        return _reranker

    with _reranker_lock:
        if _loaded:
            return _reranker

        try:
            _reranker = SiliconFlowReranker(batch_size=settings.reranker_batch_size)
            logger.info(
                "reranker loaded provider=siliconflow model={} batch_size={}",
                _reranker.model_path,
                _reranker.batch_size,
            )
            _last_error = ""
        except Exception as exc:  # noqa: BLE001 - remote config should degrade, not crash
            logger.warning(
                "reranker unavailable provider=siliconflow model={} error={}",
                settings.siliconflow_reranker_model,
                exc,
            )
            _last_error = str(exc)
            _reranker = None

        _loaded = True

    return _reranker


def reranker_error() -> str:
    """Return the last reranker setup error, if unavailable."""
    return _last_error


def reset_reranker() -> None:
    """Drop the cached reranker so the next call reloads it."""
    global _reranker, _loaded, _last_error

    with _reranker_lock:
        _reranker = None
        _loaded = False
        _last_error = ""
