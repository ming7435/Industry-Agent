"""Diagnosis Agent 的诊断编排逻辑。

LLM 客户端属于平台级共享能力，由外部注入；Agent 只负责诊断流程、Skill、Tool Guard、
Observation 和 Validator。
"""

from __future__ import annotations

import hashlib
import json
import re
import uuid

from datetime import datetime, timezone
from typing import Any, Dict, List, Mapping, Optional

from .schemas import (
    AgentStatus,
    DiagnosisResult,
    DiagnosisState,
)

from app.llm import DeepSeekClient
from app.mcp.registry import LocalMcpToolRegistry


class DiagnosisAgent:
    """
    Diagnosis Agent。

    输入：
        AbnormalEvent

    流程：
        AbnormalEvent
            ↓
        DeepSeek Reason
            ↓
        Tool Calling
            ↓
        Observation
            ↓
        DeepSeek Reason
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
    ) -> None:

        self.client = (
            client
            if client is not None
            else DeepSeekClient()
        )

        self.tools = (
            tools
            or LocalMcpToolRegistry()
        )

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
            from app.graph import build_diagnosis_graph

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
            return result
        except Exception as error:
            return self._fallback(
                state=state,
                event_id=event_id,
                device_id=device_id,
                alarm_code=alarm_code,
                error=str(error),
                task_id=task_id,
                triggered_at=triggered_at,
                diagnosis_run_id=diagnosis_run_id,
            )

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

        return [
            {
                "role":
                "system",

                "content": (
                    "你是中文工业设备诊断智能体。"
                    "你会收到 Monitor 已确认的 AbnormalEvent。"

                    "Monitor 已经完成实时数据采集和异常判断，"
                    "因此不要重复查询当前实时状态。"

                    "如果事件包含 alarm_code，"
                    "必须调用 get_alarm_definition 查询报警定义；"

                    "如果异常属于持续、重复或趋势类问题，"
                    "或者仅凭报警定义无法完成诊断，"
                    "继续调用 get_device_history "
                    "查询异常指标历史趋势；"

                    "如果需要维修手册、SOP、报警案例或安全处置依据，"
                    "调用 search_knowledge 检索知识库；"

                    "如果需要判断报警前后的状态切换、启停、通信异常或PLC日志，"
                    "调用 get_device_logs 查询设备日志；"

                    "只有用户主动诊断且事件缺少 realtime_snapshot 时，"
                    "才允许调用 get_device_status 查询实时状态。"

                    "所有结论必须基于 AbnormalEvent "
                    "和 Tool Result，"
                    "不要编造不存在的设备事实。"

                    "如果证据不足以确定具体根因，"
                    "必须明确说明需要进一步检查，"
                    "不要给出确定性根因。"

                    "所有工具结果返回后再进行诊断。"

                    "最终必须返回 JSON，字段为："
                    "summary、diagnosis、confidence、next_action、evidence、recommendation。"

                    "summary 和 diagnosis 必须使用中文。"

                    "严重等级统一使用："
                    "正常、初级预警、中级报警、"
                    "高级故障、严重故障。"

                    "不要直接输出 high、critical、"
                    "warning 等内部英文枚举。"
                ),
            },

            {
                "role":
                "user",

                "content":
                "请分析以下异常事件：\n"
                + json.dumps(
                    event,
                    ensure_ascii=False,
                ),
            },
        ]

    # ==========================================================
    # DeepSeek Response
    # ==========================================================

    @staticmethod
    def _assistant_message(
        response: Mapping[str, Any],
    ) -> Dict[str, Any]:

        choices = (
            response.get("choices")
            or []
        )

        if not choices:
            raise RuntimeError(
                "DeepSeek 没有返回 choices"
            )

        message = (
            choices[0].get("message")
            or {}
        )

        if not isinstance(
            message,
            dict,
        ):
            raise RuntimeError(
                "DeepSeek message 格式错误"
            )

        return message

    # ==========================================================
    # Tool Arguments
    # ==========================================================

    @staticmethod
    def _json_arguments(
        raw: Any,
    ) -> Dict[str, Any]:

        if isinstance(
            raw,
            dict,
        ):
            return raw

        try:
            result = json.loads(
                raw or "{}"
            )

            if isinstance(
                result,
                dict,
            ):
                return result

        except (
            TypeError,
            json.JSONDecodeError,
        ):
            pass

        return {}

    # ==========================================================
    # Parse Final JSON
    # ==========================================================

    @staticmethod
    def _parse_json(
        text: str,
    ) -> Dict[str, Any]:

        cleaned = text.strip()

        if cleaned.startswith("```"):

            cleaned = (
                cleaned
                .split("\n", 1)[-1]
                .rsplit("```", 1)[0]
                .strip()
            )

        try:
            value = json.loads(
                cleaned
            )

            if isinstance(
                value,
                dict,
            ):
                return value

            return {}

        except json.JSONDecodeError:
            return {}

    # ==========================================================
    # Skill / Tool Guard / Validator
    # ==========================================================

    @staticmethod
    def _select_skill(event: Mapping[str, Any]) -> Dict[str, Any]:
        """按事件特征选择 Diagnosis 子 Skill。"""

        severity = str(event.get("severity") or "").lower()
        trigger_reason = str(event.get("trigger_reason") or event.get("trigger_cause") or "").lower()
        event_type = str(event.get("event_type") or "").lower()
        metrics = event.get("abnormal_metrics") or []
        has_snapshot = bool(event.get("realtime_snapshot"))

        base_tools = ["get_alarm_definition", "get_device_history", "get_device_logs", "search_knowledge"]
        if not has_snapshot:
            base_tools.append("get_device_status")

        if severity == "critical" or "critical" in trigger_reason:
            return {"name": "safety_triage_skill", "allowed_tools": base_tools}
        if event.get("alarm_code"):
            return {"name": "alarm_diagnosis_skill", "allowed_tools": base_tools}
        if isinstance(metrics, list) and len(metrics) > 1:
            return {"name": "multi_metric_diagnosis_skill", "allowed_tools": base_tools}
        if any(word in event_type or word in trigger_reason for word in ("trend", "repeat", "duration", "持续", "重复")):
            return {"name": "trend_diagnosis_skill", "allowed_tools": base_tools}
        return {"name": "no_alarm_diagnosis_skill", "allowed_tools": base_tools}

    def _tool_schemas_for(self, allowed_tools: List[str]) -> List[Dict[str, Any]]:
        allowed = set(allowed_tools or [])
        return [
            schema
            for schema in self.tools.tool_schemas()
            if (schema.get("function") or {}).get("name") in allowed
        ]

    @staticmethod
    def _has_tool_call(state: DiagnosisState, name: str) -> bool:
        return any(item.get("name") == name for item in state.tool_calls)

    def _normalize_tool_arguments(
        self,
        name: str,
        arguments: Mapping[str, Any],
        graph_state: Mapping[str, Any],
    ) -> Dict[str, Any]:
        result = dict(arguments or {})
        event = graph_state.get("event") or {}
        device_id = graph_state.get("device_id") or event.get("device_id")
        alarm_code = graph_state.get("alarm_code") or event.get("alarm_code")

        if name == "get_alarm_definition" and not result.get("alarm_code"):
            result["alarm_code"] = alarm_code
        if name in {"get_device_history", "get_device_logs", "get_device_status"} and not result.get("device_id"):
            result["device_id"] = device_id
        if name == "get_device_history" and not result.get("metric_keys"):
            result["metric_keys"] = self._metric_keys_from_event(event)
        if name == "search_knowledge" and not result.get("query"):
            result["query"] = self._knowledge_query(event)
        return result

    @staticmethod
    def _guard_tool_call(name: str, arguments: Mapping[str, Any], state: DiagnosisState) -> Dict[str, Any]:
        if name not in set(state.allowed_tools or []):
            return {"allow": False, "code": "TOOL_NOT_ALLOWED", "message": "Diagnosis Agent 不允许调用工具：%s" % name}

        required = {
            "get_alarm_definition": "alarm_code",
            "get_device_history": "device_id",
            "get_device_logs": "device_id",
            "get_device_status": "device_id",
            "search_knowledge": "query",
        }.get(name)
        if required and not arguments.get(required):
            return {"allow": False, "code": "INVALID_ARGUMENT", "message": "%s 缺少参数 %s" % (name, required)}

        signature = json.dumps({"name": name, "arguments": dict(arguments)}, ensure_ascii=False, sort_keys=True)
        for item in state.tool_calls:
            previous = json.dumps({"name": item.get("name"), "arguments": item.get("arguments") or {}}, ensure_ascii=False, sort_keys=True)
            if signature == previous and item.get("guard") != "deny":
                return {"allow": False, "code": "DUPLICATE_TOOL_CALL", "message": "重复工具调用未带来新证据：%s" % name}
        return {"allow": True, "code": "OK", "message": "allowed"}

    @staticmethod
    def _observation_hash(observations: List[Mapping[str, Any]]) -> str:
        if not observations:
            return ""
        payload = json.dumps(observations, ensure_ascii=False, sort_keys=True, default=str)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _observation_from_tool(name: str, arguments: Mapping[str, Any], result: Mapping[str, Any], step: int) -> Dict[str, Any]:
        return {
            "step": step,
            "tool": name,
            "arguments": dict(arguments),
            "success": bool(result.get("success", result.get("error") in (None, ""))),
            "found": bool(result.get("found", True)),
            "source": result.get("source", ""),
            "result": dict(result),
        }

    def _evidence_from_observation(self, observation: Mapping[str, Any]) -> List[str]:
        result = observation.get("result") or {}
        tool = str(observation.get("tool") or "")
        if not isinstance(result, Mapping):
            return []
        if result.get("success") is False:
            error = result.get("error")
            if isinstance(error, Mapping):
                error = error.get("message")
            return ["%s 调用失败：%s" % (tool, error or "未知错误")]
        if tool == "get_alarm_definition":
            name = result.get("name") or "未知报警"
            description = result.get("description") or ""
            return ["报警定义：%s，%s" % (name, description)]
        if tool == "get_device_history":
            trend = result.get("trend") or {}
            evidence = []
            for key, item in trend.items():
                if isinstance(item, Mapping):
                    evidence.append("历史趋势：%s %s，最新值=%s" % (key, item.get("direction"), item.get("latest")))
            return evidence or ["历史数据采样数：%s" % result.get("sample_count", 0)]
        if tool == "get_device_logs":
            logs = result.get("logs") or []
            return ["设备日志：%s" % "；".join(str(item.get("message")) for item in logs[:3] if isinstance(item, Mapping))]
        if tool == "search_knowledge":
            docs = result.get("documents") or []
            return ["知识库证据：%s" % "；".join(str(item.get("title")) for item in docs[:3] if isinstance(item, Mapping))]
        if tool == "get_device_status":
            return ["设备状态：%s，模式=%s，健康度=%s" % (result.get("status"), result.get("mode"), result.get("health_score"))]
        return []

    def _validate_candidate(
        self,
        state: DiagnosisState,
        event: Mapping[str, Any],
        parsed: Mapping[str, Any],
        raw_text: str,
    ) -> Dict[str, Any]:
        errors: List[str] = []
        if not parsed and not raw_text.strip():
            errors.append("没有诊断候选结果")
        if event.get("alarm_code") and not self._has_tool_call(state, "get_alarm_definition"):
            errors.append("有 alarm_code 但未查询报警定义")
        if self._requires_history(event) and not self._has_tool_call(state, "get_device_history"):
            errors.append("趋势/重复异常缺少历史趋势证据")
        if not state.evidence and not self._event_evidence(event):
            errors.append("缺少 Evidence")
        if parsed:
            if not str(parsed.get("summary") or "").strip():
                errors.append("summary 为空")
            if not str(parsed.get("diagnosis") or "").strip():
                errors.append("diagnosis 为空")
            if self._confidence(parsed.get("confidence")) is None:
                errors.append("confidence 非法或缺失")
        blocked_tools = {"create_workorder", "close_workorder", "query_inventory", "generate_report", "verify_repair"}
        if any(item.get("name") in blocked_tools and item.get("guard") != "deny" for item in state.tool_calls):
            errors.append("调用了非 Diagnosis 权限工具")
        return {"pass": not errors, "errors": errors, "evidence_count": len(state.evidence)}

    @staticmethod
    def _requires_history(event: Mapping[str, Any]) -> bool:
        text = " ".join(str(event.get(key) or "") for key in ("event_type", "trigger_reason", "trigger_cause"))
        rules = " ".join(str(item) for item in (event.get("trigger_rules") or []))
        combined = (text + " " + rules).lower()
        return any(token in combined for token in ("trend", "repeat", "repeated", "趋势", "重复"))

    @staticmethod
    def _metric_keys_from_event(event: Mapping[str, Any]) -> List[str]:
        mapping = {
            "temperature": "spindle_temperature_c",
            "温度": "spindle_temperature_c",
            "vibration": "spindle_vibration_mm_s",
            "振动": "spindle_vibration_mm_s",
            "rpm": "spindle_rpm",
            "转速": "spindle_rpm",
            "pressure": "hydraulic_pressure_psi",
            "压力": "hydraulic_pressure_psi",
            "lubrication": "lubrication_level_percent",
            "润滑": "lubrication_level_percent",
            "current": "spindle_load_percent",
            "电流": "spindle_load_percent",
        }
        keys: List[str] = []
        for metric in event.get("abnormal_metrics") or []:
            if not isinstance(metric, Mapping):
                continue
            raw = " ".join(str(metric.get(key) or "") for key in ("key", "name", "label", "metric", "group"))
            lowered = raw.lower()
            for token, key in mapping.items():
                if token in lowered and key not in keys:
                    keys.append(key)
        return keys

    @staticmethod
    def _knowledge_query(event: Mapping[str, Any]) -> str:
        parts = [str(event.get("alarm_code") or ""), str(event.get("event_type") or ""), str(event.get("message") or "")]
        for metric in event.get("abnormal_metrics") or []:
            if isinstance(metric, Mapping):
                parts.append(str(metric.get("label") or metric.get("name") or metric.get("key") or ""))
        return " ".join(part for part in parts if part).strip() or "设备异常 诊断 SOP"

    def _event_evidence(self, event: Mapping[str, Any]) -> List[str]:
        evidence = []
        metrics = self._abnormal_metrics_text(event)
        if metrics != "存在设备异常":
            evidence.append("异常事件指标：%s" % metrics)
        if event.get("realtime_snapshot"):
            evidence.append("Monitor 已提供实时快照")
        return evidence

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
            model=getattr(
                self.client,
                "model",
                "deepseek-chat",
            ),
            source="deepseek",
            created_at=self._now(),
            evidence=evidence,
            recommendation=recommendation,
            task_id=task_id,
            triggered_at=triggered_at,
            event_revision=event_revision,
            trigger_cause=trigger_cause,
            diagnosis_run_id=diagnosis_run_id,
            trace_id=state.trace_id,
        )

    # ==========================================================
    # Fallback
    # ==========================================================

    def _fallback(
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
            model=getattr(
                self.client,
                "model",
                "deepseek-chat",
            ),
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
        )

    # ==========================================================
    # Alarm Definition
    # ==========================================================

    @staticmethod
    def _find_alarm_definition(
        tool_results,
        alarm_code: Any,
    ) -> Dict[str, Any]:

        if not alarm_code:
            return {}

        for result in tool_results:

            if not isinstance(
                result,
                Mapping,
            ):
                continue

            # -------------------------
            # Tool直接返回数据
            # -------------------------

            if (
                str(
                    result.get(
                        "alarm_code"
                    )
                )
                == str(alarm_code)
            ):
                return dict(result)

            # -------------------------
            # 通用ToolResult格式
            #
            # {
            #   success: true,
            #   data: {...}
            # }
            # -------------------------

            data = result.get(
                "data"
            )

            if isinstance(
                data,
                Mapping,
            ):

                if (
                    str(
                        data.get(
                            "alarm_code"
                        )
                    )
                    == str(alarm_code)
                ):
                    return dict(data)

        return {}

    @staticmethod
    def _definition_found(
        definition: Mapping[str, Any],
    ) -> bool:

        if not definition:
            return False

        if (
            definition.get("found")
            is False
        ):
            return False

        name = str(
            definition.get("name")
            or definition.get(
                "description"
            )
            or ""
        ).strip()

        if not name:
            return False

        if name in {
            "未知报警",
            "未知故障",
        }:
            return False

        return True

    # ==========================================================
    # Abnormal Metrics
    # ==========================================================

    @staticmethod
    def _abnormal_metrics_text(
        event: Mapping[str, Any],
    ) -> str:
        """
        把任意异常指标转换成中文文本。

        支持：
        temperature
        vibration
        current
        pressure
        rpm
        lubrication_level
        ...
        """

        metrics = (
            event.get(
                "abnormal_metrics"
            )
            or []
        )

        parts = []

        if isinstance(
            metrics,
            list,
        ):

            for metric in metrics:

                if not isinstance(
                    metric,
                    Mapping,
                ):
                    continue

                name = str(
                    metric.get("label")
                    or
                    metric.get("name")
                    or metric.get(
                        "metric"
                    )
                    or "未知指标"
                )

                value = metric.get(
                    "value"
                )

                unit = str(
                    metric.get("unit")
                    or ""
                )

                threshold = (
                    metric.get(
                        "threshold"
                    )
                )

                if value is None:
                    text = name
                else:
                    text = (
                        f"{name}={value}{unit}"
                    )

                if threshold is not None:
                    text += (
                        f"（阈值={threshold}{unit}）"
                    )

                parts.append(
                    text
                )

        if parts:
            return "，".join(parts)

        # -------------------------
        # 如果AbnormalEvent没有
        # abnormal_metrics，
        # 尝试使用realtime_snapshot
        # -------------------------

        snapshot = (
            event.get(
                "realtime_snapshot"
            )
            or {}
        )

        if isinstance(
            snapshot,
            Mapping,
        ) and snapshot:

            snapshot_parts = []

            for key, value in (
                snapshot.items()
            ):

                snapshot_parts.append(
                    f"{key}={value}"
                )

            if snapshot_parts:
                return "，".join(
                    snapshot_parts
                )

        return "存在设备异常"

    def _result_evidence(self, state: DiagnosisState, event: Mapping[str, Any]) -> List[str]:
        evidence = list(state.evidence)
        for item in self._event_evidence(event):
            if item not in evidence:
                evidence.append(item)
        if state.stop_reason:
            evidence.append("停止原因：%s" % state.stop_reason)
        if state.validation_errors:
            evidence.append("Validator：%s" % "；".join(state.validation_errors))
        return evidence

    # ==========================================================
    # Event Revision
    # ==========================================================

    @staticmethod
    def _event_revision(
        event: Mapping[str, Any],
    ) -> int:

        try:
            return max(
                1,
                int(
                    event.get(
                        "event_revision"
                    )
                    or 1
                ),
            )

        except (
            TypeError,
            ValueError,
        ):
            return 1

    # ==========================================================
    # Confidence
    # ==========================================================

    @staticmethod
    def _confidence(
        value: Any,
    ) -> Optional[float]:

        try:
            number = float(
                value
            )

        except (
            TypeError,
            ValueError,
        ):
            return None

        return max(
            0.0,
            min(
                1.0,
                number,
            ),
        )

    # ==========================================================
    # Datetime
    # ==========================================================

    @staticmethod
    def _parse_datetime(
        value: Any,
    ) -> Optional[datetime]:

        if not value:
            return None

        try:
            return datetime.fromisoformat(
                str(value).replace(
                    "Z",
                    "+00:00",
                )
            )

        except ValueError:
            return None

    @staticmethod
    def _now() -> datetime:
        """统一使用UTC时间。"""

        return datetime.now(
            timezone.utc
        )

    # ==========================================================
    # Severity
    # ==========================================================

    @staticmethod
    def _severity_label(
        value: Any,
    ) -> str:

        mapping = {
            "normal":
            "正常",

            "initial":
            "初级预警",

            "warning":
            "初级预警",

            "intermediate":
            "中级报警",

            "alarm":
            "中级报警",

            "high":
            "高级故障",

            "critical":
            "严重故障",
        }

        return mapping.get(
            str(value).lower(),
            str(value or "未知"),
        )

    # ==========================================================
    # 中文清理
    # ==========================================================

    @classmethod
    def _chinese_text(
        cls,
        text: str,
    ) -> str:

        replacements = {
            "high severity":
            "高级故障等级",

            "intermediate":
            "中级报警",

            "critical":
            "严重故障",

            "warning":
            "初级预警",

            "normal":
            "正常",

            "high":
            "高级故障",

            "overtemperature":
            "温度过高",

            "pressure_low":
            "压力不足",

            "vibration_high":
            "振动过高",

            "fault":
            "故障",
        }

        result = text

        for (
            source,
            target,
        ) in replacements.items():

            result = re.sub(
                r"\b%s\b"
                % re.escape(
                    source
                ),
                target,
                result,
                flags=re.IGNORECASE,
            )

        return result
