"""Quality Agent 的维修验收 LangGraph。"""

from __future__ import annotations

from typing import Any, Dict, List, Mapping, TypedDict

from langgraph.graph import END, START, StateGraph

from app.validator import QualityResult

from .schemas import QualityQuery
from .validator import QualityValidator


class QualityWorkflowState(TypedDict, total=False):
    agent: Any
    request: Dict[str, Any]
    active_skill: str
    allowed_tools: List[str]
    workorder: Dict[str, Any]
    repair_feedback: Dict[str, Any]
    repair_check: Dict[str, Any]
    workorder_check: Dict[str, Any]
    device_status: Dict[str, Any]
    active_alarms: Dict[str, Any]
    alarm_check: Dict[str, Any]
    parameter_check: Dict[str, Any]
    sop_check: Dict[str, Any]
    decision: Dict[str, Any]
    workorder_action: Dict[str, Any]
    validation_findings: List[str]
    route: str
    stop_reason: str
    result: QualityResult


def initialize(state: QualityWorkflowState) -> Dict[str, Any]:
    request = QualityQuery.from_payload(state.get("request") or {}).model_dump(mode="json")
    return {"request": request, "validation_findings": [], "route": "load_skill"}


def load_skill(_: QualityWorkflowState) -> Dict[str, Any]:
    return {
        "active_skill": "quality_master_skill",
        "allowed_tools": [
            "get_workorder", "get_repair_feedback", "get_device_status", "get_device_history",
            "get_active_alarms", "check_workorder_compliance", "verify_alarm_clearance",
            "compare_pre_post_metrics", "close_workorder", "reopen_workorder",
        ],
        "route": "load_workorder",
    }


def load_workorder(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    supplied = dict(request.get("workorder") or {})
    workorder_id = str(request.get("workorder_id") or supplied.get("workorder_id") or "")
    loaded = agent._safe_tool("get_workorder", {"workorder_id": workorder_id}) if workorder_id else {}
    workorder = loaded if loaded.get("workorder_id") else supplied
    if not workorder:
        return {"workorder": {}, "validation_findings": ["缺少可验收工单"], "route": "fallback"}
    return {"workorder": workorder, "route": "load_repair_feedback"}


def load_repair_feedback(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    workorder = state["workorder"]
    raw = request.get("repair_feedback")
    if isinstance(raw, Mapping) and raw:
        feedback = dict(raw)
    elif raw:
        feedback = {"repair_feedback": str(raw), "feedback": str(raw), "complete": True, "source": "request"}
    else:
        feedback = agent._safe_tool("get_repair_feedback", {"workorder_id": workorder.get("workorder_id", "")})
    if feedback.get("repair_feedback") and not workorder.get("repair_feedback"):
        workorder = {**workorder, "repair_feedback": feedback["repair_feedback"]}
    return {"workorder": workorder, "repair_feedback": feedback, "route": "verify_device"}


def verify_device(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    workorder = state["workorder"]
    device_id = str(state["request"].get("device_id") or workorder.get("device_id") or "")
    repair_check = agent._safe_tool("verify_repair", {"workorder_id": workorder.get("workorder_id", ""), "device_id": device_id})
    workorder_check = agent._safe_tool("check_workorder_compliance", {"workorder_id": workorder.get("workorder_id", ""), "workorder": workorder})
    device_status = agent._safe_tool("get_device_status", {"device_id": device_id}) if device_id else {"found": False, "success": False}
    return {"repair_check": repair_check, "workorder_check": workorder_check, "device_status": device_status, "route": "verify_alarm"}


def verify_alarm(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    device_id = str(state["request"].get("device_id") or state["workorder"].get("device_id") or "")
    active_alarms = agent._safe_tool("get_active_alarms", {"device_id": device_id, "device_status": state.get("device_status") or {}}) if device_id else {"active_alarms": []}
    alarm_check = agent._safe_tool("verify_alarm_clearance", {
        "device_status": state.get("device_status") or {},
        "active_alarms": active_alarms,
        "repair_check": state.get("repair_check") or {},
    })
    return {"active_alarms": active_alarms, "alarm_check": alarm_check, "route": "verify_parameters"}


def verify_parameters(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    workorder = state["workorder"]
    request = state["request"]
    metric_keys = agent._metric_keys(agent._context_text(request, workorder))
    device_id = str(request.get("device_id") or workorder.get("device_id") or "")
    history = agent._safe_tool("get_device_history", {"device_id": device_id, "metric_keys": metric_keys, "limit": 20}) if device_id and metric_keys else {}
    post_metrics = dict(request.get("post_metrics") or (state.get("device_status") or {}).get("metrics") or {})
    parameter_check = agent._safe_tool("compare_pre_post_metrics", {
        "pre_metrics": request.get("pre_metrics") or {},
        "post_metrics": post_metrics,
        "history": history,
        "metric_keys": metric_keys,
    })
    parameter_check["history"] = history
    return {"parameter_check": parameter_check, "route": "verify_sop"}


def verify_sop(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    workorder = state["workorder"]
    query = agent._sop_query(state["request"], workorder)
    sop_check = agent.request_sop(query, workorder, state["request"])
    return {"sop_check": sop_check, "route": "validate"}


def validate(state: QualityWorkflowState) -> Dict[str, Any]:
    decision = QualityValidator.validate(
        state.get("workorder") or {},
        state.get("repair_check") or {},
        state.get("device_status") or {},
        state.get("sop_check") or {},
        state.get("parameter_check") or {},
        alarm_check=state.get("alarm_check") or {},
        workorder_check=state.get("workorder_check") or {},
        repair_feedback=state.get("repair_feedback") or {},
    )
    return {"decision": decision, "validation_findings": list(decision.get("findings") or []), "route": "decision"}


def decision(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    quality = state["decision"]
    workorder_id = str((state.get("workorder") or {}).get("workorder_id") or "")
    action: Dict[str, Any] = {}
    if request.get("manage_workorder", True) and workorder_id:
        action_name = "close_workorder" if quality.get("passed") else "reopen_workorder"
        action = agent._safe_tool(action_name, {"workorder_id": workorder_id})
    return {"workorder_action": action, "route": "final"}


def final(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    result = agent._build_result(state)
    return {"result": result, "stop_reason": "validator_pass" if result.passed else "validator_fail"}


def fallback(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    findings = list(state.get("validation_findings") or ["质量验收流程未完成"])
    result = agent._fallback_result(state.get("request") or {}, findings)
    return {"result": result, "stop_reason": "fallback"}


def build_quality_graph():
    workflow = StateGraph(QualityWorkflowState)
    for name, node in (
        ("initialize", initialize), ("load_skill", load_skill), ("load_workorder", load_workorder),
        ("load_repair_feedback", load_repair_feedback), ("verify_device", verify_device),
        ("verify_alarm", verify_alarm), ("verify_parameters", verify_parameters),
        ("verify_sop", verify_sop), ("validate", validate), ("decision", decision),
        ("final", final), ("fallback", fallback),
    ):
        workflow.add_node(name, node)
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "load_workorder")
    workflow.add_conditional_edges("load_workorder", lambda state: state.get("route", "load_repair_feedback"), {"load_repair_feedback": "load_repair_feedback", "fallback": "fallback"})
    workflow.add_edge("load_repair_feedback", "verify_device")
    workflow.add_edge("verify_device", "verify_alarm")
    workflow.add_edge("verify_alarm", "verify_parameters")
    workflow.add_edge("verify_parameters", "verify_sop")
    workflow.add_edge("verify_sop", "validate")
    workflow.add_edge("validate", "decision")
    workflow.add_edge("decision", "final")
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
