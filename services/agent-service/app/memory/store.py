"""短期/长期 Memory 抽象，支持本地回退和 Redis/MySQL 后端。"""

from __future__ import annotations

from collections import deque
from threading import Lock
from typing import Any, Dict, List
import json
import os


class MemoryBackendError(RuntimeError):
    """Memory 外部后端不可用。"""


class ShortMemoryStore:
    """默认以内存实现，生产环境可替换为 Redis。"""

    backend = "redis-compatible-memory"

    def __init__(self, max_items: int = 100) -> None:
        self._items = deque(maxlen=max_items)
        self._lock = Lock()

    def add(self, item: Dict[str, Any]) -> None:
        with self._lock:
            self._items.append(dict(item))

    def recent(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._items)[-limit:]


class LongMemoryStore:
    """默认以内存实现，生产环境可替换为 MySQL repository。"""

    backend = "mysql-compatible-memory"

    def __init__(self) -> None:
        self._items: List[Dict[str, Any]] = []
        self._lock = Lock()

    def save(self, item: Dict[str, Any]) -> None:
        with self._lock:
            self._items.append(dict(item))

    def search(self, device_id: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        with self._lock:
            values = [item for item in self._items if not device_id or item.get("device_id") == device_id]
            return values[-limit:]


class RedisShortMemoryStore:
    backend = "redis"

    def __init__(self, url: str, key: str = "industrial:memory:short", max_items: int = 100) -> None:
        try:
            import redis
            self.client = redis.Redis.from_url(url, decode_responses=True)
            self.client.ping()
        except Exception as error:
            raise MemoryBackendError("Redis 不可用：%s" % error) from error
        self.key = key
        self.max_items = max_items

    def add(self, item: Dict[str, Any]) -> None:
        self.client.lpush(self.key, json.dumps(item, ensure_ascii=False, default=str))
        self.client.ltrim(self.key, 0, self.max_items - 1)

    def recent(self, limit: int = 20) -> List[Dict[str, Any]]:
        return [json.loads(value) for value in self.client.lrange(self.key, 0, max(0, limit - 1))]


class MySQLLongMemoryStore:
    backend = "mysql"

    def __init__(self, config: Dict[str, Any]) -> None:
        try:
            import mysql.connector
            self.connection = mysql.connector.connect(**config)
            cursor = self.connection.cursor()
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS industrial_experiences ("
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, device_id VARCHAR(128), "
                "payload JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
            )
            self.connection.commit()
            cursor.close()
        except Exception as error:
            raise MemoryBackendError("MySQL 不可用：%s" % error) from error

    def save(self, item: Dict[str, Any]) -> None:
        cursor = self.connection.cursor()
        cursor.execute(
            "INSERT INTO industrial_experiences (device_id, payload) VALUES (%s, %s)",
            (str(item.get("device_id", "")), json.dumps(item, ensure_ascii=False, default=str)),
        )
        self.connection.commit()
        cursor.close()

    def search(self, device_id: str = "", limit: int = 20) -> List[Dict[str, Any]]:
        cursor = self.connection.cursor()
        if device_id:
            cursor.execute("SELECT payload FROM industrial_experiences WHERE device_id = %s ORDER BY id DESC LIMIT %s", (device_id, limit))
        else:
            cursor.execute("SELECT payload FROM industrial_experiences ORDER BY id DESC LIMIT %s", (limit,))
        values = [json.loads(row[0]) for row in cursor.fetchall()]
        cursor.close()
        return values


def build_memory_stores() -> tuple[Any, Any]:
    """配置外部后端时连接，否则保持 Demo 可运行。"""

    short: Any = ShortMemoryStore()
    long: Any = LongMemoryStore()
    redis_url = os.getenv("REDIS_URL", "").strip()
    if redis_url:
        try:
            short = RedisShortMemoryStore(redis_url)
        except MemoryBackendError:
            pass
    mysql_host = os.getenv("MYSQL_HOST", "").strip()
    if mysql_host:
        try:
            long = MySQLLongMemoryStore({
                "host": mysql_host,
                "port": int(os.getenv("MYSQL_PORT", "3306")),
                "user": os.getenv("MYSQL_USER", "root"),
                "password": os.getenv("MYSQL_PASSWORD", ""),
                "database": os.getenv("MYSQL_DATABASE", "industrial_maintenance"),
            })
        except (MemoryBackendError, ValueError):
            pass
    return short, long
