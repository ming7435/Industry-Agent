"""Agent Service 事件请求的小型结果幂等边界。"""

from __future__ import annotations

from collections import OrderedDict
from threading import Lock
from typing import Any, Callable, Dict
import os

from .durable_store import DurableJsonStore
from app.config.settings import allow_degraded_storage


class EventResultConflict(ValueError):
    """同一事件修订携带了不同的业务数据。"""


class EventResultStore:
    """缓存每个非空事件 ID 对应的首次处理结果。

    存储接口独立于 HTTP 处理器和编排器契约，可按配置使用进程内缓存
    或持久化存储。
    """

    def __init__(self, max_items: int = 1000, path: str | None = None) -> None:
        self.max_items = max(1, int(max_items))
        self._results: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._lock = Lock()
        self._key_locks: dict[str, tuple[Lock, int]] = {}
        configured_path = str(path or os.getenv("EVENT_STORE_PATH", "")).strip()
        if not configured_path and not allow_degraded_storage():
            raise RuntimeError("生产模式要求配置 EVENT_STORE_PATH")
        self._durable = DurableJsonStore(configured_path) if configured_path else None

    def has_unmigrated_legacy_result(self, event_id: str, scoped_key: str) -> bool:
        """旧版仅按事件 ID 保存的结果不能被新作用域静默重放。"""

        with self._lock:
            legacy = event_id in self._results
            scoped = scoped_key in self._results
        if self._durable is not None:
            legacy = legacy or self._durable.get("agent_event", event_id) is not None
            scoped = scoped or self._durable.get("agent_event", scoped_key) is not None
        return legacy and not scoped

    def get_or_create(self, event_id: str, producer: Callable[[], Dict[str, Any]], *, fingerprint: str = "") -> Dict[str, Any]:
        key = str(event_id or "").strip()
        if not key:
            return dict(producer() or {})

        def unwrap(stored: Dict[str, Any]) -> Dict[str, Any]:
            if not fingerprint:
                return dict(stored)
            if stored.get("_event_result_store_version") != 2 or stored.get("fingerprint") != fingerprint:
                raise EventResultConflict("相同事件修订的请求参数不一致")
            return dict(stored.get("result") or {})

        def produce() -> Dict[str, Any]:
            result = dict(producer() or {})
            return {"_event_result_store_version": 2, "fingerprint": fingerprint, "result": result} if fingerprint else result

        with self._lock:
            key_lock, references = self._key_locks.get(key, (Lock(), 0))
            self._key_locks[key] = (key_lock, references + 1)
        try:
            with key_lock:
                with self._lock:
                    cached = self._results.get(key)
                    if cached is not None:
                        self._results.move_to_end(key)
                        return unwrap(cached)
                result = self._durable.get_or_create("agent_event", key, produce) if self._durable is not None else produce()
                with self._lock:
                    self._results[key] = dict(result)
                    self._results.move_to_end(key)
                    while len(self._results) > self.max_items:
                        self._results.popitem(last=False)
                return unwrap(result)
        finally:
            with self._lock:
                current_lock, references = self._key_locks[key]
                if references == 1:
                    del self._key_locks[key]
                else:
                    self._key_locks[key] = (current_lock, references - 1)
