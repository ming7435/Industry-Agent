"""Small event-result idempotency boundary for Agent Service event requests."""

from __future__ import annotations

from collections import OrderedDict
from threading import Lock
from typing import Any, Callable, Dict


class EventResultStore:
    """Cache the first result for each non-empty event id.

    The storage is intentionally in-process for this P0 change.  The interface
    is isolated so it can later be backed by a durable repository without
    changing the HTTP handler or orchestrator contract.
    """

    def __init__(self, max_items: int = 1000) -> None:
        self.max_items = max(1, int(max_items))
        self._results: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = Lock()

    def get_or_create(self, event_id: str, producer: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
        key = str(event_id or "").strip()
        if not key:
            return dict(producer() or {})
        with self._lock:
            cached = self._results.get(key)
            if cached is not None:
                self._results.move_to_end(key)
                return dict(cached)
            result = dict(producer() or {})
            self._results[key] = dict(result)
            self._results.move_to_end(key)
            while len(self._results) > self.max_items:
                self._results.popitem(last=False)
            return dict(result)

