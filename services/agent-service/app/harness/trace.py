"""轻量级 Trace 记录器，后续可替换为 OpenTelemetry。"""

from __future__ import annotations

from datetime import datetime, timezone
import os
import re
from uuid import uuid4
from collections.abc import Mapping
from threading import Lock
from collections import deque
from typing import Any, Dict, List


_OTEL_LOCK = Lock()
_OTEL_TRACER: Any | None = None
_OTEL_INITIALIZED = False


def _otel_tracer() -> Any | None:
    """仅在明确配置且依赖已安装时创建 OTLP 追踪器。"""

    global _OTEL_INITIALIZED, _OTEL_TRACER
    if _OTEL_INITIALIZED:
        return _OTEL_TRACER
    with _OTEL_LOCK:
        if _OTEL_INITIALIZED:
            return _OTEL_TRACER
        _OTEL_INITIALIZED = True
        endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip()
        enabled = os.getenv("OTEL_ENABLED", "").strip().lower() in {"1", "true", "yes", "on"}
        if not endpoint and not enabled:
            return None
        try:
            from opentelemetry import trace
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
            from opentelemetry.sdk.resources import Resource
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import BatchSpanProcessor

            provider = TracerProvider(resource=Resource.create({
                "service.name": os.getenv("OTEL_SERVICE_NAME", "industry-agent"),
            }))
            provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint or None)))
            trace.set_tracer_provider(provider)
            _OTEL_TRACER = trace.get_tracer("industry-agent.runtime")
        except Exception:
            # 未安装 OTEL 或导出器初始化失败时，TraceRecorder 仍保持完整功能。
            _OTEL_TRACER = None
        return _OTEL_TRACER


def _emit_otel(record: Dict[str, Any]) -> None:
    tracer = _otel_tracer()
    if tracer is None:
        return
    try:
        name = str(record.get("event") or record.get("name") or "trace")
        with tracer.start_as_current_span(name) as span:
            for key in ("type", "name", "task_id", "trace_id", "agent_run_id", "tool_name", "mcp_server", "error"):
                value = record.get(key)
                if value not in (None, "", [], {}):
                    span.set_attribute("industry.%s" % key, str(value)[:512])
            for key in ("latency", "latency_ms", "execution_time", "elapsed_ms"):
                value = record.get(key)
                if isinstance(value, (int, float)):
                    span.set_attribute("industry.%s" % key, float(value))
    except Exception:
        return


class TraceRecorder:
    def __init__(self, maxlen: int = 5000, store=None) -> None:
        self._lock = Lock()
        self._records: deque[Dict[str, Any]] = deque(maxlen=max(1, int(maxlen)))
        self.store = store
        self.storage_error = ''

    def record(self, **payload: Any) -> Dict[str, Any]:
        context = payload.get('context')
        if isinstance(context, Mapping):
            for key in ('agent_run_id', 'tool_call_id', 'step_run_id', 'agent', 'skill', 'step', 'run_type', 'event_id'):
                if key not in payload and key in context:
                    payload[key] = context[key]
        # 稳定身份先保留预算，避免大输入把关联编号挤出日志。
        identities = {key: payload[key] for key in ('task_id','trace_id','agent_run_id','tool_call_id','event_id','type','name','event','agent','skill','step') if key in payload}
        record = safe_trace_value({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            'trace_record_id': uuid4().hex,
            **identities,
            **payload,
        })
        if self.store is not None:
            try:
                self.store.append(record)
                self.storage_error = ''
            except Exception:
                self.storage_error = '轨迹持久化不可用，当前记录仅保留在内存'
                record['storage_warning'] = self.storage_error
        with self._lock:
            self._records.append(record)
        _emit_otel(record)
        return record

    def list(self, trace_id: str | None = None, task_id: str | None = None, limit: int | None = None) -> List[Dict[str, Any]]:
        if limit is not None and int(limit) <= 0:
            return []
        if self.store is not None:
            try:
                records = self.store.list(trace_id=trace_id, task_id=task_id, limit=limit if limit is not None else 5000)
                # 写入失败时保留内存中的真实事件，按稳定事件编号合并而非伪造成功。
                with self._lock:
                    memory = [dict(r) for r in self._records if r.get('storage_warning')]
                    local_order = {r.get('trace_record_id'): index for index, r in enumerate(self._records)}
                ids = {r.get('trace_record_id') for r in records}
                records.extend(r for r in memory if r.get('trace_record_id') not in ids and
                               (trace_id is None or r.get('trace_id') == trace_id) and (task_id is None or r.get('task_id') == task_id))
                return sorted(records, key=lambda r: (r['timestamp'], local_order.get(r.get('trace_record_id'), -1)))[-(limit or 5000):]
            except Exception:
                self.storage_error = '轨迹存储查询不可用，当前仅显示内存记录'
        with self._lock:
            records = [dict(item) for item in self._records]
        if trace_id is not None:
            records = [item for item in records if item.get("trace_id") == trace_id]
        if task_id is not None:
            records = [item for item in records if item.get("task_id") == task_id]
        if limit is not None:
            records = records[-max(0, int(limit)):]
        return records

    def clear(self) -> None:
        with self._lock:
            self._records.clear()

    def list_run_index(self, limit: int = 5000) -> List[Dict[str, Any]]:
        from .runs import run_index_record
        limit = max(0, min(5000, int(limit)))
        if not limit:
            return []
        query = getattr(self.store, 'list_run_index', None)
        if callable(query):
            try:
                records = query(limit=limit)
                with self._lock:
                    memory = [dict(item) for item in self._records if item.get('storage_warning')]
                    order = {item.get('trace_record_id'): index for index, item in enumerate(self._records)}
                ids = {item.get('trace_record_id') for item in records}
                records.extend(item for item in memory if item.get('trace_record_id') not in ids)
                self.storage_error = '轨迹持久化不可用，当前记录仅保留在内存' if memory else ''
                records.sort(key=lambda item: (item.get('timestamp', ''), order.get(item.get('trace_record_id'), -1)))
                return [run_index_record(item) for item in records[-limit:]]
            except Exception:
                self.storage_error = '轨迹存储查询不可用，当前仅显示内存记录'
                with self._lock:
                    return [run_index_record(item) for item in list(self._records)[-limit:]]
        return [run_index_record(item) for item in self.list(limit=limit)]


def safe_trace_value(value: Any) -> Any:
    """日志快照脱敏和限长；保留业务值，明确标记历史排除和截断。"""
    budget = [32000]
    def visit(item, depth=0):
        if hasattr(item, 'model_dump'):
            item = item.model_dump(mode='json')
        if isinstance(item, str):
            clean = re.sub(r'\bsk-[A-Za-z0-9_-]{12,}', '[密钥已隐藏]', item)
            clean = re.sub(r'(?i)(bearer\s+)[^\s"\']+', r'\1[已隐藏]', clean)
            size = min(len(clean), 8192, max(0, budget[0]))
            budget[0] -= size
            return clean[:size] + (f'…[截断，原文 {len(clean)} 字符]' if size < len(clean) else '')
        if item is None or isinstance(item, (bool, int, float)):
            return item
        if depth >= 8 or budget[0] <= 0:
            return '[内容过长，已截断]'
        if isinstance(item, Mapping):
            result = {}
            for key, val in list(item.items())[:80]:
                name = str(key)
                if name in {'_virtual_context', 'virtual_context'}:
                    continue
                if re.search(r'(?i)password|secret|token|api[_-]?key|authorization|cookie', name):
                    result[name] = '[已隐藏]'
                elif name in {'trace', 'step_history', 'completed_steps', 'records'} and isinstance(val, (list, tuple)):
                    result[name] = {'excluded_history_count': len(val)}
                elif name == 'agent' and not isinstance(val, str):
                    result[name] = getattr(val, 'name', type(val).__name__)
                else:
                    result[name] = visit(val, depth + 1)
            return result
        if isinstance(item, (list, tuple)):
            result = [visit(val, depth + 1) for val in item[:60]]
            if len(item) > 60:
                result.append({'truncated_items': len(item) - 60})
            return result
        return visit(str(item), depth + 1)
    return visit(value)
