"""Memory Agent LangGraph：区分经验检索和经验学习两条路径。"""

from __future__ import annotations

from typing import Any, Dict

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry

from .schemas import MemoryGraphState, MemoryResult
from .validator import MemoryAgentValidator


def initialize(state: MemoryGraphState) -> Dict[str, Any]:
    request = state["agent"].normalize_request(state.get("request") or {})
    findings = MemoryAgentValidator.validate_action(request)
    return {"request": request, "action": request.get("action", "search"), "validation_findings": findings, "route": "fallback" if findings else "load_skill"}


def load_skill(state: MemoryGraphState) -> Dict[str, Any]:
    skills = get_skill_registry().select("memory", state.get("request") or {})
    route = "validate_admission" if state["action"] == "learn" else "validate_search" if state["action"] == "search" else "retrieve_memory"
    return {"active_skill": "+".join(item.name for item in skills), "active_skills": [item.name for item in skills], "allowed_tools": get_skill_registry().merge_tools(skills), "route": route}


def validate_search(state: MemoryGraphState) -> Dict[str, Any]:
    findings = MemoryAgentValidator.validate_search(state["request"])
    return {"validation_findings": findings, "route": "retrieve_memory" if not findings else "fallback"}


def validate_admission(state: MemoryGraphState) -> Dict[str, Any]:
    findings = MemoryAgentValidator.validate_admission(state["request"])
    return {"validation_findings": findings, "route": "extract_experience" if not findings else "fallback"}


def retrieve_memory(state: MemoryGraphState) -> Dict[str, Any]:
    request = state["request"]
    if state["action"] == "recent":
        items = state["agent"].recent(limit=int(request.get("limit") or 20))
        response = {"items": items, "backend": getattr(state["agent"].experience_module.long_memory, "backend", "")}
    else:
        response = state["agent"].experience_module.search(**state["agent"].search_arguments(request))
    return {"items": list(response.get("items") or []), "route": "dedup"}


def dedup(state: MemoryGraphState) -> Dict[str, Any]:
    return {"deduped_items": MemoryAgentValidator.deduplicate(list(state.get("items") or [])), "route": "rerank"}


def rerank(state: MemoryGraphState) -> Dict[str, Any]:
    request = state["request"]
    query_tokens = set(str(request.get("query") or "").lower().split())
    values = list(state.get("deduped_items") or [])
    values.sort(key=lambda item: sum(token in str(item).lower() for token in query_tokens), reverse=True)
    return {"ranked_items": values[: int(request.get("limit") or 20)], "route": "validate"}


def validate(state: MemoryGraphState) -> Dict[str, Any]:
    findings = list(state.get("validation_findings") or [])
    if state["action"] == "search" and not state.get("ranked_items"):
        findings.append("未检索到已验证维修经验")
    return {"validation_findings": list(dict.fromkeys(findings)), "route": "final"}


def extract_experience(state: MemoryGraphState) -> Dict[str, Any]:
    request = state["request"]
    experience = state["agent"].experience_module.extractor.extract(
        workorder=dict(request.get("workorder") or {}), repair_feedback=request.get("repair_feedback") or (request.get("workorder") or {}).get("repair_feedback") or {},
        diagnosis=dict(request.get("diagnosis") or {}), maintenance_plan=dict(request.get("maintenance_plan") or {}), report=dict(request.get("report") or {}),
    )
    return {"experience": experience, "route": "dedup_experience"}


def dedup_experience(state: MemoryGraphState) -> Dict[str, Any]:
    existing = state["agent"].experience_module.long_memory.search(device_id=str((state.get("request") or {}).get("workorder", {}).get("device_id") or ""), limit=100)
    if state["agent"].experience_module.writer.deduplicator.contains(state.get("experience") or {}, existing):
        experience_id = str((state.get("experience") or {}).get("experience_id") or "")
        existing_item = next(
            (
                item for item in existing
                if str(item.get("experience_id") or "") == experience_id
            ),
            None,
        )
        # A memory row may already exist while its remote RAG upsert failed.
        # Keep the duplicate out of long memory, but send it through the writer
        # again so the stable experience id can be retried safely.
        if existing_item is not None and not bool(existing_item.get("rag_saved")):
            return {"route": "validate_experience"}
        return {"validation_findings": ["相同工单经验已存在"], "route": "final"}
    return {"route": "validate_experience"}


def validate_experience(state: MemoryGraphState) -> Dict[str, Any]:
    return {"route": "persist" if state.get("experience") and not state.get("validation_findings") else "fallback"}


def persist(state: MemoryGraphState) -> Dict[str, Any]:
    experience = state.get("experience") or {}
    saved, rag_saved, duplicate = state["agent"].experience_module.writer.write(experience)
    experience = {**experience, "memory_saved": saved, "rag_saved": rag_saved, "duplicate": duplicate}
    return {"experience": experience, "route": "final"}


def final(state: MemoryGraphState) -> Dict[str, Any]:
    action = state.get("action", "search")
    items = list(state.get("ranked_items") or [])
    experience = dict(state.get("experience") or {})
    if action in {"search", "recent"}:
        success = bool(items)
    else:
        # Preserve the historical Memory Agent meaning of ``success`` (the
        # experience was admitted to long memory).  ``rag_saved`` remains an
        # explicit stage result and the close runtime uses it to gate reports.
        # A duplicate with a successful RAG retry is also a completed learn.
        success = bool(experience.get("memory_saved") or (experience.get("duplicate") and experience.get("rag_saved")))
    result = MemoryResult(action=action, success=success, items=items, experience=experience, count=len(items), backend=getattr(state["agent"].experience_module.long_memory, "backend", ""), validation_findings=list(state.get("validation_findings") or []), stop_reason="completed")
    return {"result": result, "stop_reason": "completed"}


def fallback(state: MemoryGraphState) -> Dict[str, Any]:
    return {"result": MemoryResult(action=state.get("action", "search"), success=False, items=list(state.get("ranked_items") or []), experience=dict(state.get("experience") or {}), validation_findings=list(state.get("validation_findings") or []), stop_reason="validation_failed", error="；".join(state.get("validation_findings") or [])), "stop_reason": "validation_failed"}


def _route(state: MemoryGraphState) -> str:
    return str(state.get("route") or "fallback")


def build_memory_graph():
    workflow = StateGraph(MemoryGraphState)
    for name, node in (("initialize", initialize), ("load_skill", load_skill), ("validate_search", validate_search), ("validate_admission", validate_admission), ("retrieve_memory", retrieve_memory), ("dedup", dedup), ("rerank", rerank), ("validate", validate), ("extract_experience", extract_experience), ("dedup_experience", dedup_experience), ("validate_experience", validate_experience), ("persist", persist), ("final", final), ("fallback", fallback)):
        workflow.add_node(name, node)
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_conditional_edges("load_skill", _route, {"retrieve_memory": "retrieve_memory", "validate_search": "validate_search", "validate_admission": "validate_admission"})
    workflow.add_conditional_edges("validate_search", _route, {"retrieve_memory": "retrieve_memory", "fallback": "fallback"})
    workflow.add_edge("retrieve_memory", "dedup")
    workflow.add_edge("dedup", "rerank")
    workflow.add_edge("rerank", "validate")
    workflow.add_edge("validate", "final")
    workflow.add_conditional_edges("validate_admission", _route, {"extract_experience": "extract_experience", "fallback": "fallback"})
    workflow.add_edge("extract_experience", "dedup_experience")
    workflow.add_conditional_edges("dedup_experience", _route, {"validate_experience": "validate_experience", "final": "final"})
    workflow.add_conditional_edges("validate_experience", _route, {"persist": "persist", "fallback": "fallback"})
    workflow.add_edge("persist", "final")
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
