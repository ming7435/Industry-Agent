"""两个业务入口：自动异常和用户主动提问。"""

from __future__ import annotations

from typing import Any, Dict

from app.graph import AgentOrchestrator, build_orchestrator


def handle_user_question(user_text: str, orchestrator: AgentOrchestrator | None = None) -> Dict[str, Any]:
    return (orchestrator or build_orchestrator()).run_user(user_text)


def handle_abnormal_event(event: Dict[str, Any], orchestrator: AgentOrchestrator | None = None) -> Dict[str, Any]:
    return (orchestrator or build_orchestrator()).run_abnormal_event(event)
