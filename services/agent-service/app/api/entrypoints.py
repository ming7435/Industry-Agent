"""两个业务入口：自动异常和用户主动提问。"""

from __future__ import annotations

from typing import Any, Dict

from app.graph import AgentOrchestrator, build_orchestrator

_orchestrator: AgentOrchestrator | None = None


def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = build_orchestrator()
    return _orchestrator


def handle_user_question(user_text: str, orchestrator: AgentOrchestrator | None = None) -> Dict[str, Any]:
    return (orchestrator or get_orchestrator()).run_user(user_text)


def handle_abnormal_event(event: Dict[str, Any], orchestrator: AgentOrchestrator | None = None) -> Dict[str, Any]:
    return (orchestrator or get_orchestrator()).run_abnormal_event(event)
