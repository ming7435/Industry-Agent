"""Build truthful lifecycle run records from the detailed execution trace.

The trace is intentionally event-oriented.  This module adds the presentation
boundary needed by the log workspace without inventing a successful phase:
missing phases remain ``pending`` and an error in an observed phase remains an
error.  A quality inspection is always grouped separately from a fault run.
"""

from __future__ import annotations

from collections import OrderedDict
from datetime import datetime
from typing import Any, Iterable, Mapping


FAULT_PHASES = (
    ("monitor", "监控"),
    ("diagnosis", "诊断"),
    ("maintenance", "维修方案"),
    ("workorder", "工单派发"),
    ("report", "报告中心"),
    ("experience", "经验总结"),
)
QUALITY_PHASES = (("quality", "质检"),)
RAG_PHASES = (("rag", "RAG 问答"),)


def _as_dict(value: Any) -> Mapping[str, Any]:
    return value if isinstance(value, Mapping) else {}


def _timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    text = str(value or "")
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return datetime.min


def _first(record: Mapping[str, Any], keys: Iterable[str]) -> Any:
    """Read stable identity fields from the event envelope and its context."""

    containers = [record]
    for key in ("context", "runtime_context", "execution_context", "state_change"):
        value = record.get(key)
        if isinstance(value, Mapping):
            containers.append(value)
            for nested_key in ("raw", "event", "trigger", "abnormal_event", "payload"):
                nested = value.get(nested_key)
                if isinstance(nested, Mapping):
                    containers.append(nested)
    for container in containers:
        for key in keys:
            value = container.get(key)
            if value not in (None, "") and not isinstance(value, (dict, list)):
                return value
    return ""


def _event_id(record: Mapping[str, Any]) -> str:
    value = _first(record, ("event_id", "source_event_id", "incident_id"))
    text = str(value or "").strip()
    return text if text else ""


def _is_trigger(record: Mapping[str, Any]) -> bool:
    state_change = _as_dict(record.get("state_change"))
    return (
        str(record.get("event") or "").lower() == "goal_parsed"
        and str(state_change.get("source") or "").lower() == "trigger"
    )


def _record_text(record: Mapping[str, Any]) -> str:
    parts = [
        record.get("event"), record.get("type"), record.get("name"),
        record.get("node"), record.get("agent"), record.get("tool"),
        record.get("tool_name"), record.get("step"), record.get("skill"),
    ]
    return " ".join(str(item or "").lower() for item in parts)


def _is_quality(record: Mapping[str, Any]) -> bool:
    text = _record_text(record)
    # 不能因为报告正文包含普通质量字段就判定为质检运行；只有执行
    # 事件封装才能确定运行类型。
    return any(token in text for token in (
        "quality", "质检", "inspect_quality", "quality_check", "part_quality",
    ))


def _is_rag(record: Mapping[str, Any]) -> bool:
    """Identify a standalone knowledge/RAG interaction.

    Knowledge retrieval that belongs to a triggered fault still stays inside
    the fault run; callers decide that precedence while grouping.  This
    predicate only describes the event envelope, never a free-text report
    field, so a maintenance result cannot accidentally create a RAG card.
    """

    text = _record_text(record)
    return any(token in text for token in (
        "rag", "knowledge", "search_knowledge", "knowledge_search",
        "vector_search", "document_search", "retrieval", "检索", "知识问答",
    ))


def _phase_for(record: Mapping[str, Any], quality: bool) -> str | None:
    text = _record_text(record)
    if quality:
        return "quality"
    state_change = _as_dict(record.get("state_change"))
    source = str(state_change.get("source") or "").lower()
    if str(record.get("event") or "").lower() == "goal_parsed" and source == "trigger":
        return "monitor"
    # 知识和 CAD 是诊断阶段的取证步骤，不应额外生成生命周期卡片；
    # 它们会继续显示在诊断阶段的详细 Trace 中。
    if any(token in text for token in ("diagnos", "knowledge", "cad", "alarm_knowledge", "fault_case")):
        return "diagnosis"
    if any(token in text for token in ("maintenance", "repair_plan", "maintenance_plan", "plan_maintenance")):
        return "maintenance"
    if any(token in text for token in ("workorder", "work_order", "dispatch", "assign_workorder")):
        return "workorder"
    if any(token in text for token in ("report", "generate_report")):
        return "report"
    if any(token in text for token in ("experience", "memory", "closure", "summarize_experience", "learn")):
        return "experience"
    return None


def _is_error(record: Mapping[str, Any]) -> bool:
    event = str(record.get("event") or "").lower()
    return bool(record.get("error")) or any(token in event for token in ("error", "failed", "timeout", "exception"))


def _is_complete(record: Mapping[str, Any]) -> bool:
    event = str(record.get("event") or "").lower()
    if event == "goal_parsed" and str(_as_dict(record.get("state_change")).get("source") or "").lower() == "trigger":
        return True
    return (
        event.endswith("_completed")
        or event.endswith("_complete")
        or event.endswith("_end")
        or event in {"tool_called", "tool_completed", "step_completed", "loop_stop", "execution_end"}
    )


def _phase_record(records: list[Mapping[str, Any]], phase_id: str, label: str) -> dict[str, Any]:
    if not records:
        return {"id": phase_id, "label": label, "status": "pending"}
    errors = any(_is_error(item) for item in records)
    completed = any(_is_complete(item) for item in records)
    status = "error" if errors else ("completed" if completed else "running")
    ordered = sorted(records, key=lambda item: _timestamp(item.get("timestamp")))
    return {
        "id": phase_id,
        "label": label,
        "status": status,
        "event_count": len(records),
        "first_event_at": str(ordered[0].get("timestamp") or ""),
        "last_event_at": str(ordered[-1].get("timestamp") or ""),
    }


def _run_status(phases: list[Mapping[str, Any]]) -> str:
    statuses = {str(item.get("status")) for item in phases}
    if "error" in statuses:
        return "error"
    if statuses and statuses == {"completed"}:
        return "completed"
    return "running"


def build_run_records(records: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """Aggregate trace events into user-visible fault, RAG, and quality runs.

    A raw trace also contains implementation-only tool calls (for example a
    technician lookup opened from the workorder page).  Those events remain
    available from the trace endpoint but do not become standalone lifecycle
    records.  This keeps one card equal to one meaningful user operation.
    """

    source_records = [dict(item) for item in records if isinstance(item, Mapping)]
    # 监控事件 ID 通常只出现在第一条目标/上下文事件中。将它传递给
    # 同一 Trace 的其余事件，避免整个生命周期拆成监控卡和 Agent 卡。
    event_ids_by_identity: dict[str, str] = {}
    trigger_by_identity: set[str] = set()
    for item in source_records:
        event_id = _event_id(item)
        for identity in (str(item.get("task_id") or ""), str(item.get("trace_id") or "")):
            if identity and event_id:
                event_ids_by_identity.setdefault(identity, event_id)
            if identity and _is_trigger(item):
                trigger_by_identity.add(identity)

    groups: OrderedDict[str, dict[str, Any]] = OrderedDict()
    for index, item in enumerate(source_records):
        quality = _is_quality(item)
        task_id = str(item.get("task_id") or "")
        trace_id = str(item.get("trace_id") or "")
        quality_identity = str(_first(item, ("quality_check_id", "check_id", "object_id", "target_id")) or "")
        # Trace 是 RAG/质检交互的稳定边界；同一次回答内部的工具 Task
        # 可以合法变化。
        identity = trace_id or task_id or quality_identity or f"event-{index}"
        event_id = _event_id(item) or event_ids_by_identity.get(task_id) or event_ids_by_identity.get(trace_id) or ""
        is_fault = bool(event_id or task_id in trigger_by_identity or trace_id in trigger_by_identity)
        rag = _is_rag(item) and not is_fault
        if quality:
            group_key = f"quality:{identity}"
            run_type = "quality"
        elif is_fault:
            group_key = f"fault:{event_id}" if event_id else f"fault:{identity}"
            run_type = "fault"
        elif rag:
            group_key = f"rag:{identity}"
            run_type = "rag"
        else:
            # 仅用于实现的内部 Task 不生成运行记录。
            continue
        group = groups.setdefault(group_key, {
            "run_type": run_type,
            "run_key": group_key,
            "records": [],
            "trace_ids": [],
            "task_ids": [],
            "event_ids": [],
            "event_id": event_id,
            "device_id": str(_first(item, ("device_id",)) or ""),
            "alarm_code": str(_first(item, ("alarm_code", "alarm")) or ""),
        })
        group["records"].append(item)
        if trace_id and trace_id not in group["trace_ids"]:
            group["trace_ids"].append(trace_id)
        if task_id and task_id not in group["task_ids"]:
            group["task_ids"].append(task_id)
        if event_id and event_id not in group["event_ids"]:
            group["event_ids"].append(event_id)
        if not group["event_id"] and event_id:
            group["event_id"] = event_id
        for field, keys in (("device_id", ("device_id",)), ("alarm_code", ("alarm_code", "alarm"))):
            if not group[field]:
                group[field] = str(_first(item, keys) or "")

    result: list[dict[str, Any]] = []
    for group in groups.values():
        items = sorted(group["records"], key=lambda item: _timestamp(item.get("timestamp")))
        quality = group["run_type"] == "quality"
        phase_defs = QUALITY_PHASES if quality else RAG_PHASES if group["run_type"] == "rag" else FAULT_PHASES
        phases = [
            _phase_record(
                [item for item in items if _phase_for(item, quality) == phase_id or (group["run_type"] == "rag" and _is_rag(item))],
                phase_id,
                label,
            )
            for phase_id, label in phase_defs
        ]
        timestamps = [_timestamp(item.get("timestamp")) for item in items]
        first_at = min(timestamps) if timestamps else datetime.min
        last_at = max(timestamps) if timestamps else datetime.min
        run_id = group["run_key"]
        result.append({
            "run_id": run_id,
            "run_type": group["run_type"],
            "label": "质检运行" if quality else "故障闭环" if group["run_type"] == "fault" else "RAG 问答",
            "status": _run_status(phases),
            "event_id": group["event_id"],
            "event_ids": group["event_ids"],
            "trace_id": group["trace_ids"][0] if group["trace_ids"] else "",
            "trace_ids": group["trace_ids"],
            "task_id": group["task_ids"][0] if group["task_ids"] else "",
            "task_ids": group["task_ids"],
            "device_id": group["device_id"],
            "alarm_code": group["alarm_code"],
            "started_at": "" if first_at == datetime.min else first_at.isoformat(),
            "ended_at": "" if last_at == datetime.min else last_at.isoformat(),
            "event_count": len(items),
            "tool_count": sum(1 for item in items if str(item.get("type") or "").lower() == "tool"),
            "error_count": sum(1 for item in items if _is_error(item)),
            "phases": phases,
        })
    result.sort(key=lambda item: _timestamp(item.get("started_at")), reverse=True)
    return result
