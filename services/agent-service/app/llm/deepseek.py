"""Deprecated compatibility facade for the Model Service client.

Provider credentials and provider HTTP calls now belong to Model Service. The
class name remains temporarily so older integrations can keep importing it.
"""

from __future__ import annotations

import os
from typing import Optional

from app.clients.model import ModelServiceClient

class DeepSeekClient(ModelServiceClient):
    """Deprecated alias; use :class:`ModelServiceClient`."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        super().__init__(base_url=None, model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"))
