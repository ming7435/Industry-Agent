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
    workorder_result: Dict[str, Any]
    quality: Dict[str, Any]
    rework_via: str
    report: Dict[str, Any]
    experience: Dict[str, Any]
    memory: Dict[str, Any]
    memory_result: Dict[str, Any]
    repair_feedback: Dict[str, Any]
    repair_verification: Dict[str, Any]
    status: str
    pending_workorder_id: str
    errors: List[str]
    trace: List[Dict[str, Any]]
    evidence_loop: Dict[str, Any]
    evidence_loop_attempts: int
    evidence_status: str
    diagnosis_review: Dict[str, Any]
    maintenance_replan: Dict[str, Any]
    stop_reason: str
    goal_event: Dict[str, Any]
    runtime_plan: Dict[str, Any]
    runtime_next_index: int
    runtime_outputs: Dict[str, Any]
    runtime_result: Dict[str, Any]
    runtime_actions: List[str]
    runtime_policy: Dict[str, Any]
    runtime_pending_task: Dict[str, Any]
    runtime_resume: Dict[str, Any]
