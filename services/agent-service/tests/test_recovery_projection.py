"""Recovery listings must not deserialize completed execution bodies."""
from contextlib import contextmanager
from hashlib import sha256
import json
import sqlite3
from time import time

import pytest

from app.runtime.recovery import RecoveryManager, NAMESPACE, OWNERS
from shared.persistence import MySQLJsonStore, _encode


INDEX = 'runtime_recovery_summary'


@pytest.fixture
def store(tmp_path):
    path = str(tmp_path / 'records.db')
    with sqlite3.connect(path) as db:
        db.execute('CREATE TABLE runtime_records_mysql(namespace TEXT, key_hash TEXT, state_key TEXT, payload BLOB, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(namespace,key_hash))')
    value = MySQLJsonStore.__new__(MySQLJsonStore)
    value.body_reads = 0
    value.fail_summary = False

    class Cursor:
        def __init__(self, db):
            self.db, self.result = db, None

        def execute(self, sql, parameters=()):
            if sql.startswith('SELECT payload FROM runtime_records_mysql') and parameters[0] == NAMESPACE:
                value.body_reads += 1
            if sql.startswith('INSERT INTO runtime_records_mysql') and parameters[0] == INDEX and value.fail_summary:
                raise RuntimeError('projection write failed')
            sql = sql.replace('%s', '?').replace(' FOR UPDATE', '')
            sql = sql.replace('ON DUPLICATE KEY UPDATE payload=VALUES(payload), updated_at=CURRENT_TIMESTAMP(6)',
                              'ON CONFLICT(namespace,key_hash) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP')
            self.result = self.db.execute(sql, parameters)

        def fetchone(self):
            row = self.result.fetchone()
            return dict(row) if row is not None else None

        def fetchall(self):
            return [dict(row) for row in self.result.fetchall()]

    @contextmanager
    def session():
        db = sqlite3.connect(path)
        db.row_factory = sqlite3.Row
        try:
            db.execute('BEGIN IMMEDIATE')
            yield Cursor(db)
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    value._session = session
    value.path = path
    return value


def record():
    return {'recovery_id': 'REC-one', 'kind': 'runtime', 'task_id': 'TASK-one',
            'trace_id': 'TRACE-one', 'status': 'failed', 'created_at': '2026-01-01',
            'updated_at': '2026-01-02', 'instance_id': 'peer', 'epoch': 0, 'attempts': 0,
            'error': 'missing evidence', 'state': {
                'recovery_actor_id': 'USER-one', 'event': {'device_id': 'M1'},
                'runtime_plan': {'actions': [{'payload': {'context': 'a' * 200000}}]},
                'next_action': {'target': 'cad', 'required_capability': 'drawing_search',
                                'side_effect': True, 'payload': {'context': 'b' * 200000}},
                'completed_steps': [{'agent': 'knowledge', 'step': 'search', 'action_id': 'A1',
                                     'result': {'text': 'c' * 200000}}],
                'knowledge': {'documents': [{'text': 'd' * 200000}]},
                'runtime_execution': {'execution_status': 'UNKNOWN'}}}


def test_checkpoint_replacement_uses_locked_metadata_and_rejects_stale_writer(store):
    saved = record()
    store.set(NAMESPACE, saved['recovery_id'], saved)
    store.body_reads = 0
    updated = {**saved, 'updated_at': '2026-01-03', 'state': {'evidence': 'kept', 'runtime_plan': {'actions': [1]}}}
    assert store.replace_recovery_checkpoint(saved['recovery_id'], saved['updated_at'], updated) == updated
    assert store.body_reads == 0
    assert store.replace_recovery_checkpoint(saved['recovery_id'], saved['updated_at'], saved) is None
    assert store.get(NAMESPACE, saved['recovery_id']) == updated


def test_checkpoint_replacement_recovers_a_corrupt_index_and_is_atomic(store):
    saved = record()
    store.set(NAMESPACE, saved['recovery_id'], saved)
    with sqlite3.connect(store.path) as db:
        db.execute('UPDATE runtime_records_mysql SET payload=? WHERE namespace=?', (b'corrupt', INDEX))
    updated = {**saved, 'updated_at': '2026-01-03'}
    assert store.replace_recovery_checkpoint(saved['recovery_id'], saved['updated_at'], updated) == updated
    store.fail_summary = True
    with pytest.raises(RuntimeError, match='projection write failed'):
        store.replace_recovery_checkpoint(saved['recovery_id'], updated['updated_at'], saved)
    assert store.get(NAMESPACE, saved['recovery_id']) == updated


def test_listing_reads_only_metadata_and_preserves_authoritative_snapshot(store):
    saved = record()
    store.set(NAMESPACE, saved['recovery_id'], saved)
    assert store.get(NAMESPACE, saved['recovery_id']) == saved
    store.body_reads = 0
    manager = RecoveryManager(store)
    try:
        item = manager.list()[0]
        assert item['failed_agent'] == 'cad' and item['device_id'] == 'M1'
        assert item['actor_id'] == 'USER-one' and item['requires_reconcile'] is True
        assert item['completed_steps'] == [{'agent': 'knowledge', 'step': 'search', 'action_id': 'A1'}]
        assert len(json.dumps(item)) < 2000
        assert store.body_reads == 0, 'Listing loaded the full completed execution context'
    finally:
        manager.close()


def test_legacy_checkpoint_is_backfilled_once_without_changing_its_body(store):
    saved = record()
    with sqlite3.connect(store.path) as db:
        db.execute('INSERT INTO runtime_records_mysql(namespace,key_hash,state_key,payload) VALUES (?,?,?,?)',
                   (NAMESPACE, sha256(saved['recovery_id'].encode()).hexdigest(), saved['recovery_id'], _encode(saved)))
    manager = RecoveryManager(store)
    try:
        assert manager.list()[0]['task_id'] == 'TASK-one'
        reads = store.body_reads
        assert manager.list()[0]['task_id'] == 'TASK-one'
        assert store.body_reads == reads, 'Legacy contexts were loaded again on the next poll'
        assert store.get(NAMESPACE, saved['recovery_id']) == saved
    finally:
        manager.close()


def test_projection_write_failure_rolls_back_the_full_checkpoint(store):
    store.fail_summary = True
    saved = record()
    with pytest.raises(RuntimeError, match='projection write failed'):
        store.set(NAMESPACE, saved['recovery_id'], saved)
    assert store.get(NAMESPACE, saved['recovery_id']) is None


def test_live_owner_and_approval_gate_are_retained_in_metadata(store):
    saved = record()
    saved['status'] = 'running'
    store.set(NAMESPACE, saved['recovery_id'], saved)
    store.set(OWNERS, 'peer', {'instance_id': 'peer', 'expires_at': time() + 60, 'active_tasks': ['REC-one']})
    manager = RecoveryManager(store)
    try:
        assert manager.list()[0]['can_resume'] is False
        saved['status'] = 'blocked'
        saved['state']['runtime_result'] = {'stop_reason': 'approval_required'}
        store.set(NAMESPACE, saved['recovery_id'], saved)
        assert manager.list()[0]['can_resume'] is False
    finally:
        manager.close()


def test_deleted_checkpoints_are_not_returned_from_an_old_projection(store):
    saved = record()
    store.set(NAMESPACE, saved['recovery_id'], saved)
    store.delete(NAMESPACE, saved['recovery_id'])
    manager = RecoveryManager(store)
    try:
        assert manager.list() == []
    finally:
        manager.close()


def test_checkpoint_update_reads_previous_header_without_an_extra_full_body(store):
    saved = record()
    saved['recovery_id'] = RecoveryManager.identifier(saved['task_id'])
    store.set(NAMESPACE, saved['recovery_id'], saved)
    manager = RecoveryManager(store)
    try:
        state = {**saved['state'], 'task_id': saved['task_id'], 'trace_id': saved['trace_id']}
        updated = manager.checkpoint(state, 'blocked', error='still missing evidence')
        assert updated['created_at'] == saved['created_at']
        assert store.body_reads == 0, 'Checkpoint reread its full body before the atomic compare-and-set'
        assert store.get(NAMESPACE, saved['recovery_id'])['state']['knowledge'] == saved['state']['knowledge']
    finally:
        manager.close()


def test_old_or_corrupt_summary_is_rebuilt_from_the_authoritative_checkpoint(store):
    saved = record()
    store.set(NAMESPACE, saved['recovery_id'], saved)
    with sqlite3.connect(store.path) as db:
        db.execute('UPDATE runtime_records_mysql SET payload=? WHERE namespace=?', (b'broken-summary', INDEX))
    manager = RecoveryManager(store)
    try:
        assert manager.list()[0]['task_id'] == saved['task_id']
        assert manager.list()[0]['requires_reconcile'] is True
    finally:
        manager.close()
