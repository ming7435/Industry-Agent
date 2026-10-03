"""本地安全待办：主数据库故障时仍保留停机事件与写命令认领，不替代业务 MySQL。"""
import json
import os
from pathlib import Path
import sqlite3


class SafetyStore:
    def __init__(self, path=None):
        self.path = str(path or os.getenv('LINE_SAFETY_STORE_PATH', '.runtime/line_safety.sqlite3'))
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS pending_faults(event_id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS control_claims(command_key TEXT PRIMARY KEY)')

    def connect(self):
        # with SQLite connection 只提交事务，显式封装关闭连接。
        from contextlib import contextmanager
        @contextmanager
        def session():
            db = sqlite3.connect(self.path, timeout=10)
            try:
                with db:
                    yield db
            finally:
                db.close()
        return session()

    def add(self, event_id, device_id, device_ids, reason):
        value = {'event_id': event_id, 'device_id': device_id, 'device_ids': sorted(device_ids), 'reason': reason}
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            old = db.execute('SELECT payload FROM pending_faults WHERE event_id=?', (event_id,)).fetchone()
            if old:
                stored = json.loads(old[0])
                if stored['device_id'] != device_id or stored['device_ids'] != value['device_ids']:
                    raise ValueError('本地停机事件已绑定不同设备')
            else:
                db.execute('INSERT INTO pending_faults VALUES (?,?)', (event_id, json.dumps(value, ensure_ascii=False)))

    def pending(self):
        with self.connect() as db:
            return [json.loads(row[0]) for row in db.execute('SELECT payload FROM pending_faults ORDER BY rowid')]

    def clear(self, event_id):
        with self.connect() as db:
            db.execute('DELETE FROM pending_faults WHERE event_id=?', (event_id,))

    def claim_command(self, event_id, device_id, action):
        key = json.dumps([event_id, device_id, action], separators=(',', ':'))
        with self.connect() as db:
            return db.execute('INSERT OR IGNORE INTO control_claims VALUES (?)', (key,)).rowcount == 1
