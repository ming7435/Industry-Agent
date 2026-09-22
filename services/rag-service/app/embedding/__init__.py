"""Embedding pipeline for retrieval-ready chunks.

``models`` / ``pipeline`` belong to the offline half (chunk -> vector records),
``model`` to the shared factory (:func:`~app.embedding.model.get_embedder`) the
online dense route uses so documents and queries share SiliconFlow BGE-M3.
"""

from .models import (
    EmbeddingClient,
    EmbeddingConfig,
    EmbeddingError,
    QueryEmbedder,
    SiliconFlowEmbeddingClient,
    VectorRecord,
    get_embedder,
    prune_empty,
    reset_embedder,
    validate_vector,
)
from .pipeline import embed_chunks, iter_embed_chunks, should_embed_chunk

__all__ = [
    "EmbeddingClient",
    "EmbeddingConfig",
    "EmbeddingError",
    "QueryEmbedder",
    "SiliconFlowEmbeddingClient",
    "VectorRecord",
    "embed_chunks",
    "get_embedder",
    "iter_embed_chunks",
    "reset_embedder",
    "should_embed_chunk",
    "validate_vector",
    "prune_empty",
]
