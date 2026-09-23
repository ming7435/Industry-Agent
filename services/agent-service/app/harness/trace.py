"""轻量级 Trace 记录器，后续可替换为 OpenTelemetry。"""

from __future__ import annotations

from datetime import datetime, timezone
import os
from threading import Lock
from collections import deque
from typing import Any, Dict, List


_OTEL_LOCK = Lock()
_OTEL_TRACER: Any | None = None
_OTEL_INITIALIZED = False


def _otel_tracer() -> Any | None:
    """Create an OTLP tracer only when explicitly configured and installed."""

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
            # TraceRecorder remains fully functional when OTEL is not installed
            # or the exporter cannot be initialized.
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
    def __init__(self, maxlen: int = 5000) -> None:
        self._lock = Lock()
        self._records = deque(maxlen=max(1, int(maxlen)))

    def record(self, **payload: Any) -> Dict[str, Any]:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **payload,
        }
        with self._lock:
            self._records.append(record)
        _emit_otel(record)
        return record

    def list(self, trace_id: str | None = None, task_id: str | None = None, limit: int | None = None) -> List[Dict[str, Any]]:
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
