from __future__ import annotations

from pydantic import BaseModel, Field


class ClosureTaskRequest(BaseModel):
    workorder_id: str = ""
    quality_check_id: str = ""
    title: str = Field(min_length=1)
    owner: str = ""
    actions: list[str] = Field(default_factory=list)
    due_at: str = ""
