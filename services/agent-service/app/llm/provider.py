"""平台级默认 LLM Provider。"""

from __future__ import annotations

from typing import Any

from app.clients.model import ModelServiceClient


def get_default_llm_client() -> Any:
    """返回平台默认 LLM 客户端。

    Agent 只依赖这个共享入口或外部注入的 client，不直接绑定具体模型实现。
    """

    return ModelServiceClient()
