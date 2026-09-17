"""Local BGE-M3 embedding client.

This module keeps the optional sentence-transformers dependency isolated so the
rest of the RAG pipeline can be tested without loading a model.
"""

from __future__ import annotations

from typing import Any

from .models import EmbeddingConfig, EmbeddingError


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
            vectors = self._model.encode(texts)
        except Exception as exc:
            raise EmbeddingError(f"BGE-M3 embedding failed: {exc}") from exc

        normalized_vectors = [_as_float_list(vector) for vector in vectors]
        if normalized_vectors:
            self._dimension = len(normalized_vectors[0])
        return normalized_vectors

    def _load_model(self) -> Any:
        try:
            from sentence_transformers import SentenceTransformer
        except ImportError as exc:
            raise EmbeddingError(
                "BGE-M3 embeddings require sentence-transformers. "
                "Install it with 'pip install sentence-transformers'."
            ) from exc

        try:
            return SentenceTransformer(self.config.model_name)
        except Exception as exc:
            raise EmbeddingError(
                f"Unable to load embedding model '{self.config.model_name}': {exc}"
            ) from exc


def _as_float_list(vector: Any) -> list[float]:
    if hasattr(vector, "tolist"):
        vector = vector.tolist()
    return [float(value) for value in vector]


__all__ = ["BGEM3EmbeddingClient"]
