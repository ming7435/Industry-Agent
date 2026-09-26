"""Report Agent 的报告汇总 LangGraph。"""

from __future__ import annotations

from typing import Any, Dict, List, TypedDict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry
from app.agents.base import trace_skill_node
from app.contracts import ReportResult

from .schemas import ReportQuery


class ReportWorkflowState(TypedDict, total=False):
    agent: Any
    active_agent: str
    current_step: str
    step_history: list[dict[str, Any]]
    completed_steps: list[dict[str, Any]]
    failed_steps: list[dict[str, Any]]
    request: Dict[str, Any]
    active_skill: str
    active_skills: List[str]
    allowed_tools: List[str]
    diagnosis: Dict[str, Any]
    maintenance_plan: Dict[str, Any]
    workorder: Dict[str, Any]
    repair_feedback: Dict[str, Any]
    repair_verification: Dict[str, Any]
    quality: Dict[str, Any]
    knowledge: Dict[str, Any]
    event: Dict[str, Any]
    trace_summary: Dict[str, Any]
    sections: Dict[str, Any]
    source_refs: List[Dict[str, Any]]
    report_type: str
    completeness_findings: List[str]
    validation_findings: List[str]
    persistence: Dict[str, Any]
    report: ReportResult
    route: str
    stop_reason: str
    result: ReportResult


def initialize(state: ReportWorkflowState) -> Dict[str, Any]:
    request = ReportQuery.from_payload(state.get("request") or {}).model_dump(mode="json")
    return {"request": request, "completeness_findings": [], "validation_findings": [], "route": "load_skill"}


def load_skill(state: ReportWorkflowState) -> Dict[str, Any]:
    skills = get_skill_registry().select("report", state.get("request") or {})
    names = [skill.name for skill in skills] or ["report_master_skill"]
    default_tools = [
        "get_diagnosis_record", "get_maintenance_record", "get_workorder", "get_quality_record",
        "get_trace_summary", "persist_report", "generate_report_file",
    ]
    return {
        "active_skill": "+".join(names),
        "active_skills": names,
        "allowed_tools": get_skill_registry().merge_tools(skills) or default_tools,
        "route": "collect_sources",
    }


def collect_sources(state: ReportWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]

    diagnosis_raw = agent._safe_tool("get_diagnosis_record", {"record": request.get("diagnosis"), "event": request.get("event"), "event_id": request.get("event_id", "")})
    plan_raw = agent._safe_tool("get_maintenance_record", {"record": request.get("maintenance_plan"), "plan_id": (request.get("maintenance_plan") or {}).get("plan_id", "")})
    order = dict(request.get("workorder") or {})
    if not order and request.get("workorder_id"):
        order = agent._safe_tool("get_workorder", {"workorder_id": request["workorder_id"]})
    feedback = agent._mapping(request.get("repair_feedback") or order.get("repair_feedback"))
    verification = agent._mapping(request.get("repair_verification") or order.get("repair_verification"))
    quality_raw = agent._safe_tool("get_quality_record", {"record": request.get("quality"), "workorder_id": request.get("workorder_id", "")})
    trace_raw = agent._safe_tool("get_trace_summary", {"trace": request.get("trace") or [], "trace_id": request.get("trace_id", "")})

    return {
        "diagnosis": agent._record(diagnosis_raw),
        "maintenance_plan": agent._record(plan_raw),
        "workorder": order,
        "repair_feedback": feedback,
        "repair_verification": verification,
        "quality": agent._record(quality_raw),
        "knowledge": dict(request.get("knowledge") or {}),
        "event": dict(request.get("event") or {}),
        "trace_summary": dict(trace_raw.get("summary") or {}),
        "route": "check_completeness",
    }


def check_completeness(state: ReportWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    report_type = agent._report_type(request, state.get("diagnosis") or {}, state.get("maintenance_plan") or {}, state.get("workorder") or {}, state.get("repair_feedback") or {}, state.get("repair_verification") or {}, state.get("quality") or {})
    sections = {key: value for key, value in {
        "diagnosis": state.get("diagnosis") or {},
        "maintenance_plan": state.get("maintenance_plan") or {},
        "workorder": state.get("workorder") or {},
        "repair_feedback": state.get("repair_feedback") or {},
        "repair_verification": state.get("repair_verification") or {},
        "quality": state.get("quality") or {},
        "knowledge": state.get("knowledge") or {},
        "event": state.get("event") or {},
        "trace_summary": state.get("trace_summary") or {},
    }.items() if value}
    findings = agent._completeness_findings(sections, report_type)
    return {"report_type": report_type, "sections": sections, "completeness_findings": findings, "route": "compose" if sections else "fallback"}


def compose(state: ReportWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    refs = agent._source_refs(state["request"], state.get("sections") or {})
    report = agent._compose_result(state.get("request") or {}, state.get("sections") or {}, state.get("report_type") or "incident_report", refs, list(state.get("completeness_findings") or []))
    return {"source_refs": refs, "report": report, "route": "validate"}


def validate(state: ReportWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    report = state["report"]
    findings = agent._validate_report(state.get("sections") or {}, state.get("source_refs") or [], state.get("report_type") or "maintenance_report", state.get("completeness_findings") or [])
    status = "completed" if not findings else "incomplete"
    report = report.model_copy(update={"status": status, "validation_findings": findings, "stop_reason": "validator_pass" if not findings else "validation_failed"})
    return {"report": report, "validation_findings": findings, "route": "persist"}


def persist(state: ReportWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    report = state["report"]
    persistence: Dict[str, Any] = {}
    if request.get("persist", True):
        persistence = agent._safe_tool("persist_report", {"report": report.model_dump(mode="json")})
        report = report.model_copy(update={"persisted": bool(persistence.get("persisted"))})
    return {"report": report, "persistence": persistence, "route": "final"}


def final(state: ReportWorkflowState) -> Dict[str, Any]:
    return {"result": state["report"], "stop_reason": state["report"].stop_reason}


def fallback(state: ReportWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    report = agent._fallback_result(state.get("request") or {}, state.get("completeness_findings") or ["报告汇总流程未完成"])
    return {"result": report, "stop_reason": "fallback"}


def build_report_graph():
    workflow = StateGraph(ReportWorkflowState)
    for name, node in (
        ("initialize", initialize), ("load_skill", load_skill), ("collect_sources", collect_sources),
        ("check_completeness", check_completeness), ("compose", compose), ("validate", validate),
        ("persist", persist), ("final", final), ("fallback", fallback),
    ):
        workflow.add_node(name, trace_skill_node("report", name, node))
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "collect_sources")
    workflow.add_edge("collect_sources", "check_completeness")
    workflow.add_conditional_edges("check_completeness", lambda state: state.get("route", "fallback"), {"compose": "compose", "fallback": "fallback"})
    workflow.add_edge("compose", "validate")
    workflow.add_edge("validate", "persist")
    workflow.add_edge("persist", "final")
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
