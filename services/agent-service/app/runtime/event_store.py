"""Agent Service 事件请求的小型结果幂等边界。"""

from __future__ import annotations

from collections import OrderedDict
from threading import Lock
from typing import Any, Callable, Dict
from time import monotonic
import json
import os

from .durable_store import DurableJsonStore
from .event_plan_reader import EventPlanReader
from app.config.settings import allow_degraded_storage
from shared.persistence import MySQLJsonStore
from shared.temporary_cache import RedisJsonCache


def scoped_event_key(event: dict) -> str:
    """诊断进度与最终结果共用完整事件作用域，不混用设备或修订。"""
    event_id = str(event.get("event_id") or "")
    if not event_id:
        return ""
    raw_revision = event.get("event_revision", 1)
    if isinstance(raw_revision, bool):
        raise ValueError("修订不能是布尔值")
    revision = int(raw_revision)
    if revision < 1:
        raise ValueError("修订必须为正数")
    return json.dumps([str(event.get("tenant_id") or ""), str(event.get("device_id") or ""),
                       event_id, revision], ensure_ascii=False, separators=(",", ":"))


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
        online = os.getenv("APP_ENV", "development").lower() != "testing"
        self._durable = DurableJsonStore(configured_path) if online or configured_path else None
        self._plan_reader = EventPlanReader(configured_path) if configured_path and not online else None
        self._online = online
        # 正式结果仍进入 MySQL；阶段进度只进入 Redis，隔离测试使用有界内存。
        self._stage_cache = RedisJsonCache(prefix="agent:event-progress", ttl_seconds=900) if online else None
        self._stages: OrderedDict[str, tuple[float, Dict[str, Any]]] = OrderedDict()

    def record_stage(self, event: dict, result: Dict[str, Any]) -> None:
        """仅由服务端执行器发布已产生的阶段输出，不认领或重放任何业务动作。"""
        key = scoped_event_key(event)
        if not key:
            return
        with self._lock:
            self._stages[key] = (monotonic() + 900, dict(result))
            self._stages.move_to_end(key)
            while len(self._stages) > self.max_items:
                self._stages.popitem(last=False)
        if self._stage_cache is not None:
            self._stage_cache.set(key, result)

    def list_active_plan_stages(self) -> list[Dict[str, Any]]:
        """方案已生成即可只读展示，只包含本进程仍在处理的实际事件。"""
        now = monotonic()
        with self._lock:
            return [dict(result) for key, (expires, result) in reversed(self._stages.items())
                    if key in self._key_locks and expires > now and result.get('maintenance_plan')]

    def get_stage(self, scoped_key: str) -> Dict[str, Any] | None:
        """只读临时进度；过期或缺失不表示整个事件已失败。"""
        if not scoped_key:
            return None
        if self._stage_cache is not None:
            value = self._stage_cache.get(scoped_key)
            return dict(value) if isinstance(value, dict) else None
        with self._lock:
            stage = self._stages.get(scoped_key)
            if stage is None:
                return None
            expires, value = stage
            if expires <= monotonic():
                del self._stages[scoped_key]
                return None
            return dict(value)

    def has_unmigrated_legacy_result(self, event_id: str, scoped_key: str) -> bool:
        """旧版仅按事件 ID 保存的结果不能被新作用域静默重放。"""

        with self._lock:
            legacy = event_id in self._results
            scoped = scoped_key in self._results
        if self._durable is not None:
            legacy = legacy or self._durable.get("agent_event", event_id) is not None
            scoped = scoped or self._durable.get("agent_event", scoped_key) is not None
        return legacy and not scoped

    def list_results(self, limit: int = 1000) -> list[Dict[str, Any]]:
        """读取既有事件结果供方案工作台展示；不执行事件或生成工单。"""
        limit = max(1, min(int(limit), 5000))
        if self._durable is not None:
            stored = self._durable.values("agent_event", limit)
        else:
            with self._lock:
                stored = list(reversed(list(self._results.values())))[:limit]
        return [
            dict(value.get("result") or {}) if value.get("_event_result_store_version") == 2 else dict(value)
            for value in stored
        ]

    def get_result(self, scoped_key: str) -> Dict[str, Any] | None:
        """按事件作用域只读回查；不认领任务，不等待生产锁，也不重放写操作。"""

        if not scoped_key:
            return None
        if self._durable is not None:
            stored = self._durable.get("agent_event", scoped_key)
        else:
            with self._lock:
                stored = self._results.get(scoped_key)
        if stored is None:
            return None
        if stored.get("_event_result_store_version") == 2:
            return dict(stored.get("result") or {})
        return dict(stored)

    def list_plan_results(self):
        """方案投影与历史日志全文分离；大历史库由单个只读任务渐进加载。"""
        if isinstance(self._durable, MySQLJsonStore):
            return self._durable.plan_results()
        if self._plan_reader is not None:
            return self._plan_reader.snapshot()
        results = self.list_results(limit=5000)
        return results, {"status": "ready", "loaded_records": len(results), "total_records": len(results), "error": ""}

    def deleted_plan_ids(self):
        if isinstance(self._durable, MySQLJsonStore):
            return self._durable.deleted_plan_ids()
        return self._durable.keys("maintenance_plan_deleted") if self._durable else []

    def delete_plans(self, ids, actor_id):
        if isinstance(self._durable, MySQLJsonStore):
            return self._durable.delete_plans(ids, actor_id)
        # SQLite 删除兼容只在隔离测试中启用；线上固定走 MySQL 原子批次。
        ids = list(dict.fromkeys(ids))
        results = self.list_results(limit=5000)
        available = {item.get("maintenance_plan", {}).get("plan_id") for item in results}
        if not set(ids).issubset(available):
            raise KeyError("维修方案不存在")
        from datetime import datetime, timezone
        for plan_id in ids:
            self._durable.get_or_create("maintenance_plan_deleted", plan_id, lambda: {"actor_id": actor_id, "deleted_at": datetime.now(timezone.utc).isoformat()})
        return ids

    def close(self):
        if self._plan_reader is not None:
            self._plan_reader.close()
        if self._stage_cache is not None:
            self._stage_cache.client.close()

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
                if self._plan_reader is not None:
                    self._plan_reader.invalidate()
                if not self._online:
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
