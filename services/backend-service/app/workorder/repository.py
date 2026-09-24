"""Backend-owned WorkOrder persistence."""

from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Any, Mapping


class BusinessStoreError(RuntimeError):
    pass


class SQLiteRepository:
    def __init__(self, path: str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        with sqlite3.connect(str(self.path)) as connection:
            connection.execute("CREATE TABLE IF NOT EXISTS workorders (workorder_id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
            connection.execute("CREATE TABLE IF NOT EXISTS business_records (record_type TEXT NOT NULL, record_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(record_type, record_id))")

    def create(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        key = str(value.get("idempotency_key") or "") or None
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            try:
                connection.execute("INSERT INTO workorders(workorder_id,idempotency_key,payload) VALUES (?,?,?)", (value["workorder_id"], key, json.dumps(value, ensure_ascii=False, default=str)))
            except sqlite3.IntegrityError:
                row = connection.execute("SELECT payload FROM workorders WHERE workorder_id=? OR idempotency_key=?", (value["workorder_id"], key)).fetchone()
                if row:
                    return dict(json.loads(row[0]))
                raise
        return value

    def get(self, workorder_id: str) -> dict[str, Any] | None:
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            row = connection.execute("SELECT payload FROM workorders WHERE workorder_id=?", (str(workorder_id),)).fetchone()
        return dict(json.loads(row[0])) if row else None

    def update(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            connection.execute("UPDATE workorders SET payload=?, updated_at=CURRENT_TIMESTAMP WHERE workorder_id=?", (json.dumps(value, ensure_ascii=False, default=str), value["workorder_id"]))
        return value

    def list(self) -> list[dict[str, Any]]:
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            rows = connection.execute("SELECT payload FROM workorders ORDER BY rowid").fetchall()
        return [dict(json.loads(row[0])) for row in rows]

    def save_record(self, record_type: str, record_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(payload)
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            connection.execute(
                "INSERT INTO business_records(record_type,record_id,payload) VALUES (?,?,?) "
                "ON CONFLICT(record_type,record_id) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP",
                (str(record_type), str(record_id), json.dumps(value, ensure_ascii=False, default=str)),
            )
        return value

    def get_record(self, record_type: str, record_id: str) -> dict[str, Any] | None:
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            row = connection.execute("SELECT payload FROM business_records WHERE record_type=? AND record_id=?", (str(record_type), str(record_id))).fetchone()
        return dict(json.loads(row[0])) if row else None

    def list_records(self, record_type: str) -> list[dict[str, Any]]:
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            rows = connection.execute("SELECT payload FROM business_records WHERE record_type=? ORDER BY updated_at", (str(record_type),)).fetchall()
        return [dict(json.loads(row[0])) for row in rows]


class MySQLRepository:
    def __init__(self) -> None:
        try:
            import mysql.connector
        except ImportError as error:
            raise BusinessStoreError("mysql-connector-python is required") from error
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv("MYSQL_HOST", "mysql"), port=int(os.getenv("MYSQL_PORT", "3306")),
                user=os.getenv("MYSQL_USER", "industry"), password=os.getenv("MYSQL_PASSWORD", os.getenv("MYSQL_APP_PASSWORD", "industry")),
                database=os.getenv("MYSQL_DATABASE", "industry_agent"), autocommit=False,
            )
            cursor = self.connection.cursor()
            cursor.execute("CREATE TABLE IF NOT EXISTS workorders (workorder_id VARCHAR(64) PRIMARY KEY, idempotency_key VARCHAR(255) UNIQUE, payload JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)")
            cursor.execute("CREATE TABLE IF NOT EXISTS business_records (record_type VARCHAR(64) NOT NULL, record_id VARCHAR(128) NOT NULL, payload JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(record_type, record_id))")
            self.connection.commit()
            cursor.close()
        except Exception as error:
            raise BusinessStoreError("MySQL WorkOrder persistence unavailable: %s" % error) from error

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
            cursor.execute("INSERT INTO workorders(workorder_id,idempotency_key,payload) VALUES (%s,%s,%s)", (value["workorder_id"], key, json.dumps(value, ensure_ascii=False, default=str)))
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
        cursor.execute("UPDATE workorders SET payload=%s WHERE workorder_id=%s", (json.dumps(value, ensure_ascii=False, default=str), value["workorder_id"]))
        self.connection.commit()
        cursor.close()
        return value

    def list(self) -> list[dict[str, Any]]:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM workorders ORDER BY workorder_id")
        rows = cursor.fetchall()
        cursor.close()
        return [dict(json.loads(row["payload"])) for row in rows]

    def save_record(self, record_type: str, record_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(payload)
        cursor = self.connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO business_records(record_type,record_id,payload) VALUES (%s,%s,%s) "
                "ON DUPLICATE KEY UPDATE payload=VALUES(payload), updated_at=CURRENT_TIMESTAMP",
                (str(record_type), str(record_id), json.dumps(value, ensure_ascii=False, default=str)),
            )
            self.connection.commit()
        except Exception:
            self.connection.rollback()
            raise
        finally:
            cursor.close()
        return value

    def get_record(self, record_type: str, record_id: str) -> dict[str, Any] | None:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM business_records WHERE record_type=%s AND record_id=%s", (str(record_type), str(record_id)))
        row = cursor.fetchone()
        cursor.close()
        return dict(json.loads(row["payload"])) if row else None

    def list_records(self, record_type: str) -> list[dict[str, Any]]:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM business_records WHERE record_type=%s ORDER BY updated_at", (str(record_type),))
        rows = cursor.fetchall()
        cursor.close()
        return [dict(json.loads(row["payload"])) for row in rows]


def build_repository() -> SQLiteRepository | MySQLRepository:
    backend = os.getenv("BACKEND_STORAGE", os.getenv("WORKORDER_BACKEND", "mysql")).lower()
    if backend == "sqlite":
        return SQLiteRepository(os.getenv("BACKEND_SQLITE_PATH", "/tmp/backend.sqlite3"))
    return MySQLRepository()


__all__ = ["BusinessStoreError", "SQLiteRepository", "MySQLRepository", "build_repository"]
