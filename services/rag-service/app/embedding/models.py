"""Embedding data models and configuration."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from typing import Any, Protocol

from app.chunk import IndustrialChunk


class EmbeddingError(RuntimeError):
    """Raised when chunk embedding fails."""


class EmbeddingClient(Protocol):
    """Protocol implemented by embedding providers."""

    @property
    def dimension(self) -> int | None:
        ...

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...


@dataclass(frozen=True)
class EmbeddingConfig:
    """Options controlling chunk filtering and embedding batches."""

    model_name: str = "BAAI/bge-m3"
    batch_size: int = 16
    min_characters: int = 20
    normalize_embeddings: bool = True
    skip_low_quality: bool = True
    skip_unrecognized_visual: bool = True
    expected_dimension: int | None = None

    def __post_init__(self) -> None:
        if not self.model_name.strip():
            raise ValueError("model_name must not be empty.")
        if self.batch_size <= 0:
            raise ValueError("batch_size must be greater than zero.")
        if self.min_characters < 0:
            raise ValueError("min_characters must not be negative.")
        if self.expected_dimension is not None and self.expected_dimension <= 0:
            raise ValueError("expected_dimension must be greater than zero.")


@dataclass
class VectorRecord:
    """A chunk plus its dense vector and flattened Milvus-friendly fields."""

    id: str
    chunk_id: str
    text: str
    vector: list[float]
    source_name: str | None
    page_numbers: list[int] = field(default_factory=list)
    chunk_type: str | None = None
    quality: str | None = None
    contains_table: bool = False
    contains_image: bool = False
    contains_cad: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)
    source_path: str | None = None
    source_format: str | None = None

    @property
    def metadata_json(self) -> str:
        return json.dumps(self.metadata, ensure_ascii=False)

    @classmethod
    def from_chunk(cls, chunk: IndustrialChunk, vector: list[float]) -> "VectorRecord":
        metadata = dict(chunk.metadata)
        return cls(
            id=chunk.chunk_id,
            chunk_id=chunk.chunk_id,
            text=chunk.text,
            vector=vector,
            source_name=metadata.get("source_name"),
            source_path=metadata.get("source_path"),
            source_format=metadata.get("source_format"),
            page_numbers=list(metadata.get("page_numbers") or []),
            chunk_type=metadata.get("chunk_type"),
            quality=metadata.get("quality"),
            contains_table=bool(metadata.get("contains_table")),
            contains_image=bool(metadata.get("contains_image")),
            contains_cad=bool(metadata.get("contains_cad")),
            metadata=metadata,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "chunk_id": self.chunk_id,
            "text": self.text,
            "vector": list(self.vector),
            "source_name": self.source_name,
            "source_path": self.source_path,
            "source_format": self.source_format,
            "page_numbers": list(self.page_numbers),
            "chunk_type": self.chunk_type,
            "quality": self.quality,
            "contains_table": self.contains_table,
            "contains_image": self.contains_image,
            "contains_cad": self.contains_cad,
            "metadata": dict(self.metadata),
            "metadata_json": self.metadata_json,
        }


def validate_vector(
    vector: list[float],
    *,
    expected_dimension: int | None = None,
) -> None:
    """Validate one embedding vector before creating a record."""

    if not vector:
        raise EmbeddingError("Embedding vector must not be empty.")
    if expected_dimension is not None and len(vector) != expected_dimension:
        raise EmbeddingError(
            f"Expected embedding dimension {expected_dimension}, got {len(vector)}."
        )
    for value in vector:
        if not isinstance(value, int | float) or not math.isfinite(float(value)):
            raise EmbeddingError("Embedding vector contains a non-finite numeric value.")


__all__ = [
    "EmbeddingClient",
    "EmbeddingConfig",
    "EmbeddingError",
    "VectorRecord",
    "validate_vector",
]
