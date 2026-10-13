"""Short database transactions reuse connections without sharing live work."""
from concurrent.futures import ThreadPoolExecutor
from threading import Event

import mysql.connector
import pytest

from shared.persistence import mysql_session, StorageUnavailable


class Connection:
    def __init__(self, database, identity, pool=None):
        self.database, self.identity, self.pool = database, identity, pool
        self.pending, self.busy = [], True

    def cursor(self):
        return self

    def execute(self, sql, values):
        self.pending.append(values[0])

    def commit(self):
        self.database.rows.extend(self.pending)
        self.pending.clear()

    def rollback(self):
        self.pending.clear()

    def close(self):
        self.busy = False


class Driver:
    def __init__(self):
        self.handshakes, self.pools, self.databases = [], {}, {}

    def connect(self, **options):
        database = self.databases.setdefault(options['database'], type('Database', (), {'rows': []})())
        name = options.get('pool_name')
        if name:
            pool = self.pools.setdefault(name, [])
            for connection in pool:
                if not connection.busy:
                    connection.busy = True
                    return connection
            if len(pool) >= options['pool_size']:
                raise mysql.connector.errors.PoolError('pool exhausted')
        else:
            pool = None
        connection = Connection(database, len(self.handshakes) + 1, pool)
        self.handshakes.append(connection)
        if pool is not None:
            pool.append(connection)
        return connection


@pytest.fixture
def driver(monkeypatch):
    value = Driver()
    monkeypatch.setenv('MYSQL_POOL_SIZE', '2')
    monkeypatch.setattr(mysql.connector, 'connect', value.connect)
    return value


def config(database='isolated'):
    return {'host': 'isolated', 'user': 'isolated', 'password': 'isolated-secret',
            'database': database, 'connection_timeout': .2}


def test_short_transactions_reuse_connections_and_commit_each_result(driver):
    for index in range(12):
        with mysql_session(config()) as connection:
            connection.cursor().execute('INSERT', (index,))
        assert driver.databases['isolated'].rows == list(range(index + 1))
    assert len(driver.handshakes) <= 2, 'Each short transaction opened a new authenticated connection'


def test_failed_transaction_rolls_back_before_connection_is_reused(driver):
    with pytest.raises(ValueError):
        with mysql_session(config()) as connection:
            connection.cursor().execute('INSERT', ('must-rollback',))
            raise ValueError('business validation failed')
    with mysql_session(config()) as connection:
        connection.cursor().execute('INSERT', ('saved',))
    assert driver.databases['isolated'].rows == ['saved']
    assert len(driver.handshakes) == 1


def test_pool_configuration_keeps_databases_separate(driver):
    for database in ['first', 'second', 'first']:
        with mysql_session(config(database)) as connection:
            connection.cursor().execute('INSERT', (database,))
    assert driver.databases['first'].rows == ['first', 'first']
    assert driver.databases['second'].rows == ['second']
    assert len(driver.handshakes) == 2


def test_busy_pool_waits_for_returned_connection_without_sharing_transaction(driver, monkeypatch):
    monkeypatch.setenv('MYSQL_POOL_SIZE', '1')
    entered, waiting = Event(), Event()
    def second():
        waiting.set()
        with mysql_session(config()) as connection:
            entered.set()
            connection.cursor().execute('INSERT', ('second',))
    with ThreadPoolExecutor(max_workers=1) as executor:
        with mysql_session(config()) as connection:
            connection.cursor().execute('INSERT', ('first',))
            future = executor.submit(second)
            assert waiting.wait(1)
            assert not entered.wait(.05)
        future.result(timeout=2)
    assert driver.databases['isolated'].rows == ['first', 'second']
    assert len(driver.handshakes) == 1


def test_pool_wait_timeout_releases_future_capacity(driver, monkeypatch):
    monkeypatch.setenv('MYSQL_POOL_SIZE', '1')
    with mysql_session(config()) as held:
        with ThreadPoolExecutor(max_workers=1) as executor:
            def wait_for_pool():
                with pytest.raises(StorageUnavailable):
                    with mysql_session(config()):
                        pytest.fail('a busy connection was shared')
            executor.submit(wait_for_pool).result(timeout=2)
        held.cursor().execute('INSERT', ('first',))
    with mysql_session(config()) as connection:
        connection.cursor().execute('INSERT', ('after-timeout',))
    assert driver.databases['isolated'].rows == ['first', 'after-timeout']


def test_pool_can_be_disabled_explicitly(driver, monkeypatch):
    monkeypatch.setenv('MYSQL_POOL_SIZE', '0')
    for _ in range(2):
        with mysql_session(config()):
            pass
    assert len(driver.handshakes) == 2
