"""Diagnosis Agent 使用的状态和结果契约。"""

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
    """
    Diagnosis Agent 单次运行状态。

    后续可直接映射到 LangGraph StateGraph。
    """

    # Monitor / AbnormalEvent Manager 传入的异常事件
    abnormal_event: Dict[str, Any]

    # Agent 当前运行状态
    status: AgentStatus = AgentStatus.IDLE

    # LLM 对话上下文
    messages: List[Dict[str, Any]] = field(default_factory=list)

    # Tool 调用记录
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)

    # Tool 原始返回结果
    tool_results: List[Dict[str, Any]] = field(default_factory=list)

    # Agent 从 Tool Result 得到的 Observation
    observations: List[Dict[str, Any]] = field(default_factory=list)

    # Agent Loop 控制
    step_count: int = 0
    max_steps: int = 6

    # Agent 下一步动作
    next_action: Optional[str] = None

    # 最终诊断
    diagnosis: Optional[Dict[str, Any]] = None

    # 诊断置信度
    confidence: Optional[float] = None

    # 本次 Agent Run 的 Trace
    trace_id: str = ""

    # 错误信息
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "abnormal_event": dict(self.abnormal_event),
            "status": self.status.value,
            "messages": list(self.messages),
            "tool_calls": list(self.tool_calls),
            "tool_results": list(self.tool_results),
            "observations": list(self.observations),
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
    """
    Diagnosis Agent 一次运行结束后的最终结果。

    可供：
    - 前端
    - Maintenance Agent
    - Report Agent
    - Trace
    - 数据库存储
    """

    # 故障事件
    event_id: str

    # 设备
    device_id: str

    # Agent运行状态
    status: AgentStatus

    # 简要说明
    summary: str

    # 诊断结果
    diagnosis: str

    # 置信度
    confidence: Optional[float]

    # 报警定义
    alarm_definition: Dict[str, Any]

    # 本次 Agent 调过哪些工具
    tool_calls: List[Dict[str, Any]]

    # 使用的模型
    model: str

    # 结果来源
    source: str

    # 诊断完成时间
    created_at: datetime

    # 外部任务ID
    task_id: str = ""

    # Agent触发时间
    triggered_at: Optional[datetime] = None

    # 错误
    error: Optional[str] = None

    # 同一个故障事件第几轮诊断
    #
    # 例如：
    # revision=1 首次异常
    # revision=2 warning -> high
    # revision=3 high -> critical
    event_revision: int = 1

    # 为什么触发本次诊断
    #
    # initial_abnormal
    # severity_escalation
    # new_fault
    # critical_alarm
    trigger_cause: str = ""

    # 每一次 Agent 真正运行的唯一ID
    diagnosis_run_id: str = ""

    # 全链路 Trace ID
    trace_id: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "device_id": self.device_id,
            "status": self.status.value,
            "summary": self.summary,
            "diagnosis": self.diagnosis,
            "confidence": self.confidence,
            "alarm_definition": dict(self.alarm_definition),
            "tool_calls": list(self.tool_calls),
            "model": self.model,
            "source": self.source,
            "created_at": self.created_at.isoformat(),
            "task_id": self.task_id or None,
            "triggered_at": (
                self.triggered_at.isoformat()
                if self.triggered_at
                else None
            ),
            "error": self.error,
            "event_revision": self.event_revision,
            "trigger_cause": self.trigger_cause,
            "diagnosis_run_id": self.diagnosis_run_id,
            "trace_id": self.trace_id,
        }