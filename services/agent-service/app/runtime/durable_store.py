"""用于跨重启保留幂等状态的小型 SQLite 键值存储。"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from time import monotonic, sleep
from typing import Any
from typing import Callable


class PendingResultError(RuntimeError):
    """操作已领取但没有可证明的最终结果，不允许自动重复生产。"""

    def __init__(self, status: str) -> None:
        self.status = status
        super().__init__("操作处理结果未知，需要人工对账" if status == "uncertain" else "同一操作仍在处理中")


class DurableJsonStore:
    """按键持久化 JSON 值，同时保留进程内 API 的形式。"""

    def __init__(self, path: str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        with closing(self._connect()) as connection, connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS runtime_state ("
                "namespace TEXT NOT NULL, state_key TEXT NOT NULL, payload TEXT NOT NULL, "
                "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "
                "PRIMARY KEY(namespace, state_key))"
            )
            connection.execute(
                "CREATE TABLE IF NOT EXISTS runtime_claims ("
                "namespace TEXT NOT NULL, state_key TEXT NOT NULL, status TEXT NOT NULL, "
                "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, "
                "PRIMARY KEY(namespace, state_key))"
            )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.path), timeout=30, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        return connection

    def get(self, namespace: str, key: str) -> dict[str, Any] | None:
        with self._lock, closing(self._connect()) as connection, connection:
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
        with self._lock, closing(self._connect()) as connection, connection:
            connection.execute(
                "INSERT INTO runtime_state(namespace, state_key, payload) VALUES (?, ?, ?) "
                "ON CONFLICT(namespace, state_key) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP",
                (str(namespace), str(key), payload),
            )

    def delete(self, namespace: str, key: str) -> None:
        with self._lock, closing(self._connect()) as connection, connection:
            connection.execute(
                "DELETE FROM runtime_state WHERE namespace = ? AND state_key = ?",
                (str(namespace), str(key)),
            )

    def keys(self, namespace: str) -> list[str]:
        with self._lock, closing(self._connect()) as connection, connection:
            rows = connection.execute(
                "SELECT state_key FROM runtime_state WHERE namespace = ? ORDER BY state_key",
                (str(namespace),),
            ).fetchall()
        return [str(row["state_key"]) for row in rows]

    def values(self, namespace: str, limit: int = 1000) -> list[dict[str, Any]]:
        """只读列出已完成的结果；不领取或重试仍未完成的操作。"""
        with self._lock, closing(self._connect()) as connection:
            rows = connection.execute(
                "SELECT payload FROM runtime_state WHERE namespace = ? "
                "ORDER BY updated_at DESC, rowid DESC LIMIT ?",
                (str(namespace), max(1, min(int(limit), 5000))),
            ).fetchall()
        values = [json.loads(row["payload"]) for row in rows]
        return [value for value in values if isinstance(value, dict)]

    def get_or_create(self, namespace: str, key: str, producer: Callable[[], dict[str, Any]]) -> dict[str, Any]:
        """以短事务领取键；耗时生产在事务外执行，失败则保留未知状态。"""

        namespace, key = str(namespace), str(key)
        wait_seconds = max(0.1, float(os.getenv("DURABLE_RESULT_WAIT_SECONDS", "180")))
        stale_seconds = max(wait_seconds, float(os.getenv("DURABLE_CLAIM_STALE_SECONDS", "600")))
        deadline = monotonic() + wait_seconds
        while True:
            owner = False
            orphaned = False
            with self._lock, closing(self._connect()) as connection, connection:
                connection.execute("BEGIN IMMEDIATE")
                row = connection.execute(
                    "SELECT payload FROM runtime_state WHERE namespace = ? AND state_key = ?",
                    (namespace, key),
                ).fetchone()
                if row is not None:
                    return dict(json.loads(row["payload"]))
                claim = connection.execute(
                    "SELECT status, created_at FROM runtime_claims WHERE namespace = ? AND state_key = ?",
                    (namespace, key),
                ).fetchone()
                if claim is None:
                    connection.execute(
                        "INSERT INTO runtime_claims(namespace, state_key, status) VALUES (?, ?, 'running')",
                        (namespace, key),
                    )
                    owner = True
                elif claim["status"] == "uncertain":
                    raise PendingResultError("uncertain")
                elif claim["status"] == "running":
                    try:
                        created_at = datetime.fromisoformat(str(claim["created_at"]).replace("Z", "+00:00"))
                        if created_at.tzinfo is None:
                            created_at = created_at.replace(tzinfo=timezone.utc)
                        orphaned = (datetime.now(timezone.utc) - created_at).total_seconds() >= stale_seconds
                    except (TypeError, ValueError):
                        orphaned = True
                    if orphaned:
                        connection.execute(
                            "UPDATE runtime_claims SET status = 'uncertain' WHERE namespace = ? AND state_key = ?",
                            (namespace, key),
                        )
            if orphaned:
                raise PendingResultError("uncertain")
            if owner:
                try:
                    value = dict(producer() or {})
                except Exception:
                    with self._lock, closing(self._connect()) as connection, connection:
                        connection.execute(
                            "UPDATE runtime_claims SET status = 'uncertain' WHERE namespace = ? AND state_key = ?",
                            (namespace, key),
                        )
                    raise
                with self._lock, closing(self._connect()) as connection, connection:
                    connection.execute("BEGIN IMMEDIATE")
                    connection.execute(
                        "INSERT INTO runtime_state(namespace, state_key, payload) VALUES (?, ?, ?)",
                        (namespace, key, json.dumps(value, ensure_ascii=False, default=str)),
                    )
                    connection.execute(
                        "DELETE FROM runtime_claims WHERE namespace = ? AND state_key = ?",
                        (namespace, key),
                    )
                return value
            if monotonic() >= deadline:
                raise PendingResultError("running")
            sleep(0.05)

    def compare_and_set(
        self,
        namespace: str,
        key: str,
        field: str,
        expected: Any,
        values: dict[str, Any],
    ) -> dict[str, Any] | None:
        """在 SQLite 事务中按字段条件更新 JSON 状态，成功时返回新值。"""

        with self._lock, closing(self._connect()) as connection, connection:
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
