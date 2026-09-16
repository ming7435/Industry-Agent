"""平台级共享 LLM 客户端。"""

from .deepseek import DeepSeekClient
from .provider import get_default_llm_client

__all__ = ["DeepSeekClient", "get_default_llm_client"]
