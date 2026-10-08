"""Trace writes reuse one serialized connection without batching or replaying unknown commits."""
from concurrent.futures import ThreadPoolExecutor
from threading import Event, Lock
from time import sleep
import json

import mysql.connector
import pytest

from app.harness.trace import TraceRecorder
from app.harness.trace_store import MySQLTraceStore
from shared.persistence import StorageUnavailable


class FakeDatabase:
    def __init__(self):
        self.connections = []
        self.rows = []
        self.lock = Lock()
        self.fail_next_commit = False
        self.block_commit = False
        self.commit_entered, self.release_commit = Event(), Event()

    def connect(self, **config):
        assert config['autocommit'] is False
        connection = FakeConnection(self)
        self.connections.append(connection)
        return connection


class FakeConnection:
    def __init__(self, database):
        self.database = database
        self.pending = []
        self.closed = False
        self.active = False
        self.commits = 0
        self.rollbacks = 0

    def cursor(self):
        assert not self.closed
        return FakeCursor(self)

    def commit(self):
        self.commits += 1
        if self.pending:
            if self.database.block_commit:
                self.database.commit_entered.set()
                assert self.database.release_commit.wait(3)
            with self.database.lock:
                self.database.rows.extend(self.pending)
            self.pending = []
            self.active = False
            if self.database.fail_next_commit:
                self.database.fail_next_commit = False
                raise mysql.connector.OperationalError('SECRET host credential leaked', errno=2013)

    def rollback(self):
        self.rollbacks += 1
        self.pending = []
        self.active = False

    def close(self):
        self.closed = True


class FakeCursor:
    def __init__(self, connection):
        self.connection = connection

    def execute(self, sql, parameters=()):
        if sql.startswith('CREATE TABLE'):
            return
        assert sql.startswith('INSERT INTO agent_execution_trace')
        assert not self.connection.active, 'parallel users shared an open transaction'
        self.connection.active = True
        sleep(0.002)
        record = json.loads(parameters[2])
        assert parameters[:2] == (record.get('trace_id', ''), record.get('task_id', ''))
        self.connection.pending.append(record)

    def close(self):
        pass


@pytest.fixture
def database(monkeypatch):
    database = FakeDatabase()
    monkeypatch.setattr(mysql.connector, 'connect', database.connect)
    return database


def make_store():
    return MySQLTraceStore({'host': 'isolated', 'database': 'isolated'})


def test_append_reuses_connection_and_commits_every_record(database):
    store = make_store()
    initialization_connections = len(database.connections)
    for index in range(3):
        store.append({'event': str(index), 'trace_id': 'T1', 'task_id': 'TASK1'})
        assert len(database.rows) == index + 1  # visible before the next append
    assert len(database.connections) == initialization_connections + 1
    assert database.connections[-1].commits == 3
    store.close()
    assert all(connection.closed for connection in database.connections)


def test_append_does_not_return_before_its_commit(database):
    store = make_store()
    database.block_commit = True
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(store.append, {'event': 'sync'})
        try:
            assert database.commit_entered.wait(2)
            assert not future.done()
        finally:
            database.release_commit.set()
        future.result(timeout=2)
    assert database.rows == [{'event': 'sync'}]


def test_concurrent_append_serializes_one_connection_and_preserves_all_records(database):
    store = make_store()
    initialization_connections = len(database.connections)
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(lambda index: store.append({'event': str(index)}), range(20)))
    assert {row['event'] for row in database.rows} == {str(index) for index in range(20)}
    assert len(database.rows) == 20
    assert len(database.connections) == initialization_connections + 1


def test_unknown_commit_is_not_replayed_and_next_record_gets_fresh_connection(database):
    store = make_store()
    store.append({'event': 'first'})
    previous = database.connections[-1]
    database.fail_next_commit = True
    with pytest.raises(StorageUnavailable) as failure:
        store.append({'event': 'unknown'})
    assert 'SECRET' not in str(failure.value)
    assert '2013' in str(failure.value)
    assert previous.closed is True
    assert previous.rollbacks == 1
    assert [row['event'] for row in database.rows] == ['first', 'unknown']
    store.append({'event': 'next'})
    assert database.connections[-1] is not previous
    assert [row['event'] for row in database.rows] == ['first', 'unknown', 'next']


def test_recorder_keeps_failed_persistence_warning_instead_of_claiming_saved(database):
    store = make_store()
    recorder = TraceRecorder(store=store)
    database.fail_next_commit = True
    record = recorder.record(event='uncertain', type='runtime')
    assert record['storage_warning']
    assert recorder.storage_error
    assert len(database.rows) == 1  # no replay even when acknowledgement was lost


@pytest.mark.parametrize('ticks', [(0, 31), (0, 20, 40, 60, 80, 100, 120, 140, 160,
                                          180, 200, 220, 240, 260, 280, 301)])
def test_idle_or_old_connections_rotate_before_the_next_insert(database, monkeypatch, ticks):
    import app.harness.trace_store as module
    clock = [0]
    monkeypatch.setattr(module, 'monotonic', lambda: clock[0], raising=False)
    store = make_store()
    previous = None
    for tick in ticks:
        clock[0] = tick
        store.append({'event': str(tick)})
        if previous is None:
            previous = database.connections[-1]
    assert previous.closed is True
    assert database.connections[-1] is not previous
    assert len(database.connections) == 3  # initialization and two append connections
    assert len(database.rows) == len(ticks)
