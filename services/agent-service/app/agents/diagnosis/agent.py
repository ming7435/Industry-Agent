"""Diagnosis Agent 的诊断编排逻辑。

LLM 客户端属于平台级共享能力，由外部注入；Agent 只负责诊断流程、Skill、Tool Guard、
Observation 和 Validator。
"""

from __future__ import annotations

import uuid

from datetime import datetime
from dataclasses import replace
from typing import Any, Callable, Dict, List, Mapping, Optional

from . import evidence, parsing, tool_policy, validator
from .dedup import DiagnosisRunCache
from .graph import build_diagnosis_graph
from .prompt import build_diagnosis_messages
from .schemas import (
    AgentStatus,
    DiagnosisResult,
    DiagnosisState,
)

from app.llm import get_default_llm_client
from app.mcp.registry import LocalMcpToolRegistry


class DiagnosisAgent:
    """
    Diagnosis Agent。

    输入：
        AbnormalEvent

    流程：
        AbnormalEvent
            ↓
        LLM Reason
            ↓
        Tool Calling
            ↓
        Observation
            ↓
        LLM Reason
            ↓
        Diagnosis

    注意：
        是否应该启动 Agent，
        不由 DiagnosisAgent 自己决定。

        该逻辑应该放在：
        Monitor
            ↓
        Rule Engine
            ↓
        AbnormalEvent Manager
            ↓
        DiagnosisAgent.run()
    """

    def __init__(
        self,
        client: Optional[Any] = None,
        tools: Optional[LocalMcpToolRegistry] = None,
        knowledge_provider: Optional[Callable[[Mapping[str, Any], str], Mapping[str, Any]]] = None,
        run_cache: Optional[DiagnosisRunCache] = None,
    ) -> None:

        self.client = client if client is not None else get_default_llm_client()

        self.tools = (
            tools
            or LocalMcpToolRegistry()
        )
        self.knowledge_provider = knowledge_provider
        self.run_cache = run_cache if run_cache is not None else DiagnosisRunCache()

    def run(
        self,
        abnormal_event: Any,
    ) -> DiagnosisResult:
        """
        对一个 AbnormalEvent 执行一次完整诊断。

        一次 run = 一次 Diagnosis Agent Run。
        """

        event = self._event_dict(
            abnormal_event
        )

        cached = self.run_cache.get(event)
        if cached is not None:
            return replace(cached, cached=True)

        # -------------------------
        # 生成本次运行ID
        # -------------------------

        diagnosis_run_id = (
            "RUN-"
            + uuid.uuid4().hex[:12]
        )

        trace_id = (
            "TRACE-"
            + uuid.uuid4().hex[:12]
        )

        # -------------------------
        # 初始化State
        # -------------------------

        state = DiagnosisState(
            abnormal_event=event,
            status=AgentStatus.RUNNING,
            trace_id=trace_id,
        )

        # -------------------------
        # 基础字段
        # -------------------------

        event_id = str(
            event.get("event_id")
            or event.get("key")
            or "event:unknown"
        )

        device_id = str(
            event.get("device_id")
            or "unknown"
        )

        alarm_code = event.get(
            "alarm_code"
        )

        task_id = str(
            event.get("task_id")
            or ""
        )

        triggered_at = self._parse_datetime(
            event.get("timestamp")
            or event.get("last_seen")
        )

        try:
            graph = build_diagnosis_graph()
            output = graph.invoke({
                "agent": self,
                "event": event,
                "agent_state": state,
                "event_id": event_id,
                "device_id": device_id,
                "alarm_code": alarm_code,
                "task_id": task_id,
                "triggered_at": triggered_at,
                "diagnosis_run_id": diagnosis_run_id,
            })
            result = output.get("final_result")
            if result is None:
                raise RuntimeError("LangGraph 未生成诊断结果")
            self.run_cache.put(event, result)
            return result
        except Exception as error:
            result = self._build_fallback_result(
                state=state,
                event_id=event_id,
                device_id=device_id,
                alarm_code=alarm_code,
                error=str(error),
                task_id=task_id,
                triggered_at=triggered_at,
                diagnosis_run_id=diagnosis_run_id,
            )
            self.run_cache.put(event, result)
            return result

    def request_knowledge(self, event: Mapping[str, Any], query: str) -> Dict[str, Any]:
        """通过 Orchestrator 注入的 A2A 回调获取知识证据。"""

        if self.knowledge_provider is None:
            return {}
        result = self.knowledge_provider(event, query)
        return dict(result or {})

    # ==========================================================
    # Event
    # ==========================================================

    @staticmethod
    def _event_dict(
        event: Any,
    ) -> Dict[str, Any]:

        if hasattr(
            event,
            "to_dict",
        ):
            event = event.to_dict()

        if not isinstance(
            event,
            Mapping,
        ):
            raise TypeError(
                "abnormal_event 必须是对象或字典"
            )

        return dict(event)

    # ==========================================================
    # Prompt
    # ==========================================================

    @staticmethod
    def _messages(
        event: Mapping[str, Any],
    ):
        return build_diagnosis_messages(event)

    # ==========================================================
    # LLM Response
    # ==========================================================

    @staticmethod
    def _assistant_message(
        response: Mapping[str, Any],
    ) -> Dict[str, Any]:
        return parsing.assistant_message(response)

    # ==========================================================
    # Tool Arguments
    # ==========================================================

    @staticmethod
    def _json_arguments(
        raw: Any,
    ) -> Dict[str, Any]:
        return parsing.json_arguments(raw)

    # ==========================================================
    # Parse Final JSON
    # ==========================================================

    @staticmethod
    def _parse_json(
        text: str,
    ) -> Dict[str, Any]:
        return parsing.parse_final_json(text)

    # ==========================================================
    # Skill / Tool Guard / Validator
    # ==========================================================

    @staticmethod
    def _select_skill(event: Mapping[str, Any]) -> Dict[str, Any]:
        """按事件特征选择 Diagnosis 子 Skill。"""
        return tool_policy.select_skill(event)

    def _tool_schemas_for(self, allowed_tools: List[str]) -> List[Dict[str, Any]]:
        return tool_policy.tool_schemas_for(self.tools, allowed_tools)

    @staticmethod
    def _has_tool_call(state: DiagnosisState, name: str) -> bool:
        return tool_policy.has_tool_call(state, name)

    def _normalize_tool_arguments(
        self,
        name: str,
        arguments: Mapping[str, Any],
        graph_state: Mapping[str, Any],
    ) -> Dict[str, Any]:
        return tool_policy.normalize_tool_arguments(name, arguments, graph_state)

    @staticmethod
    def _guard_tool_call(name: str, arguments: Mapping[str, Any], state: DiagnosisState) -> Dict[str, Any]:
        return tool_policy.guard_tool_call(name, arguments, state)

    @staticmethod
    def _observation_hash(observations: List[Mapping[str, Any]]) -> str:
        return evidence.observation_hash(observations)

    @staticmethod
    def _observation_from_tool(name: str, arguments: Mapping[str, Any], result: Mapping[str, Any], step: int) -> Dict[str, Any]:
        return evidence.observation_from_tool(name, arguments, result, step)

    def _evidence_from_observation(self, observation: Mapping[str, Any]) -> List[str]:
        return evidence.evidence_from_observation(observation)

    def _validate_candidate(
        self,
        state: DiagnosisState,
        event: Mapping[str, Any],
        parsed: Mapping[str, Any],
        raw_text: str,
    ) -> Dict[str, Any]:
        return validator.validate_candidate(state, event, parsed, raw_text)

    @staticmethod
    def _requires_history(event: Mapping[str, Any]) -> bool:
        return tool_policy.requires_history(event)

    @staticmethod
    def _metric_keys_from_event(event: Mapping[str, Any]) -> List[str]:
        return tool_policy.metric_keys_from_event(event)

    @staticmethod
    def _knowledge_query(event: Mapping[str, Any]) -> str:
        return tool_policy.knowledge_query(event)

    def _event_evidence(self, event: Mapping[str, Any]) -> List[str]:
        return evidence.event_evidence(event)

    # ==========================================================
    # Result
    # ==========================================================

    def _result_from_model(
        self,
        state: DiagnosisState,
        event_id: str,
        device_id: str,
        alarm_code: Any,
        parsed: Mapping[str, Any],
        raw_text: str,
        task_id: str,
        triggered_at: Optional[datetime],
        diagnosis_run_id: str,
    ) -> DiagnosisResult:

        definition = (
            self._find_alarm_definition(
                state.tool_results,
                alarm_code,
            )
        )

        # 最后安全补查
        if (
            not definition
            and alarm_code
        ):

            definition = (
                self.tools.execute(
                    "get_alarm_definition",
                    {
                        "alarm_code":
                        alarm_code
                    },
                )
            )

        summary = self._chinese_text(
            str(
                parsed.get("summary")
                or raw_text
                or "已完成异常分析"
            )
        )

        diagnosis = self._chinese_text(
            str(
                parsed.get("diagnosis")
                or summary
            )
        )

        confidence = (
            self._confidence(
                parsed.get(
                    "confidence"
                )
            )
        )

        state.confidence = confidence

        event_revision = (
            self._event_revision(
                state.abnormal_event
            )
        )

        trigger_cause = str(
            state.abnormal_event.get(
                "trigger_reason"
            )
            or state.abnormal_event.get(
                "trigger_cause"
            )
            or ""
        )

        state.status = (
            AgentStatus.COMPLETED
        )

        state.next_action = (
            parsed.get(
                "next_action"
            )
            or "诊断完成"
        )

        state.diagnosis = {
            "summary":
            summary,

            "diagnosis":
            diagnosis,

            "confidence":
            confidence,

            "next_action":
            state.next_action,
        }

        evidence = self._result_evidence(state, state.abnormal_event)
        recommendation = self._chinese_text(
            str(parsed.get("recommendation") or parsed.get("next_action") or state.next_action or "根据诊断结果安排现场检查")
        )

        return DiagnosisResult(
            event_id=event_id,
            device_id=device_id,
            status=AgentStatus.COMPLETED,
            summary=summary,
            diagnosis=diagnosis,
            confidence=confidence,
            alarm_definition=definition,
            tool_calls=state.tool_calls,
            model=self._model_name(),
            source=self._model_source(),
            created_at=self._now(),
            evidence=evidence,
            recommendation=recommendation,
            task_id=task_id,
            triggered_at=triggered_at,
            event_revision=event_revision,
            trigger_cause=trigger_cause,
            diagnosis_run_id=diagnosis_run_id,
            trace_id=state.trace_id,
            active_skill=state.active_skill,
            validation_errors=list(state.validation_errors),
            stop_reason=state.stop_reason,
        )

    # ==========================================================
    # Fallback
    # ==========================================================

    def _build_fallback_result(
        self,
        state: DiagnosisState,
        event_id: str,
        device_id: str,
        alarm_code: Any,
        error: str,
        task_id: str,
        triggered_at: Optional[datetime],
        diagnosis_run_id: str,
    ) -> DiagnosisResult:

        definition: Dict[str, Any] = {}

        if alarm_code:

            try:
                definition = (
                    self.tools.execute(
                        "get_alarm_definition",
                        {
                            "alarm_code":
                            alarm_code
                        },
                    )
                )

            except Exception:
                definition = {}

        event = state.abnormal_event

        event_revision = (
            self._event_revision(
                event
            )
        )

        trigger_cause = str(
            event.get("trigger_reason")
            or event.get("trigger_cause")
            or ""
        )

        metric_text = (
            self._abnormal_metrics_text(
                event
            )
        )

        alarm_name = (
            definition.get("name")
            or definition.get(
                "description"
            )
            or "设备异常"
        )

        severity = (
            definition.get("severity")
            or event.get("severity")
            or "未知"
        )

        severity_text = (
            self._severity_label(
                severity
            )
        )

        summary = (
            "设备 %s 检测到%s，"
            "异常指标：%s，"
            "当前等级：%s。"
            % (
                device_id,
                alarm_name,
                metric_text,
                severity_text,
            )
        )

        diagnosis = (
            definition.get(
                "description"
            )
            or (
                "当前已确认设备存在异常，"
                "但现有证据不足以确定具体根因，"
                "需要进一步查询历史趋势、"
                "设备日志或维修知识。"
            )
        )

        state.status = (
            AgentStatus.FALLBACK
        )

        state.error = error

        state.confidence = (
            0.65
            if self._definition_found(
                definition
            )
            else 0.35
        )

        state.diagnosis = {
            "summary":
            summary,

            "diagnosis":
            diagnosis,

            "confidence":
            state.confidence,
        }

        evidence = self._result_evidence(state, event)
        recommendation = (
            definition.get("recommended_action")
            or "补充历史趋势、设备日志和维修手册证据后，由维修人员现场确认。"
        )

        # 防止重复记录
        already_called = any(
            item.get("name")
            == "get_alarm_definition"
            for item in state.tool_calls
        )

        if (
            alarm_code
            and definition
            and not already_called
        ):

            state.tool_calls.append(
                {
                    "name":
                    "get_alarm_definition",

                    "arguments": {
                        "alarm_code":
                        alarm_code,
                    },

                    "result":
                    definition,
                }
            )

        return DiagnosisResult(
            event_id=event_id,
            device_id=device_id,
            status=AgentStatus.FALLBACK,
            summary=summary,
            diagnosis=diagnosis,
            confidence=state.confidence,
            alarm_definition=definition,
            tool_calls=state.tool_calls,
            model=self._model_name(),
            source="local_fallback",
            created_at=self._now(),
            evidence=evidence,
            recommendation=recommendation,
            task_id=task_id,
            triggered_at=triggered_at,
            error=error,
            event_revision=event_revision,
            trigger_cause=trigger_cause,
            diagnosis_run_id=diagnosis_run_id,
            trace_id=state.trace_id,
            active_skill=state.active_skill,
            validation_errors=list(state.validation_errors),
            stop_reason=state.stop_reason,
        )

    # ==========================================================
    # LLM Metadata
    # ==========================================================

    def _model_name(self) -> str:
        return str(getattr(self.client, "model", "shared-llm"))

    def _model_source(self) -> str:
        return str(getattr(self.client, "provider", "llm"))

    # ==========================================================
    # Alarm Definition
    # ==========================================================

    @staticmethod
    def _find_alarm_definition(
        tool_results,
        alarm_code: Any,
    ) -> Dict[str, Any]:
        return evidence.find_alarm_definition(tool_results, alarm_code)

    @staticmethod
    def _definition_found(
        definition: Mapping[str, Any],
    ) -> bool:
        return evidence.definition_found(definition)

    # ==========================================================
    # Abnormal Metrics
    # ==========================================================

    @staticmethod
    def _abnormal_metrics_text(
        event: Mapping[str, Any],
    ) -> str:
        """把任意异常指标转换成中文文本。"""

        return evidence.abnormal_metrics_text(event)

    def _result_evidence(self, state: DiagnosisState, event: Mapping[str, Any]) -> List[str]:
        return evidence.result_evidence(state, event)

    # ==========================================================
    # Event Revision
    # ==========================================================

    @staticmethod
    def _event_revision(
        event: Mapping[str, Any],
    ) -> int:
        return parsing.event_revision(event)

    # ==========================================================
    # Confidence
    # ==========================================================

    @staticmethod
    def _confidence(
        value: Any,
    ) -> Optional[float]:
        return parsing.confidence(value)

    # ==========================================================
    # Datetime
    # ==========================================================

    @staticmethod
    def _parse_datetime(
        value: Any,
    ) -> Optional[datetime]:
        return parsing.parse_datetime(value)

    @staticmethod
    def _now() -> datetime:
        """统一使用UTC时间。"""
        return parsing.now_utc()

    # ==========================================================
    # Severity
    # ==========================================================

    @staticmethod
    def _severity_label(
        value: Any,
    ) -> str:
        return parsing.severity_label(value)

    # ==========================================================
    # 中文清理
    # ==========================================================

    @classmethod
    def _chinese_text(
        cls,
        text: str,
    ) -> str:
        return parsing.chinese_text(text)
