"""Diagnosis Agent 的 DeepSeek + Tool Calling 诊断闭环。"""

from __future__ import annotations

import json
import os
import re
import uuid

from datetime import datetime, timezone
from typing import Any, Dict, Mapping, Optional

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .models import (
    AgentStatus,
    DiagnosisResult,
    DiagnosisState,
)

from app.mcp.registry import LocalMcpToolRegistry


def _load_project_env() -> None:
    """读取项目根目录 .env，不覆盖已经存在的环境变量。"""

    project_root = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "..",
            "..",
            "..",
        )
    )

    env_path = os.path.join(project_root, ".env")

    if not os.path.isfile(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as stream:
        for raw_line in stream:
            line = raw_line.strip()

            if not line:
                continue

            if line.startswith("#"):
                continue

            if "=" not in line:
                continue

            key, value = line.split("=", 1)

            os.environ.setdefault(
                key.strip(),
                value.strip().strip('"').strip("'"),
            )


class DeepSeekClient:
    """
    DeepSeek OpenAI Compatible API Client。

    当前只依赖 Python 标准库。
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
    ) -> None:

        _load_project_env()

        self.api_key = (
            api_key
            or os.getenv("DEEPSEEK_API_KEY", "").strip()
        )

        self.base_url = os.getenv(
            "DEEPSEEK_BASE_URL",
            "https://api.deepseek.com",
        ).rstrip("/")

        self.model = os.getenv(
            "DEEPSEEK_MODEL",
            "deepseek-chat",
        )

        self.timeout = float(
            os.getenv(
                "DEEPSEEK_TIMEOUT_SECONDS",
                "30",
            )
        )

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def chat(
        self,
        messages,
        tools=None,
        tool_choice=None,
    ) -> Dict[str, Any]:

        if not self.available:
            raise RuntimeError(
                "未配置 DEEPSEEK_API_KEY"
            )

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
        }

        if tools:
            payload["tools"] = tools

        if tool_choice is not None:
            payload["tool_choice"] = tool_choice

        request = Request(
            self.base_url + "/chat/completions",
            data=json.dumps(
                payload,
                ensure_ascii=False,
            ).encode("utf-8"),
            method="POST",
            headers={
                "Authorization": (
                    "Bearer " + self.api_key
                ),
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )

        try:
            with urlopen(
                request,
                timeout=self.timeout,
            ) as response:

                body = (
                    response
                    .read()
                    .decode("utf-8")
                )

        except (
            HTTPError,
            URLError,
            TimeoutError,
        ) as error:

            raise RuntimeError(
                "DeepSeek 请求失败：%s" % error
            ) from error

        try:
            result = json.loads(body)

        except json.JSONDecodeError as error:

            raise RuntimeError(
                "DeepSeek 返回内容不是有效 JSON"
            ) from error

        if not isinstance(result, dict):
            raise RuntimeError(
                "DeepSeek 返回格式错误"
            )

        return result


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

            # =========================
            # DeepSeek不可用
            # =========================

            if not getattr(
                self.client,
                "available",
                True,
            ):

                return self._fallback(
                    state=state,
                    event_id=event_id,
                    device_id=device_id,
                    alarm_code=alarm_code,
                    error="未配置 DeepSeek 密钥",
                    task_id=task_id,
                    triggered_at=triggered_at,
                    diagnosis_run_id=diagnosis_run_id,
                )

            # =========================
            # 初始化Messages
            # =========================

            messages = self._messages(
                event
            )

            # Agent State保存上下文
            state.messages.extend(
                messages
            )

            # =========================
            # MCP Tool Schema
            # =========================

            tool_schemas = (
                self.tools.tool_schemas()
            )

            # =========================
            # 第一次模型调用
            #
            # 如果有alarm_code
            # 强制先查报警定义
            # =========================

            response = self.client.chat(
                messages,
                tools=tool_schemas,
                tool_choice=(
                    {
                        "type": "function",
                        "function": {
                            "name":
                            "get_alarm_definition"
                        },
                    }
                    if alarm_code
                    else "auto"
                ),
            )

            # ==================================================
            # Agent Loop
            # ==================================================

            while (
                state.step_count
                < state.max_steps
            ):

                state.step_count += 1

                # -------------------------
                # DeepSeek Assistant Message
                # -------------------------

                assistant = (
                    self._assistant_message(
                        response
                    )
                )

                assistant = dict(
                    assistant
                )

                state.messages.append(
                    assistant
                )

                # -------------------------
                # DeepSeek返回Tool Calls
                # -------------------------

                calls = (
                    assistant.get(
                        "tool_calls"
                    )
                    or []
                )

                # -------------------------------------------------
                # 安全兜底：
                #
                # 理论上有 alarm_code 时，
                # tool_choice 已经强制 get_alarm_definition。
                #
                # 如果模型仍未返回 Tool Call，
                # 手动构造一次。
                # -------------------------------------------------

                if (
                    not calls
                    and alarm_code
                    and not state.tool_results
                ):

                    calls = [
                        {
                            "id":
                            "forced_get_alarm_definition",

                            "type":
                            "function",

                            "function": {
                                "name":
                                "get_alarm_definition",

                                "arguments":
                                json.dumps(
                                    {
                                        "alarm_code":
                                        alarm_code
                                    },
                                    ensure_ascii=False,
                                ),
                            },
                        }
                    ]

                    # 保证后续 Tool Message
                    # 与 Assistant Tool Call 对应
                    assistant["tool_calls"] = calls

                # ==============================================
                # 没有Tool Call
                # → Agent认为信息足够
                # → 输出最终诊断
                # ==============================================

                if not calls:

                    final_text = str(
                        assistant.get(
                            "content"
                        )
                        or ""
                    )

                    return self._result_from_model(
                        state=state,
                        event_id=event_id,
                        device_id=device_id,
                        alarm_code=alarm_code,
                        parsed=self._parse_json(
                            final_text
                        ),
                        raw_text=final_text,
                        task_id=task_id,
                        triggered_at=triggered_at,
                        diagnosis_run_id=diagnosis_run_id,
                    )

                # ==============================================
                # Tool Calling
                # ==============================================

                tool_messages = []

                for call in calls:

                    function = (
                        call.get("function")
                        or {}
                    )

                    name = (
                        function.get("name")
                        or ""
                    )

                    arguments = (
                        self._json_arguments(
                            function.get(
                                "arguments"
                            )
                        )
                    )

                    # -------------------------
                    # 参数补全
                    # -------------------------

                    if (
                        name
                        == "get_alarm_definition"
                        and not arguments.get(
                            "alarm_code"
                        )
                    ):

                        arguments = {
                            "alarm_code":
                            alarm_code
                        }

                    if (
                        name
                        == "get_device_history"
                        and not arguments.get(
                            "device_id"
                        )
                    ):

                        arguments[
                            "device_id"
                        ] = device_id

                    # -------------------------
                    # 真正执行 Tool
                    # -------------------------

                    result = (
                        self.tools.execute(
                            name,
                            arguments,
                        )
                    )

                    # -------------------------
                    # Tool Call Trace
                    # -------------------------

                    call_record = {
                        "step":
                        state.step_count,

                        "name":
                        name,

                        "arguments":
                        arguments,

                        "result":
                        result,
                    }

                    state.tool_calls.append(
                        call_record
                    )

                    state.tool_results.append(
                        result
                    )

                    # -------------------------
                    # Observation
                    # -------------------------

                    observation = {
                        "step":
                        state.step_count,

                        "tool":
                        name,

                        "arguments":
                        arguments,

                        "result":
                        result,
                    }

                    state.observations.append(
                        observation
                    )

                    # -------------------------
                    # 返回给DeepSeek的Tool Message
                    # -------------------------

                    tool_message = {
                        "role":
                        "tool",

                        "tool_call_id":
                        call.get("id")
                        or "tool_call",

                        "name":
                        name,

                        "content":
                        json.dumps(
                            result,
                            ensure_ascii=False,
                        ),
                    }

                    tool_messages.append(
                        tool_message
                    )

                    state.messages.append(
                        tool_message
                    )

                # ==============================================
                # Tool完成
                #
                # 下一轮让DeepSeek判断：
                #
                # 信息够不够？
                #
                # 需要继续 get_device_history？
                #
                # 还是直接诊断？
                # ==============================================

                state.next_action = (
                    "判断是否需要更多诊断依据"
                )

                messages = (
                    messages
                    + [assistant]
                    + tool_messages
                )

                response = (
                    self.client.chat(
                        messages,
                        tools=tool_schemas,
                    )
                )

            # ==================================================
            # 达到 max_steps
            # ==================================================

            raise RuntimeError(
                "诊断工具调用超过最大轮次："
                + str(state.max_steps)
            )

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

                    "所有结论必须基于 AbnormalEvent "
                    "和 Tool Result，"
                    "不要编造不存在的设备事实。"

                    "如果证据不足以确定具体根因，"
                    "必须明确说明需要进一步检查，"
                    "不要给出确定性根因。"

                    "工具结果返回后再进行诊断。"

                    "最终必须返回 JSON，字段为："
                    "summary、diagnosis、confidence、next_action。"

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