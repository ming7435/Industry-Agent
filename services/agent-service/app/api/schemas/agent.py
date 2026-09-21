from __future__ import annotations

from typing import Any, Dict
from pydantic import BaseModel, Field


class UserQuestionRequest(BaseModel):
    user_text: str = Field(min_length=1)
    context: Dict[str, Any] = Field(default_factory=dict)


class AbnormalEventRequest(BaseModel):
    event: Dict[str, Any]
