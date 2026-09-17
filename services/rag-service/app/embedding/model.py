"""Embedder factory shared by the offline writer and the online dense route.

Why this module exists: the offline ingestion pipeline embeds *chunks* in batches
while the online chain embeds a single *query* per request, but both must use the
same weights -- two different models (or two differently configured instances of
the same model) would put the query and the documents in different vector spaces
and silently ruin the dense route.

Both halves therefore go through :func:`get_embedder`, which returns one lazy,
process-wide :class:`QueryEmbedder` wrapping the offline
:class:`~app.embedding.bge_m3.BGEM3EmbeddingClient`. Loading happens on first
use, never at import time, so the API can boot without the model and report the
failure through ``GET /health`` instead of crashing.
"""

from __future__ import annotations

from threading import Lock
from typing import Any

from loguru import logger

from config.settings import settings

from .bge_m3 import BGEM3EmbeddingClient
from .models import EmbeddingConfig, EmbeddingError

_embedder: "QueryEmbedder | None" = None
_loaded = False
_embedder_lock = Lock()


class QueryEmbedder:
    """Thin, synchronous wrapper turning any embedding client into a query encoder.

    The class is deliberately tiny: it owns no timeout and no thread off-loading,
    because those are the responsibility of the caller
    (:mod:`app.api.pipeline` runs this object inside a worker thread).
    """

    def __init__(self, client: Any | None = None) -> None:
        """Wrap an embedding client, building the default one when omitted.

        Args:
            client: Object exposing ``embed_texts`` and optionally ``dimension``.
                ``None`` builds a :class:`BGEM3EmbeddingClient` from the merged
                service settings.

        Raises:
            EmbeddingError: If the default client cannot be built (missing
                sentence-transformers, absent weights, ...).
        """
        if client is None:
            client = BGEM3EmbeddingClient(
                EmbeddingConfig(
                    model_name=settings.embedding_model_path,
                    batch_size=settings.embedding_batch_size,
                    min_characters=settings.embedding_min_characters,
                    normalize_embeddings=settings.embedding_normalize,
                )
            )
        self._client = client

    @property
    def client(self) -> Any:
        """The wrapped embedding client."""
        return self._client

    @property
    def dimension(self) -> int | None:
        """Dimension of the produced vectors, when the client reports one."""
        return getattr(self._client, "dimension", None)

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Return one dense vector per input text.

        Args:
            texts: Texts to encode.

        Returns:
            One vector per text, in input order.

        Raises:
            EmbeddingError: If the underlying client fails.
        """
        return self._client.embed_texts(texts)

    def embed_query(self, query: str) -> list[float]:
        """Return the dense vector of a single query.

        Args:
            query: User query (already stripped by the API model).

        Returns:
            The query vector.

        Raises:
            EmbeddingError: If the client fails or returns nothing.
        """
        vectors = self.embed_texts([query])
        if not vectors:
            raise EmbeddingError("embedding client returned no vector for the query")
        return vectors[0]


def get_embedder() -> QueryEmbedder | None:
    """Return the process-wide embedder, loading it on first use.

    Returns:
        The shared :class:`QueryEmbedder`, or ``None`` when the model could not
        be loaded. ``None`` is cached, so a broken installation is not retried on
        every request -- call :func:`reset_embedder` after fixing the environment.
    """
    global _embedder, _loaded

    if _loaded:
        return _embedder

    with _embedder_lock:
        if _loaded:
            return _embedder

        try:
            _embedder = QueryEmbedder()
            logger.info(
                "embedder loaded model={} batch_size={}",
                settings.embedding_model_path,
                settings.embedding_batch_size,
            )
        except Exception as exc:  # noqa: BLE001 - a broken model must not kill boot
            logger.warning(
                "embedder unavailable model={} error={!r}",
                settings.embedding_model_path,
                exc,
            )
            _embedder = None

        _loaded = True

    return _embedder


def reset_embedder() -> None:
    """Drop the cached embedder so the next call reloads it.

    Intended for operational recovery (weights re-downloaded, GPU freed) and for
    tests that need to exercise the ``embedding_unavailable`` branch.
    """
    global _embedder, _loaded

    with _embedder_lock:
        _embedder = None
        _loaded = False


__all__ = ["QueryEmbedder", "get_embedder", "reset_embedder"]
