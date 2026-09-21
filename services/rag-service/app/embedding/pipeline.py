"""Chunk-to-vector embedding pipeline."""

from __future__ import annotations

from collections.abc import Iterable, Iterator

from app.chunk import IndustrialChunk

from .models import (
    EmbeddingClient,
    EmbeddingConfig,
    EmbeddingError,
    VectorRecord,
    validate_vector,
)


BAD_RECOGNITION_STATUSES = {"pending", "failed", "disabled"}


def should_embed_chunk(chunk: IndustrialChunk, config: EmbeddingConfig | None = None) -> bool:
    """Return whether a chunk is clean enough to enter the vector store."""

    config = config or EmbeddingConfig()
    text = chunk.text.strip()
    if not text or len(text) < config.min_characters:
        return False

    metadata = chunk.metadata
    if config.skip_low_quality and metadata.get("quality") == "low":
        return False

    statuses = set(metadata.get("recognition_statuses") or [])
    if config.skip_unrecognized_visual and statuses & BAD_RECOGNITION_STATUSES:
        return False

    return True


def embed_chunks(
    chunks: Iterable[IndustrialChunk],
    client: EmbeddingClient,
    *,
    config: EmbeddingConfig | None = None,
) -> list[VectorRecord]:
    """Embed chunks and return vector records ready for Milvus insertion."""

    return list(iter_embed_chunks(chunks, client, config=config))


def iter_embed_chunks(
    chunks: Iterable[IndustrialChunk],
    client: EmbeddingClient,
    *,
    config: EmbeddingConfig | None = None,
) -> Iterator[VectorRecord]:
    """Stream vector records in batches while preserving chunk order."""

    config = config or EmbeddingConfig()
    expected_dimension = config.expected_dimension or client.dimension

    # 内存中只保留一个嵌入批次。旧实现会先物化所有有效分块，导致大文档导入在调用模型前就不必要地消耗内存。
    batch: list[IndustrialChunk] = []
    for chunk in chunks:
        if not should_embed_chunk(chunk, config):
            continue
        batch.append(chunk)
        if len(batch) < config.batch_size:
            continue

        vectors = client.embed_texts([item.text for item in batch])
        if len(vectors) != len(batch):
            raise EmbeddingError(
                f"Embedding client returned {len(vectors)} vectors for {len(batch)} texts."
            )
        if expected_dimension is None and vectors:
            expected_dimension = len(vectors[0])
        for chunk_item, vector in zip(batch, vectors, strict=True):
            validate_vector(vector, expected_dimension=expected_dimension)
            yield VectorRecord.from_chunk(chunk_item, vector)
        batch = []

    if not batch:
        return

    vectors = client.embed_texts([item.text for item in batch])
    if len(vectors) != len(batch):
        raise EmbeddingError(
            f"Embedding client returned {len(vectors)} vectors for {len(batch)} texts."
        )
    if expected_dimension is None and vectors:
        expected_dimension = len(vectors[0])
    for chunk, vector in zip(batch, vectors, strict=True):
        validate_vector(vector, expected_dimension=expected_dimension)
        yield VectorRecord.from_chunk(chunk, vector)


__all__ = [
    "BAD_RECOGNITION_STATUSES",
    "embed_chunks",
    "iter_embed_chunks",
    "should_embed_chunk",
]
