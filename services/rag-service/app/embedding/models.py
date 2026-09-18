"""Embedding data models and configuration."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from typing import Any, Protocol

from loguru import logger

from app.chunk import IndustrialChunk
from config.settings import settings


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
    model_path: str | None = None
    batch_size: int = 16
    min_characters: int = 20
    normalize_embeddings: bool = True
    skip_low_quality: bool = True
    skip_unrecognized_visual: bool = True
    expected_dimension: int | None = None

    def __post_init__(self) -> None:
        if not self.model_name.strip():
            raise ValueError("model_name must not be empty.")
        if self.model_path is not None and not self.model_path.strip():
            raise ValueError("model_path must not be empty when provided.")
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
    drawing_id: str | None = None
    version_id: str | None = None
    entity_id: str | None = None
    project_id: str | None = None
    layer_name: str | None = None
    device_id: str | None = None
    tenant_id: str | None = None

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
            drawing_id=metadata.get("drawing_id"),
            version_id=metadata.get("version_id"),
            entity_id=metadata.get("entity_id"),
            project_id=metadata.get("project_id"),
            layer_name=metadata.get("layer_name"),
            device_id=metadata.get("device_id"),
            tenant_id=metadata.get("tenant_id"),
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
            "drawing_id": self.drawing_id,
            "version_id": self.version_id,
            "entity_id": self.entity_id,
            "project_id": self.project_id,
            "layer_name": self.layer_name,
            "device_id": self.device_id,
            "tenant_id": self.tenant_id,
            "page_numbers": list(self.page_numbers),
            "chunk_type": self.chunk_type,
            "quality": self.quality,
            "contains_table": self.contains_table,
            "contains_image": self.contains_image,
            "contains_cad": self.contains_cad,
            "metadata": dict(self.metadata),
            "metadata_json": self.metadata_json,
        }


class BGEM3EmbeddingClient:
    """Embed texts with the local ``BAAI/bge-m3`` sentence-transformers model."""

    def __init__(
        self,
        config: EmbeddingConfig | None = None,
        *,
        model: Any | None = None,
    ) -> None:
        self.config = config or EmbeddingConfig()
        self._model = model or self._load_model()
        self._dimension: int | None = None

    @property
    def dimension(self) -> int | None:
        return self._dimension

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Return one normalized dense vector per input text."""

        if not texts:
            return []
        if any(not text.strip() for text in texts):
            raise ValueError("Embedding texts must not contain empty strings.")

        try:
            vectors = self._model.encode(
                texts,
                normalize_embeddings=self.config.normalize_embeddings,
                convert_to_numpy=False,
                show_progress_bar=False,
            )
        except TypeError:
            # Keep compatibility with older sentence-transformers versions,
            # then apply the requested normalization locally instead of
            # silently changing the geometry used by COSINE search.
            vectors = self._model.encode(texts)
        except Exception as exc:
            raise EmbeddingError(f"BGE-M3 embedding failed: {exc}") from exc

        normalized_vectors = [_as_float_list(vector) for vector in vectors]
        if self.config.normalize_embeddings:
            normalized_vectors = [_l2_normalize(vector) for vector in normalized_vectors]
        if normalized_vectors:
            self._dimension = len(normalized_vectors[0])
        return normalized_vectors

    def _load_model(self) -> Any:
        model_name = self.config.model_path or self.config.model_name
        if self.config.model_path and (Path(self.config.model_path) / "onnx" / "model.onnx").is_file():
            return _OnnxEmbeddingModel(self.config.model_path)

        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise EmbeddingError(
                "BGE-M3 embeddings require sentence-transformers. "
                "Install it with 'pip install sentence-transformers'."
            ) from exc

        try:
            return SentenceTransformer(model_name, local_files_only=bool(self.config.model_path))
        except TypeError:
            # Older sentence-transformers versions do not expose local_files_only.
            # A local path is still passed directly, so no model name resolution is needed.
            try:
                return SentenceTransformer(model_name)
            except Exception as exc:
                raise EmbeddingError(
                    f"Unable to load embedding model '{model_name}': {exc}"
                ) from exc
        except Exception as exc:
            model_name = self.config.model_path or self.config.model_name
            raise EmbeddingError(
                f"Unable to load embedding model '{model_name}': {exc}"
            ) from exc


class _OnnxEmbeddingModel:
    """Small SentenceTransformer-compatible wrapper for local BGE ONNX exports.

    The project normally uses the PyTorch SentenceTransformer checkpoint. Some
    Windows deployments already have the official ONNX export, however, and it
    produces the same 1024-dimensional sentence embeddings. Keeping this
    adapter behind ``BGEM3EmbeddingClient`` preserves the existing ingestion and
    retrieval contracts while allowing those deployments to run offline.
    """

    def __init__(self, model_path: str) -> None:
        try:
            import numpy as np
            import onnxruntime as ort
            from transformers import AutoTokenizer
        except ImportError as exc:
            raise EmbeddingError(
                "Local BGE ONNX models require onnxruntime and transformers."
            ) from exc

        self._np = np
        self._session = ort.InferenceSession(
            str(Path(model_path) / "onnx" / "model.onnx"),
            providers=["CPUExecutionProvider"],
        )
        self._tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            local_files_only=True,
        )
        self._input_names = {item.name for item in self._session.get_inputs()}

    def encode(
        self,
        texts: list[str],
        *,
        normalize_embeddings: bool = True,
        convert_to_numpy: bool = False,
        show_progress_bar: bool = False,
        **_: Any,
    ) -> list[Any]:
        del convert_to_numpy, show_progress_bar
        if not texts:
            return []

        encoded = self._tokenizer(
            texts,
            padding=True,
            truncation=True,
            # Ingestion chunks are capped at 1200 characters. Keeping the
            # ONNX sequence length bounded avoids quadratic CPU work from the
            # model's native 8192-token context window.
            max_length=512,
            return_tensors="np",
        )
        feed = {
            name: encoded[name].astype("int64")
            for name in self._input_names
            if name in encoded
        }
        vectors = self._session.run(["sentence_embedding"], feed)[0].astype("float32")
        if normalize_embeddings:
            norms = self._np.linalg.norm(vectors, axis=1, keepdims=True)
            vectors = vectors / self._np.where(norms == 0, 1, norms)
        return list(vectors)


class QueryEmbedder:
    """Thin, synchronous wrapper turning any embedding client into a query encoder."""

    def __init__(self, client: Any | None = None) -> None:
        """Wrap an embedding client, building the default one when omitted."""
        if client is None:
            client = BGEM3EmbeddingClient(
                EmbeddingConfig(
                    model_path=settings.embedding_model_path,
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
        """Return one dense vector per input text."""
        return self._client.embed_texts(texts)

    def embed_query(self, query: str) -> list[float]:
        """Return the dense vector of a single query."""
        vectors = self.embed_texts([query])
        if not vectors:
            raise EmbeddingError("embedding client returned no vector for the query")
        return vectors[0]


_embedder: QueryEmbedder | None = None
_loaded = False
_embedder_lock = Lock()


def get_embedder() -> QueryEmbedder | None:
    """Return the process-wide embedder, loading it on first use."""
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
    """Drop the cached embedder so the next call reloads it."""
    global _embedder, _loaded

    with _embedder_lock:
        _embedder = None
        _loaded = False


def _as_float_list(vector: Any) -> list[float]:
    if hasattr(vector, "tolist"):
        vector = vector.tolist()
    return [float(value) for value in vector]


def _l2_normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0.0:
        return vector
    return [value / norm for value in vector]


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
    "BGEM3EmbeddingClient",
    "EmbeddingClient",
    "EmbeddingConfig",
    "EmbeddingError",
    "QueryEmbedder",
    "VectorRecord",
    "get_embedder",
    "reset_embedder",
    "validate_vector",
]
