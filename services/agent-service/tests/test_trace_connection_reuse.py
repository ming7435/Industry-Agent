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
        self.coverage = {}
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
        self.coverage_pending = {}
        self.closed = False
        self.active = False
        self.commits = 0
        self.rollbacks = 0

    def cursor(self):
        assert not self.closed
        return FakeCursor(self)

    def commit(self):
        self.commits += 1
        self.database.coverage.update(self.coverage_pending)
        self.coverage_pending = {}
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
        self.coverage_pending = {}
        self.active = False

    def close(self):
        self.closed = True


class FakeCursor:
    def __init__(self, connection):
        self.connection = connection

    def execute(self, sql, parameters=()):
        self.sql, self.parameters = sql, parameters
        if sql.startswith('CREATE TABLE'):
            return
        if sql.startswith('INSERT INTO agent_trace_coverage'):
            identity, started, covered, gaps = parameters
            self.connection.coverage_pending[identity] = {'started_at': started, 'last_covered_at': covered,
                                                        'closed_at': None, 'gap_days': gaps}
            self.rowcount = 1
            return
        if sql.startswith('UPDATE agent_trace_coverage SET last_covered_at='):
            covered, closed, gaps, identity = parameters
            current = self.connection.database.coverage.get(identity)
            self.rowcount = int(bool(current and current['closed_at'] is None))
            if self.rowcount:
                self.connection.coverage_pending[identity] = {**current, 'last_covered_at': covered,
                                                            'closed_at': closed, 'gap_days': gaps}
            return
        if sql.startswith('UPDATE agent_trace_coverage SET closed_at='):
            closed, expired, owner = parameters
            for key, row in self.connection.database.coverage.items():
                if key != owner and row['closed_at'] is None and row['last_covered_at'] < expired:
                    self.connection.coverage_pending[key] = {**row, 'closed_at': closed}
            return
        if sql.startswith('SELECT'):
            return
        assert sql.startswith('INSERT INTO agent_execution_trace')
        assert not self.connection.active, 'parallel users shared an open transaction'
        self.connection.active = True
        sleep(0.002)
        record = json.loads(parameters[2])
        assert parameters[:2] == (record.get('trace_id', ''), record.get('task_id', ''))
        self.connection.pending.append(record)

    def fetchone(self):
        assert 'MAX(sequence_id)' in self.sql
        return (len(self.connection.database.rows),)

    def fetchall(self):
        if 'FROM agent_trace_coverage' in self.sql:
            rows = {**self.connection.database.coverage, **self.connection.coverage_pending}
            return list(rows.values())
        assert self.sql.startswith('SELECT sequence_id,')
        return [(i, json.dumps(row)) for i, row in enumerate(self.connection.database.rows, 1)]

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


def test_persistent_coverage_keeps_write_gap_after_recovery_and_new_recorder(database, monkeypatch):
    from datetime import datetime, timezone
    from app.harness.trace_coverage import CoverageTracker
    clock = [datetime(2026, 10, 1)]
    monkeypatch.setattr('app.harness.trace_store.CoverageTracker', lambda: CoverageTracker(clock=lambda: clock[0]))
    store = make_store()
    store.append({'event': 'initial'})
    clock[0] = datetime(2026, 10, 7)
    database.fail_next_commit = True
    with pytest.raises(StorageUnavailable):
        store.append({'event': 'uncertain'})
    clock[0] = datetime(2026, 10, 13)
    store.append({'event': 'recovered'})
    fresh = make_store()
    page = fresh.skill_window_page(datetime(2026, 10, 5, tzinfo=timezone.utc), datetime(2026, 10, 12, tzinfo=timezone.utc))
    assert page['recording_complete'] is False
    assert any('2026-10-07' in row['gap_days'] for row in database.coverage.values())


def test_persistent_coverage_proves_healthy_full_window(database, monkeypatch):
    from datetime import datetime, timezone
    from app.harness.trace_coverage import CoverageTracker
    clock = [datetime(2026, 10, 1)]
    monkeypatch.setattr('app.harness.trace_store.CoverageTracker', lambda: CoverageTracker(clock=lambda: clock[0]))
    store = make_store()
    clock[0] = datetime(2026, 10, 13)
    page = store.skill_window_page(datetime(2026, 10, 5, tzinfo=timezone.utc), datetime(2026, 10, 12, tzinfo=timezone.utc))
    assert page['recording_complete'] is True


def test_close_never_opens_a_new_database_connection(database):
    store = make_store()
    initialization_connections = len(database.connections)
    store.close()
    assert len(database.connections) == initialization_connections
