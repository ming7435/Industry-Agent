"""WorkOrder repository boundary with memory and SQLite implementations."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Any, Mapping


class MemoryWorkOrderRepository:
    def __init__(self) -> None:
        self._orders: dict[str, dict[str, Any]] = {}
        self._lock = Lock()

    def create(self, order: Mapping[str, Any]) -> dict[str, Any]:
        with self._lock:
            key = str(order.get("idempotency_key") or "")
            if key:
                for existing in self._orders.values():
                    if str(existing.get("idempotency_key") or "") == key:
                        return dict(existing)
            value = dict(order)
            self._orders[str(value["workorder_id"])] = value
            return dict(value)

    def get(self, workorder_id: str) -> dict[str, Any] | None:
        with self._lock:
            value = self._orders.get(str(workorder_id))
            return dict(value) if value else None

    def update(self, order: Mapping[str, Any]) -> dict[str, Any]:
        with self._lock:
            value = dict(order)
            self._orders[str(value["workorder_id"])] = value
            return dict(value)

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            return [dict(value) for value in self._orders.values()]


class SQLiteWorkOrderRepository:
    def __init__(self, path: str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        with self._connect() as connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS workorders ("
                "workorder_id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE, payload TEXT NOT NULL, "
                "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
            )

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(str(self.path), timeout=30, check_same_thread=False)

    def create(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        key = str(value.get("idempotency_key") or "") or None
        with self._lock, self._connect() as connection:
            try:
                connection.execute(
                    "INSERT INTO workorders(workorder_id, idempotency_key, payload) VALUES (?, ?, ?)",
                    (str(value["workorder_id"]), key, json.dumps(value, ensure_ascii=False, default=str)),
                )
            except sqlite3.IntegrityError:
                row = connection.execute(
                    "SELECT payload FROM workorders WHERE workorder_id = ? OR idempotency_key = ?",
                    (str(value["workorder_id"]), key),
                ).fetchone()
                if row is not None:
                    return dict(json.loads(row[0]))
                raise
        return dict(value)

    def get(self, workorder_id: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as connection:
            row = connection.execute("SELECT payload FROM workorders WHERE workorder_id = ?", (str(workorder_id),)).fetchone()
        return dict(json.loads(row[0])) if row else None

    def update(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        with self._lock, self._connect() as connection:
            connection.execute(
                "UPDATE workorders SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE workorder_id = ?",
                (json.dumps(value, ensure_ascii=False, default=str), str(value["workorder_id"])),
            )
        return dict(value)

    def list(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as connection:
            rows = connection.execute("SELECT payload FROM workorders ORDER BY rowid").fetchall()
        return [dict(json.loads(row[0])) for row in rows]


def build_workorder_repository(path: str | None = None) -> MemoryWorkOrderRepository | SQLiteWorkOrderRepository:
    return SQLiteWorkOrderRepository(path) if str(path or "").strip() else MemoryWorkOrderRepository()


__all__ = ["MemoryWorkOrderRepository", "SQLiteWorkOrderRepository", "build_workorder_repository"]
