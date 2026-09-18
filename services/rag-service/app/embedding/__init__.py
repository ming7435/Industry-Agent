"""Embedding pipeline for retrieval-ready chunks.

``models`` / ``bge_m3`` / ``pipeline`` belong to the offline half (chunk ->
vector records), ``model`` to the shared factory
(:func:`~app.embedding.model.get_embedder`) the online dense route uses so that
documents and queries are encoded with the same weights.
"""

from .models import (
    BGEM3EmbeddingClient,
    EmbeddingClient,
    EmbeddingConfig,
    EmbeddingError,
    QueryEmbedder,
    VectorRecord,
    get_embedder,
    reset_embedder,
    validate_vector,
)
from .pipeline import embed_chunks, iter_embed_chunks, should_embed_chunk

__all__ = [
    "BGEM3EmbeddingClient",
    "EmbeddingClient",
    "EmbeddingConfig",
    "EmbeddingError",
    "QueryEmbedder",
    "VectorRecord",
    "embed_chunks",
    "get_embedder",
    "iter_embed_chunks",
    "reset_embedder",
    "should_embed_chunk",
    "validate_vector",
]
