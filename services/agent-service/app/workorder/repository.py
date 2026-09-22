"""WorkOrder repository boundary with memory and SQLite implementations."""

from __future__ import annotations

import json
import sqlite3
import os
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


class MySQLWorkOrderRepository:
    """Shared-database repository with a unique idempotency key."""

    def __init__(self) -> None:
        try:
            import mysql.connector
        except ImportError as error:
            raise RuntimeError("MySQL WorkOrder persistence requires mysql-connector-python") from error
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv("WORKORDER_MYSQL_HOST") or os.getenv("MYSQL_HOST"),
                port=int(os.getenv("WORKORDER_MYSQL_PORT") or os.getenv("MYSQL_PORT", "3306")),
                user=os.getenv("WORKORDER_MYSQL_USER") or os.getenv("MYSQL_USER", "root"),
                password=os.getenv("WORKORDER_MYSQL_PASSWORD") or os.getenv("MYSQL_PASSWORD", ""),
                database=os.getenv("WORKORDER_MYSQL_DATABASE") or os.getenv("MYSQL_DATABASE", "industrial_maintenance"),
                autocommit=False,
            )
            cursor = self.connection.cursor()
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS workorders ("
                "workorder_id VARCHAR(64) PRIMARY KEY, idempotency_key VARCHAR(255) UNIQUE, "
                "payload JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
            )
            self.connection.commit()
            cursor.close()
        except Exception as error:
            raise RuntimeError("MySQL WorkOrder persistence unavailable: %s" % error) from error

    def create(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        key = str(value.get("idempotency_key") or "") or None
        cursor = self.connection.cursor(dictionary=True)
        try:
            if key:
                cursor.execute("SELECT payload FROM workorders WHERE idempotency_key=%s", (key,))
                row = cursor.fetchone()
                if row:
                    return dict(json.loads(row["payload"]))
            cursor.execute(
                "INSERT INTO workorders(workorder_id, idempotency_key, payload) VALUES (%s, %s, %s)",
                (str(value["workorder_id"]), key, json.dumps(value, ensure_ascii=False, default=str)),
            )
            self.connection.commit()
            return value
        except Exception:
            self.connection.rollback()
            if key:
                cursor.execute("SELECT payload FROM workorders WHERE idempotency_key=%s", (key,))
                row = cursor.fetchone()
                if row:
                    return dict(json.loads(row["payload"]))
            raise
        finally:
            cursor.close()

    def get(self, workorder_id: str) -> dict[str, Any] | None:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM workorders WHERE workorder_id=%s", (str(workorder_id),))
        row = cursor.fetchone()
        cursor.close()
        return dict(json.loads(row["payload"])) if row else None

    def update(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        cursor = self.connection.cursor()
        cursor.execute("UPDATE workorders SET payload=%s WHERE workorder_id=%s", (json.dumps(value, ensure_ascii=False, default=str), str(value["workorder_id"])))
        self.connection.commit()
        cursor.close()
        return value

    def list(self) -> list[dict[str, Any]]:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM workorders ORDER BY workorder_id")
        rows = cursor.fetchall()
        cursor.close()
        return [dict(json.loads(row["payload"])) for row in rows]


def build_workorder_repository(path: str | None = None) -> MemoryWorkOrderRepository | SQLiteWorkOrderRepository | MySQLWorkOrderRepository:
    backend = os.getenv("WORKORDER_BACKEND", "").strip().lower()
    if backend == "mysql" or (backend == "" and os.getenv("APP_ENV", "development").lower() in {"prod", "production"} and os.getenv("MYSQL_HOST")):
        return MySQLWorkOrderRepository()
    if backend == "" and os.getenv("APP_ENV", "development").lower() in {"prod", "production"} and not str(path or "").strip():
        raise RuntimeError("生产模式要求配置 MYSQL_HOST 或 WORKORDER_STORE_PATH")
    return SQLiteWorkOrderRepository(path) if str(path or "").strip() else MemoryWorkOrderRepository()


__all__ = ["MemoryWorkOrderRepository", "SQLiteWorkOrderRepository", "MySQLWorkOrderRepository", "build_workorder_repository"]
