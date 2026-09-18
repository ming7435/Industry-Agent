"""Diagnosis Agent 的 Observation 与证据整理。"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List, Mapping

from .schemas import DiagnosisState


def observation_hash(observations: List[Mapping[str, Any]]) -> str:
    """生成 Observation 指纹，用于检测重复取证。"""

    if not observations:
        return ""
    payload = json.dumps(observations, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def observation_from_tool(name: str, arguments: Mapping[str, Any], result: Mapping[str, Any], step: int) -> Dict[str, Any]:
    """把工具返回封装为可追踪 Observation。"""

    return {
        "step": step,
        "tool": name,
        "arguments": dict(arguments),
        "success": bool(result.get("success", result.get("error") in (None, ""))),
        "found": bool(result.get("found", True)),
        "source": result.get("source", ""),
        "result": dict(result),
    }


def evidence_from_observation(observation: Mapping[str, Any]) -> List[str]:
    """把 Observation 提炼为中文证据句。"""

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
    if tool in {
        "search_knowledge",
        "search_alarm_knowledge",
        "search_sop",
        "search_manual",
        "search_fault_cases",
        "search_semantic_memory",
    }:
        docs = result.get("documents") or []
        return ["知识库证据：%s" % "；".join(str(item.get("title")) for item in docs[:3] if isinstance(item, Mapping))]
    if tool == "get_device_status":
        return ["设备状态：%s，模式=%s，健康度=%s" % (result.get("status"), result.get("mode"), result.get("health_score"))]
    return []


def evidence_records_from_observation(observation: Mapping[str, Any]) -> List[Dict[str, Any]]:
    """将 Observation 转为可供后续 RAG/报告复用的结构化证据。"""

    result = observation.get("result") or {}
    records: List[Dict[str, Any]] = []
    for content in evidence_from_observation(observation):
        records.append({
            "source": str(observation.get("source") or observation.get("tool") or "diagnosis_observation"),
            "tool": str(observation.get("tool") or ""),
            "step": observation.get("step", 0),
            "content": content,
            "result": dict(result) if isinstance(result, Mapping) else result,
        })
    return records


def event_evidence(event: Mapping[str, Any]) -> List[str]:
    """从 AbnormalEvent 本身提取证据。"""

    evidence = []
    metrics = abnormal_metrics_text(event)
    if metrics != "存在设备异常":
        evidence.append("异常事件指标：%s" % metrics)
    if event.get("realtime_snapshot"):
        evidence.append("Monitor 已提供实时快照")
    return evidence


def abnormal_metrics_text(event: Mapping[str, Any]) -> str:
    """把任意异常指标转换成中文文本。"""

    metrics = event.get("abnormal_metrics") or []
    parts = []
    if isinstance(metrics, list):
        for metric in metrics:
            if not isinstance(metric, Mapping):
                continue
            name = str(metric.get("label") or metric.get("name") or metric.get("metric") or "未知指标")
            value = metric.get("value")
            unit = str(metric.get("unit") or "")
            threshold = metric.get("threshold")
            text = name if value is None else f"{name}={value}{unit}"
            if threshold is not None:
                text += f"（阈值={threshold}{unit}）"
            parts.append(text)
    if parts:
        return "，".join(parts)

    snapshot = event.get("realtime_snapshot") or {}
    if isinstance(snapshot, Mapping) and snapshot:
        snapshot_parts = [f"{key}={value}" for key, value in snapshot.items()]
        if snapshot_parts:
            return "，".join(snapshot_parts)
    return "存在设备异常"


def result_evidence(state: DiagnosisState, event: Mapping[str, Any]) -> List[str]:
    """合并工具证据、事件证据和运行状态证据。"""

    evidence = list(state.evidence)
    for item in event_evidence(event):
        if item not in evidence:
            evidence.append(item)
    if state.stop_reason:
        evidence.append("停止原因：%s" % state.stop_reason)
    if state.validation_errors:
        evidence.append("Validator：%s" % "；".join(state.validation_errors))
    return evidence


def find_alarm_definition(tool_results, alarm_code: Any) -> Dict[str, Any]:
    """从工具返回里查找匹配的报警定义。"""

    if not alarm_code:
        return {}
    for result in tool_results:
        if not isinstance(result, Mapping):
            continue
        if str(result.get("alarm_code")) == str(alarm_code):
            return dict(result)
        data = result.get("data")
        if isinstance(data, Mapping) and str(data.get("alarm_code")) == str(alarm_code):
            return dict(data)
    return {}


def definition_found(definition: Mapping[str, Any]) -> bool:
    """判断报警定义是否有效命中。"""

    if not definition or definition.get("found") is False:
        return False
    name = str(definition.get("name") or definition.get("description") or "").strip()
    return bool(name and name not in {"未知报警", "未知故障"})
