"""质检闭环持久化适配器。"""

from __future__ import annotations

import json
import os
from app.config.settings import allow_degraded_storage
from typing import Any, Dict, Mapping


class ClosureBackendError(RuntimeError):
    """质检闭环外部存储不可用。"""


class MySQLClosureStore:
    """使用 MySQL 持久化质检、整改和审计记录。"""

    backend = "mysql"

    def __init__(self, config: Mapping[str, Any]) -> None:
        self.config = dict(config)
        try:
            import mysql.connector

            self._connector = mysql.connector
            self._initialize_schema()
        except Exception as error:
            raise ClosureBackendError("MySQL 质检闭环存储不可用：%s" % error) from error

    def _connect(self):
        return self._connector.connect(**self.config)

    def _initialize_schema(self) -> None:
        statements = (
            """
            CREATE TABLE IF NOT EXISTS quality_checks (
                quality_check_id VARCHAR(64) PRIMARY KEY,
                target_type VARCHAR(64) NOT NULL,
                target_id VARCHAR(128) NOT NULL,
                workorder_id VARCHAR(128) NOT NULL DEFAULT '',
                part_id VARCHAR(128) NOT NULL DEFAULT '',
                part_no VARCHAR(128) NOT NULL DEFAULT '',
                batch_id VARCHAR(128) NOT NULL DEFAULT '',
                production_order_id VARCHAR(128) NOT NULL DEFAULT '',
                inspection_type VARCHAR(64) NOT NULL DEFAULT '',
                score DOUBLE NULL,
                result VARCHAR(32) NOT NULL,
                findings JSON NOT NULL,
                items JSON NOT NULL,
                reviewer VARCHAR(128) NOT NULL DEFAULT '',
                risk_level VARCHAR(32) NOT NULL DEFAULT 'R1',
                status VARCHAR(32) NOT NULL DEFAULT 'open',
                appeal_ids JSON NOT NULL,
                created_at VARCHAR(64) NOT NULL,
                updated_at VARCHAR(64) NOT NULL,
                KEY idx_quality_target (target_type, target_id),
                KEY idx_quality_status (status),
                KEY idx_quality_part (part_id, part_no)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS quality_appeals (
                appeal_id VARCHAR(64) PRIMARY KEY,
                quality_check_id VARCHAR(64) NOT NULL,
                reason TEXT NOT NULL,
                evidence JSON NOT NULL,
                applicant VARCHAR(128) NOT NULL DEFAULT '',
                status VARCHAR(32) NOT NULL DEFAULT 'pending',
                created_at VARCHAR(64) NOT NULL,
                KEY idx_appeal_quality_check (quality_check_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS closure_tasks (
                closure_task_id VARCHAR(64) PRIMARY KEY,
                workorder_id VARCHAR(128) NOT NULL DEFAULT '',
                quality_check_id VARCHAR(64) NOT NULL DEFAULT '',
                title VARCHAR(255) NOT NULL,
                owner VARCHAR(128) NOT NULL DEFAULT '',
                actions JSON NOT NULL,
                due_at VARCHAR(64) NOT NULL DEFAULT '',
                status VARCHAR(32) NOT NULL DEFAULT 'open',
                created_by VARCHAR(128) NOT NULL DEFAULT '',
                completion_note TEXT NOT NULL,
                completed_by VARCHAR(128) NOT NULL DEFAULT '',
                completed_at VARCHAR(64) NOT NULL DEFAULT '',
                created_at VARCHAR(64) NOT NULL,
                updated_at VARCHAR(64) NOT NULL,
                KEY idx_closure_task_status (status),
                KEY idx_closure_task_workorder (workorder_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS closure_audit_logs (
                audit_id VARCHAR(64) PRIMARY KEY,
                action VARCHAR(128) NOT NULL,
                object_id VARCHAR(128) NOT NULL,
                operator VARCHAR(128) NOT NULL DEFAULT '',
                changes JSON NOT NULL,
                created_at VARCHAR(64) NOT NULL,
                KEY idx_audit_object (object_id),
                KEY idx_audit_action (action)
            )
            """,
        )
        connection = self._connect()
        cursor = connection.cursor()
        try:
            for statement in statements:
                cursor.execute(statement)
            connection.commit()
        finally:
            cursor.close()
            connection.close()

    @staticmethod
    def _json(value: Any, default: Any) -> str:
        return json.dumps(value if value is not None else default, ensure_ascii=False, default=str)

    @staticmethod
    def _loads(value: Any, default: Any) -> Any:
        if value is None:
            return default
        if isinstance(value, (dict, list)):
            return value
        try:
            return json.loads(value)
        except (TypeError, ValueError):
            return default

    @classmethod
    def _quality_row(cls, row: Mapping[str, Any]) -> dict[str, Any]:
        result = dict(row)
        defaults: tuple[tuple[str, Any], ...] = (("findings", []), ("items", []), ("appeal_ids", []))
        for key, default in defaults:
            result[key] = cls._loads(result.get(key), default)
        return result

    @classmethod
    def _task_row(cls, row: Mapping[str, Any]) -> dict[str, Any]:
        result = dict(row)
        result["actions"] = cls._loads(result.get("actions"), [])
        return result

    @classmethod
    def _appeal_row(cls, row: Mapping[str, Any]) -> dict[str, Any]:
        result = dict(row)
        result["evidence"] = cls._loads(result.get("evidence"), [])
        return result

    @classmethod
    def _audit_row(cls, row: Mapping[str, Any]) -> dict[str, Any]:
        result = dict(row)
        result["changes"] = cls._loads(result.get("changes"), {})
        return result

    def create_quality_check(self, record: Mapping[str, Any]) -> dict[str, Any]:
        connection = self._connect()
        cursor = connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO quality_checks (quality_check_id, target_type, target_id, workorder_id, part_id, part_no, batch_id, production_order_id, inspection_type, score, result, findings, items, reviewer, risk_level, status, appeal_ids, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    record["quality_check_id"], record["target_type"], record["target_id"],
                    record["workorder_id"], record["part_id"], record["part_no"],
                    record["batch_id"], record["production_order_id"], record["inspection_type"],
                    record["score"], record["result"], self._json(record["findings"], []),
                    self._json(record["items"], []), record["reviewer"], record["risk_level"],
                    record["status"], self._json(record["appeal_ids"], []), record["created_at"], record["updated_at"],
                ),
            )
            connection.commit()
        finally:
            cursor.close()
            connection.close()
        return dict(record)

    def list_quality_checks(self, target_id: str = "", status: str = "") -> list[dict[str, Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        if target_id:
            clauses.append("target_id = %s")
            params.append(target_id)
        if status:
            clauses.append("status = %s")
            params.append(status)
        query = "SELECT * FROM quality_checks"
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY created_at DESC"
        connection = self._connect()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(query, tuple(params))
            return [self._quality_row(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            connection.close()

    def get_quality_check(self, check_id: str) -> dict[str, Any] | None:
        connection = self._connect()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM quality_checks WHERE quality_check_id = %s", (check_id,))
            row = cursor.fetchone()
            return self._quality_row(row) if row else None
        finally:
            cursor.close()
            connection.close()

    def update_quality_check(self, check_id: str, values: Mapping[str, Any]) -> None:
        assignments: list[str] = []
        params: list[Any] = []
        for key in ("appeal_ids", "status", "updated_at"):
            if key in values:
                assignments.append(key + " = %s")
                params.append(self._json(values[key], []) if key == "appeal_ids" else values[key])
        if not assignments:
            return
        params.append(check_id)
        connection = self._connect()
        cursor = connection.cursor()
        try:
            cursor.execute("UPDATE quality_checks SET " + ", ".join(assignments) + " WHERE quality_check_id = %s", tuple(params))
            connection.commit()
        finally:
            cursor.close()
            connection.close()

    def create_appeal(self, record: Mapping[str, Any]) -> dict[str, Any]:
        connection = self._connect()
        cursor = connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO quality_appeals (appeal_id, quality_check_id, reason, evidence, applicant, status, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (record["appeal_id"], record["quality_check_id"], record["reason"], self._json(record["evidence"], []), record["applicant"], record["status"], record["created_at"]),
            )
            connection.commit()
        finally:
            cursor.close()
            connection.close()
        return dict(record)

    def create_closure_task(self, record: Mapping[str, Any]) -> dict[str, Any]:
        connection = self._connect()
        cursor = connection.cursor()
        try:
            cursor.execute(
                "INSERT INTO closure_tasks (closure_task_id, workorder_id, quality_check_id, title, owner, actions, due_at, status, created_by, completion_note, completed_by, completed_at, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (record["closure_task_id"], record["workorder_id"], record["quality_check_id"], record["title"], record["owner"], self._json(record["actions"], []), record["due_at"], record["status"], record["created_by"], record.get("completion_note", ""), record.get("completed_by", ""), record.get("completed_at", ""), record["created_at"], record["updated_at"]),
            )
            connection.commit()
        finally:
            cursor.close()
            connection.close()
        return dict(record)

    def list_closure_tasks(self, status: str = "") -> list[dict[str, Any]]:
        connection = self._connect()
        cursor = connection.cursor(dictionary=True)
        try:
            if status:
                cursor.execute("SELECT * FROM closure_tasks WHERE status = %s ORDER BY created_at DESC", (status,))
            else:
                cursor.execute("SELECT * FROM closure_tasks ORDER BY created_at DESC")
            return [self._task_row(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            connection.close()

    def get_closure_task(self, task_id: str) -> dict[str, Any] | None:
        connection = self._connect()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM closure_tasks WHERE closure_task_id = %s", (task_id,))
            row = cursor.fetchone()
            return self._task_row(row) if row else None
        finally:
            cursor.close()
            connection.close()

    def update_closure_task(self, task_id: str, values: Mapping[str, Any]) -> None:
        allowed = ("status", "completion_note", "completed_by", "completed_at", "updated_at")
        assignments = [key + " = %s" for key in allowed if key in values]
        if not assignments:
            return
        params = [values[key] for key in allowed if key in values] + [task_id]
        connection = self._connect()
        cursor = connection.cursor()
        try:
            cursor.execute("UPDATE closure_tasks SET " + ", ".join(assignments) + " WHERE closure_task_id = %s", tuple(params))
            connection.commit()
        finally:
            cursor.close()
            connection.close()

    def create_audit(self, record: Mapping[str, Any]) -> dict[str, Any]:
        connection = self._connect()
        cursor = connection.cursor()
        try:
            cursor.execute("INSERT INTO closure_audit_logs (audit_id, action, object_id, operator, changes, created_at) VALUES (%s, %s, %s, %s, %s, %s)", (record["audit_id"], record["action"], record["object_id"], record["operator"], self._json(record["changes"], {}), record["created_at"]))
            connection.commit()
        finally:
            cursor.close()
            connection.close()
        return dict(record)

    def list_audit_logs(self, object_id: str = "", action: str = "") -> list[dict[str, Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        if object_id:
            clauses.append("object_id = %s")
            params.append(object_id)
        if action:
            clauses.append("action = %s")
            params.append(action)
        query = "SELECT * FROM closure_audit_logs"
        if clauses:
            query += " WHERE " + " AND ".join(clauses)
        query += " ORDER BY created_at DESC"
        connection = self._connect()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(query, tuple(params))
            return [self._audit_row(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            connection.close()


def build_closure_store() -> MySQLClosureStore | None:
    """配置 MYSQL_HOST 后自动启用 MySQL，否则返回 None 走内存实现。"""

    host = os.getenv("MYSQL_HOST", "").strip()
    if not host:
        if not allow_degraded_storage():
            raise ClosureBackendError("生产模式要求配置 MYSQL_HOST")
        return None
    try:
        return MySQLClosureStore(
            {
                "host": host,
                "port": int(os.getenv("MYSQL_PORT", "3306")),
                "user": os.getenv("MYSQL_USER", "root"),
                "password": os.getenv("MYSQL_PASSWORD", ""),
                "database": os.getenv("MYSQL_DATABASE", "industrial_maintenance"),
            }
        )
    except (ClosureBackendError, ValueError):
        if not allow_degraded_storage():
            raise
        return None
