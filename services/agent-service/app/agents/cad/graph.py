"""CAD Agent 的 LangGraph 工程查询流程。"""

from __future__ import annotations

from typing import Any, Dict, List, Mapping, TypedDict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry
from app.agents.base import trace_skill_node
from app.contracts import CADComponent, CADResult

from .schemas import CADQuery
from .validator import CADEngineeringValidator


CAD_TOOLS = ("query_drawing", "query_bom", "query_part", "query_relation", "fetch_engineering_record")


class CADGraphState(TypedDict, total=False):
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
    pending_tools: List[str]
    query_type: str
    step_count: int
    max_steps: int
    observations: List[Dict[str, Any]]
    components: List[Dict[str, Any]]
    drawings: List[Dict[str, Any]]
    bom_items: List[Dict[str, Any]]
    assembly_relations: List[Dict[str, Any]]
    locations: List[Dict[str, Any]]
    sources: List[str]
    validation: Dict[str, Any]
    errors: List[str]
    stop_reason: str
    route: str
    result: CADResult


def initialize(state: CADGraphState) -> Dict[str, Any]:
    request = CADQuery.from_payload(state.get("request") or {}).model_dump(mode="json")
    return {"request": request, "step_count": 0, "max_steps": request["max_steps"], "observations": [], "components": [], "drawings": [], "bom_items": [], "assembly_relations": [], "locations": [], "sources": [], "errors": [], "route": "load_skill"}


def load_skill(state: CADGraphState) -> Dict[str, Any]:
    skills = get_skill_registry().select("cad", state.get("request") or {})
    names = [skill.name for skill in skills] or ["cad_master_skill"]
    allowed_tools = get_skill_registry().merge_tools(skills)
    return {"active_skill": "+".join(names), "active_skills": names, "allowed_tools": allowed_tools or list(CAD_TOOLS), "route": "resolve_component"}


def resolve_component(state: CADGraphState) -> Dict[str, Any]:
    request = state["request"]
    query = str(request.get("query") or "工程结构查询")
    return {"request": {**request, "query": query}, "query_type": _query_type(query), "route": "plan_engineering_query"}


def plan_engineering_query(state: CADGraphState) -> Dict[str, Any]:
    request = state["request"]
    plans = {"bom": ["query_part", "query_bom", "query_relation", "query_drawing"], "location": ["query_part", "query_drawing", "query_relation"], "assembly_relation": ["query_part", "query_relation", "query_drawing", "query_bom"], "component": ["query_part", "query_drawing", "query_bom", "query_relation"]}
    if state.get("pending_tools") is None:
        return {"pending_tools": plans.get(state.get("query_type") or _query_type(request["query"]), plans["component"]), "route": "query"}
    if state["pending_tools"]:
        return {"route": "query"}
    return {"route": "validate_relation"}


def query(state: CADGraphState) -> Dict[str, Any]:
    pending = list(state.get("pending_tools") or [])
    if not pending:
        return {"route": "validate_relation"}
    if state.get("step_count", 0) >= state.get("max_steps", 5):
        return {"stop_reason": "max_steps", "route": "validate_relation"}
    operation = pending.pop(0)
    request = state["request"]
    lookup = request.get("part_no") or request.get("component") or request.get("query", "")
    arguments = {"request_id": request.get("request_id", ""), "device_id": request.get("device_id", ""), "device_model": request.get("device_model", ""), "component": request.get("component", ""), "part_no": request.get("part_no", ""), "query": lookup, "component_id": request.get("component", "")}
    try:
        result = state["agent"].tools.execute(operation, arguments)
        error = ""
    except Exception as exc:
        result = {"query": request.get("query", ""), "source": "cad-service-error"}
        error = "%s：%s" % (operation, exc)
    observation = {"step": state.get("step_count", 0) + 1, "tool": operation, "arguments": arguments, "result": dict(result or {}), "success": not bool(error)}
    if error:
        observation["error"] = error
    return {"pending_tools": pending, "step_count": state.get("step_count", 0) + 1, "observations": list(state.get("observations") or []) + [observation], "errors": list(state.get("errors") or []) + ([error] if error else []), "route": "observe"}


def observe(state: CADGraphState) -> Dict[str, Any]:
    observation = (state.get("observations") or [])[-1]
    result = observation.get("result") or {}
    components = list(state.get("components") or [])
    drawings = list(state.get("drawings") or [])
    bom_items = list(state.get("bom_items") or [])
    relations = list(state.get("assembly_relations") or [])
    locations = list(state.get("locations") or [])
    sources = list(state.get("sources") or [])
    _extend(components, result.get("components") or result.get("parts") or result.get("records") or [], "component_id")
    _extend(drawings, result.get("drawings") or [], "drawing_id")
    _extend(bom_items, result.get("bom_items") or [], "part_no")
    _extend(relations, result.get("assembly_relations") or result.get("relations") or [], "component_id")
    _extend(locations, result.get("locations") or [], "component_id")
    record = result.get("record")
    if isinstance(record, dict):
        _extend(components, record.get("components") or [], "component_id")
        _extend(drawings, record.get("drawings") or [], "drawing_id")
        _extend(bom_items, record.get("bom_items") or [], "part_no")
        _extend(relations, record.get("assembly_relations") or [], "component_id")
    source = str(result.get("source") or "").strip()
    if source and source not in sources:
        sources.append(source)
    return {"components": components, "drawings": drawings, "bom_items": bom_items, "assembly_relations": relations, "locations": locations, "sources": sources, "route": "plan_engineering_query"}


def validate_relation(state: CADGraphState) -> Dict[str, Any]:
    aggregate: dict[str, Any] = {"components": state.get("components", []), "drawings": state.get("drawings", []), "bom_items": state.get("bom_items", []), "assembly_relations": state.get("assembly_relations", []), "source": (state.get("sources") or [""])[0]}
    components: list[CADComponent] = []
    for item in aggregate["components"]:
        value = dict(item)
        value.setdefault("component_id", value.get("part_no") or value.get("name") or "unknown-component")
        value.setdefault("name", value.get("component_id") or "工程部件")
        components.append(CADComponent(**value))
    findings = CADEngineeringValidator.validate(components, aggregate["bom_items"], aggregate["drawings"], [], aggregate["assembly_relations"], state.get("locations", []))
    validation = {"pass": not findings and bool(components), "errors": findings, "component_count": len(components), "bom_count": len(aggregate["bom_items"]), "drawing_count": len(aggregate["drawings"]), "relation_count": len(aggregate["assembly_relations"])}
    has_data = any(aggregate[key] for key in ("components", "drawings", "bom_items", "assembly_relations"))
    if not has_data:
        return {"validation": validation, "stop_reason": "cad_service_no_data", "route": "fallback"}
    if validation["pass"]:
        return {"validation": validation, "stop_reason": state.get("stop_reason") or "validator_pass", "route": "final"}
    return {"validation": validation, "stop_reason": "validation_failed", "route": "fallback"}


def final(state: CADGraphState) -> Dict[str, Any]:
    return {"result": _result(state, "completed")}


def fallback(state: CADGraphState) -> Dict[str, Any]:
    return {"result": _result(state, "insufficient_engineering_data")}


def build_cad_graph():
    workflow = StateGraph(CADGraphState)
    node_skill_steps = {
        "initialize": "normalize_query",
        "load_skill": "classify_engineering_request",
        "resolve_component": "resolve_part",
        "query": "resolve_bom",
        "observe": "merge_engineering_context",
        "validate_relation": "validate_engineering_context",
        "final": "build_result",
    }
    for name, node in (("initialize", initialize), ("load_skill", load_skill), ("resolve_component", resolve_component), ("plan_engineering_query", plan_engineering_query), ("query", query), ("observe", observe), ("validate_relation", validate_relation), ("final", final), ("fallback", fallback)):
        workflow.add_node(name, trace_skill_node("cad", name, node, skill_step=node_skill_steps.get(name, name)))
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "resolve_component")
    workflow.add_edge("resolve_component", "plan_engineering_query")
    workflow.add_conditional_edges("plan_engineering_query", _route, {"query": "query", "validate_relation": "validate_relation"})
    workflow.add_conditional_edges("query", _route, {"observe": "observe", "validate_relation": "validate_relation"})
    workflow.add_edge("observe", "plan_engineering_query")
    workflow.add_conditional_edges("validate_relation", _route, {"final": "final", "fallback": "fallback"})
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()


def _route(state: CADGraphState) -> str:
    return state.get("route", "fallback")


def _query_type(query: str) -> str:
    text = str(query or "").lower()
    if any(token in text for token in ("bom", "物料", "零件", "part")):
        return "bom"
    if any(token in text for token in ("位置", "在哪里", "location")):
        return "location"
    if any(token in text for token in ("装配", "关系", "relation")):
        return "assembly_relation"
    return "component"


def _extend(target: list[dict[str, Any]], items: Any, key: str) -> None:
    if not isinstance(items, (list, tuple)):
        return
    existing = {str(item.get(key) or item.get("part_no") or item.get("name") or "") for item in target}
    for item in items:
        if not isinstance(item, Mapping):
            continue
        normalized = dict(item)
        identity = str(normalized.get(key) or normalized.get("part_no") or normalized.get("name") or "")
        if identity and identity not in existing:
            target.append(normalized)
            existing.add(identity)


def _result(state: CADGraphState, status: str) -> CADResult:
    request = CADQuery.from_payload(state.get("request") or {})
    components = []
    for item in state.get("components", []):
        value = dict(item)
        value.setdefault("component_id", value.get("part_no") or value.get("name") or "unknown-component")
        value.setdefault("name", value.get("component_id") or "工程部件")
        components.append(CADComponent(**value))
    drawings = list(state.get("drawings") or [])
    bom_items = list(state.get("bom_items") or [])
    relations = list(state.get("assembly_relations") or [])
    locations = list(state.get("locations") or [])
    component = request.component or (components[0].component_id if components else "")
    part_no = request.part_no or (components[0].part_no if components else "")
    drawing_refs = _drawing_refs(drawings, components)
    drawing_ref_details = _drawing_ref_details(drawings, components, locations)
    location = str((locations[0] if locations else {}).get("location") or (components[0].position if components else ""))
    viewer_context = _viewer_context(drawings, components, location)
    evidence = [{"type": "component", "component_id": item.component_id, "part_no": item.part_no, "name": item.name, "position": item.position, "drawing_ref": item.drawing_ref} for item in components]
    evidence.extend({"type": "bom", **item} for item in bom_items)
    evidence.extend({"type": "drawing", **item} for item in drawings)
    evidence.extend({"type": "assembly_relation", **item} for item in relations)
    evidence.extend({"type": "location", **item} for item in locations)
    confidence = 0.0
    if components:
        confidence = 0.75 + (0.08 if bom_items else 0) + (0.07 if drawings else 0) + (0.07 if relations else 0) + (0.03 if all(item.part_no for item in components) else 0)
    summary = ("定位到 %s 个工程部件、%s 份图纸、%s 条 BOM 和 %s 条装配关系。" % (len(components), len(drawings), len(bom_items), len(relations))) if status == "completed" else ("未查询到与“%s”直接相关的工程 CAD/BOM 数据。" % request.query)
    remote = any("document-cad-service" in source for source in state.get("sources", []))
    return CADResult(request_id=request.request_id, device_id=request.device_id, device_model=request.device_model, query=request.query, status=status, query_type=_query_type(request.query), component=component, part_no=part_no, drawing_refs=drawing_refs, drawing_ref_details=drawing_ref_details, viewer_context=viewer_context, location=location, summary=summary, components=components, parts=[dict(item) for item in components], drawings=drawings, bom_items=bom_items, part_relations=relations, assembly_relations=relations, locations=locations, evidence=evidence, sources=list(state.get("sources") or []), confidence=round(min(1.0, confidence), 4), total=len(components), source=(state.get("sources") or ["document-cad-service"])[0], validation_findings=list((state.get("validation") or {}).get("errors") or []), steps=list(state.get("observations") or []), stop_reason=state.get("stop_reason", ""), backend_status="remote" if remote else "local_fallback", degraded=not remote, warning="当前使用本地 CAD 兼容数据" if not remote else "")


def _drawing_refs(drawings: list[dict[str, Any]], components: list[CADComponent]) -> list[Any]:
    output: list[Any] = []
    for item in drawings:
        drawing_id = str(item.get("drawing_id") or item.get("drawing_ref") or "")
        if not drawing_id:
            continue
        # 远程 CAD 返回 URL/类型时输出结构化引用；本地兼容数据继续返回旧字符串。
        if item.get("drawing_url") or item.get("drawing_type"):
            value: Any = {
                "drawing_id": drawing_id,
                "drawing_url": str(item.get("drawing_url") or ""),
                "drawing_type": str(item.get("drawing_type") or item.get("format") or ""),
            }
        else:
            value = drawing_id
        if value not in output:
            output.append(value)
    for component in components:
        if component.drawing_ref and component.drawing_ref not in output:
            output.append(component.drawing_ref)
    return output


def _viewer_context(drawings: list[dict[str, Any]], components: list[CADComponent], location: str) -> dict[str, str]:
    drawing = next((item for item in drawings if isinstance(item, dict)), {})
    component = components[0] if components else None
    component_id = str((component.component_id if component else "") or drawing.get("component_id") or "")
    return {
        "model_url": str(drawing.get("model_url") or drawing.get("viewer_url") or ("/cad/models/%s.glb" % component_id if component_id else "")),
        "mesh_id": str(drawing.get("mesh_id") or (component.component_id if component else "")),
        "mesh_name": str(drawing.get("mesh_name") or (component.name if component else "")),
        "location": location,
        "default_view": str((drawing.get("default_view") or "component") if component else ""),
    }


def _drawing_ref_details(drawings: list[dict[str, Any]], components: list[CADComponent], locations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """构造故障零件到图纸、模型和安装位置的稳定工程映射。"""
    by_ref = {str(item.drawing_ref): item for item in components if item.drawing_ref}
    location_by_component = {str(item.get("component_id")): str(item.get("location") or "") for item in locations}
    details: list[dict[str, Any]] = []
    for drawing in drawings:
        drawing_id = str(drawing.get("drawing_id") or drawing.get("drawing_ref") or "")
        if not drawing_id:
            continue
        component = by_ref.get(drawing_id)
        component_id = str(drawing.get("component_id") or (component.component_id if component else ""))
        part_no = str(drawing.get("part_no") or (component.part_no if component else ""))
        location = str(drawing.get("location") or location_by_component.get(component_id) or (component.position if component else ""))
        details.append({
            "drawing_id": drawing_id,
            "drawing_url": str(drawing.get("drawing_url") or "/cad/drawings/%s.pdf" % drawing_id),
            "drawing_type": str(drawing.get("drawing_type") or drawing.get("format") or "pdf"),
            "component_id": component_id,
            "part_no": part_no,
            "model_url": str(drawing.get("model_url") or ("/cad/models/%s.glb" % component_id if component_id else "")),
            "mesh_id": str(drawing.get("mesh_id") or component_id),
            "mesh_name": str(drawing.get("mesh_name") or (component.name if component else "")),
            "location": location,
            "default_view": str(drawing.get("default_view") or "component"),
        })
    return details
