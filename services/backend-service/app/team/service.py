"""密码不入上下文；会话与维修身份在后端验证。"""
import hashlib
import hmac
import secrets
import time
import unicodedata
import json
from uuid import uuid4
from .repository import TeamRepository
from .device_catalog import devices


def public(row):
    return {key: row[key] for key in ('user_id', 'username', 'role', 'primary_device_id', 'enabled')}


class TeamService:
    def __init__(self, repository=None, devices=devices):
        self.repository = repository or TeamRepository()
        self.devices = devices

    def register(self, username, password, role, primary_device_id=''):
        name = unicodedata.normalize('NFC', str(username).strip())
        key = name.casefold()
        if not 1 <= len(name) <= 64 or not 8 <= len(password) <= 256:
            raise ValueError('用户名须为1–64字，密码须为8–256字')
        if role != 'technician':
            raise ValueError('仅支持维修人员注册')
        if primary_device_id not in {str(d.get('device_id') or d.get('id') or '') for d in self.devices()}:
            raise ValueError('请选择工厂当前存在的设备')
        salt = secrets.token_hex(16)
        digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
        account = dict(user_id='USER-' + uuid4().hex, username=name, role='technician', primary_device_id=primary_device_id, enabled=1)
        with self.repository.transaction() as db:
            self.repository.lock(db)
            if db.execute('SELECT user_id FROM team_accounts WHERE username_key=?', (key,)).fetchone():
                raise ValueError('用户名已注册')
            count = db.execute('SELECT COUNT(*) AS n FROM team_accounts WHERE role=?', (role,)).fetchone()['n']
            if count >= 4:
                raise ValueError('该身份名额已满')
            db.execute('INSERT INTO team_accounts VALUES (?,?,?,?,?,?,?,?)', (account['user_id'], name, key, salt + ':' + digest, role, account['primary_device_id'], 1, time.time()))
        return account

    def login(self, username, password):
        if len(password) > 256:
            raise ValueError('用户名或密码错误')
        key = unicodedata.normalize('NFC', str(username).strip()).casefold()
        with self.repository.transaction() as db:
            row = db.execute("SELECT * FROM team_accounts WHERE username_key=? AND enabled=1 AND role='technician'", (key,)).fetchone()
        if not row:
            raise ValueError('用户名或密码错误')
        salt, expected = row['password_hash'].split(':')
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
        if not hmac.compare_digest(actual, expected):
            raise ValueError('用户名或密码错误')
        token = secrets.token_urlsafe(32)
        self.repository.save_session(hashlib.sha256(token.encode()).hexdigest(), row['user_id'], time.time() + 28800)
        return public(row), token

    def resolve_session(self, token):
        user_id = self.repository.session_user(hashlib.sha256(token.encode()).hexdigest())
        if not user_id:
            return None
        with self.repository.transaction() as db:
            row = db.execute("SELECT * FROM team_accounts WHERE user_id=? AND enabled=1 AND role='technician'", (user_id,)).fetchone()
        return public(row) if row else None

    def logout(self, token):
        self.repository.delete_session(hashlib.sha256(token.encode()).hexdigest())

    def technicians(self, device_id=''):
        online = self.repository.active_session_user_ids()
        with self.repository.transaction() as db:
            rows = db.execute("SELECT * FROM team_accounts WHERE role='technician' AND enabled=1 ORDER BY user_id").fetchall()
        return [{**public(row), 'online': row['user_id'] in online} for row in rows
                if not device_id or row['primary_device_id'] == device_id]

    def create_reminder(self, workorder_id, actor_id, recipient_id, text):
        with self.repository.transaction() as db:
            actor = db.execute('SELECT * FROM team_accounts WHERE user_id=? AND enabled=1', (actor_id,)).fetchone()
            recipient = db.execute("SELECT * FROM team_accounts WHERE user_id=? AND enabled=1 AND role='technician'", (recipient_id,)).fetchone()
            if not actor or actor['role'] != 'supervisor':
                raise PermissionError('只有监督人可以催办')
            if not recipient or not text.strip() or len(text) > 1000:
                raise ValueError('催办对象或内容无效')
            reminder = dict(reminder_id=uuid4().hex, workorder_id=workorder_id, actor_id=actor_id, recipient_id=recipient_id, text=text.strip(), created_at=time.time(), read=False)
            self.repository.save_state(db, 'reminder:' + reminder['reminder_id'], reminder)
        return reminder

    def reminders(self, actor):
        with self.repository.transaction() as db:
            values = [json.loads(row['payload']) for row in db.execute("SELECT payload FROM team_state WHERE state_key LIKE 'reminder:%'").fetchall()]
        return [r for r in values if actor['role'] == 'supervisor' or r['recipient_id'] == actor['user_id']]

    def read_reminder(self, reminder_id, actor):
        with self.repository.transaction() as db:
            self.repository.lock(db)
            reminder = self.repository.state(db, 'reminder:' + reminder_id)
            if not reminder or actor['role'] != 'technician' or reminder['recipient_id'] != actor['user_id']:
                raise PermissionError('只有收到催办的维修人员可以标记已读')
            reminder.update(read=True, read_at=time.time())
            self.repository.save_state(db, 'reminder:' + reminder_id, reminder)
        return reminder
