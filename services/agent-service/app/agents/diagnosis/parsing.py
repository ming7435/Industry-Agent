"""Diagnosis Agent 的通用解析与格式化工具。"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, Mapping, Optional


def assistant_message(response: Mapping[str, Any]) -> Dict[str, Any]:
    """从 OpenAI-compatible 响应中取出 assistant message。"""

    choices = response.get("choices") or []
    if not choices:
        raise RuntimeError("LLM 没有返回 choices")
    message = choices[0].get("message") or {}
    if not isinstance(message, dict):
        raise RuntimeError("LLM message 格式错误")
    return message


def json_arguments(raw: Any) -> Dict[str, Any]:
    """解析 tool call arguments。"""

    if isinstance(raw, dict):
        return raw
    try:
        result = json.loads(raw or "{}")
    except (TypeError, json.JSONDecodeError):
        return {}
    return result if isinstance(result, dict) else {}


def parse_final_json(text: str) -> Dict[str, Any]:
    """解析模型最终 JSON 输出，兼容 Markdown 代码块。"""

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def confidence(value: Any) -> Optional[float]:
    """把置信度归一化到 0 到 1。"""

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(1.0, number))


def parse_datetime(value: Any) -> Optional[datetime]:
    """解析 ISO 时间。"""

    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def now_utc() -> datetime:
    """统一使用 UTC 时间。"""

    return datetime.now(timezone.utc)


def severity_label(value: Any) -> str:
    """把内部告警等级转换为中文展示文本。"""

    mapping = {
        "normal": "正常",
        "initial": "初级预警",
        "warning": "初级预警",
        "intermediate": "中级报警",
        "alarm": "中级报警",
        "high": "高级故障",
        "critical": "严重故障",
    }
    return mapping.get(str(value).lower(), str(value or "未知"))


def event_revision(event: Mapping[str, Any]) -> int:
    """取事件修订号，最小为 1。"""

    try:
        return max(1, int(event.get("event_revision") or 1))
    except (TypeError, ValueError):
        return 1


def chinese_text(text: str) -> str:
    """清理模型输出中的内部英文枚举。"""

    replacements = {
        "Pointer with value zero is freed: {hex}": "控制器检测到空指针被释放（底层软件指针异常）",
        "Wrong memory pointer is freed: {hex}": "控制器检测到错误内存指针被释放（底层软件内存异常）",
        "The pointer value is 0": "控制器检测到指针值为 0（底层软件指针异常）",
        "An error occurred in controller software.": "控制器软件发生错误。",
        "fault_injection": "故障注入状态",
        "processing": "加工中",
        "emergency_stop": "急停状态",
        "high severity": "高级故障等级",
        "intermediate": "中级报警",
        "critical": "严重故障",
        "warning": "初级预警",
        "normal": "正常",
        "high": "高级故障",
        "overtemperature": "温度过高",
        "pressure_low": "压力不足",
        "vibration_high": "振动过高",
        "fault": "故障",
    }
    result = text
    for source, target in replacements.items():
        result = re.sub(r"\b%s\b" % re.escape(source), target, result, flags=re.IGNORECASE)
    return result
