"""Agent Service 事件请求的小型结果幂等边界。"""

from __future__ import annotations

from collections import OrderedDict
from threading import Lock
from typing import Any, Callable, Dict
import os

from .durable_store import DurableJsonStore
from app.config.settings import allow_degraded_storage


class EventResultStore:
    """缓存每个非空事件 ID 对应的首次处理结果。

    存储接口独立于 HTTP 处理器和编排器契约，可按配置使用进程内缓存
    或持久化存储。
    """

    def __init__(self, max_items: int = 1000, path: str | None = None) -> None:
        self.max_items = max(1, int(max_items))
        self._results: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = Lock()
        configured_path = str(path or os.getenv("EVENT_STORE_PATH", "")).strip()
        if not configured_path and not allow_degraded_storage():
            raise RuntimeError("生产模式要求配置 EVENT_STORE_PATH")
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
                result = self._durable.get_or_create("agent_event", key, producer)
            else:
                result = dict(producer() or {})
            self._results[key] = dict(result)
            self._results.move_to_end(key)
            while len(self._results) > self.max_items:
                self._results.popitem(last=False)
            return dict(result)
