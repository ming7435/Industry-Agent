"""根据详细执行轨迹构建如实反映生命周期的运行记录。

轨迹以事件为中心。本模块为日志工作区提供展示边界：缺失的阶段仍为
``pending``，阶段状态与错误取自当前 Runtime 执行和负责人的当前尝试。
质检运行始终与故障运行分别归组。
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

# 索引仅保留归组、状态判定所需值；输入、工具返回正文按 Trace 单独读取。
_IDENTITY_FIELDS = ('event_id', 'source_event_id', 'incident_id', 'device_id', 'alarm_code', 'alarm',
                    'run_type', 'quality_check_id', 'check_id', 'object_id', 'target_id')
_IDENTITY_SHAPE = dict.fromkeys(_IDENTITY_FIELDS)
_CONTEXT_SHAPE = {**_IDENTITY_SHAPE, **dict.fromkeys(('agent',)),
                  **{key: _IDENTITY_SHAPE for key in ('raw', 'event', 'trigger', 'abnormal_event', 'payload')}}
RUN_INDEX_SHAPE = {
    **dict.fromkeys(('timestamp', 'trace_record_id', 'type', 'name', 'node', 'agent', 'event',
                     'task_id', 'trace_id', 'agent_run_id', 'tool_name', 'tool', 'step', 'skill', 'error', 'allowed')),
    **_IDENTITY_SHAPE,
    **{key: _CONTEXT_SHAPE for key in ('context', 'runtime_context', 'execution_context')},
    'state_change': {**_CONTEXT_SHAPE, **dict.fromkeys(('source', 'status', 'stop_reason'))},
    'output': {**dict.fromkeys(('status', 'result', 'success')),
               'quality_check': dict.fromkeys(('status', 'result', 'success'))},
}


def run_index_record(record: Mapping[str, Any]) -> dict[str, Any]:
    def project(value, shape):
        source = _as_dict(value)
        result = {}
        for key, nested in shape.items():
            item = source.get(key)
            if isinstance(nested, dict):
                child = project(item, nested)
                if child:
                    result[key] = child
            elif item is not None and not isinstance(item, (dict, list)):
                result[key] = item
        return result
    return project(record, RUN_INDEX_SHAPE)


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
    """从事件封装及其上下文读取稳定的身份字段。"""

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
    run_type = str(_first(record, ('run_type',)) or '').lower()
    if run_type:
        return run_type == 'quality'
    # 报告取材并不是一次质检执行，不能因读取质检记录改变整个故障归组。
    if (record.get('tool_name') or record.get('tool') or record.get('name')) == 'get_quality_record':
        return False
    text = _record_text(record)
    # 不能因为报告正文包含普通质量字段就判定为质检运行；只有执行
    # 事件封装才能确定运行类型。
    return any(token in text for token in (
        "quality", "质检", "inspect_quality", "quality_check", "part_quality",
    ))


def _is_rag(record: Mapping[str, Any]) -> bool:
    """识别独立的知识/RAG 交互。

    属于已触发故障处理的知识检索仍保留在故障运行中；归组时由调用方
    决定此优先级。该判断只检查事件封装，不检查报告自由文本，
    因此维修结果不会意外生成 RAG 卡片。
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
    agent = str(record.get('agent') or (record.get('name') if record.get('type') == 'agent' else '') or '').lower()
    agent_phase = {'report':'report','memory':'experience','maintenance':'maintenance','workorder':'workorder',
                   'diagnosis':'diagnosis','knowledge':'diagnosis','cad':'diagnosis'}
    if agent in agent_phase:
        return agent_phase[agent]
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
    return event in {'agent_completed', 'node_completed', 'node_complete', 'node_end'}


def _same_execution(record: Mapping[str, Any], boundary: Mapping[str, Any]) -> bool:
    for key in ('trace_id', 'task_id'):
        if boundary.get(key) and record.get(key):
            return record[key] == boundary[key]
    return not (boundary.get('trace_id') or boundary.get('task_id'))


def _is_runtime_boundary(record: Mapping[str, Any]) -> bool:
    return record.get('event') in {'loop_start', 'loop_stop'} \
        and str(record.get('agent') or 'runtime') == 'runtime' \
        and str(record.get('node') or record.get('name') or 'runtime') == 'runtime'


def _current_runtime_records(records: list[Mapping[str, Any]]) -> list[Mapping[str, Any]]:
    start = next((index for index in range(len(records) - 1, -1, -1)
                  if records[index].get('event') == 'loop_start' and _is_runtime_boundary(records[index])), None)
    if start is None:
        return records
    return [item for item in records[start:] if _same_execution(item, records[start])]


def _rag_owner(records: list[Mapping[str, Any]]) -> str:
    # 独立检索可以由 Memory 或 Knowledge 发起；根调用先于它的子调用。
    # A2A 边界也能保留负责人，兼容截断后缺少 Agent 开始事件的轨迹。
    agents = {'memory', 'knowledge'}
    for item in records:
        event = str(item.get('event') or '')
        if event == 'a2a_started':
            caller, separator, callee = str(item.get('name') or '').partition('->')
            if separator:
                if caller in agents:
                    return caller
                if callee in agents:
                    return callee
        if event in {'agent_started', 'node_started'}:
            agent = (item.get('node') or item.get('agent') or item.get('name')) \
                if event == 'node_started' else (item.get('agent') or item.get('name'))
            if agent in agents:
                return str(agent)
    # 旧 Knowledge 轨迹可能只有完成事件，没有开始事件。
    return next((str(item.get('agent') or item.get('name')) for item in records
                 if item.get('event') == 'agent_completed'
                 and (item.get('agent') or item.get('name')) in agents), 'knowledge')


def _phase_record(records: list[Mapping[str, Any]], phase_id: str, label: str) -> dict[str, Any]:
    if not records:
        return {"id": phase_id, "label": label, "status": "pending"}
    ordered = sorted(records, key=lambda item: _timestamp(item.get("timestamp")))
    owner = {'diagnosis': 'diagnosis', 'maintenance': 'maintenance', 'workorder': 'workorder',
             'report': 'report', 'experience': 'memory', 'quality': 'quality', 'rag': 'knowledge'}.get(phase_id)
    if phase_id == 'rag':
        owner = _rag_owner(ordered)
    completed_events = {'agent_completed', 'node_completed', 'node_complete', 'node_end'}
    lifecycle_events = completed_events | {'agent_started', 'agent_error', 'agent_failed', 'agent_timeout',
                                           'node_started', 'node_error', 'node_failed', 'node_timeout'}
    def owns(item):
        identity = (item.get('node') or item.get('agent') or item.get('name')) \
            if str(item.get('event') or '').startswith('node_') else (item.get('agent') or item.get('name'))
        return identity == owner
    owned = [item for item in ordered if item.get('event') in lifecycle_events and owns(item)]
    active = ordered
    if owned:
        # 重试以负责人最近一次开始事件为边界，不继承旧尝试的结果或错误。
        start = next((index for index in range(len(ordered) - 1, -1, -1)
                      if ordered[index].get('event') in {'agent_started', 'node_started'} and owns(ordered[index])), None)
        if start is not None:
            boundary = ordered[start]
            active = [item for item in ordered[start:] if _same_execution(item, boundary)]
            attempt = str(boundary.get('agent_run_id') or '')
            if attempt:
                active = [item for item in active if not owns(item) or not item.get('agent_run_id')
                          or str(item.get('agent_run_id')) == attempt]
    lifecycle = [item for item in active if item.get('event') in lifecycle_events
                 and owns(item)]
    # 子 Agent 的终态不结束阶段；业务状态读取当前负责人的真实结果。
    last_output = next((_as_dict(item.get('output')) for item in reversed(lifecycle)
                        if item.get('event') == 'agent_completed'), {})
    if not last_output:
        last_output = next((_as_dict(item.get('output')) for item in reversed(lifecycle)
                            if item.get('event') in completed_events and _as_dict(item.get('output'))), {})
    if phase_id == 'quality':
        last_output = _as_dict(last_output.get('quality_check')) or last_output
    business_status = str(last_output.get('status') or '').lower()
    blocked = business_status in {'blocked','pending_approval','review','not_tested','insufficient_data','incomplete'}
    if phase_id == 'quality' and business_status not in {'released', 'closed'}:
        blocked = blocked or str(last_output.get('result') or '').lower() in {'review', 'not_tested', 'insufficient_data'}
    errors = any(_is_error(item) for item in active) or business_status in {'error', 'failed', 'timeout'}
    completed = lifecycle[-1].get('event') in completed_events if lifecycle else (not owner and any(_is_complete(item) for item in active))
    if lifecycle and lifecycle[-1].get('event') in {'agent_started', 'node_started'} and not errors:
        blocked = False
    status = "blocked" if blocked else "error" if errors or last_output.get('success') is False else ("completed" if completed else "running")
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
    if 'blocked' in statuses:
        return 'blocked'
    if statuses and statuses == {"completed"}:
        return "completed"
    return "running"


def _runtime_terminal(records: list[Mapping[str, Any]]) -> tuple[str, str]:
    # 同一故障重新运行时，新 loop_start 会撤销旧终态；内部步骤结束不是 Runtime 终态。
    lifecycle = [item for item in _current_runtime_records(records) if _is_runtime_boundary(item)]
    if not lifecycle or lifecycle[-1].get('event') != 'loop_stop':
        return '', ''
    state = _as_dict(lifecycle[-1].get('state_change'))
    status = str(state.get('status') or '')
    return (status, str(state.get('stop_reason') or '')) if status in {'blocked', 'error', 'failed', 'timeout'} else ('', '')


def _execution_identity(record: Mapping[str, Any]) -> tuple[str, str] | None:
    # Trace 是一次执行的边界；有 Trace 时不能通过复用的 Task 串联其他执行。
    for key in ('trace_id', 'task_id'):
        value = str(record.get(key) or '')
        if value:
            return key, value
    return None


def build_run_records(records: Iterable[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """将轨迹事件聚合为用户可见的故障、RAG 和质检运行。

    原始轨迹还包含仅供实现使用的工具调用（例如从工单页面发起的技术人员查询）。
    这些事件仍可通过轨迹接口查看，但不会成为独立的生命周期记录，
    从而确保每张卡片对应一次有意义的用户操作。
    """

    source_records = [dict(item) for item in records if isinstance(item, Mapping)]
    # 监控事件 ID 通常只出现在第一条目标/上下文事件中。将它传递给
    # 同一 Trace 的其余事件，避免整个生命周期拆成监控卡和 Agent 卡。
    event_ids_by_identity: dict[tuple[str, str], str] = {}
    trigger_by_identity: set[tuple[str, str]] = set()
    quality_by_identity: set[tuple[str, str]] = set()
    rag_by_identity: set[tuple[str, str]] = set()
    for item in source_records:
        event_id = _event_id(item)
        execution_identity = _execution_identity(item)
        if execution_identity:
            if event_id:
                event_ids_by_identity.setdefault(execution_identity, event_id)
            if _is_trigger(item):
                trigger_by_identity.add(execution_identity)
            if _is_quality(item):
                quality_by_identity.add(execution_identity)
            if _is_rag(item):
                rag_by_identity.add(execution_identity)

    groups: OrderedDict[str, dict[str, Any]] = OrderedDict()
    for index, item in enumerate(source_records):
        task_id = str(item.get("task_id") or "")
        trace_id = str(item.get("trace_id") or "")
        execution_identity = _execution_identity(item)
        quality = _is_quality(item) or execution_identity in quality_by_identity
        quality_identity = str(_first(item, ("quality_check_id", "check_id", "object_id", "target_id")) or "")
        # Trace 是 RAG/质检交互的稳定边界；同一次回答内部的工具 Task
        # 可以合法变化。
        identity = trace_id or task_id or quality_identity or f"event-{index}"
        event_id = _event_id(item) or event_ids_by_identity.get(execution_identity) or ""
        is_fault = bool(event_id or execution_identity in trigger_by_identity)
        rag = _is_rag(item) or execution_identity in rag_by_identity
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
        current_items = _current_runtime_records(items)
        quality = group["run_type"] == "quality"
        phase_defs = QUALITY_PHASES if quality else RAG_PHASES if group["run_type"] == "rag" else FAULT_PHASES
        phases = [
            _phase_record(
                [item for item in (items if phase_id == 'monitor' else current_items)
                 if group["run_type"] == "rag" or _phase_for(item, quality) == phase_id],
                phase_id,
                label,
            )
            for phase_id, label in phase_defs
        ]
        timestamps = [_timestamp(item.get("timestamp")) for item in items]
        first_at = min(timestamps) if timestamps else datetime.min
        last_at = max(timestamps) if timestamps else datetime.min
        run_id = group["run_key"]
        terminal_status, stop_reason = _runtime_terminal(items)
        result.append({
            "run_id": run_id,
            "run_type": group["run_type"],
            "label": "质检运行" if quality else "故障闭环" if group["run_type"] == "fault" else "RAG 问答",
            "status": ('error' if terminal_status in {'failed', 'timeout'} else terminal_status) or _run_status(phases),
            "stop_reason": stop_reason,
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
