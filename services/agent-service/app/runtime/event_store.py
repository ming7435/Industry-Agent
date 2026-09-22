"""Small event-result idempotency boundary for Agent Service event requests."""

from __future__ import annotations

from collections import OrderedDict
from threading import Lock
from typing import Any, Callable, Dict
import os

from .durable_store import DurableJsonStore


class EventResultStore:
    """Cache the first result for each non-empty event id.

    The storage is intentionally in-process for this P0 change.  The interface
    is isolated so it can later be backed by a durable repository without
    changing the HTTP handler or orchestrator contract.
    """

    def __init__(self, max_items: int = 1000, path: str | None = None) -> None:
        self.max_items = max(1, int(max_items))
        self._results: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = Lock()
        configured_path = str(path or os.getenv("EVENT_STORE_PATH", "")).strip()
        self._durable = DurableJsonStore(configured_path) if configured_path else None

    def get_or_create(self, event_id: str, producer: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
        key = str(event_id or "").strip()
        if not key:
            return dict(producer() or {})
        with self._lock:
            cached = self._results.get(key)
            if cached is not None:
                self._results.move_to_end(key)
                return dict(cached)
            if self._durable is not None:
                durable = self._durable.get("agent_event", key)
                if durable is not None:
                    self._results[key] = dict(durable)
                    return dict(durable)
            result = dict(producer() or {})
            self._results[key] = dict(result)
            if self._durable is not None:
                self._durable.set("agent_event", key, result)
            self._results.move_to_end(key)
            while len(self._results) > self.max_items:
                self._results.popitem(last=False)
            return dict(result)
