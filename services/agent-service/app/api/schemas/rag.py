from __future__ import annotations

from pydantic import BaseModel, Field


class RAGIngestRequest(BaseModel):
    path: str = Field(min_length=1)
    collection: str = ""
