"""Small SQLite key/value store used for restart-safe idempotency state."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Any


class DurableJsonStore:
    """Persist JSON values by key without changing the in-memory API shape."""

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


__all__ = ["DurableJsonStore"]
