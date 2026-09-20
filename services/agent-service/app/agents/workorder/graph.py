"""WorkOrder Agent LangGraph 编排。"""

from __future__ import annotations

from typing import Any, Dict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry

from .schemas import WorkOrderGraphState, WorkOrderResult
from .validator import WorkOrderAgentValidator


def initialize(state: WorkOrderGraphState) -> Dict[str, Any]:
    request = state["agent"].normalize_request(state.get("request") or {})
    return {"request": request, "action": request.get("action", "create"), "validation_findings": [], "route": "load_skill"}


def load_skill(state: WorkOrderGraphState) -> Dict[str, Any]:
    skills = get_skill_registry().select("workorder", state.get("request") or {})
    names = [item.name for item in skills]
    return {"active_skill": "+".join(names), "active_skills": names, "allowed_tools": get_skill_registry().merge_tools(skills), "route": "validate_plan"}


def validate_plan(state: WorkOrderGraphState) -> Dict[str, Any]:
    findings = WorkOrderAgentValidator.validate_request(state["request"])
    if findings:
        return {"validation_findings": findings, "route": "fallback"}
    return {"plan": dict(state["request"].get("maintenance_plan") or state["request"].get("plan") or {}), "route": "create_order" if state["action"] == "create" else "execute_action"}


def create_order(state: WorkOrderGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    existing = agent.find_idempotent(request)
    if existing:
        return {"workorder": existing, "route": "collect_dispatch_context"}
    order = agent.service.create_from_plan(state.get("plan") or {})
    raw = order.model_dump(mode="json") if hasattr(order, "model_dump") else dict(order)
    agent.remember_idempotent(request, raw)
    return {"workorder": raw, "route": "collect_dispatch_context"}


def collect_dispatch_context(state: WorkOrderGraphState) -> Dict[str, Any]:
    return {"dispatch_context": state["agent"].collect_dispatch_context(state.get("plan") or {}, state.get("workorder") or {}, state.get("request") or {}), "route": "select_assignee"}


def select_assignee(state: WorkOrderGraphState) -> Dict[str, Any]:
    context = dict(state.get("dispatch_context") or {})
    candidates = state["agent"].rank_candidates(context, state.get("request") or {}, state.get("plan") or {})
    requested = str(state["request"].get("assignee") or "")
    selected = requested or (str(candidates[0].get("technician_id") or candidates[0].get("name") or "") if candidates else "")
    context["candidates"] = candidates
    context["selected_assignee"] = selected
    return {"dispatch_context": context, "candidates": candidates, "selected_assignee": selected, "priority": WorkOrderAgentValidator.priority(state["request"], state.get("plan") or {}), "route": "assign_order"}


def assign_order(state: WorkOrderGraphState) -> Dict[str, Any]:
    order = dict(state.get("workorder") or {})
    assignee = state.get("selected_assignee") or ""
    if order.get("workorder_id") and assignee:
        order = state["agent"].service.assign(order["workorder_id"], assignee)
    return {"workorder": order, "route": "validate"}


def execute_action(state: WorkOrderGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    action = state["action"]
    try:
        result = agent.execute_action(request)
        raw = result.model_dump(mode="json") if hasattr(result, "model_dump") else dict(result or {})
        return {"workorder": raw, "route": "validate"}
    except Exception as error:
        return {"validation_findings": [str(error)], "route": "fallback"}


def validate(state: WorkOrderGraphState) -> Dict[str, Any]:
    findings = WorkOrderAgentValidator.final_findings(state["action"], state.get("workorder") or {}, state.get("validation_findings"))
    return {"validation_findings": findings, "route": "final" if not findings else "fallback"}


def final(state: WorkOrderGraphState) -> Dict[str, Any]:
    order = dict(state.get("workorder") or {})
    action = state["action"]
    items = list(order.get("items") or [])
    success = bool(order.get("workorder_id")) or (action == "query" and "items" in order)
    result = WorkOrderResult(
        action=action, success=success, workorder_id=str(order.get("workorder_id") or ""),
        status=str(order.get("status") or ""), priority=str(state.get("priority") or "normal"),
        assignee=str(order.get("assignee") or state.get("selected_assignee") or ""), workorder=order,
        items=items,
        candidates=list(state.get("candidates") or []), dispatch_context=dict(state.get("dispatch_context") or {}),
        validation_findings=list(state.get("validation_findings") or []), stop_reason="completed",
    )
    return {"result": result, "stop_reason": "completed"}


def fallback(state: WorkOrderGraphState) -> Dict[str, Any]:
    order = dict(state.get("workorder") or {})
    result = WorkOrderResult(action=state.get("action", "create"), success=False, workorder_id=str(order.get("workorder_id") or ""), status=str(order.get("status") or ""), workorder=order, validation_findings=list(state.get("validation_findings") or []), stop_reason="validation_failed", error="；".join(state.get("validation_findings") or []))
    return {"result": result, "stop_reason": "validation_failed"}


def _route(state: WorkOrderGraphState) -> str:
    return str(state.get("route") or "fallback")


def build_workorder_graph():
    workflow = StateGraph(WorkOrderGraphState)
    for name, node in (("initialize", initialize), ("load_skill", load_skill), ("validate_plan", validate_plan), ("create_order", create_order), ("collect_dispatch_context", collect_dispatch_context), ("select_assignee", select_assignee), ("assign_order", assign_order), ("execute_action", execute_action), ("validate", validate), ("final", final), ("fallback", fallback)):
        workflow.add_node(name, node)
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "validate_plan")
    workflow.add_conditional_edges("validate_plan", _route, {"create_order": "create_order", "execute_action": "execute_action", "fallback": "fallback"})
    workflow.add_edge("create_order", "collect_dispatch_context")
    workflow.add_edge("collect_dispatch_context", "select_assignee")
    workflow.add_edge("select_assignee", "assign_order")
    workflow.add_edge("assign_order", "validate")
    workflow.add_edge("execute_action", "validate")
    workflow.add_conditional_edges("validate", _route, {"final": "final", "fallback": "fallback"})
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
