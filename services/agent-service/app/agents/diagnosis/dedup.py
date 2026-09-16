"""Diagnosis Agent 运行去重和幂等缓存。"""

from __future__ import annotations

from copy import deepcopy
from threading import Lock
from typing import Any, Dict, Tuple


class DiagnosisRunCache:
    """按 event_id + event_revision 缓存一次诊断结果。

    同一事件版本重复投递时直接返回已有结果；事件版本升级会自然使用新的缓存键重新运行。
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._results: Dict[Tuple[str, int], Any] = {}

    @staticmethod
    def key(event: Dict[str, Any]) -> Tuple[str, int]:
        event_id = str(event.get("event_id") or event.get("key") or "event:unknown")
        try:
            revision = max(1, int(event.get("event_revision") or 1))
        except (TypeError, ValueError):
            revision = 1
        return event_id, revision

    def get(self, event: Dict[str, Any]) -> Any | None:
        with self._lock:
            result = self._results.get(self.key(event))
            return deepcopy(result) if result is not None else None

    def put(self, event: Dict[str, Any], result: Any) -> None:
        with self._lock:
            self._results[self.key(event)] = deepcopy(result)

    def clear(self) -> None:
        with self._lock:
            self._results.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._results)
