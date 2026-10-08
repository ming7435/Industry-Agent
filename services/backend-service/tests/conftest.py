"""同名 app 包独立测试进程，不读取本机业务配置。"""
import os
os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ["APP_ENV"] = "testing"

import hashlib
import time
import unicodedata
from uuid import uuid4
import pytest


@pytest.fixture
def legacy_supervisor():
    """历史账号直接写入隔离数据库，不依赖已关闭的监督人员注册入口。"""
    def seed(team, username='监督', password='password-123'):
        name = unicodedata.normalize('NFC', username.strip())
        salt = '01' * 16
        digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
        account = dict(user_id='USER-' + uuid4().hex, username=name, role='supervisor', primary_device_id='', enabled=1)
        with team.repository.transaction() as db:
            db.execute('INSERT INTO team_accounts VALUES (?,?,?,?,?,?,?,?)',
                       (account['user_id'], name, name.casefold(), salt + ':' + digest, 'supervisor', '', 1, time.time()))
        return account
    return seed
