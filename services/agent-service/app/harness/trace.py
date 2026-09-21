"""轻量级 Trace 记录器，后续可替换为 OpenTelemetry。"""

from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from collections import deque
from typing import Any, Dict, List


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
