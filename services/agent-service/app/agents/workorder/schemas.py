"""WorkOrder Agent 的输入、内部状态和输出契约。"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, TypedDict

from pydantic import BaseModel, Field


WORKORDER_ACTIONS = {
    "create", "assign", "query", "get", "update", "submit_feedback",
    "mark_repair_completed", "close", "reopen",
}


class WorkOrderQuery(BaseModel):
    task_id: str = ""
    trace_id: str = ""
    action: str = "create"
    workorder_id: str = ""
    device_id: str = ""
    title: str = ""
    maintenance_plan: Dict[str, Any] = Field(default_factory=dict)
    plan: Dict[str, Any] = Field(default_factory=dict)
    workorder: Dict[str, Any] = Field(default_factory=dict)
    repair_feedback: Dict[str, Any] | str = Field(default_factory=dict)
    repair_verification: Dict[str, Any] = Field(default_factory=dict)
    status: str = ""
    assignee: str = ""
    fault_level: str = ""
    idempotency_key: str = ""
    closure_reason: str = ""
    priority: str = "normal"
    risk_level: str = ""
    source: str = ""
    context: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_payload(cls, payload: Any) -> "WorkOrderQuery":
        if isinstance(payload, cls):
            return payload
        if hasattr(payload, "model_dump"):
            payload = payload.model_dump(mode="json")
        values = dict(payload or {})
        plan = values.get("maintenance_plan") or values.get("plan") or {}
        if hasattr(plan, "model_dump"):
            plan = plan.model_dump(mode="json")
        values["maintenance_plan"] = dict(plan or {})
        values.setdefault("device_id", str(values["maintenance_plan"].get("device_id") or values["maintenance_plan"].get("diagnosis", {}).get("device_id") or ""))
        return cls(**values)


class WorkOrderResult(BaseModel):
    action: str
    success: bool = False
    workorder_id: str = ""
    status: str = ""
    priority: str = "normal"
    assignee: str = ""
    workorder: Dict[str, Any] = Field(default_factory=dict)
    items: List[Dict[str, Any]] = Field(default_factory=list)
    candidates: List[Dict[str, Any]] = Field(default_factory=list)
    dispatch_context: Dict[str, Any] = Field(default_factory=dict)
    validation_findings: List[str] = Field(default_factory=list)
    stop_reason: str = ""
    error: str = ""


class WorkOrderGraphState(TypedDict, total=False):
    agent: Any
    request: Dict[str, Any]
    active_skill: str
    active_skills: List[str]
    allowed_tools: List[str]
    action: str
    plan: Dict[str, Any]
    workorder: Dict[str, Any]
    dispatch_context: Dict[str, Any]
    candidates: List[Dict[str, Any]]
    selected_assignee: str
    priority: str
    validation_findings: List[str]
    result: WorkOrderResult
    route: str
    stop_reason: str
