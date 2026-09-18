"""Knowledge Agent 的内部请求契约。"""

from __future__ import annotations

from typing import Any, Dict, List
from uuid import uuid4

from pydantic import BaseModel, Field


class KnowledgeQuery(BaseModel):
    request_id: str = Field(default_factory=lambda: "KR-" + uuid4().hex[:12].upper())
    task_id: str = ""
    trace_id: str = ""
    device_id: str = ""
    query: str = ""
    query_type: str = "hybrid"
    alarm_code: str = ""
    component: str = ""
    document_id: str = ""
    chunk_id: str = ""
    required_sources: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)
    limit: int = Field(default=5, ge=1, le=50)
    max_steps: int = Field(default=4, ge=1, le=8)

    @classmethod
    def from_payload(cls, payload: Any) -> "KnowledgeQuery":
        if isinstance(payload, cls):
            return payload
        if isinstance(payload, str):
            return cls(query=payload)
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        values = dict(payload or {})
        if not values.get("query"):
            values["query"] = values.get("user_text") or values.get("fault") or values.get("summary") or "工业设备维修"
        if not values.get("required_sources"):
            values["required_sources"] = values.get("required_knowledge_types") or []
        filters = dict(values.get("filters") or {})
        for key in ("device_id", "alarm_code", "component", "document_id", "chunk_id"):
            if values.get(key) and key not in filters:
                filters[key] = values[key]
        values["filters"] = filters
        return cls(**values)
