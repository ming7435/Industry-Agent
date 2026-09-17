"""Knowledge Agent 的 LangGraph 检索、融合和证据校验流程。"""

from __future__ import annotations

from typing import Any, Dict, List, TypedDict

from langgraph.graph import END, START, StateGraph

from app.validator import KnowledgeResult

from .schemas import KnowledgeQuery
from .validator import KnowledgeEvidenceValidator


KNOWLEDGE_TOOLS = (
    "search_knowledge",
    "search_alarm_knowledge",
    "search_sop",
    "search_manual",
    "search_fault_cases",
    "search_semantic_memory",
    "fetch_document",
    "fetch_chunk",
)


class KnowledgeGraphState(TypedDict, total=False):
    agent: Any
    request: Dict[str, Any]
    active_skill: str
    allowed_tools: List[str]
    query_type: str
    retrieval_plan: List[str]
    pending_tools: List[str]
    step_count: int
    max_steps: int
    query: str
    observations: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    evidence: List[Dict[str, Any]]
    validation_findings: List[str]
    status: str
    stop_reason: str
    route: str
    result: KnowledgeResult


def initialize(state: KnowledgeGraphState) -> Dict[str, Any]:
    request = KnowledgeQuery.from_payload(state.get("request") or {}).model_dump(mode="json")
    return {
        "request": request,
        "query": request["query"],
        "step_count": 0,
        "max_steps": request["max_steps"],
        "observations": [],
        "documents": [],
        "evidence": [],
        "validation_findings": [],
        "route": "load_skill",
    }


def load_skill(state: KnowledgeGraphState) -> Dict[str, Any]:
    return {
        "active_skill": "knowledge_master_skill",
        "allowed_tools": list(KNOWLEDGE_TOOLS),
        "route": "classify_query",
    }


def classify_query(state: KnowledgeGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    request = state["request"]
    query_type = agent._classify_query(state["query"], request.get("filters") or {}, request.get("required_sources") or [])
    return {"query_type": query_type, "route": "plan_retrieval"}


def plan_retrieval(state: KnowledgeGraphState) -> Dict[str, Any]:
    request = state["request"]
    query_type = state.get("query_type") or "hybrid"
    plans = {
        "alarm": ["search_alarm_knowledge", "search_knowledge"],
        "sop": ["search_sop", "search_manual"],
        "case": ["search_fault_cases", "search_semantic_memory"],
        "engineering": ["search_manual", "search_knowledge"],
        "hybrid": ["search_knowledge", "search_sop", "search_fault_cases"],
    }
    planned = list(plans.get(query_type, plans["hybrid"]))
    required = [str(item).lower() for item in request.get("required_sources") or []]
    if required:
        if any(item in {"alarm", "alarm_code"} for item in required) and "search_alarm_knowledge" not in planned:
            planned.insert(0, "search_alarm_knowledge")
        if "sop" in required and "search_sop" not in planned:
            planned.append("search_sop")
        if "case" in required and "search_fault_cases" not in planned:
            planned.append("search_fault_cases")
    return {"retrieval_plan": planned, "pending_tools": list(planned), "route": "retrieve"}


def retrieve(state: KnowledgeGraphState) -> Dict[str, Any]:
    pending = list(state["pending_tools"] if "pending_tools" in state else state.get("retrieval_plan") or [])
    if not pending or state.get("step_count", 0) >= state.get("max_steps", 4):
        return {"pending_tools": pending, "route": "observe"}
    operation = pending.pop(0)
    request = state["request"]
    arguments = {
        "query": state["query"],
        "limit": request.get("limit", 5),
        "filters": request.get("filters") or {},
        "alarm_code": request.get("alarm_code", ""),
        "component": request.get("component", ""),
        "device_id": request.get("device_id", ""),
    }
    try:
        raw = state["agent"].tools.execute(operation, arguments)
        error = ""
    except Exception as exc:
        raw = {"documents": [], "source": "knowledge-tool-error"}
        error = str(exc)
    observations = list(state.get("observations") or [])
    observations.append({"tool": operation, "result": raw, "error": error})
    documents = list(state.get("documents") or []) + list(raw.get("documents") or [])
    return {
        "pending_tools": pending,
        "observations": observations,
        "documents": documents,
        "step_count": state.get("step_count", 0) + 1,
        "route": "observe",
    }


def observe(state: KnowledgeGraphState) -> Dict[str, Any]:
    documents = list(state.get("documents") or [])
    pending = list(state.get("pending_tools") or [])
    required = [str(item).lower() for item in state["request"].get("required_sources") or []]
    found_types = {str(item.get("metadata", {}).get("knowledge_type") or "").lower() for item in documents}
    covered = not required or all(item in found_types for item in required)
    if documents and covered:
        route = "rerank"
    elif pending and state.get("step_count", 0) < state.get("max_steps", 4):
        route = "retrieve"
    elif not documents and state.get("step_count", 0) < state.get("max_steps", 4):
        route = "refine_query"
    else:
        route = "rerank"
    return {"route": route}


def refine_query(state: KnowledgeGraphState) -> Dict[str, Any]:
    query = state["query"]
    query_type = state.get("query_type") or "hybrid"
    suffix = {"alarm": " 报警定义 含义 检查", "sop": " SOP 维修步骤", "case": " 历史案例 故障经验", "engineering": " 手册 部件", "hybrid": " 工业设备维修"}.get(query_type, " 工业设备维修")
    refined = query if suffix.strip() in query else query + suffix
    return {"query": refined, "pending_tools": ["search_knowledge"], "route": "retrieve"}


def rerank(state: KnowledgeGraphState) -> Dict[str, Any]:
    documents = state["agent"]._deduplicate_documents(state.get("documents") or [])
    evidence = state["agent"]._evidence_from_documents(documents)
    return {"documents": [item.model_dump(mode="json") for item in documents], "evidence": evidence, "route": "validate"}


def validate(state: KnowledgeGraphState) -> Dict[str, Any]:
    documents = list(state.get("documents") or [])
    evidence = list(state.get("evidence") or [])
    confidence = state["agent"]._confidence_from_documents(documents, state["request"].get("required_sources") or [])
    findings = KnowledgeEvidenceValidator.validate(
        documents,
        evidence,
        state["request"].get("required_sources") or [],
        confidence,
        "completed" if documents else "insufficient_evidence",
    )
    status = "completed" if documents and not findings else "insufficient_evidence"
    return {"validation_findings": findings, "status": status, "route": "final" if not findings else "fallback"}


def final(state: KnowledgeGraphState) -> Dict[str, Any]:
    result = state["agent"]._build_result(
        request=state["request"],
        query=state["query"],
        query_type=state.get("query_type") or "hybrid",
        documents=state.get("documents") or [],
        evidence=state.get("evidence") or [],
        status=state.get("status") or "insufficient_evidence",
        observations=state.get("observations") or [],
        validation_findings=state.get("validation_findings") or [],
    )
    return {"result": result, "stop_reason": "evidence_ready" if result.status == "completed" else "insufficient_evidence"}


def fallback(state: KnowledgeGraphState) -> Dict[str, Any]:
    findings = list(state.get("validation_findings") or [])
    if "知识库检索未获得足够证据" not in findings:
        findings.append("知识库检索未获得足够证据")
    return {"status": "insufficient_evidence", "validation_findings": findings, "route": "final"}


def _route(state: KnowledgeGraphState) -> str:
    return str(state.get("route") or "fallback")


def build_knowledge_graph():
    workflow = StateGraph(KnowledgeGraphState)
    for name, node in (
        ("initialize", initialize),
        ("load_skill", load_skill),
        ("classify_query", classify_query),
        ("plan_retrieval", plan_retrieval),
        ("retrieve", retrieve),
        ("observe", observe),
        ("refine_query", refine_query),
        ("rerank", rerank),
        ("validate", validate),
        ("final", final),
        ("fallback", fallback),
    ):
        workflow.add_node(name, node)
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "classify_query")
    workflow.add_edge("classify_query", "plan_retrieval")
    workflow.add_edge("plan_retrieval", "retrieve")
    workflow.add_edge("retrieve", "observe")
    workflow.add_conditional_edges("observe", _route, {"retrieve": "retrieve", "refine_query": "refine_query", "rerank": "rerank"})
    workflow.add_edge("refine_query", "retrieve")
    workflow.add_edge("rerank", "validate")
    workflow.add_conditional_edges("validate", _route, {"final": "final", "fallback": "fallback"})
    workflow.add_edge("fallback", "final")
    workflow.add_edge("final", END)
    return workflow.compile()
