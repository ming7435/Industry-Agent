"""Diagnosis Agent 的 Skill 选择和工具访问策略。"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Mapping

from .schemas import DiagnosisState


def select_skill(event: Mapping[str, Any]) -> Dict[str, Any]:
    """按事件特征组合 Diagnosis 子 Skill，而不是只选择一个分支。"""

    severity = str(event.get("severity") or "").lower()
    trigger_reason = str(event.get("trigger_reason") or event.get("trigger_cause") or "").lower()
    event_type = str(event.get("event_type") or "").lower()
    metrics = event.get("abnormal_metrics") or []
    has_snapshot = bool(event.get("realtime_snapshot"))

    base_tools = ["get_alarm_definition", "get_device_history", "get_device_logs", "search_knowledge"]
    if not has_snapshot:
        base_tools.append("get_device_status")

    skills: List[str] = []
    if event.get("alarm_code"):
        skills.append("alarm_diagnosis_skill")
    if isinstance(metrics, list) and len(metrics) > 1:
        skills.append("multi_metric_diagnosis_skill")
    if requires_history(event):
        skills.append("trend_diagnosis_skill")
    if not skills:
        skills.append("no_alarm_diagnosis_skill")
    if severity == "critical" or "critical" in trigger_reason or "严重" in trigger_reason:
        skills.append("safety_triage_skill")

    return {
        "name": "+".join(skills),
        "skills": skills,
        "allowed_tools": base_tools,
    }


def tool_schemas_for(tools: Any, allowed_tools: List[str]) -> List[Dict[str, Any]]:
    """按白名单过滤 MCP 工具 schema。"""

    allowed = set(allowed_tools or [])
    return [
        schema
        for schema in tools.tool_schemas()
        if (schema.get("function") or {}).get("name") in allowed
    ]


def has_tool_call(state: DiagnosisState, name: str) -> bool:
    """判断当前运行是否已经调用过某个工具。"""

    return any(item.get("name") == name for item in state.tool_calls)


def normalize_tool_arguments(
    name: str,
    arguments: Mapping[str, Any],
    graph_state: Mapping[str, Any],
) -> Dict[str, Any]:
    """根据异常事件上下文补齐工具参数。"""

    result = dict(arguments or {})
    event = graph_state.get("event") or {}
    device_id = graph_state.get("device_id") or event.get("device_id")
    alarm_code = graph_state.get("alarm_code") or event.get("alarm_code")

    if name == "get_alarm_definition" and not result.get("alarm_code"):
        result["alarm_code"] = alarm_code
    if name in {"get_device_history", "get_device_logs", "get_device_status"} and not result.get("device_id"):
        result["device_id"] = device_id
    if name == "get_device_history" and not result.get("metric_keys"):
        result["metric_keys"] = metric_keys_from_event(event)
    if name == "search_knowledge" and not result.get("query"):
        result["query"] = knowledge_query(event)
    return result


def guard_tool_call(name: str, arguments: Mapping[str, Any], state: DiagnosisState) -> Dict[str, Any]:
    """执行工具权限、必填参数和重复调用校验。"""

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


def requires_history(event: Mapping[str, Any]) -> bool:
    """判断事件是否必须补充历史趋势证据。"""

    text = " ".join(str(event.get(key) or "") for key in ("event_type", "trigger_reason", "trigger_cause"))
    rules = " ".join(str(item) for item in (event.get("trigger_rules") or []))
    combined = (text + " " + rules).lower()
    try:
        occurrence_count = int(event.get("occurrence_count") or 0)
    except (TypeError, ValueError):
        occurrence_count = 0
    if event.get("duration_seconds") or occurrence_count > 1:
        return True
    if str(event.get("event_type") or "").lower() in {"multi_metric", "trend", "repeated", "duration", "count"}:
        return True
    return any(token in combined for token in ("trend", "repeat", "repeated", "duration", "count", "趋势", "重复", "持续", "计数"))


def metric_keys_from_event(event: Mapping[str, Any]) -> List[str]:
    """从异常指标推断工厂历史接口 metric key。"""

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


def knowledge_query(event: Mapping[str, Any]) -> str:
    """从异常事件构造知识库检索 query。"""

    parts = [str(event.get("alarm_code") or ""), str(event.get("event_type") or ""), str(event.get("message") or "")]
    for metric in event.get("abnormal_metrics") or []:
        if isinstance(metric, Mapping):
            parts.append(str(metric.get("label") or metric.get("name") or metric.get("key") or ""))
    return " ".join(part for part in parts if part).strip() or "设备异常 诊断 SOP"
