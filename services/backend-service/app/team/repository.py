"""增量存储；每个事务独立连接，席位与账本更新在数据库内串行化。"""
from contextlib import contextmanager
import json
import os
from pathlib import Path
import sqlite3


class TeamRepository:
    def __init__(self, sqlite_path=None):
        self.sqlite_path = sqlite_path or (os.getenv('BACKEND_SQLITE_PATH', '.runtime/backend.sqlite3') if os.getenv('BACKEND_STORAGE') == 'sqlite' else None)
        if self.sqlite_path:
            Path(self.sqlite_path).parent.mkdir(parents=True, exist_ok=True)
        with self.transaction() as db:
            key_type = 'VARCHAR(256)' if self.sqlite_path else 'VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin'
            db.execute('CREATE TABLE IF NOT EXISTS team_accounts (user_id VARCHAR(64) PRIMARY KEY, username VARCHAR(128) NOT NULL, username_key ' + key_type + ' NOT NULL UNIQUE, password_hash TEXT NOT NULL, role VARCHAR(24) NOT NULL, primary_device_id VARCHAR(128) NOT NULL, enabled INTEGER NOT NULL, created_at DOUBLE NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS team_sessions (token_hash VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) NOT NULL, expires_at DOUBLE NOT NULL)')
            payload_type = 'TEXT' if self.sqlite_path else 'LONGTEXT'
            db.execute('CREATE TABLE IF NOT EXISTS team_state (state_key VARCHAR(128) PRIMARY KEY, payload ' + payload_type + ' NOT NULL)')
            # 角色上限与整线状态都锁定这个永不删除的单例行。
            sql = 'INSERT OR IGNORE' if self.sqlite_path else 'INSERT IGNORE'
            db.execute(sql + " INTO team_state(state_key,payload) VALUES (?,?)", ('guard', '{}'))

    @contextmanager
    def transaction(self):
        if self.sqlite_path:
            connection = sqlite3.connect(self.sqlite_path, timeout=15)
            connection.row_factory = sqlite3.Row
            connection.execute('BEGIN IMMEDIATE')
            db = connection
        else:
            import mysql.connector
            connection = mysql.connector.connect(host=os.getenv('MYSQL_HOST', 'mysql'), port=int(os.getenv('MYSQL_PORT', '3306')), user=os.getenv('MYSQL_USER', 'industry'), password=os.getenv('MYSQL_PASSWORD', os.getenv('MYSQL_APP_PASSWORD', 'industry')), database=os.getenv('MYSQL_DATABASE', 'industry_agent'), autocommit=False)
            db = _MySQLSession(connection)
        try:
            yield db
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            if not self.sqlite_path:
                db.close()
            connection.close()

    def lock(self, db):
        suffix = '' if self.sqlite_path else ' FOR UPDATE'
        db.execute("SELECT payload FROM team_state WHERE state_key='guard'" + suffix).fetchone()

    def state(self, db, key, default=None):
        row = db.execute('SELECT payload FROM team_state WHERE state_key=?', (key,)).fetchone()
        return json.loads(row['payload']) if row else default

    def save_state(self, db, key, value):
        if self.sqlite_path:
            sql = 'INSERT INTO team_state(state_key,payload) VALUES (?,?) ON CONFLICT(state_key) DO UPDATE SET payload=excluded.payload'
        else:
            sql = 'INSERT INTO team_state(state_key,payload) VALUES (?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)'
        db.execute(sql, (key, json.dumps(value, ensure_ascii=False)))


class _MySQLSession:
    def __init__(self, connection):
        self.connection = connection
        self.cursors = []

    def execute(self, sql, params=()):
        cursor = self.connection.cursor(dictionary=True)
        self.cursors.append(cursor)
        cursor.execute(sql.replace('?', '%s'), params)
        return cursor

    def close(self):
        for cursor in self.cursors:
            cursor.close()
