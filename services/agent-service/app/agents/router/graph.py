"""Router Agent 的 LangGraph 意图识别与路由编排。"""

from __future__ import annotations

from typing import Any, Dict, TypedDict

from langgraph.graph import END, START, StateGraph

from app.validator import RouteResult

from .validator import RouterValidator


class RouterGraphState(TypedDict, total=False):
    """Router 单次运行在 LangGraph 节点之间传递的状态。"""

    agent: Any
    task: Dict[str, Any]
    text: str
    context: Dict[str, Any]
    active_skill: str
    intent: str
    reason: str
    entities: Dict[str, Any]
    target_agent: str
    validation_findings: list[str]
    result: RouteResult
    route: str


def initialize(state: RouterGraphState) -> Dict[str, Any]:
    payload = dict(state.get("task") or {})
    return {
        "task": payload,
        "text": str(payload.get("user_text") or ""),
        "context": dict(payload.get("context") or {}),
        "route": "load_skill",
    }


def load_skill(_: RouterGraphState) -> Dict[str, Any]:
    return {"active_skill": "router_master_skill", "route": "classify_intent"}


def classify_intent(state: RouterGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    intent, reason = agent._classify_intent(state["text"].lower(), state.get("context") or {})
    return {"intent": intent, "reason": reason, "route": "extract_entities"}


def extract_entities(state: RouterGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    entities = agent._extract_entities(state["text"], state.get("context") or {})
    return {"entities": entities, "route": "validate_route"}


def validate_route(state: RouterGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    text = state["text"].lower()
    entities = state.get("entities") or {}
    # 实体提取后重新判断一次，使 E102 这类报警码问题进入 Knowledge。
    intent, reason = agent._classify_intent(text, entities)
    target_agent = agent._target_agent(intent)
    findings = RouterValidator.validate(intent, target_agent, entities)
    if findings:
        intent = "need_more_context"
        target_agent = "router"
        reason = "路由目标已识别，但缺少必要实体：%s" % "；".join(findings)
    route = "fallback" if intent == "unknown" else "final"
    return {
        "intent": intent,
        "reason": reason,
        "target_agent": target_agent,
        "validation_findings": findings,
        "route": route,
    }


def final(state: RouterGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    intent = state["intent"]
    entities = state.get("entities") or {}
    findings = list(state.get("validation_findings") or [])
    result = RouteResult(
        intent=intent,
        target_agent=state.get("target_agent") or agent._target_agent(intent),
        confidence=agent._confidence(intent, entities, findings),
        reason=state.get("reason") or "路由完成",
        entities=entities,
        target_input=agent._target_input(state["text"], state.get("context") or {}, entities, intent),
        validation_findings=findings,
    )
    return {"result": result}


def fallback(state: RouterGraphState) -> Dict[str, Any]:
    agent = state["agent"]
    entities = state.get("entities") or {}
    result = RouteResult(
        intent="unknown",
        target_agent="router",
        confidence=0.2,
        reason=state.get("reason") or "未识别到明确的工业运维意图",
        entities=entities,
        target_input=agent._target_input(state.get("text", ""), state.get("context") or {}, entities, "unknown"),
        validation_findings=list(state.get("validation_findings") or []),
    )
    return {"result": result}


def _route(state: RouterGraphState) -> str:
    return str(state.get("route") or "fallback")


def build_router_graph():
    """构建并编译 Router Agent 工作流。"""

    workflow = StateGraph(RouterGraphState)
    for name, node in (
        ("initialize", initialize),
        ("load_skill", load_skill),
        ("classify_intent", classify_intent),
        ("extract_entities", extract_entities),
        ("validate_route", validate_route),
        ("final", final),
        ("fallback", fallback),
    ):
        workflow.add_node(name, node)
    workflow.add_edge(START, "initialize")
    workflow.add_edge("initialize", "load_skill")
    workflow.add_edge("load_skill", "classify_intent")
    workflow.add_edge("classify_intent", "extract_entities")
    workflow.add_edge("extract_entities", "validate_route")
    workflow.add_conditional_edges("validate_route", _route, {"final": "final", "fallback": "fallback"})
    workflow.add_edge("final", END)
    workflow.add_edge("fallback", END)
    return workflow.compile()
