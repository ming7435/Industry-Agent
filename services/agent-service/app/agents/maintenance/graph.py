"""Maintenance Agent 的 LangGraph 维修计划流程。"""

from __future__ import annotations

from typing import Any, Dict, List, TypedDict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry
from app.agents.base import trace_skill_node
from app.contracts import DiagnosisView, MaintenancePlan

from .schemas import MaintenanceQuery
from .validator import MaintenancePlanValidator


class MaintenanceGraphState(TypedDict, total=False):
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
    diagnosis: DiagnosisView
    query: str
    cad_required: bool
    knowledge: Dict[str, Any]
    cad: Dict[str, Any]
    memory: Dict[str, Any]
    inventory: Dict[str, Any]
    part_availability: Dict[str, Any]
    plan_payload: Dict[str, Any]
    workorder_draft: Dict[str, Any]
    validation_findings: List[str]
    stop_reason: str
    route: str
    result: MaintenancePlan


def initialize(state: MaintenanceGraphState) -> Dict[str, Any]:
    request = MaintenanceQuery.from_payload(state.get("request") or {}).model_dump(mode="json")
    return {"request": request, "route": "load_skill", "validation_findings": []}


def load_skill(state: MaintenanceGraphState) -> Dict[str, Any]:
    skills = get_skill_registry().select("maintenance", state.get("request") or {})
    names = [skill.name for skill in skills] or ["maintenance_master_skill"]
    default_tools = ["query_inventory", "query_part_availability", "get_workorder_template", "submit_workorder_draft"]
    return {
        "active_skill": "+".join(names),
        "active_skills": names,
        "allowed_tools": get_skill_registry().merge_tools(skills) or default_tools,
        "route": "assess_diagnosis",
    }


def assess_diagnosis(state: MaintenanceGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    diagnosis = agent._normalize_diagnosis(request.get("diagnosis_result") or request.get("diagnosis") or request)
    if request.get("device_id") and diagnosis.device_id == "unknown":
        diagnosis = diagnosis.model_copy(update={"device_id": request["device_id"]})
    query = agent._query(request, diagnosis)
    return {
        "diagnosis": diagnosis,
        "query": query,
        "memory": dict(request.get("memory") or {}),
        "cad_required": agent._requires_cad(diagnosis),
        "route": "request_knowledge",
    }


def request_knowledge(state: MaintenanceGraphState) -> Dict[str, Any]:
    request = state["request"]
    knowledge = dict(request.get("knowledge") or {})
    if not knowledge and not request.get("runtime_managed"):
        knowledge = state["agent"].request_knowledge(state["query"], state["diagnosis"])
    return {"knowledge": knowledge, "route": "request_cad"}


def request_cad(state: MaintenanceGraphState) -> Dict[str, Any]:
    request = state["request"]
    cad = dict(request.get("cad") or {})
    if not cad and state.get("cad_required", True) and not request.get("runtime_managed"):
        cad = state["agent"].request_cad(state["query"], state["diagnosis"], required=True)
    return {"cad": cad, "route": "plan_repair"}


def check_parts_tools(state: MaintenanceGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    diagnosis = state["diagnosis"]
    query = state["query"]
    inventory = agent._safe_tool("query_inventory", {"query": query, "device_id": diagnosis.device_id})
    availability = agent._safe_tool("query_part_availability", {"query": query, "device_id": diagnosis.device_id})
    plan = dict(state.get("plan_payload") or {})
    components = list((state.get("cad") or {}).get("components") or [])
    bom_items = list((state.get("cad") or {}).get("bom_items") or [])
    profile = agent._profile(diagnosis, components)
    parts = agent._parts(profile, inventory, components, bom_items)
    if parts:
        plan["parts"] = parts
        plan["required_parts"] = parts
    plan["inventory_status"] = inventory
    plan["part_availability"] = availability
    plan["evidence"] = agent._evidence(diagnosis, state.get("knowledge") or {}, state.get("cad") or {}, inventory, profile, state.get("memory") or {})
    return {"inventory": inventory, "part_availability": availability, "plan_payload": plan, "route": "safety_validate"}


def plan_repair(state: MaintenanceGraphState) -> Dict[str, Any]:
    payload = state["agent"]._build_plan_payload(
        payload=state["request"],
        diagnosis=state["diagnosis"],
        knowledge=state.get("knowledge") or {},
        cad=state.get("cad") or {},
        memory=state.get("memory") or {},
    )
    return {"plan_payload": payload, "route": "check_parts_tools"}


def safety_validate(state: MaintenanceGraphState) -> Dict[str, Any]:
    findings: list[str] = []
    plan = state.get("plan_payload") or {}
    if not plan.get("safety_requirements") and not plan.get("safety"):
        findings.append("缺少安全要求")
    if any("运行" in str(step) for step in plan.get("repair_steps") or []) and not any("确认" in str(item) or "LOTO" in str(item) for item in plan.get("safety_requirements") or []):
        findings.append("涉及试运行但安全确认不足")
    return {"validation_findings": list(state.get("validation_findings") or []) + findings, "route": "validate"}


def validate(state: MaintenanceGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    plan = dict(state.get("plan_payload") or {})
    findings = list(state.get("validation_findings") or [])
    findings.extend(MaintenancePlanValidator.validate(plan, state.get("knowledge") or {}, state.get("cad") or {}, state.get("inventory") or {}))
    findings = agent._dedupe(findings)
    plan["validation_findings"] = findings
    plan["workorder_ready"] = MaintenancePlanValidator.workorder_ready(findings, plan)
    return {"plan_payload": plan, "validation_findings": findings, "route": "prepare_workorder"}


def prepare_workorder(state: MaintenanceGraphState) -> Dict[str, Any]:
    plan = dict(state.get("plan_payload") or {})
    diagnosis = state["diagnosis"]
    draft = state["agent"]._safe_tool("get_workorder_template", {"device_id": diagnosis.device_id, "plan": plan})
    draft.update({
        "device_id": diagnosis.device_id,
        "title": "设备维修：%s" % (diagnosis.fault or plan.get("repair_target") or "设备异常"),
        "plan_id": plan.get("plan_id", ""),
        "steps": list(plan.get("repair_steps") or []),
        "ready": bool(plan.get("workorder_ready")),
        "repair_target": dict(plan.get("target_part") or {}),
        "drawing_context": _drawing_context(plan.get("engineering_context") or {}),
    })
    if plan.get("workorder_ready") and (state["request"].get("constraints") or {}).get("need_workorder"):
        draft = state["agent"]._safe_tool("submit_workorder_draft", draft) or draft
    return {"workorder_draft": draft, "route": "final"}


def final(state: MaintenanceGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    plan = dict(state.get("plan_payload") or {})
    plan["workorder_draft"] = dict(state.get("workorder_draft") or {})
    result = agent._plan_result(plan, state["diagnosis"])
    return {"result": result, "stop_reason": "validator_pass" if result.workorder_ready else "validation_failed"}


def fallback(state: MaintenanceGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    diagnosis = state.get("diagnosis") or agent._normalize_diagnosis(state.get("request") or {})
    plan = {"repair_target": diagnosis.fault or "设备异常", "validation_findings": ["维修计划流程未完成"], "workorder_ready": False}
    return {"result": agent._plan_result(plan, diagnosis), "stop_reason": "fallback"}


def _drawing_context(engineering_context: Dict[str, Any]) -> Dict[str, str]:
    viewer = dict(engineering_context.get("viewer_context") or {})
    refs = list(engineering_context.get("drawing_ref_details") or engineering_context.get("drawing_refs") or [])
    first = refs[0] if refs else {}
    if isinstance(first, str):
        drawing_url = ""
    else:
        drawing_url = str(first.get("drawing_url") or "")
    return {
        "drawing_url": drawing_url,
        "model_url": str(viewer.get("model_url") or ""),
        "mesh_name": str(viewer.get("mesh_name") or ""),
        "location": str(viewer.get("location") or ""),
    }


def build_maintenance_graph():
    workflow = StateGraph(MaintenanceGraphState)
    node_skill_steps = {
        "initialize": "validate_diagnosis",
        "load_skill": "select_skills",
        "check_parts_tools": "determine_required_parts",
        "safety_validate": "build_safety_steps",
        "prepare_workorder": "build_result",
        "final": "build_result",
    }
    for name, node in (
        ("initialize", initialize),
        ("load_skill", load_skill),
        ("assess_diagnosis", assess_diagnosis),
        ("request_knowledge", request_knowledge),
        ("request_cad", request_cad),
        ("plan_repair", plan_repair),
        ("check_parts_tools", check_parts_tools),
        ("safety_validate", safety_validate),
        ("validate", validate),
        ("prepare_workorder", prepare_workorder),
        ("final", final),
        ("fallback", fallback),
    ):
        workflow.add_node(name, trace_skill_node("maintenance", name, node, skill_step=node_skill_steps.get(name, name)))
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "assess_diagnosis")
    workflow.add_edge("assess_diagnosis", "request_knowledge")
    workflow.add_edge("request_knowledge", "request_cad")
    workflow.add_edge("request_cad", "plan_repair")
    workflow.add_edge("plan_repair", "check_parts_tools")
    workflow.add_edge("check_parts_tools", "safety_validate")
    workflow.add_edge("safety_validate", "validate")
    workflow.add_edge("validate", "prepare_workorder")
    workflow.add_edge("prepare_workorder", "final")
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
