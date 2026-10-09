"""Quality Agent 的生产零件质检 LangGraph。"""

from __future__ import annotations

from typing import Any, Dict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry
from app.agents.base import chain_nodes, prepare_skill_node, result_node, trace_skill_node
from .schemas import QualityQuery, QualityWorkflowState
from .validator import QualityValidator
from shared.part_design_quality import SCOPE


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
    part = dict(loaded.get("part") or {})
    identifiers = ("part_id", "part_no", "batch_id", "production_order_id", "device_id")
    identity_matches = all(
        not request.get(key) or str(part.get(key) or "") == str(request[key])
        for key in identifiers
    )
    trusted = (
        loaded.get("success") is True and loaded.get("found") is True
        and loaded.get("identity_verified") is True
        and loaded.get("synthetic") is not True and loaded.get("degraded") is not True
        and part.get("synthetic") is not True and part.get("degraded") is not True
    )
    if not part or not trusted or not identity_matches:
        return {"part": {}, "validation_findings": ["生产零件身份或数据来源未核实，不能判定质量合格"], "route": "fallback"}
    if (request.get('production_context') or {}).get('comparison_scope') == SCOPE and part.get('comparison_scope') != SCOPE:
        return {'part': {}, 'validation_findings': ['请先选择生产建模的图纸版本，保存生产后实测值再检测'], 'route': 'fallback'}
    context = request.get('production_context') or {}
    reference = part.get('design_reference') or {}
    expected = {'expected_design_run_id': reference.get('run_id'), 'expected_design_digest': reference.get('digest'),
                'expected_recorded_at': part.get('recorded_at')}
    if any(context.get(key) and context[key] != value for key, value in expected.items()):
        return {'part': {}, 'validation_findings': ['当前图纸版本或实测记录已改变，请重新读取并保存后检测'], 'route': 'fallback'}
    return {"part": part, "route": "load_inspection_plan"}


def load_inspection_plan(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    part = state.get("part") or {}
    specification = agent._safe_tool("get_part_specification", {"part": part})
    verified_specification = (
        specification.get("success") is True
        and specification.get("synthetic") is not True
        and specification.get("degraded") is not True
    )
    plan = dict(specification.get("specifications") or {}) if verified_specification else {}
    if not plan:
        plan = dict(part.get("specifications") or {})
    if verified_specification and specification.get("specifications"):
        part = {**part, "specifications": dict(specification["specifications"])}
    return {"part": part, "inspection_plan": plan}


def inspect_dimensions(state: QualityWorkflowState) -> Dict[str, Any]:
    agent = state["agent"]
    return {"dimension_check": agent._safe_tool("inspect_part_dimensions", {
        "part": state.get("part") or {},
        "measurements": (state.get("part") or {}).get("measurements") or {},
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
    if (state.get('part') or {}).get('comparison_scope') == SCOPE:
        decision = QualityValidator.validate_design(state['part'], state.get('dimension_check') or {})
        return {'decision': decision, 'validation_findings': list(decision.get('findings') or [])}
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


def final(state: QualityWorkflowState) -> Dict[str, Any]:
    result = state["agent"]._build_result(state)
    return {"result": result, "stop_reason": "validator_pass" if result.passed else "validator_fail"}


def fallback(state: QualityWorkflowState) -> Dict[str, Any]:
    findings = list(state.get("validation_findings") or ["生产零件质检流程未完成"])
    result = state["agent"]._fallback_result(state.get("request") or {}, findings)
    return {"result": result, "stop_reason": "fallback"}


def build_quality_graph():
    from app.production_simulation.agents import virtual_execution_node
    workflow = StateGraph(QualityWorkflowState)
    workflow.add_node('virtual_size_inspection', virtual_execution_node('quality'))
    node_skill_steps = {
        "initialize": "identify_part",
        "load_skill": "select_skills",
        "validate_part": "determine_pass_fail",
        "final": "build_result",
    }
    workflow.add_node("prepare", prepare_skill_node("quality", initialize, load_skill, skill_steps=node_skill_steps))
    steps = {}
    for name, node in (
        ("load_part", load_part),
        ("load_inspection_plan", load_inspection_plan),
        ("inspect_dimensions", inspect_dimensions),
        ("inspect_appearance", inspect_appearance),
        ("inspect_material", inspect_material),
        ("inspect_function", inspect_function),
        ("inspect_process", inspect_process),
        ("validate_part", validate_part),
        ("final", final),
        ("fallback", fallback),
    ):
        steps[name] = trace_skill_node("quality", name, node, skill_step=node_skill_steps.get(name, name))
    workflow.add_node("load_input", chain_nodes(steps["load_part"], steps["load_inspection_plan"], stop_routes=("fallback",)))
    legacy_inspection = chain_nodes(*(steps[name] for name in (
        "inspect_dimensions", "inspect_appearance", "inspect_material", "inspect_function", "inspect_process",
    )))
    def inspect(state):
        # 分支由已核实的生产零件记录决定，客户端不能把五项检验改成只检尺寸。
        if (state.get('part') or {}).get('comparison_scope') == SCOPE:
            return steps['inspect_dimensions'](state)
        return legacy_inspection(state)
    workflow.add_node('inspect', inspect)
    workflow.add_node("validate_part", steps["validate_part"])
    workflow.add_node("finish", result_node(steps["final"], steps["fallback"]))
    workflow.add_conditional_edges(START, lambda state: 'virtual_size_inspection'
        if (state.get('request') or {}).get('inspection_type') == 'virtual_profile_dimensions_v1' else 'prepare',
        {'virtual_size_inspection': 'virtual_size_inspection', 'prepare': 'prepare'})
    workflow.add_edge('virtual_size_inspection', END)
    workflow.add_edge("prepare", "load_input")
    workflow.add_conditional_edges(
        "load_input",
        lambda state: state.get("route", "load_inspection_plan"),
        {"load_inspection_plan": "inspect", "fallback": "finish"},
    )
    workflow.add_edge("inspect", "validate_part")
    workflow.add_edge("validate_part", "finish")
    workflow.add_edge("finish", END)
    return workflow.compile()
