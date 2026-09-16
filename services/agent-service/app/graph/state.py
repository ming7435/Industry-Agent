"""多 Agent 编排共享状态。"""

from __future__ import annotations

from typing import Any, Dict, List, TypedDict


class AgentState(TypedDict, total=False):
    task_id: str
    trace_id: str
    entry: str
    user_text: str
    context: Dict[str, Any]
    event: Dict[str, Any]
    route: str
    route_result: Dict[str, Any]
    diagnosis: Dict[str, Any]
    knowledge: Dict[str, Any]
    cad: Dict[str, Any]
    maintenance_plan: Dict[str, Any]
    workorder: Dict[str, Any]
    quality: Dict[str, Any]
    report: Dict[str, Any]
    experience: Dict[str, Any]
    memory: Dict[str, Any]
    status: str
    pending_workorder_id: str
    errors: List[str]
    trace: List[Dict[str, Any]]
