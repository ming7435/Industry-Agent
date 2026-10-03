"""多 Agent 编排共享状态。"""

from __future__ import annotations

from app.agents.state import AgentExecutionState

from typing import Any, Dict, List


class AgentState(AgentExecutionState, total=False):
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
    report: Dict[str, Any]
    experience: Dict[str, Any]
    memory: Dict[str, Any]
    memory_result: Dict[str, Any]
    repair_feedback: Dict[str, Any]
    repair_verification: Dict[str, Any]
    status: str
    errors: List[str]
    trace: List[Dict[str, Any]]
    evidence_status: str
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
    tool_calls: List[Dict[str, Any]]
    observations: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]
    evidence_records: List[Dict[str, Any]]
    validation: Dict[str, Any]
    validation_results: List[Dict[str, Any]]
    next_action: Dict[str, Any]
