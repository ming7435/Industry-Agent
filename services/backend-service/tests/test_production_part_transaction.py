"""用隔离 SQL 适配器执行真实仓储事务，不连接生产 MySQL。"""
from concurrent.futures import ThreadPoolExecutor
from contextvars import ContextVar
from threading import Barrier
import sqlite3
from types import SimpleNamespace

import pytest

from app.workorder.repository import MySQLRepository, SQLiteRepository
from app.quality.inspection import PartInspectionService
from test_cad_parameter_quality import design, save


class Cursor:
    def __init__(self, connection, dictionary=False):
        self.connection = connection
        self.cursor = connection.cursor()
        self.dictionary = dictionary

    def execute(self, sql, values=()):
        # 只替换驱动方言，业务绑定／校验／读写均执行项目真实代码。
        if 'ON DUPLICATE KEY UPDATE record_id=record_id' in sql:
            if not self.connection.in_transaction:
                self.connection.execute('BEGIN IMMEDIATE')
            sql = sql.split(' ON DUPLICATE KEY')[0] + ' ON CONFLICT(record_type,record_id) DO NOTHING'
        elif 'ON DUPLICATE KEY UPDATE payload=VALUES(payload)' in sql:
            sql = sql.split(' ON DUPLICATE KEY')[0] + ' ON CONFLICT(record_type,record_id) DO UPDATE SET payload=excluded.payload'
        self.cursor.execute(sql.replace('%s', '?').replace(' FOR UPDATE', ''), values)

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(zip([field[0] for field in self.cursor.description], row)) if row and self.dictionary else row

    def close(self):
        self.cursor.close()


class Connection:
    def __init__(self, path):
        self.raw = sqlite3.connect(path, timeout=10)

    def cursor(self, dictionary=False):
        return Cursor(self.raw, dictionary)

    def commit(self):
        self.raw.commit()

    def rollback(self):
        self.raw.rollback()

    def close(self):
        self.raw.close()


def repository(tmp_path, mysql):
    path = str(tmp_path / 'isolated-records.db')
    initialized = SQLiteRepository(path)
    if not mysql:
        return initialized
    target = MySQLRepository.__new__(MySQLRepository)
    target._active_connection = ContextVar('isolated_mysql_connection', default=None)
    target._connector = SimpleNamespace(connect=lambda **_: Connection(path))
    return target


@pytest.mark.parametrize('mysql', [False, True])
def test_first_concurrent_binding_cannot_overwrite_another_version(tmp_path, mysql):
    target = repository(tmp_path, mysql)
    backend = SimpleNamespace(qms=PartInspectionService(target).call)
    barrier = Barrier(2)

    def bind(digit):
        barrier.wait(timeout=5)
        try:
            # 首次绑定同一编号，不同版本必须有且只有一方成功。
            with target.production_part_transaction('PRODUCED-PIN'):
                return save(backend, reference=design(digit))['design_reference']['run_id']
        except ValueError:
            return 'conflict'

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(bind, ['a', 'b']))
    assert outcomes.count('conflict') == 1
    stored = target.get_record('production_part', 'PRODUCED-PIN')
    assert stored['design_reference']['run_id'] in outcomes


@pytest.mark.parametrize('mysql', [False, True])
def test_invalid_first_binding_rolls_back_the_lock_placeholder(tmp_path, mysql):
    target = repository(tmp_path, mysql)
    with pytest.raises(ValueError):
        with target.production_part_transaction('P-INVALID'):
            raise ValueError('实测数据无效')
    assert target.get_record('production_part', 'P-INVALID') is None
