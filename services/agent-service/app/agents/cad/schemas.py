"""CAD Agent 的内部请求契约。"""

from __future__ import annotations

from typing import Any, Dict
from uuid import uuid4

from pydantic import BaseModel, Field


class CADQuery(BaseModel):
    """统一承接用户、Diagnosis 和 Maintenance 发来的工程查询。"""

    request_id: str = Field(default_factory=lambda: "CADR-" + uuid4().hex[:12].upper())
    device_id: str = ""
    device_model: str = ""
    component: str = ""
    part_no: str = ""
    query: str = ""
    max_steps: int = Field(default=5, ge=1, le=6)

    @classmethod
    def from_payload(cls, payload: Any) -> "CADQuery":
        if isinstance(payload, cls):
            return payload
        if isinstance(payload, str):
            return cls(query=payload)
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        values: Dict[str, Any] = dict(payload or {})
        if not values.get("query"):
            values["query"] = values.get("fault") or values.get("summary") or "工程结构查询"
        return cls(**values)

