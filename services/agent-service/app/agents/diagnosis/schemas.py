"""Diagnosis Agent 的状态与结果契约。"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class AgentStatus(str, Enum):
    """诊断任务当前状态。"""

    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FALLBACK = "fallback"
    FAILED = "failed"


@dataclass
class DiagnosisState:
    """Diagnosis Agent 单次运行状态，可直接映射到 LangGraph StateGraph。"""

    abnormal_event: Dict[str, Any]
    status: AgentStatus = AgentStatus.IDLE
    current_agent: str = "diagnosis"
    final_result: Optional[Dict[str, Any]] = None
    messages: List[Dict[str, Any]] = field(default_factory=list)
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    tool_results: List[Dict[str, Any]] = field(default_factory=list)
    observations: List[Dict[str, Any]] = field(default_factory=list)
    active_skill: str = "diagnosis_master_skill"
    active_skills: List[str] = field(default_factory=lambda: ["diagnosis_master_skill"])
    allowed_tools: List[str] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)
    evidence_records: List[Dict[str, Any]] = field(default_factory=list)
    validation_errors: List[str] = field(default_factory=list)
    stop_reason: str = ""
    last_observation_hash: str = ""
    repeated_observation_count: int = 0
    step_count: int = 0
    max_steps: int = 6
    next_action: Optional[str] = None
    diagnosis: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    trace_id: str = ""
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "abnormal_event": dict(self.abnormal_event),
            "status": self.status.value,
            "current_agent": self.current_agent,
            "final_result": self.final_result,
            "messages": list(self.messages),
            "tool_calls": list(self.tool_calls),
            "tool_results": list(self.tool_results),
            "observations": list(self.observations),
            "active_skill": self.active_skill,
            "active_skills": list(self.active_skills),
            "allowed_tools": list(self.allowed_tools),
            "evidence": list(self.evidence),
            "evidence_records": list(self.evidence_records),
            "validation_errors": list(self.validation_errors),
            "stop_reason": self.stop_reason,
            "last_observation_hash": self.last_observation_hash,
            "repeated_observation_count": self.repeated_observation_count,
            "step_count": self.step_count,
            "max_steps": self.max_steps,
            "next_action": self.next_action,
            "diagnosis": self.diagnosis,
            "confidence": self.confidence,
            "trace_id": self.trace_id,
            "error": self.error,
        }


@dataclass(frozen=True)
class DiagnosisResult:
    """Diagnosis Agent 一次运行结束后的最终结果。"""

    event_id: str
    device_id: str
    status: AgentStatus
    summary: str
    diagnosis: str
    confidence: Optional[float]
    alarm_definition: Dict[str, Any]
    tool_calls: List[Dict[str, Any]]
    model: str
    source: str
    created_at: datetime
    evidence: List[str] = field(default_factory=list)
    evidence_records: List[Dict[str, Any]] = field(default_factory=list)
    recommendation: str = ""
    task_id: str = ""
    triggered_at: Optional[datetime] = None
    error: Optional[str] = None
    event_revision: int = 1
    trigger_cause: str = ""
    diagnosis_run_id: str = ""
    trace_id: str = ""
    active_skill: str = "diagnosis_master_skill"
    active_skills: List[str] = field(default_factory=list)
    validation_errors: List[str] = field(default_factory=list)
    stop_reason: str = ""
    cached: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "device_id": self.device_id,
            "status": self.status.value,
            "summary": self.summary,
            "diagnosis": self.diagnosis,
            "confidence": self.confidence,
            "evidence": list(self.evidence),
            "evidence_records": list(self.evidence_records),
            "recommendation": self.recommendation,
            "alarm_definition": dict(self.alarm_definition),
            "tool_calls": list(self.tool_calls),
            "model": self.model,
            "source": self.source,
            "created_at": self.created_at.isoformat(),
            "task_id": self.task_id or None,
            "triggered_at": self.triggered_at.isoformat() if self.triggered_at else None,
            "error": self.error,
            "event_revision": self.event_revision,
            "trigger_cause": self.trigger_cause,
            "diagnosis_run_id": self.diagnosis_run_id,
            "trace_id": self.trace_id,
            "active_skill": self.active_skill,
            "active_skills": list(self.active_skills),
            "validation_errors": list(self.validation_errors),
            "stop_reason": self.stop_reason,
            "cached": self.cached,
        }
