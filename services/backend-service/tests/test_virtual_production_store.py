"""Persistent identity, transaction and ownership invariants for virtual factory facts."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from pathlib import Path
import sys
import time
import json
from types import SimpleNamespace
from threading import Event, get_ident

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tests/unit'))
from test_virtual_turning import run, setup, factory_module, RunningLine
from test_production_part_transaction import repository, Cursor, Connection
from shared.virtual_turning import VirtualProductionError

OWNER = {'user_id': 'USER-1', 'role': 'technician', 'username': '生产员'}
OTHER = {'user_id': 'USER-2', 'role': 'technician', 'username': '另一生产员'}
SUPERVISOR = {'user_id': 'USER-3', 'role': 'supervisor', 'username': '监督'}


@pytest.fixture(params=[False, True], ids=['sqlite', 'mysql-dialect'])
def service(tmp_path, request):
    from app.production_simulation.service import VirtualProductionService
    target = repository(tmp_path, request.param)
    if request.param:
        class ReadCursor(Cursor):
            def fetchall(self):
                rows = self.cursor.fetchall()
                return [dict(zip([field[0] for field in self.cursor.description], row)) for row in rows] if self.dictionary else rows
        class ReadConnection(Connection):
            def cursor(self, dictionary=False): return ReadCursor(self.raw, dictionary)
        target._connector = SimpleNamespace(connect=lambda **_: ReadConnection(str(tmp_path / 'isolated-records.db')))
    return VirtualProductionService(target)


@pytest.fixture
def factory(tmp_path):
    store = factory_module().ProductionStore(tmp_path / 'factory', RunningLine())
    try: yield store
    finally: store.close()


def prepare(service, command='prepare-1', actor=OWNER, batch='batch-1', design=None):
    return service.prepare(actor, command, design or run(), setup(), '模拟钢材', batch)


def complete(service, factory, job):
    received = factory.submit(job['factory_command_id'], job['program'])
    saved = service.record_receipt(OWNER, job['job_id'], job['revision'], received)
    factory.start(received['job_id'], received['program_digest'], OWNER['username'])
    factory.tick(20)
    receipt = factory.get(received['job_id'])
    return service.record_receipt(OWNER, job['job_id'], saved['revision'], receipt), receipt


def test_idempotent_plan_and_completed_output(service, factory):
    first = prepare(service)
    replay = prepare(service)
    assert first['job_id'] == replay['job_id']
    assert len(service.repository.list_records('sim_production_job')) == 1
    completed, receipt = complete(service, factory, first)
    assert completed['status'] == 'completed'
    assert completed['output']['profile']['outer_diameter_mm'] == 20
    again = service.record_receipt(OWNER, first['job_id'], completed['revision'], receipt)
    assert again['output']['output_digest'] == completed['output']['output_digest']
    assert len(service.repository.list_records('sim_produced_part')) == 1
    for record in ['production_part', 'quality', 'simulated_quality_batch']:
        assert service.repository.list_records(record) == []


@pytest.mark.parametrize('view', ['detail', 'directory'])
def test_completion_between_job_and_output_reads_never_creates_false_review(service, factory, monkeypatch, view):
    job = prepare(service)
    received = factory.submit(job['factory_command_id'], job['program'])
    saved = service.record_receipt(OWNER, job['job_id'], job['revision'], received)
    factory.start(received['job_id'], received['program_digest'], '测试'); factory.tick(1)
    running = service.record_receipt(OWNER, job['job_id'], saved['revision'], factory.get(received['job_id']))
    factory.tick(20); final_receipt = factory.get(received['job_id'])
    entered, committed = Event(), Event()
    reader_thread, original_read = get_ident(), service._read
    paused = False
    def paused_read(identity):
        nonlocal paused
        value = original_read(identity)
        if get_ident() == reader_thread and not paused:
            paused = True; entered.set(); committed.wait(timeout=1)
        return value
    monkeypatch.setattr(service, '_read', paused_read)
    def writer():
        assert entered.wait(timeout=3)
        value = service.record_receipt(OWNER, job['job_id'], running['revision'], final_receipt)
        committed.set()
        return value
    with ThreadPoolExecutor(max_workers=1) as pool:
        pending = pool.submit(writer)
        value = service.get(OWNER, job['job_id']) if view == 'detail' else service.list_jobs(OWNER)['items'][0]
        assert value['sync_status'] == 'confirmed', value.get('error_code')
        assert bool(value['output']) == (value['status'] == 'completed')
        assert pending.result(timeout=3)['status'] == 'completed'
    assert service.get(OWNER, job['job_id'])['output'] is not None


def test_immutable_factory_bytes_survive_numeric_json_database_reformatting(service, factory, monkeypatch):
    # Binary JSON stores can reformat DOUBLE values on extraction. Reproduce
    # the verified MySQL boundary without weakening any digest verification.
    target = getattr(service.repository, 'raw', service.repository)
    original = target.save_record
    def reformatted(kind, identity, value):
        stored = json.loads(json.dumps(value), parse_float=lambda text: float(format(float(text), '.15g')))
        return original(kind, identity, stored)
    monkeypatch.setattr(target, 'save_record', reformatted)
    job = prepare(service, 'database-byte-roundtrip')
    assert service.get(OWNER, job['job_id'])['program'] == job['program']
    completed, receipt = complete(service, factory, job)
    assert service.get(OWNER, job['job_id'])['receipt'] == receipt
    check = service.inspect(OWNER, job['part_id'], completed['output']['output_digest'])
    assert check['status'] == 'pass'
    assert service.get(OWNER, job['job_id'])['inspection']['check_id'] == check['check_id']


def test_same_command_with_other_design_or_setup_is_conflict(service):
    first = prepare(service)
    config = setup(); config['spindle_rpm'] = 2000
    with pytest.raises(VirtualProductionError) as error:
        service.prepare(OWNER, 'prepare-1', run(), config, '模拟钢材', 'batch-1')
    assert error.value.status == 409
    other = run(); other['run_id'] = 'FC-' + 'b' * 64
    with pytest.raises(VirtualProductionError): prepare(service, design=other)
    assert service.get(OWNER, first['job_id'])['program_digest'] == first['program_digest']


def test_old_revision_cannot_replace_new_fact(service, factory):
    job = prepare(service)
    receipt = factory.submit(job['factory_command_id'], job['program'])
    saved = service.record_receipt(OWNER, job['job_id'], job['revision'], receipt)
    with pytest.raises(VirtualProductionError) as error:
        service.record_sync_error(OWNER, job['job_id'], job['revision'], 'late-timeout')
    assert error.value.status == 409
    assert service.get(OWNER, job['job_id'])['revision'] == saved['revision']
    assert service.get(OWNER, job['job_id'])['sync_status'] == 'confirmed'


def test_completion_output_and_receipt_rollback_together(service, factory, monkeypatch):
    job = prepare(service)
    receipt = factory.submit(job['factory_command_id'], job['program'])
    saved = service.record_receipt(OWNER, job['job_id'], job['revision'], receipt)
    factory.start(receipt['job_id'], receipt['program_digest'], '测试')
    factory.tick(20)
    original = service.repository.save_record
    def fail(kind, key, payload):
        if kind == 'sim_produced_part': raise OSError('isolated write failed')
        return original(kind, key, payload)
    monkeypatch.setattr(service.repository, 'save_record', fail)
    with pytest.raises(OSError): service.record_receipt(OWNER, job['job_id'], saved['revision'], factory.get(receipt['job_id']))
    assert service.get(OWNER, job['job_id'])['status'] == 'received'
    assert service.repository.list_records('sim_produced_part') == []


def test_conflicting_completed_receipt_marks_review_without_replacement(service, factory):
    completed, receipt = complete(service, factory, prepare(service))
    bad = deepcopy(receipt); bad['result_profile']['outer_diameter_mm'] = 19
    reviewed = service.record_receipt(OWNER, completed['job_id'], completed['revision'], bad)
    assert reviewed['sync_status'] == 'review'
    assert reviewed['output']['output_digest'] == completed['output']['output_digest']
    with pytest.raises(VirtualProductionError):
        service.inspect(OWNER, completed['part_id'], completed['output']['output_digest'])


@pytest.mark.parametrize('change', ['regress', 'events', 'identity', 'unit', 'nan'])
def test_invalid_receipt_never_advances_confirmed_fact(service, factory, change):
    completed, receipt = complete(service, factory, prepare(service))
    bad = deepcopy(receipt)
    if change == 'regress': bad['status'] = 'running'; bad['progress'] = .5
    if change == 'events': bad['events'][0]['type'] = 'started'
    if change == 'identity': bad['command_id'] = 'foreign-command'
    if change == 'unit': bad['units'] = 'inch'
    if change == 'nan': bad['result_profile']['length_mm'] = float('nan')
    reviewed = service.record_receipt(OWNER, completed['job_id'], completed['revision'], bad)
    assert reviewed['sync_status'] == 'review'
    assert reviewed['receipt'] == receipt


def test_owner_isolation_and_supervisor_access(service):
    job = prepare(service)
    with pytest.raises(VirtualProductionError) as error: service.get(OTHER, job['job_id'])
    assert error.value.status in (403, 404)
    assert service.list_jobs(OTHER)['items'] == []
    assert service.get(SUPERVISOR, job['job_id'])['actor_id'] == OWNER['user_id']
    assert prepare(service, actor=OTHER)['job_id'] != job['job_id']
    with pytest.raises(VirtualProductionError): service.get({}, job['job_id'])


def test_concurrent_first_prepare_keeps_one_immutable_job(service):
    def attempt(rpm):
        config = setup(); config['spindle_rpm'] = rpm
        try: return service.prepare(OWNER, 'race', run(), config, '钢', 'batch-1')['program']['setup']['spindle_rpm']
        except VirtualProductionError: return 'conflict'
    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(attempt, [1000, 2000]))
    assert outcomes.count('conflict') == 1
    assert len(service.repository.list_records('sim_production_job')) == 1


def test_pending_excludes_unsubmitted_and_completed_but_retains_unknown(service, factory):
    job = prepare(service)
    assert service.pending(10**12)['items'] == []
    saved = service.record_sync_error(OWNER, job['job_id'], job['revision'], 'receive_timeout', True)
    assert service.pending(10**12)['items'][0]['factory_command_id'] == job['factory_command_id']
    received = factory.submit(job['factory_command_id'], job['program'])
    saved = service.sync_receipt(job['job_id'], saved['revision'], received)
    assert saved['sync_status'] == 'confirmed'
    factory.start(received['job_id'], received['program_digest'], '测试'); factory.tick(20)
    saved = service.sync_receipt(job['job_id'], saved['revision'], factory.get(received['job_id']))
    assert saved['status'] == 'completed'
    assert service.pending(10**12)['items'] == []


def test_pagination_is_stable_and_filters_design_and_batch(service):
    for i in range(4): prepare(service, f'page-{i}', batch='A' if i % 2 else 'B')
    first = service.list_jobs(OWNER, batch_id='A', limit=1)
    second = service.list_jobs(OWNER, batch_id='A', cursor=first['next_cursor'], limit=1)
    assert first['items'][0]['job_id'] != second['items'][0]['job_id']
    assert second['next_cursor'] is None
    assert service.list_jobs(OWNER, design_run_id='FC-' + 'b' * 64)['items'] == []


def test_internal_api_resolves_role_and_rejects_forged_actor_authority(tmp_path, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.production_simulation.routes import create_router
    from app.team.repository import TeamRepository
    from app.workorder.repository import SQLiteRepository
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'isolated-internal')
    team = TeamRepository(str(tmp_path / 'accounts.db'))
    with team.transaction() as db:
        for actor in (OWNER, OTHER, SUPERVISOR):
            db.execute('INSERT INTO team_accounts VALUES (?,?,?,?,?,?,?,?)',
                       (actor['user_id'], actor['username'], actor['user_id'], 'unused', actor['role'], '', 1, time.time()))
    target = SimpleNamespace(repository=SQLiteRepository(str(tmp_path / 'facts.db')), team=SimpleNamespace(repository=team))
    app = FastAPI(); app.include_router(create_router(lambda: target))
    with TestClient(app) as client:
        path = '/internal/production/virtual/'
        body = {'actor_id': OWNER['user_id'], 'command_id': 'http-plan', 'run': run(), 'setup': setup(), 'material': '钢'}
        assert client.post(path + 'prepare', json=body).status_code == 401
        headers = {'Authorization': 'Bearer isolated-internal'}
        prepared = client.post(path + 'prepare', json=body, headers=headers)
        assert prepared.status_code == 200
        job_id = prepared.json()['result']['job_id']
        assert client.post(path + 'get', json={'actor_id': OTHER['user_id'], 'job_id': job_id}, headers=headers).status_code == 403
        assert client.post(path + 'get', json={'actor_id': SUPERVISOR['user_id'], 'job_id': job_id}, headers=headers).status_code == 200
        assert client.post(path + 'get', json={'actor_id': OTHER['user_id'], 'job_id': job_id, 'role': 'supervisor'}, headers=headers).status_code == 422
        assert client.post(path + 'get', json={'actor_id': 'unknown-user', 'job_id': job_id}, headers=headers).status_code == 401
        assert client.post(path + 'pending', json={'now': time.time(), 'actor_id': OWNER['user_id']}, headers=headers).status_code == 422
        assert client.post(path + 'pending', json={'now': time.time()}).status_code == 401


def test_virtual_lock_failure_rolls_back_guard(service):
    with pytest.raises(ValueError):
        with service.repository.simulation_transaction('test-rollback'):
            raise ValueError('invalid plan')
    assert service.repository.get_record('sim_production_lock', 'test-rollback') is None
