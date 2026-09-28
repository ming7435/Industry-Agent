"""用于跨重启保留幂等状态的小型 SQLite 键值存储。"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Any
from typing import Callable


class DurableJsonStore:
    """按键持久化 JSON 值，同时保留进程内 API 的形式。"""

    def __init__(self, path: str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        with self._connect() as connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS runtime_state ("
                "namespace TEXT NOT NULL, state_key TEXT NOT NULL, payload TEXT NOT NULL, "
                "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "
                "PRIMARY KEY(namespace, state_key))"
            )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.path), timeout=30, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        return connection

    def get(self, namespace: str, key: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as connection:
            row = connection.execute(
                "SELECT payload FROM runtime_state WHERE namespace = ? AND state_key = ?",
                (str(namespace), str(key)),
            ).fetchone()
        if row is None:
            return None
        value = json.loads(row["payload"])
        return dict(value) if isinstance(value, dict) else None

    def set(self, namespace: str, key: str, value: dict[str, Any]) -> None:
        payload = json.dumps(dict(value), ensure_ascii=False, default=str)
        with self._lock, self._connect() as connection:
            connection.execute(
                "INSERT INTO runtime_state(namespace, state_key, payload) VALUES (?, ?, ?) "
                "ON CONFLICT(namespace, state_key) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP",
                (str(namespace), str(key), payload),
            )

    def delete(self, namespace: str, key: str) -> None:
        with self._lock, self._connect() as connection:
            connection.execute(
                "DELETE FROM runtime_state WHERE namespace = ? AND state_key = ?",
                (str(namespace), str(key)),
            )

    def keys(self, namespace: str) -> list[str]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                "SELECT state_key FROM runtime_state WHERE namespace = ? ORDER BY state_key",
                (str(namespace),),
            ).fetchall()
        return [str(row["state_key"]) for row in rows]

    def get_or_create(self, namespace: str, key: str, producer: Callable[[], dict[str, Any]]) -> dict[str, Any]:
        """跨进程序列化生产操作，返回单个持久化值。"""

        with self._lock, self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT payload FROM runtime_state WHERE namespace = ? AND state_key = ?",
                (str(namespace), str(key)),
            ).fetchone()
            if row is not None:
                return dict(json.loads(row["payload"]))
            value = dict(producer() or {})
            connection.execute(
                "INSERT INTO runtime_state(namespace, state_key, payload) VALUES (?, ?, ?)",
                (str(namespace), str(key), json.dumps(value, ensure_ascii=False, default=str)),
            )
            return value

    def compare_and_set(
        self,
        namespace: str,
        key: str,
        field: str,
        expected: Any,
        values: dict[str, Any],
    ) -> dict[str, Any] | None:
        """在 SQLite 事务中按字段条件更新 JSON 状态，成功时返回新值。"""

        with self._lock, self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT payload FROM runtime_state WHERE namespace = ? AND state_key = ?",
                (str(namespace), str(key)),
            ).fetchone()
            if row is None:
                return None
            current = json.loads(row["payload"])
            if not isinstance(current, dict) or current.get(str(field)) != expected:
                return None
            current.update(dict(values))
            connection.execute(
                "UPDATE runtime_state SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE namespace = ? AND state_key = ?",
                (json.dumps(current, ensure_ascii=False, default=str), str(namespace), str(key)),
            )
            return dict(current)


__all__ = ["DurableJsonStore"]
