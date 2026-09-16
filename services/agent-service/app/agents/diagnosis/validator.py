"""Diagnosis Agent 诊断候选结果校验。"""

from __future__ import annotations

from typing import Any, Dict, List, Mapping

from . import evidence, parsing, tool_policy
from .schemas import DiagnosisState


def _successful_external_evidence(state: DiagnosisState) -> bool:
    """仅把成功的工具/A2A Observation 视为外部证据。"""

    for item in state.observations:
        result = item.get("result") or {}
        if item.get("success") and result.get("found", True) is not False:
            return True
    return False


def _looks_deterministic(text: str) -> bool:
    """识别没有证据时不应直接输出的确定性根因措辞。"""

    normalized = str(text or "").lower()
    markers = (
        "确定是",
        "明确是",
        "根因是",
        "原因就是",
        "确诊为",
        "确定原因",
        "confirmed",
        "root cause is",
    )
    return any(marker in normalized for marker in markers)


def validate_candidate(
    state: DiagnosisState,
    event: Mapping[str, Any],
    parsed: Mapping[str, Any],
    raw_text: str,
) -> Dict[str, Any]:
    """校验模型候选结果是否具备必要证据和字段。"""

    errors: List[str] = []
    if not parsed and not raw_text.strip():
        errors.append("没有诊断候选结果")
    if event.get("alarm_code") and not tool_policy.has_tool_call(state, "get_alarm_definition"):
        errors.append("有 alarm_code 但未查询报警定义")
    if tool_policy.requires_history(event) and not tool_policy.has_tool_call(state, "get_device_history"):
        errors.append("趋势/重复异常缺少历史趋势证据")
    if not state.evidence and not evidence.event_evidence(event):
        errors.append("缺少 Evidence")
    if parsed:
        if not str(parsed.get("summary") or "").strip():
            errors.append("summary 为空")
        if not str(parsed.get("diagnosis") or "").strip():
            errors.append("diagnosis 为空")
        if parsing.confidence(parsed.get("confidence")) is None:
            errors.append("confidence 非法或缺失")
        confidence = parsing.confidence(parsed.get("confidence"))
        diagnosis_text = "%s %s" % (parsed.get("summary") or "", parsed.get("diagnosis") or "")
        if not _successful_external_evidence(state) and (
            (confidence is not None and confidence >= 0.8) or _looks_deterministic(diagnosis_text)
        ):
            errors.append("缺少外部 Evidence，不允许输出确定性根因")
    blocked_tools = {"create_workorder", "close_workorder", "query_inventory", "generate_report", "verify_repair"}
    if any(item.get("name") in blocked_tools and item.get("guard") != "deny" for item in state.tool_calls):
        errors.append("调用了非 Diagnosis 权限工具")
    return {"pass": not errors, "errors": errors, "evidence_count": len(state.evidence)}
