"""轻量级 Trace 记录器，后续可替换为 OpenTelemetry。"""

from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from typing import Any, Dict, List


class TraceRecorder:
    def __init__(self) -> None:
        self._lock = Lock()
        self._records: List[Dict[str, Any]] = []

    def record(self, **payload: Any) -> Dict[str, Any]:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **payload,
        }
        with self._lock:
            self._records.append(record)
        return record

    def list(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [dict(item) for item in self._records]

    def clear(self) -> None:
        with self._lock:
            self._records.clear()
