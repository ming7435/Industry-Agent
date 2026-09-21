"""Quality Agent 的生产零件质检 LangGraph。"""

from __future__ import annotations

from typing import Any, Dict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry
from app.contracts import QualityResult

from .schemas import QualityQuery, QualityWorkflowState
from .validator import QualityValidator


def initialize(state: QualityWorkflowState) -> Dict[str, Any]:
    request = QualityQuery.from_payload(state.get("request") or {}).model_dump(mode="json")
    return {"request": request, "validation_findings": [], "route": "load_skill"}


def load_skill(state: QualityWorkflowState) -> Dict[str, Any]:
    skills = get_skill_registry().select("quality", state.get("request") or {})
    skills = [skill for skill in skills if skill.trigger in {"part_quality", "production_part_quality"}]
    if not skills:
        skills = get_skill_registry().select("quality", names=["part_quality_inspection_skill"])
    names = [skill.name for skill in skills] or ["part_quality_master_skill"]
    tools = get_skill_registry().merge_tools(skills)
    if not tools:
        tools = [
            "get_production_part", "get_part_specification", "inspect_part_dimensions",
            "inspect_part_appearance", "inspect_part_material", "inspect_part_function",
            "inspect_part_process",
        ]
    return {
        "active_skill": "+".join(names),
        "active_skills": names,
        "allowed_tools": tools,
        "route": "load_part",
    }


def load_part(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    supplied = dict(request.get("part") or {})
    loaded = agent._safe_tool("get_production_part", {
        "part_id": request.get("part_id", ""),
        "part_no": request.get("part_no", ""),
        "batch_id": request.get("batch_id", ""),
        "production_order_id": request.get("production_order_id", ""),
        "part": supplied,
    })
    part = dict(loaded.get("part") or supplied)
    if not part:
        return {"part": {}, "validation_findings": ["缺少可检测的生产零件"], "route": "fallback"}
    if request.get("measurements"):
        part["measurements"] = {**dict(part.get("measurements") or {}), **dict(request["measurements"])}
    if request.get("specifications"):
        part["specifications"] = {**dict(part.get("specifications") or {}), **dict(request["specifications"])}
    return {"part": part, "route": "load_inspection_plan"}


def load_inspection_plan(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    part = state.get("part") or {}
    specification = agent._safe_tool("get_part_specification", {"part": part})
    plan = dict(state["request"].get("inspection_plan") or {})
    if not plan:
        plan = dict(specification.get("specifications") or part.get("specifications") or {})
    if specification.get("specifications"):
        part = {**part, "specifications": dict(specification["specifications"])}
    return {"part": part, "inspection_plan": plan}


def inspect_dimensions(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    return {"dimension_check": agent._safe_tool("inspect_part_dimensions", {
        "part": state.get("part") or {},
        "measurements": state["request"].get("measurements") or {},
        "specifications": state.get("inspection_plan") or {},
    })}


def inspect_appearance(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    return {"appearance_check": agent._safe_tool("inspect_part_appearance", {"part": state.get("part") or {}})}


def inspect_material(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    return {"material_check": agent._safe_tool("inspect_part_material", {
        "part": state.get("part") or {},
        "specifications": state.get("inspection_plan") or {},
    })}


def inspect_function(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    return {"function_check": agent._safe_tool("inspect_part_function", {
        "part": state.get("part") or {},
        "specifications": state.get("inspection_plan") or {},
    })}


def inspect_process(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    return {"process_check": agent._safe_tool("inspect_part_process", {"part": state.get("part") or {}})}


def validate_part(state: QualityWorkflowState) -> Dict[str, Any]:
    decision = QualityValidator.validate_part(
        state.get("part") or {},
        state.get("inspection_plan") or {},
        state.get("dimension_check") or {},
        state.get("appearance_check") or {},
        state.get("material_check") or {},
        state.get("function_check") or {},
        state.get("process_check") or {},
    )
    return {"decision": decision, "validation_findings": list(decision.get("findings") or [])}


def decision(state: QualityWorkflowState) -> Dict[str, Any]:
    return {"route": "final"}


def final(state: QualityWorkflowState) -> Dict[str, Any]:
    result = state["agent"]._build_result(state)
    return {"result": result, "stop_reason": "validator_pass" if result.passed else "validator_fail"}


def fallback(state: QualityWorkflowState) -> Dict[str, Any]:
    findings = list(state.get("validation_findings") or ["生产零件质检流程未完成"])
    result = state["agent"]._fallback_result(state.get("request") or {}, findings)
    return {"result": result, "stop_reason": "fallback"}


def build_quality_graph():
    workflow = StateGraph(QualityWorkflowState)
    for name, node in (
        ("initialize", initialize),
        ("load_skill", load_skill),
        ("load_part", load_part),
        ("load_inspection_plan", load_inspection_plan),
        ("inspect_dimensions", inspect_dimensions),
        ("inspect_appearance", inspect_appearance),
        ("inspect_material", inspect_material),
        ("inspect_function", inspect_function),
        ("inspect_process", inspect_process),
        ("validate_part", validate_part),
        ("decision", decision),
        ("final", final),
        ("fallback", fallback),
    ):
        workflow.add_node(name, node)
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "load_part")
    workflow.add_conditional_edges(
        "load_part",
        lambda state: state.get("route", "load_inspection_plan"),
        {"load_inspection_plan": "load_inspection_plan", "fallback": "fallback"},
    )
    workflow.add_edge("load_inspection_plan", "inspect_dimensions")
    workflow.add_edge("inspect_dimensions", "inspect_appearance")
    workflow.add_edge("inspect_appearance", "inspect_material")
    workflow.add_edge("inspect_material", "inspect_function")
    workflow.add_edge("inspect_function", "inspect_process")
    workflow.add_edge("inspect_process", "validate_part")
    workflow.add_edge("validate_part", "decision")
    workflow.add_edge("decision", "final")
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
