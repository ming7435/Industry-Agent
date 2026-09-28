"""由模型服务维护的提供方契约。"""

from __future__ import annotations

from typing import Any, Mapping, Protocol


class ProviderError(RuntimeError):
    """由网关对外暴露的规范化提供方错误。"""


class ModelProvider(Protocol):
    name: str

    def chat(self, payload: Mapping[str, Any]) -> dict[str, Any]: ...

    def embeddings(self, payload: Mapping[str, Any]) -> dict[str, Any]: ...

    def rerank(self, payload: Mapping[str, Any]) -> dict[str, Any]: ...


__all__ = ["ModelProvider", "ProviderError"]
