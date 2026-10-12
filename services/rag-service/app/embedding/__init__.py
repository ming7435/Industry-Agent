"""Embedding pipeline for retrieval-ready chunks.

``models`` contains the embedding client and shared query factory
(:func:`~app.embedding.models.get_embedder`); ``pipeline`` turns chunks into
vector records so documents and queries share SiliconFlow BGE-M3.
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
