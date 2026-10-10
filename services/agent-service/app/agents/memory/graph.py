"""Memory Agent LangGraph：区分经验检索和经验学习两条路径。"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from langgraph.graph import END, START, StateGraph

from app.skills import get_skill_registry
from app.agents.base import chain_nodes, prepare_skill_node, result_node, trace_skill_node

from .schemas import MemoryGraphState, MemoryResult
from .validator import MemoryAgentValidator


def initialize(state: MemoryGraphState) -> Dict[str, Any]:
    request = state["agent"].normalize_request(state.get("request") or {})
    findings = MemoryAgentValidator.validate_action(request)
    return {"request": request, "action": request.get("action", "search"), "validation_findings": findings, "route": "fallback" if findings else "load_skill"}


def load_skill(state: MemoryGraphState) -> Dict[str, Any]:
    skills = get_skill_registry().select("memory", state.get("request") or {})
    route = "summarize_repair" if state["action"] in {"summarize", "sync"} else "validate_admission" if state["action"] == "learn" else "validate_search" if state["action"] == "search" else "retrieve_memory"
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
        findings.append("未检索到匹配的维修经验")
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
        # 记忆记录可能已经存在，但远程 RAG upsert 失败。
        # 不把重复记录再次加入长期记忆，但仍通过写入器重试，使稳定的经验 ID 可以安全恢复。
        if existing_item is not None and not bool(existing_item.get("rag_saved")):
            return {"route": "validate_experience"}
        return {"validation_findings": ["相同工单经验已存在"], "route": "final"}
    return {"route": "validate_experience"}


def validate_experience(state: MemoryGraphState) -> Dict[str, Any]:
    experience = dict(state.get("experience") or {})
    if not experience or state.get("validation_findings"):
        return {"route": "fallback"}
    request = state.get("request") or {}
    workorder = dict(request.get("workorder") or {})
    feedback = request.get("repair_feedback") or workorder.get("repair_feedback") or {}
    existing_raw = state["agent"].experience_module.long_memory.search(
        device_id=str(workorder.get("device_id") or ""), limit=100
    )
    existing = [dict(item) for item in existing_raw if isinstance(item, Mapping)]
    quality = state["agent"].experience_module.validator.validate_experience(
        experience, workorder, feedback, existing=existing
    )
    experience.update({
        "experience_quality_score": quality.experience_quality_score,
        "validation_status": quality.validation_status,
        "validation_findings": list(quality.findings),
    })
    if not quality.accepted:
        return {
            "experience": experience,
            "validation_findings": list(quality.findings),
            "route": "fallback",
        }
    return {"experience": experience, "route": "persist"}


def persist(state: MemoryGraphState) -> Dict[str, Any]:
    if state['action'] == 'sync':
        request = state['request']
        proposed_id = (request.get('experience') or {}).get('experience_id')
        existing = next((item for item in state['agent'].experience_module.long_memory.search(
            experience_id=proposed_id, limit=100) if item.get('experience_id') == proposed_id), None)
        if not existing or existing.get('validation_status') not in {'accepted', 'duplicate', 'manual_confirmed'}:
            return {'validation_findings': ['仅同步数据库已保存且已确认的经验'], 'route': 'fallback'}
        if existing.get('validation_status') != 'manual_confirmed' and float(existing.get('experience_quality_score') or 0) < .8:
            return {'validation_findings': ['经验质量未达到知识沉淀条件'], 'route': 'fallback'}
        experience = existing if existing.get('rag_saved') else state['agent'].experience_module.writer.sync(existing)
        return {'experience': {**experience, 'memory_saved': True}, 'route': 'final'}
    if state['action'] == 'summarize':
        return summarize_repair(state)
    experience = state.get("experience") or {}
    saved, rag_saved, duplicate = state["agent"].experience_module.writer.write(experience)
    experience = {**experience, "memory_saved": saved, "rag_saved": rag_saved, "duplicate": duplicate}
    return {"experience": experience, "route": "final"}


def summarize_repair(state: MemoryGraphState) -> Dict[str, Any]:
    from shared.repair_experience import build_manual_summary
    request = state['request']
    try:
        experience = build_manual_summary(request.get('workorder') or {}, request.get('report') or {})
    except ValueError as error:
        return {'validation_findings': [str(error)], 'route': 'fallback'}
    store = state['agent'].experience_module.long_memory
    existing = next((item for item in store.search(device_id=experience['device_id'], limit=100,
                                                 source_workorder=experience['source_workorder'])
                     if item.get('experience_id') == experience['experience_id']), None)
    if existing:
        # Rebuild missing metadata for older persisted summaries, retaining receipts.
        store.save(experience)
        existing = next((item for item in store.search(device_id=experience['device_id'], limit=100,
                            source_workorder=experience['source_workorder'])
                         if item.get('experience_id') == experience['experience_id']), experience)
        experience = {**experience, **existing, 'memory_saved': True, 'duplicate': True}
    else:
        store.save(experience)
    # Confirmation returns after the durable save. Remote indexing is performed
    # by the background Memory Agent invocation and can safely resume on restart.
    if (request.get('context') or {}).get('sync_knowledge') and not experience.get('rag_saved'):
        experience = state['agent'].experience_module.writer.sync(experience)
    return {'experience': experience, 'route': 'final'}


def final(state: MemoryGraphState) -> Dict[str, Any]:
    action = state.get("action", "search")
    items = list(state.get("ranked_items") or [])
    experience = dict(state.get("experience") or {})
    if action in {"search", "recent"}:
        success = bool(items)
    else:
        # 保留 Memory Agent 对 ``success`` 的历史语义（经验已进入长期记忆）。
        # ``rag_saved`` 仍是明确的阶段结果，关闭运行时用它控制报告生成。
        # RAG 重试成功的重复记录也视为学习完成。
        success = bool(experience.get("memory_saved") or (experience.get("duplicate") and experience.get("rag_saved")))
    result = MemoryResult(action=action, success=success, items=items, experience=experience, count=len(items), backend=getattr(state["agent"].experience_module.long_memory, "backend", ""), validation_findings=list(state.get("validation_findings") or []), stop_reason="completed")
    return {"result": result, "stop_reason": "completed"}


def fallback(state: MemoryGraphState) -> Dict[str, Any]:
    return {"result": MemoryResult(action=state.get("action", "search"), success=False, items=list(state.get("ranked_items") or []), experience=dict(state.get("experience") or {}), validation_findings=list(state.get("validation_findings") or []), stop_reason="validation_failed", error="；".join(state.get("validation_findings") or [])), "stop_reason": "validation_failed"}


def _route(state: MemoryGraphState) -> str:
    return str(state.get("route") or "fallback")


def build_memory_graph():
    workflow = StateGraph(MemoryGraphState)
    node_skill_steps = {
        "initialize": "validate_closed",
        "load_skill": "select_skills",
        "rerank": "score_experience",
        "final": "build_result",
    }
    prepare = prepare_skill_node("memory", initialize, load_skill, skill_steps=node_skill_steps)
    steps = {}
    for name, node in (("validate_search", validate_search), ("validate_admission", validate_admission), ("retrieve_memory", retrieve_memory), ("dedup", dedup), ("rerank", rerank), ("validate", validate), ("extract_experience", extract_experience), ("dedup_experience", dedup_experience), ("validate_experience", validate_experience), ("persist", persist), ("final", final), ("fallback", fallback)):
        steps[name] = trace_skill_node("memory", name, node, skill_step=node_skill_steps.get(name, name))

    def validate_entry(state: MemoryGraphState) -> Dict[str, Any]:
        # 三条业务路径互斥；recent 不执行搜索或学习入口验证。
        route = state.get("route")
        if route in {"validate_search", "validate_admission"}:
            return steps[route](state)
        return {}

    workflow.add_node("prepare", chain_nodes(prepare, validate_entry, stop_routes=("fallback",)))
    workflow.add_node("retrieve_memory", steps["retrieve_memory"])
    workflow.add_node("rank_results", chain_nodes(steps["dedup"], steps["rerank"], steps["validate"]))
    workflow.add_node("extract", chain_nodes(steps["extract_experience"], steps["dedup_experience"]))
    workflow.add_node("validate_experience", steps["validate_experience"])
    workflow.add_node("persist", steps["persist"])
    workflow.add_node("finish", result_node(steps["final"], steps["fallback"]))
    workflow.add_edge(START, "prepare")
    workflow.add_conditional_edges("prepare", _route, {"retrieve_memory": "retrieve_memory", "extract_experience": "extract", "summarize_repair": "persist", "fallback": "finish"})
    workflow.add_edge("retrieve_memory", "rank_results")
    workflow.add_edge("rank_results", "finish")
    workflow.add_conditional_edges("extract", _route, {"validate_experience": "validate_experience", "final": "finish"})
    workflow.add_conditional_edges("validate_experience", _route, {"persist": "persist", "fallback": "finish"})
    workflow.add_edge("persist", "finish")
    workflow.add_edge("finish", END)
    return workflow.compile()
