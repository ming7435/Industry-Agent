"""WorkOrder Agent LangGraph 编排。"""

from __future__ import annotations

from typing import Any, Dict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry
from app.agents.base import chain_nodes, prepare_skill_node, result_node, trace_skill_node

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
    if state['action'] == 'create' and WorkOrderAgentValidator.approval_required(state['request']):
        return {'validation_findings': ['该动作明确要求服务端审批，审批通过后继续派发'],
                'stop_reason': 'approval_required', 'route': 'fallback'}
    return {"plan": dict(state["request"].get("maintenance_plan") or state["request"].get("plan") or {}), "route": "create_order" if state["action"] == "create" else "execute_action"}


def create_order(state: WorkOrderGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    existing = agent.find_idempotent(request)
    if existing:
        return {"workorder": existing, "route": "collect_dispatch_context"
                if _should_dispatch(request) and not existing.get('assignee') else "validate"}
    plan = dict(state.get("plan") or {})
    for key in ("idempotency_key", "event_id", "diagnosis_snapshot", "maintenance_plan_snapshot"):
        if request.get(key):
            plan[key] = request[key]
    order = agent.service.create_from_plan(plan)
    raw = order.model_dump(mode="json") if hasattr(order, "model_dump") else dict(order)
    agent.remember_idempotent(request, raw)
    return {"workorder": raw, "route": "collect_dispatch_context" if _should_dispatch(request) and not raw.get('assignee') else "validate"}


def _should_dispatch(request: Dict[str, Any]) -> bool:
    """判断创建请求是否已经进入自动派工流程。

    监控/诊断产生的工单必须自动派工；人工创建的草稿先保持 open，
    这样操作员可以在派工前修订或删除，不会绕过删除门禁。
    """

    if request.get("auto_dispatch") is not None:
        return bool(request.get("auto_dispatch"))
    source = str(request.get("source") or "").strip().lower()
    if source in {"manual", "manual_draft"}:
        return bool(request.get("assignee"))
    plan = request.get("maintenance_plan") or request.get("plan") or {}
    if isinstance(plan, dict) and plan.get("workorder_ready") is True:
        return True
    if request.get("event_id") or request.get("diagnosis_snapshot"):
        return True
    return bool(request.get("assignee")) or source not in {"", "manual", "manual_draft"}


def collect_dispatch_context(state: WorkOrderGraphState) -> Dict[str, Any]:
    return {"dispatch_context": state["agent"].collect_dispatch_context(state.get("plan") or {}, state.get("workorder") or {}, state.get("request") or {}), "route": "select_assignee"}


def select_assignee(state: WorkOrderGraphState) -> Dict[str, Any]:
    context = dict(state.get("dispatch_context") or {})
    if context.get('personnel_query_error'):
        return {'dispatch_context': context, 'candidates': [], 'selected_assignee': '',
                'validation_findings': [str(context['personnel_query_error'])],
                'stop_reason': 'personnel_query_failed', 'route': 'fallback'}
    candidates = state["agent"].rank_candidates(context, state.get("request") or {}, state.get("plan") or {})
    requested = str(state["request"].get("assignee") or "")
    selected = requested if requested in {item['technician_id'] for item in candidates} else \
        str(candidates[0]['technician_id']) if candidates and not requested else ''
    context["candidates"] = candidates
    context["selected_assignee"] = selected
    if not selected:
        reason = '指定人员不是该设备已登录且可用的登记负责人' if requested else '等待该设备对应负责人员登录'
        return {"dispatch_context": context, "candidates": candidates, "selected_assignee": "",
                "validation_findings": [reason], "stop_reason": "waiting_for_personnel", "route": "fallback"}
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
    try:
        result = agent.execute_action(request)
        raw = result.model_dump(mode="json") if hasattr(result, "model_dump") else dict(result or {})
        return {"workorder": raw, "route": "validate"}
    except Exception as error:
        # 原执行异常路径仍须经过最终校验，再构造失败结果；不重试业务写入。
        return {"validation_findings": [str(error)], "route": "validate"}


def validate(state: WorkOrderGraphState) -> Dict[str, Any]:
    findings = WorkOrderAgentValidator.final_findings(state["action"], state.get("workorder") or {}, state.get("validation_findings"))
    if state['action'] == 'create' and _should_dispatch(state['request']) and not (state.get('workorder') or {}).get('assignee'):
        findings.append('自动派工未返回实际负责人')
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
    stop_reason = state.get('stop_reason') if state.get('stop_reason') in {'waiting_for_personnel', 'personnel_query_failed', 'approval_required'} else 'validation_failed'
    status = {'waiting_for_personnel': 'waiting_for_personnel', 'personnel_query_failed': 'blocked',
              'approval_required': 'waiting_approval'}.get(stop_reason, str(order.get('status') or ''))
    result = WorkOrderResult(action=state.get("action", "create"), success=False, workorder_id=str(order.get("workorder_id") or ""), status=status, workorder=order, candidates=list(state.get('candidates') or []), dispatch_context=dict(state.get('dispatch_context') or {}), validation_findings=list(state.get("validation_findings") or []), stop_reason=stop_reason, error="；".join(state.get("validation_findings") or []))
    return {"result": result, "stop_reason": stop_reason}


def _route(state: WorkOrderGraphState) -> str:
    return str(state.get("route") or "fallback")


def build_workorder_graph():
    workflow = StateGraph(WorkOrderGraphState)
    node_skill_steps = {"final": "validate_result"}
    workflow.add_node("prepare", prepare_skill_node("workorder", initialize, load_skill, skill_steps=node_skill_steps))
    steps = {}
    for name, node in (("validate_plan", validate_plan), ("create_order", create_order), ("collect_dispatch_context", collect_dispatch_context), ("select_assignee", select_assignee), ("assign_order", assign_order), ("execute_action", execute_action), ("validate", validate), ("final", final), ("fallback", fallback)):
        steps[name] = trace_skill_node("workorder", name, node, skill_step=node_skill_steps.get(name, name))
    for name in ("validate_plan", "create_order", "assign_order", "execute_action"):
        workflow.add_node(name, steps[name])
    workflow.add_node("dispatch_context", chain_nodes(steps["collect_dispatch_context"], steps["select_assignee"]))
    validated_result = chain_nodes(steps["validate"], result_node(steps["final"], steps["fallback"]))

    def finish(state: WorkOrderGraphState) -> Dict[str, Any]:
        # 输入门禁失败直接回退；执行动作（包括异常）保持原最终校验。
        if state.get("route") == "fallback":
            return steps["fallback"](state)
        return validated_result(state)

    workflow.add_node("finish", finish)
    workflow.add_edge(START, "prepare")
    workflow.add_edge("prepare", "validate_plan")
    workflow.add_conditional_edges("validate_plan", _route, {"create_order": "create_order", "execute_action": "execute_action", "fallback": "finish"})
    workflow.add_conditional_edges("create_order", _route, {"collect_dispatch_context": "dispatch_context", "validate": "finish"})
    workflow.add_conditional_edges("dispatch_context", _route, {"assign_order": "assign_order", "fallback": "finish"})
    workflow.add_edge("assign_order", "finish")
    workflow.add_edge("execute_action", "finish")
    workflow.add_edge("finish", END)
    return workflow.compile()
