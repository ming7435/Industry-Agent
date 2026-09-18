"""Lazy, failure-tolerant singleton loader for the reranker model.

Loading ``bge-reranker-v2-m3`` costs seconds and hundreds of megabytes of RAM, so
it happens once per process on first use.  A load failure (missing dependency,
absent model weights, OOM, ...) must **not** prevent the API from starting: the
loader logs the reason and returns ``None``, and the caller
(:mod:`app.api.pipeline`) then skips reranking and reports
``degrade_reason="reranker_unavailable"``.

The double-checked locking pattern below makes the loader safe to call from the
event loop, from worker threads and from startup warm-up tasks concurrently.
"""

from __future__ import annotations

from threading import Lock

from loguru import logger

from config.settings import settings

from .model import Reranker

_reranker: Reranker | None = None
_loaded = False
_last_error = ""
_reranker_lock = Lock()


def get_reranker() -> Reranker | None:
    """Return the process-wide reranker, loading it on first use.

    Returns:
        The shared :class:`~app.reranker.model.Reranker`, or ``None`` when the
        model could not be loaded. ``None`` is cached, so a broken installation
        is not retried on every request -- call :func:`reset_reranker` to force a
        reload after fixing the environment.
    """
    global _reranker, _loaded, _last_error

    if _loaded:
        return _reranker

    with _reranker_lock:
        if _loaded:
            return _reranker

        if not settings.reranker_model_path:
            logger.warning("reranker_model_path is not configured, reranking disabled")
            _last_error = "reranker_model_path is not configured"
            _reranker = None
        else:
            try:
                _reranker = Reranker(
                    model_path=settings.reranker_model_path,
                    device=settings.reranker_device,
                    batch_size=settings.reranker_batch_size,
                )
                logger.info(
                    "reranker loaded model={} device={} batch_size={}",
                    _reranker.model_path,
                    _reranker.device,
                    _reranker.batch_size,
                )
                _last_error = ""
            except (RuntimeError, ValueError, OSError) as exc:
                logger.warning(
                    "reranker unavailable model={} error={}",
                    settings.reranker_model_path,
                    exc,
                )
                _last_error = str(exc)
                _reranker = None
            except Exception as exc:  # noqa: BLE001 - third-party loaders raise anything
                logger.warning(
                    "reranker unavailable (unexpected error) model={} error={!r}",
                    settings.reranker_model_path,
                    exc,
                )
                _last_error = f"{type(exc).__name__}: {exc}"
                _reranker = None

        _loaded = True

    return _reranker


def reranker_error() -> str:
    """Return the last model-load error, if the reranker is unavailable."""

    return _last_error


def reset_reranker() -> None:
    """Drop the cached reranker so the next call reloads it.

    Intended for operational recovery (model re-download, GPU freed) and for
    tests that need to exercise the ``reranker_unavailable`` branch.
    """
    global _reranker, _loaded, _last_error

    with _reranker_lock:
        _reranker = None
        _loaded = False
        _last_error = ""
