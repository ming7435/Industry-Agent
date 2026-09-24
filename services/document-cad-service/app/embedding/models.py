"""Embedding data models and SiliconFlow query client."""

from __future__ import annotations

import json
import math
import http.client
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from threading import Lock
from typing import Any, Protocol

from loguru import logger

from app.chunk import IndustrialChunk
from config.settings import settings


class EmbeddingError(RuntimeError):
    """Raised when chunk or query embedding fails."""


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
    drawing_id: str | None = None
    version_id: str | None = None
    entity_id: str | None = None
    project_id: str | None = None
    layer_name: str | None = None
    device_id: str | None = None
    tenant_id: str | None = None

    @property
    def metadata_json(self) -> str:
        return json.dumps(prune_empty(self.metadata), ensure_ascii=False)

    @classmethod
    def from_chunk(cls, chunk: IndustrialChunk, vector: list[float]) -> "VectorRecord":
        metadata = prune_empty(chunk.metadata)
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


class SiliconFlowEmbeddingClient:
    """Embed texts through SiliconFlow's OpenAI-compatible embedding API."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout_s: float | None = None,
        max_attempts: int | None = None,
        retry_base_s: float | None = None,
        retry_max_s: float | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.siliconflow_api_key
        self.base_url = (base_url or settings.siliconflow_base_url).rstrip("/")
        self.model = model or settings.siliconflow_embedding_model
        self.timeout_s = (
            settings.embedding_request_timeout_seconds if timeout_s is None else timeout_s
        )
        self.max_attempts = settings.embedding_max_attempts if max_attempts is None else max_attempts
        self.retry_base_s = (
            settings.embedding_retry_base_seconds if retry_base_s is None else retry_base_s
        )
        self.retry_max_s = (
            settings.embedding_retry_max_seconds if retry_max_s is None else retry_max_s
        )
        self._dimension: int | None = None
        if not self.api_key:
            raise EmbeddingError("SILICONFLOW_API_KEY is not configured")
        if self.timeout_s <= 0:
            raise ValueError("timeout_s must be greater than zero")
        if self.max_attempts <= 0:
            raise ValueError("max_attempts must be greater than zero")
        if self.retry_base_s < 0 or self.retry_max_s < 0:
            raise ValueError("retry delays must not be negative")

    @property
    def dimension(self) -> int | None:
        return self._dimension

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if any(not text.strip() for text in texts):
            raise ValueError("Embedding texts must not contain empty strings.")
        payload = {
            "model": self.model,
            "input": texts,
        }
        request = urllib.request.Request(
            f"{self.base_url}/embeddings",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        body = ""
        for attempt in range(1, self.max_attempts + 1):
            try:
                with urllib.request.urlopen(request, timeout=self.timeout_s) as response:
                    body = response.read().decode("utf-8")
                break
            except urllib.error.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="ignore")[:300]
                if exc.code == 429 or 500 <= exc.code < 600:
                    if attempt < self.max_attempts:
                        delay = self._retry_delay(attempt, exc.headers.get("Retry-After"))
                        logger.warning(
                            "embedding request failed attempt={}/{} status={} retry_in={:.1f}s",
                            attempt,
                            self.max_attempts,
                            exc.code,
                            delay,
                        )
                        time.sleep(delay)
                        continue
                raise EmbeddingError(
                    f"SiliconFlow embedding request failed: HTTP {exc.code} {detail}"
                ) from exc
            except (
                urllib.error.URLError,
                http.client.IncompleteRead,
                http.client.RemoteDisconnected,
                TimeoutError,
                OSError,
            ) as exc:
                if attempt == self.max_attempts:
                    detail = str(getattr(exc, "reason", exc))[:300]
                    raise EmbeddingError(
                        f"SiliconFlow embedding request failed after {self.max_attempts} attempts: "
                        f"{type(exc).__name__}: {detail}"
                    ) from exc
                delay = self._retry_delay(attempt)
                logger.warning(
                    "embedding request failed attempt={}/{} error={!r} retry_in={:.1f}s",
                    attempt,
                    self.max_attempts,
                    exc,
                    delay,
                )
                time.sleep(delay)
        try:
            result = json.loads(body)
            items = result["data"]
            vectors = [
                _as_float_list(item["embedding"])
                for item in sorted(items, key=lambda item: int(item.get("index", 0)))
            ]
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise EmbeddingError("SiliconFlow embedding response is unusable") from exc
        if len(vectors) != len(texts):
            raise EmbeddingError(
                f"SiliconFlow returned {len(vectors)} embeddings for {len(texts)} texts"
            )
        if vectors:
            self._dimension = len(vectors[0])
        return vectors

    def _retry_delay(self, attempt: int, retry_after: str | None = None) -> float:
        """Return a bounded retry delay, honoring numeric Retry-After values."""

        if retry_after:
            try:
                return min(max(float(retry_after), 0.0), self.retry_max_s)
            except ValueError:
                pass
        return min(self.retry_base_s * (2 ** (attempt - 1)), self.retry_max_s)


class QueryEmbedder:
    """Thin, synchronous wrapper turning SiliconFlow embeddings into query vectors."""

    def __init__(self, client: Any | None = None) -> None:
        """Wrap an embedding client, building the default one when omitted."""
        self._client = client or SiliconFlowEmbeddingClient()

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
                "embedder loaded provider=siliconflow model={} batch_size={}",
                settings.siliconflow_embedding_model,
                settings.embedding_batch_size,
            )
        except Exception as exc:  # noqa: BLE001 - a broken provider must not kill boot
            logger.warning(
                "embedder unavailable provider=siliconflow model={} error={!r}",
                settings.siliconflow_embedding_model,
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


def prune_empty(value: Any) -> Any:
    """Remove blank metadata values while preserving false and zero values."""

    if isinstance(value, dict):
        cleaned = {}
        for key, item in value.items():
            normalized = prune_empty(item)
            if normalized is None:
                continue
            if isinstance(normalized, str) and not normalized.strip():
                continue
            if isinstance(normalized, (dict, list)) and not normalized:
                continue
            cleaned[key] = normalized
        return cleaned
    if isinstance(value, list):
        return [item for item in (prune_empty(item) for item in value) if item is not None]
    if isinstance(value, str):
        return value.strip()
    return value


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
    "QueryEmbedder",
    "SiliconFlowEmbeddingClient",
    "VectorRecord",
    "get_embedder",
    "reset_embedder",
    "validate_vector",
    "prune_empty",
]
