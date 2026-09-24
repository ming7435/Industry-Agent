"""Provider contract owned by Model Service."""

from __future__ import annotations

from typing import Any, Mapping, Protocol


class ProviderError(RuntimeError):
    """Normalized provider failure exposed by the gateway."""


class ModelProvider(Protocol):
    name: str

    def chat(self, payload: Mapping[str, Any]) -> dict[str, Any]: ...

    def embeddings(self, payload: Mapping[str, Any]) -> dict[str, Any]: ...

    def rerank(self, payload: Mapping[str, Any]) -> dict[str, Any]: ...


__all__ = ["ModelProvider", "ProviderError"]
