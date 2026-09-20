"""Memory Agent 的检索和经验学习契约。"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, TypedDict

from pydantic import BaseModel, Field


class MemoryQuery(BaseModel):
    task_id: str = ""
    trace_id: str = ""
    action: Literal["search", "recent", "learn"] = "search"
    device_id: str = ""
    device_model: str = ""
    alarm_code: str = ""
    fault_type: str = ""
    component: str = ""
    part_no: str = ""
    query: str = ""
    limit: int = Field(default=20, ge=1, le=100)
    diagnosis: Dict[str, Any] = Field(default_factory=dict)
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)
    workorder: Dict[str, Any] = Field(default_factory=dict)
    repair_feedback: Dict[str, Any] | str = Field(default_factory=dict)
    quality: Dict[str, Any] = Field(default_factory=dict)
    report: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_payload(cls, payload: Any) -> "MemoryQuery":
        if isinstance(payload, cls):
            return payload
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        return cls(**dict(payload or {}))


class MemoryResult(BaseModel):
    action: str
    success: bool = False
    items: List[Dict[str, Any]] = Field(default_factory=list)
    experience: Dict[str, Any] = Field(default_factory=dict)
    count: int = 0
    backend: str = ""
    validation_findings: List[str] = Field(default_factory=list)
    stop_reason: str = ""
    error: str = ""


class MemoryGraphState(TypedDict, total=False):
    agent: Any
    request: Dict[str, Any]
    action: str
    items: List[Dict[str, Any]]
    deduped_items: List[Dict[str, Any]]
    ranked_items: List[Dict[str, Any]]
    experience: Dict[str, Any]
    validation_findings: List[str]
    result: MemoryResult
    route: str
    stop_reason: str
