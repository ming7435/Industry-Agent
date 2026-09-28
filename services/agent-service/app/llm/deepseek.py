"""Model Service 客户端的弃用兼容门面。

Provider 凭据和 Provider HTTP 调用现由 Model Service 负责。暂时保留类名，
以便旧集成继续导入。
"""

from __future__ import annotations

import os
from typing import Optional

from app.clients.model import ModelServiceClient

class DeepSeekClient(ModelServiceClient):
    """已弃用的别名；请使用 :class:`ModelServiceClient`。"""

    def __init__(self, api_key: Optional[str] = None) -> None:
        super().__init__(base_url=None, model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"))
