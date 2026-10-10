"""由后端负责的工单持久化。"""

from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Any, Mapping
from contextlib import contextmanager
from contextvars import ContextVar
from functools import wraps
from shared.task_deletion import creation_deletion_key, deletion_records, order_plan_ids


class BusinessStoreError(RuntimeError):
    pass


class SQLiteRepository:
    def __init__(self, path: str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        self._record_connection = ContextVar('backend_record_connection', default=None)
        with sqlite3.connect(str(self.path)) as connection:
            connection.execute("CREATE TABLE IF NOT EXISTS workorders (workorder_id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
            connection.execute("CREATE TABLE IF NOT EXISTS business_records (record_type TEXT NOT NULL, record_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(record_type, record_id))")

    def create(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        key = str(value.get("idempotency_key") or "") or None
        with self._record_session() as connection:
            if not connection.in_transaction:
                connection.execute('BEGIN IMMEDIATE')
            guards = [('workorder_deleted', value['workorder_id']),
                      ('workorder_creation_deleted', creation_deletion_key(value)),
                      *[('maintenance_plan_deleted', plan_id) for plan_id in order_plan_ids(value)]]
            for kind, identifier in guards:
                if identifier and connection.execute('SELECT 1 FROM business_records WHERE record_type=? AND record_id=?', (kind, identifier)).fetchone():
                    raise ValueError('工单或关联方案已删除，不能自动重新创建')
            try:
                connection.execute("INSERT INTO workorders(workorder_id,idempotency_key,payload) VALUES (?,?,?)", (value["workorder_id"], key, json.dumps(value, ensure_ascii=False, default=str)))
            except sqlite3.IntegrityError:
                row = connection.execute("SELECT payload FROM workorders WHERE workorder_id=? OR idempotency_key=?", (value["workorder_id"], key)).fetchone()
                if row:
                    return dict(json.loads(row[0]))
                raise
        return value

    def get(self, workorder_id: str) -> dict[str, Any] | None:
        with self._record_session() as connection:
            row = connection.execute("SELECT payload FROM workorders WHERE workorder_id=?", (str(workorder_id),)).fetchone()
        return dict(json.loads(row[0])) if row else None

    def update(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        with self._record_session() as connection:
            if not connection.in_transaction:
                connection.execute('BEGIN IMMEDIATE')
            current = connection.execute('SELECT payload FROM workorders WHERE workorder_id=?', (value['workorder_id'],)).fetchone()
            stored = json.loads(current[0]) if current else None
            if stored is None or int(stored.get('_revision', 0)) != int(value.get('_revision', 0)):
                raise ValueError('工单已被其他操作更新，请刷新后重试')
            value['_revision'] = int(value.get('_revision', 0)) + 1
            connection.execute("UPDATE workorders SET payload=?, updated_at=CURRENT_TIMESTAMP WHERE workorder_id=?", (json.dumps(value, ensure_ascii=False, default=str), value["workorder_id"]))
        return value

    def list(self) -> list[dict[str, Any]]:
        with self._record_session() as connection:
            rows = connection.execute("SELECT payload FROM workorders ORDER BY rowid").fetchall()
        return [dict(json.loads(row[0])) for row in rows]

    def list_run_facts(self, event_ids):
        from .run_facts import read_run_facts
        with self._record_session() as connection:
            return read_run_facts(lambda sql, params: connection.execute(sql, params).fetchall(), event_ids)

    def delete(self, workorder_id: str) -> bool:
        with self._record_session() as connection:
            cursor = connection.execute("DELETE FROM workorders WHERE workorder_id=?", (str(workorder_id),))
            return bool(cursor.rowcount)

    def archive(self, order, audit, deleted_plan_ids):
        """工单、关联方案删除标记及审计在同一事务中保存。"""
        value = dict(order)
        with self._record_session() as connection:
            if not connection.in_transaction:
                connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('SELECT payload FROM workorders WHERE workorder_id=?', (value['workorder_id'],)).fetchone()
            stored = json.loads(row[0]) if row else None
            if stored is None or int(stored.get('_revision', 0)) != int(value.get('_revision', 0)):
                raise ValueError('工单已被其他操作更新，请刷新后重试')
            value['_revision'] = int(value.get('_revision', 0)) + 1
            connection.execute('UPDATE workorders SET payload=? WHERE workorder_id=?', (json.dumps(value, ensure_ascii=False, default=str), value['workorder_id']))
            records = [('audit', audit['audit_id'], audit), *[('maintenance_plan_deleted', plan_id,
                {'plan_id': plan_id, 'workorder_id': value['workorder_id'], 'deleted_at': value['deleted_at'], 'actor_id': value['deleted_by']}) for plan_id in deleted_plan_ids]]
            for kind, key, payload in records:
                connection.execute('INSERT INTO business_records(record_type,record_id,payload) VALUES (?,?,?) '
                    'ON CONFLICT(record_type,record_id) DO UPDATE SET payload=excluded.payload', (kind, key, json.dumps(payload, ensure_ascii=False)))
        return value

    def purge(self, order, audit, plan_ids):
        with self._record_session() as connection:
            if not connection.in_transaction:
                connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('SELECT payload FROM workorders WHERE workorder_id=?', (order['workorder_id'],)).fetchone()
            stored = json.loads(row[0]) if row else None
            if stored is None or int(stored.get('_revision', 0)) != int(order.get('_revision', 0)):
                raise ValueError('工单已被其他操作更新，请刷新后重试')
            connection.execute('DELETE FROM workorders WHERE workorder_id=?', (order['workorder_id'],))
            for kind, key, payload in deletion_records(order, audit, plan_ids):
                connection.execute('INSERT INTO business_records(record_type,record_id,payload) VALUES (?,?,?) '
                    'ON CONFLICT(record_type,record_id) DO UPDATE SET payload=excluded.payload', (kind, key, json.dumps(payload, ensure_ascii=False)))

    def save_record(self, record_type: str, record_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(payload)
        with self._record_session() as connection:
            connection.execute(
                "INSERT INTO business_records(record_type,record_id,payload) VALUES (?,?,?) "
                "ON CONFLICT(record_type,record_id) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP",
                (str(record_type), str(record_id), json.dumps(value, ensure_ascii=False, default=str)),
            )
        return value

    def get_record(self, record_type: str, record_id: str) -> dict[str, Any] | None:
        with self._record_session() as connection:
            row = connection.execute("SELECT payload FROM business_records WHERE record_type=? AND record_id=?", (str(record_type), str(record_id))).fetchone()
        return dict(json.loads(row[0])) if row else None

    def list_records(self, record_type: str) -> list[dict[str, Any]]:
        with self._record_session() as connection:
            rows = connection.execute("SELECT payload FROM business_records WHERE record_type=? ORDER BY updated_at", (str(record_type),)).fetchall()
        return [dict(json.loads(row[0])) for row in rows]

    def delete_record(self, record_type: str, record_id: str) -> bool:
        with self._record_session() as connection:
            cursor = connection.execute("DELETE FROM business_records WHERE record_type=? AND record_id=?", (str(record_type), str(record_id)))
            return bool(cursor.rowcount)

    @contextmanager
    def borrow_transaction(self, connection, path):
        """同一隔离库借用团队事务；提交、回滚和关闭仍由连接拥有者负责。"""
        if Path(path).resolve() != self.path.resolve():
            yield
            return
        active = self._record_connection.get()
        if active is not None and active is not connection:
            raise RuntimeError('工单已有另一活动事务，不能切换连接')
        token = self._record_connection.set(connection)
        try:
            yield
        finally:
            self._record_connection.reset(token)

    @contextmanager
    def _record_session(self):
        active = self._record_connection.get()
        if active is not None:
            yield active
            return
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            yield connection

    @contextmanager
    def quality_transaction(self):
        active = self._record_connection.get()
        if active is not None:
            yield
            return
        with self._lock, sqlite3.connect(str(self.path), timeout=30) as connection:
            connection.execute('BEGIN IMMEDIATE')
            token = self._record_connection.set(connection)
            try:
                yield
            finally:
                self._record_connection.reset(token)

    @contextmanager
    def production_part_transaction(self, part_id):
        """短事务保护同一实物编号的读取、版本绑定和实测保存。"""
        with self.quality_transaction():
            yield self.get_record('production_part', str(part_id)) or {}

    @contextmanager
    def simulated_quality_transaction(self, request_key, basis_key):
        with self.quality_transaction():
            yield

    @contextmanager
    def simulation_transaction(self, lock_id: str):
        """Serialize virtual production facts without borrowing formal quality rows."""
        with self.quality_transaction():
            yield


def _mysql_operation(method):
    @wraps(method)
    def execute(self, *args, **kwargs):
        with self._session():
            return method(self, *args, **kwargs)
    return execute


class MySQLRepository:
    def __init__(self) -> None:
        try:
            import mysql.connector
        except ImportError as error:
            raise BusinessStoreError("mysql-connector-python is required") from error
        self._connector = mysql.connector
        self._active_connection = ContextVar('workorder_connection')
        self._initialize()

    @property
    def connection(self):
        return self._active_connection.get()

    @_mysql_operation
    def list_run_facts(self, event_ids):
        from .run_facts import read_run_facts
        cursor = self.connection.cursor()
        try:
            def query(sql, params):
                cursor.execute(sql, params)
                return cursor.fetchall()
            return read_run_facts(query, event_ids, mysql=True)
        finally:
            cursor.close()

    @contextmanager
    def _session(self):
        if self._active_connection.get(None) is not None:
            yield
            return
        # 每次业务读写独立连接，读取也结束事务；不保留跨线程的旧快照。
        connection = self._connector.connect(
            host=os.getenv('MYSQL_HOST', 'mysql'), port=int(os.getenv('MYSQL_PORT', '3306')),
            user=os.getenv('MYSQL_USER', 'industry'), password=os.getenv('MYSQL_PASSWORD', os.getenv('MYSQL_APP_PASSWORD', 'industry')),
            database=os.getenv('MYSQL_DATABASE', 'industry_agent'), autocommit=False,
        )
        token = self._active_connection.set(connection)
        try:
            yield
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            self._active_connection.reset(token)
            connection.close()

    @contextmanager
    def quality_transaction(self):
        with self._session():
            cursor = self.connection.cursor()
            try:
                # Lock quality and task records through validation, mutation and audit.
                cursor.execute("SELECT record_id FROM business_records WHERE record_type IN ('quality','closure') ORDER BY record_type, record_id FOR UPDATE")
                cursor.fetchall()
                yield
            finally:
                cursor.close()

    @contextmanager
    def simulation_transaction(self, lock_id: str):
        """Use a stable virtual-job guard; network calls never run in this scope."""
        with self._session():
            cursor = self.connection.cursor()
            try:
                cursor.execute('INSERT INTO business_records(record_type,record_id,payload) VALUES (%s,%s,%s) '
                               'ON DUPLICATE KEY UPDATE record_id=record_id', ('sim_production_lock', str(lock_id), '{}'))
                cursor.execute('SELECT payload FROM business_records WHERE record_type=%s AND record_id=%s FOR UPDATE',
                               ('sim_production_lock', str(lock_id)))
                cursor.fetchone()
                yield
            finally:
                cursor.close()

    @contextmanager
    def production_part_transaction(self, part_id):
        """首次插入也锁住唯一键；冲突或无效输入回滚，不留下空业务记录。"""
        with self._session():
            cursor = self.connection.cursor()
            try:
                cursor.execute('INSERT INTO business_records(record_type,record_id,payload) VALUES (%s,%s,%s) '
                    'ON DUPLICATE KEY UPDATE record_id=record_id', ('production_part', str(part_id), '{}'))
                cursor.execute('SELECT payload FROM business_records WHERE record_type=%s AND record_id=%s FOR UPDATE',
                               ('production_part', str(part_id)))
                row = cursor.fetchone()
                yield dict(json.loads(row[0])) if row else {}
            finally:
                cursor.close()

    @contextmanager
    def simulated_quality_transaction(self, request_key, basis_key):
        """独立命名空间、固定请求→基准锁序；首次插入也锁唯一键。"""
        with self._session():
            cursor = self.connection.cursor()
            try:
                for kind, key in [('simulated_quality_request', request_key), ('simulated_quality_basis', basis_key)]:
                    cursor.execute('INSERT INTO business_records(record_type,record_id,payload) VALUES (%s,%s,%s) '
                                   'ON DUPLICATE KEY UPDATE record_id=record_id', (kind, key, '{}'))
                    cursor.execute('SELECT payload FROM business_records WHERE record_type=%s AND record_id=%s FOR UPDATE', (kind, key))
                    cursor.fetchone()
                yield
            finally:
                cursor.close()

    @_mysql_operation
    def _initialize(self):
        try:
            cursor = self.connection.cursor()
            cursor.execute("CREATE TABLE IF NOT EXISTS workorders (workorder_id VARCHAR(64) PRIMARY KEY, idempotency_key VARCHAR(255) UNIQUE, payload JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)")
            cursor.execute("CREATE TABLE IF NOT EXISTS business_records (record_type VARCHAR(64) NOT NULL, record_id VARCHAR(128) NOT NULL, payload JSON NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY(record_type, record_id))")
            self.connection.commit()
            cursor.close()
        except Exception as error:
            raise BusinessStoreError("MySQL WorkOrder persistence unavailable: %s" % error) from error

    @_mysql_operation
    def create(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        key = str(value.get("idempotency_key") or "") or None
        cursor = self.connection.cursor(dictionary=True)
        try:
            guards = [('workorder_deleted', value['workorder_id']),
                      ('workorder_creation_deleted', creation_deletion_key(value)),
                      *[('maintenance_plan_deleted', plan_id) for plan_id in order_plan_ids(value)]]
            for kind, identifier in guards:
                if identifier:
                    cursor.execute('SELECT record_id FROM business_records WHERE record_type=%s AND record_id=%s FOR UPDATE', (kind, identifier))
                    if cursor.fetchone():
                        raise ValueError('工单或关联方案已删除，不能自动重新创建')
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

    @_mysql_operation
    def get(self, workorder_id: str) -> dict[str, Any] | None:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM workorders WHERE workorder_id=%s", (str(workorder_id),))
        row = cursor.fetchone()
        cursor.close()
        return dict(json.loads(row["payload"])) if row else None

    @_mysql_operation
    def update(self, order: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(order)
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute('SELECT payload FROM workorders WHERE workorder_id=%s FOR UPDATE', (value['workorder_id'],))
        row = cursor.fetchone()
        stored = json.loads(row['payload']) if row else None
        if stored is None or int(stored.get('_revision', 0)) != int(value.get('_revision', 0)):
            cursor.close()
            raise ValueError('工单已被其他操作更新，请刷新后重试')
        value['_revision'] = int(value.get('_revision', 0)) + 1
        cursor.execute("UPDATE workorders SET payload=%s WHERE workorder_id=%s", (json.dumps(value, ensure_ascii=False, default=str), value["workorder_id"]))
        self.connection.commit()
        cursor.close()
        return value

    @_mysql_operation
    def list(self) -> list[dict[str, Any]]:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM workorders ORDER BY workorder_id")
        rows = cursor.fetchall()
        cursor.close()
        return [dict(json.loads(row["payload"])) for row in rows]

    @_mysql_operation
    def delete(self, workorder_id: str) -> bool:
        cursor = self.connection.cursor()
        try:
            cursor.execute("DELETE FROM workorders WHERE workorder_id=%s", (str(workorder_id),))
            deleted = cursor.rowcount > 0
            self.connection.commit()
            return deleted
        except Exception:
            self.connection.rollback()
            raise
        finally:
            cursor.close()

    @_mysql_operation
    def archive(self, order, audit, deleted_plan_ids):
        value = dict(order)
        cursor = self.connection.cursor(dictionary=True)
        try:
            cursor.execute('SELECT payload FROM workorders WHERE workorder_id=%s FOR UPDATE', (value['workorder_id'],))
            row = cursor.fetchone()
            stored = json.loads(row['payload']) if row else None
            if stored is None or int(stored.get('_revision', 0)) != int(value.get('_revision', 0)):
                raise ValueError('工单已被其他操作更新，请刷新后重试')
            value['_revision'] = int(value.get('_revision', 0)) + 1
            cursor.execute('UPDATE workorders SET payload=%s WHERE workorder_id=%s', (json.dumps(value, ensure_ascii=False, default=str), value['workorder_id']))
            records = [('audit', audit['audit_id'], audit), *[('maintenance_plan_deleted', plan_id,
                {'plan_id': plan_id, 'workorder_id': value['workorder_id'], 'deleted_at': value['deleted_at'], 'actor_id': value['deleted_by']}) for plan_id in deleted_plan_ids]]
            for kind, key, payload in records:
                cursor.execute('INSERT INTO business_records(record_type,record_id,payload) VALUES (%s,%s,%s) '
                    'ON DUPLICATE KEY UPDATE payload=VALUES(payload)', (kind, key, json.dumps(payload, ensure_ascii=False)))
            # _session commits only after all three records succeed; no intermediate commit.
            return value
        finally:
            cursor.close()

    @_mysql_operation
    def save_record(self, record_type: str, record_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        value = dict(payload)
        cursor = self.connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO business_records(record_type,record_id,payload) VALUES (%s,%s,%s) "
                "ON DUPLICATE KEY UPDATE payload=VALUES(payload), updated_at=CURRENT_TIMESTAMP",
                (str(record_type), str(record_id), json.dumps(value, ensure_ascii=False, default=str)),
            )
        finally:
            cursor.close()
        return value

    @_mysql_operation
    def purge(self, order, audit, plan_ids):
        from shared.persistence import purge_mysql_plans
        cursor = self.connection.cursor(dictionary=True)
        try:
            cursor.execute('SELECT payload FROM workorders WHERE workorder_id=%s FOR UPDATE', (order['workorder_id'],))
            row = cursor.fetchone()
            stored = json.loads(row['payload']) if row else None
            if stored is None or int(stored.get('_revision', 0)) != int(order.get('_revision', 0)):
                raise ValueError('工单已被其他操作更新，请刷新后重试')
            for kind, key, payload in deletion_records(order, audit, plan_ids):
                cursor.execute('INSERT INTO business_records(record_type,record_id,payload) VALUES (%s,%s,%s) '
                    'ON DUPLICATE KEY UPDATE payload=VALUES(payload)', (kind, key, json.dumps(payload, ensure_ascii=False)))
            purge_mysql_plans(cursor, plan_ids, audit['operator'], workorder_ids=[order['workorder_id']], allow_missing=True)
            cursor.execute('DELETE FROM workorders WHERE workorder_id=%s', (order['workorder_id'],))
        finally:
            cursor.close()

    @_mysql_operation
    def get_record(self, record_type: str, record_id: str) -> dict[str, Any] | None:
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute("SELECT payload FROM business_records WHERE record_type=%s AND record_id=%s", (str(record_type), str(record_id)))
        row = cursor.fetchone()
        cursor.close()
        return dict(json.loads(row["payload"])) if row else None

    @_mysql_operation
    def list_records(self, record_type: str) -> list[dict[str, Any]]:
        cursor = self.connection.cursor(dictionary=True)
        try:
            # 只排序小编号；大型 JSON 参与 filesort 会产生 1038，并不是报告不存在。
            cursor.execute("SELECT record_id FROM business_records WHERE record_type=%s ORDER BY updated_at, record_id", (str(record_type),))
            identifiers = [row['record_id'] for row in cursor.fetchall()]
            records = []
            for identifier in identifiers:
                cursor.execute("SELECT payload FROM business_records WHERE record_type=%s AND record_id=%s", (str(record_type), identifier))
                row = cursor.fetchone()
                if row:
                    records.append(dict(json.loads(row['payload'])))
            return records
        finally:
            cursor.close()

    @_mysql_operation
    def delete_record(self, record_type: str, record_id: str) -> bool:
        cursor = self.connection.cursor()
        try:
            cursor.execute("DELETE FROM business_records WHERE record_type=%s AND record_id=%s", (str(record_type), str(record_id)))
            deleted = cursor.rowcount > 0
            self.connection.commit()
            return deleted
        except Exception:
            self.connection.rollback()
            raise
        finally:
            cursor.close()


def build_repository() -> SQLiteRepository | MySQLRepository:
    backend = os.getenv("BACKEND_STORAGE", os.getenv("WORKORDER_BACKEND", "mysql")).lower()
    if backend == "sqlite":
        if os.getenv("APP_ENV", "development").lower() != "testing":
            raise BusinessStoreError("在线业务存储必须使用 MySQL，SQLite 仅用于隔离测试")
        return SQLiteRepository(os.getenv("BACKEND_SQLITE_PATH", "/tmp/backend.sqlite3"))
    if backend != "mysql":
        raise BusinessStoreError("业务存储类型无效，仅支持 MySQL 或隔离测试 SQLite")
    return MySQLRepository()


__all__ = ["BusinessStoreError", "SQLiteRepository", "MySQLRepository", "build_repository"]
