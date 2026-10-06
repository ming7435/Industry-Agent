"""在线工单存入 MySQL，隔离测试保留内存与 SQLite 实现。"""

from __future__ import annotations

import json
import sqlite3
import os
from pathlib import Path
from threading import Lock
from typing import Any, Mapping
from contextlib import contextmanager
from shared.persistence import mysql_configuration, mysql_session


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

    def delete(self, workorder_id: str) -> bool:
        with self._lock:
            return self._orders.pop(str(workorder_id), None) is not None


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

    def delete(self, workorder_id: str) -> bool:
        with self._lock, self._connect() as connection:
            cursor = connection.execute("DELETE FROM workorders WHERE workorder_id = ?", (str(workorder_id),))
            return bool(cursor.rowcount)


class MySQLWorkOrderRepository:
    """使用唯一幂等键的共享数据库仓储。"""

    def __init__(self) -> None:
        self._config = mysql_configuration()
        for name in ("host", "port", "user", "password", "database"):
            override = os.getenv("WORKORDER_MYSQL_" + name.upper())
            if override:
                self._config[name] = int(override) if name == "port" else override
        with self._cursor() as cursor:
            cursor.execute(
                "CREATE TABLE IF NOT EXISTS workorders ("
                "workorder_id VARCHAR(64) PRIMARY KEY, idempotency_key VARCHAR(255) UNIQUE, "
                "payload JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)"
            )

    @contextmanager
    def _cursor(self):
        with mysql_session(self._config) as connection:
            cursor = connection.cursor(dictionary=True)
            try:
                yield cursor
            finally:
                cursor.close()

    def create(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        key = str(value.get("idempotency_key") or "") or None
        import mysql.connector
        try:
            with self._cursor() as cursor:
                if key:
                    cursor.execute("SELECT payload FROM workorders WHERE idempotency_key=%s", (key,))
                    row = cursor.fetchone()
                    if row:
                        return dict(json.loads(row["payload"]))
                cursor.execute("INSERT INTO workorders(workorder_id,idempotency_key,payload) VALUES (%s,%s,%s)", (str(value["workorder_id"]), key, json.dumps(value, ensure_ascii=False, default=str)))
                return value
        except RuntimeError:
            # 失败后只读对账，不重复执行 INSERT；不同错误也不得盲目重试写入。
            with self._cursor() as cursor:
                cursor.execute("SELECT payload FROM workorders WHERE workorder_id=%s OR idempotency_key=%s", (str(value["workorder_id"]), key))
                row = cursor.fetchone()
                if row:
                    return dict(json.loads(row["payload"]))
            raise

    def get(self, workorder_id: str) -> dict[str, Any] | None:
        with self._cursor() as cursor:
            cursor.execute("SELECT payload FROM workorders WHERE workorder_id=%s", (str(workorder_id),))
            row = cursor.fetchone()
            return dict(json.loads(row["payload"])) if row else None

    def update(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        with self._cursor() as cursor:
            cursor.execute("SELECT payload FROM workorders WHERE workorder_id=%s FOR UPDATE", (str(value["workorder_id"]),))
            row = cursor.fetchone()
            stored = json.loads(row["payload"]) if row else None
            if stored is None or int(stored.get("_revision", 0)) != int(value.get("_revision", 0)):
                raise ValueError("工单已被其他操作更新，请刷新后重试")
            value["_revision"] = int(value.get("_revision", 0)) + 1
            cursor.execute("UPDATE workorders SET payload=%s WHERE workorder_id=%s", (json.dumps(value, ensure_ascii=False, default=str), str(value["workorder_id"])))
            return value

    def list(self) -> list[dict[str, Any]]:
        with self._cursor() as cursor:
            cursor.execute("SELECT payload FROM workorders ORDER BY workorder_id")
            return [dict(json.loads(row["payload"])) for row in cursor.fetchall()]

    def delete(self, workorder_id: str) -> bool:
        with self._cursor() as cursor:
            cursor.execute("DELETE FROM workorders WHERE workorder_id=%s", (str(workorder_id),))
            deleted = cursor.rowcount > 0
            return deleted


def build_workorder_repository(path: str | None = None) -> MemoryWorkOrderRepository | SQLiteWorkOrderRepository | MySQLWorkOrderRepository:
    backend = os.getenv("WORKORDER_BACKEND", "").strip().lower()
    if os.getenv("APP_ENV", "development").lower() != "testing":
        if backend and backend != "mysql":
            raise RuntimeError("在线工单仅支持 MySQL，SQLite/内存仅用于隔离测试")
        return MySQLWorkOrderRepository()
    if backend == "mysql" or (backend == "" and os.getenv("APP_ENV", "development").lower() in {"prod", "production"} and os.getenv("MYSQL_HOST")):
        return MySQLWorkOrderRepository()
    if backend == "" and os.getenv("APP_ENV", "development").lower() in {"prod", "production"} and not str(path or "").strip():
        raise RuntimeError("生产模式要求配置 MYSQL_HOST 或 WORKORDER_STORE_PATH")
    sqlite_path = str(path or "").strip()
    return SQLiteWorkOrderRepository(sqlite_path) if sqlite_path else MemoryWorkOrderRepository()


__all__ = ["MemoryWorkOrderRepository", "SQLiteWorkOrderRepository", "MySQLWorkOrderRepository", "build_workorder_repository"]
