"""Unknown outcomes and background polling never trigger another production action."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
import threading
import time
from types import SimpleNamespace
import pytest

from virtual_production_test_support import production_backend, OWNER
from test_virtual_factory_client import isolated_factory, run, setup
from test_virtual_production_agents import runtime


def coordinator(production_backend, isolated_factory):
    from app.production_simulation.backend import VirtualProductionBackend
    from app.production_simulation.factory import VirtualFactoryClient
    from app.production_simulation.coordinator import VirtualProductionCoordinator
    system = runtime()
    backend = VirtualProductionBackend(production_backend.client)
    factory = VirtualFactoryClient(isolated_factory[0], timeout=1)
    return VirtualProductionCoordinator(backend, factory, system.operations, system.trace), backend


def prepared(target, command='reconcile-1'):
    return target.prepare(OWNER, {'command_id': command, 'run': run(), 'setup': setup(), 'material': '钢', 'batch_id': 'A'})


def test_unknown_receive_reconciles_one_factory_job(production_backend, isolated_factory):
    target, backend = coordinator(production_backend, isolated_factory)
    job = prepared(target)
    isolated_factory[3]['lost'] = True
    received = target.submit(OWNER, job['job_id'], job['program_digest'])
    assert received['status'] == 'received'
    replay = target.submit(OWNER, job['job_id'], job['program_digest'])
    assert replay['factory_job_id'] == received['factory_job_id']
    posts = [call for call in isolated_factory[2] if call['method'] == 'POST']
    assert len(posts) == 1
    assert posts[0]['body']['command_id'] == job['factory_command_id']


def test_background_reconciliation_saves_without_browser(production_backend, isolated_factory):
    from app.production_simulation.reconciler import VirtualProductionReconciler
    target, backend = coordinator(production_backend, isolated_factory)
    job = prepared(target)
    target.submit(OWNER, job['job_id'], job['program_digest'])
    target.start(OWNER, job['job_id'], job['program_digest'])
    isolated_factory[1].tick(20)
    isolated_factory[2].clear()
    worker = VirtualProductionReconciler(target, backend, clock=lambda: 10**12)
    try:
        worker.run_once(10**12)
        saved = backend.get(OWNER, job['job_id'])
        assert saved['status'] == 'completed'
        assert saved['output']['profile']['outer_diameter_mm'] == 20
        assert len(production_backend.repository.list_records('sim_produced_part')) == 1
        assert all(call['method'] == 'GET' for call in isolated_factory[2])
    finally: worker.close()


def test_backend_receipt_failure_then_restart_restores_original_command(production_backend, isolated_factory, monkeypatch):
    from app.production_simulation.reconciler import VirtualProductionReconciler
    from shared.virtual_turning import VirtualProductionError
    target, backend = coordinator(production_backend, isolated_factory)
    job = prepared(target)
    original = backend.record_receipt
    def fail(*args, **kwargs): raise VirtualProductionError('backend-offline', 'storage lost response', 503)
    monkeypatch.setattr(backend, 'record_receipt', fail)
    try: target.submit(OWNER, job['job_id'], job['program_digest'])
    except VirtualProductionError: pass
    assert backend.get(OWNER, job['job_id'])['sync_status'] == 'outcome_unknown'
    monkeypatch.setattr(backend, 'record_receipt', original)
    first = VirtualProductionReconciler(target, backend); first.close()
    resumed = VirtualProductionReconciler(target, backend)
    try: resumed.run_once(10**12)
    finally: resumed.close()
    saved = backend.get(OWNER, job['job_id'])
    assert saved['status'] == 'received'
    assert isolated_factory[1].by_command(job['factory_command_id'])['job_id'] == saved['factory_job_id']
    assert len([call for call in isolated_factory[2] if call['method'] == 'POST']) == 1


def test_restart_does_not_automatically_resume_paused_job(production_backend, isolated_factory, monkeypatch):
    from app.production_simulation.reconciler import VirtualProductionReconciler
    target, backend = coordinator(production_backend, isolated_factory)
    job = prepared(target)
    received = target.submit(OWNER, job['job_id'], job['program_digest'])
    target.start(OWNER, job['job_id'], job['program_digest'])
    line = isolated_factory[1].factory
    monkeypatch.setattr(line, 'list_devices', lambda: [{'device_id': 'TRAK-TC820LTYSI-001', 'status': 'alarm'}])
    isolated_factory[1].tick(1)
    assert isolated_factory[1].get(received['factory_job_id'])['status'] == 'paused'
    count = len([call for call in isolated_factory[2] if call['path'].endswith('/start')])
    worker = VirtualProductionReconciler(target, backend)
    try: worker.run_once(10**12)
    finally: worker.close()
    assert backend.get(OWNER, job['job_id'])['status'] == 'paused'
    assert len([call for call in isolated_factory[2] if call['path'].endswith('/start')]) == count


def test_simultaneous_submit_and_background_sync_cannot_duplicate_output(production_backend, isolated_factory):
    from app.production_simulation.reconciler import VirtualProductionReconciler
    target, backend = coordinator(production_backend, isolated_factory)
    job = prepared(target)
    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(lambda _: target.submit(OWNER, job['job_id'], job['program_digest']), range(2)))
    assert len({item['factory_job_id'] for item in outcomes}) == 1
    target.start(OWNER, job['job_id'], job['program_digest']); isolated_factory[1].tick(20)
    worker = VirtualProductionReconciler(target, backend)
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda i: target.sync(OWNER, job['job_id']) if i == 0 else worker.run_once(10**12), range(2)))
    finally: worker.close()
    assert backend.get(OWNER, job['job_id'])['status'] == 'completed'
    assert len(production_backend.repository.list_records('sim_produced_part')) == 1


def test_unknown_start_is_queried_without_automatic_write(production_backend, isolated_factory):
    from app.production_simulation.reconciler import VirtualProductionReconciler
    target, backend = coordinator(production_backend, isolated_factory)
    job = prepared(target); target.submit(OWNER, job['job_id'], job['program_digest'])
    isolated_factory[3]['lost'] = True
    target.start(OWNER, job['job_id'], job['program_digest'])
    target.start(OWNER, job['job_id'], job['program_digest'])
    worker = VirtualProductionReconciler(target, backend)
    try: worker.run_once(10**12)
    finally: worker.close()
    assert len([call for call in isolated_factory[2] if call['path'].endswith('/start')]) == 1


def test_reconciler_is_bounded_and_pages_without_starvation():
    from app.production_simulation.reconciler import VirtualProductionReconciler
    jobs = [{'job_id': f'SIM-JOB-{i:064x}'} for i in range(65)]
    seen, active, peak = [], 0, 0
    lock = threading.Lock()
    class Backend:
        def pending(self, now, cursor='', limit=50):
            items = [job for job in jobs if job['job_id'] > cursor][:limit]
            return {'items': items, 'next_cursor': items[-1]['job_id'] if items and items[-1] != jobs[-1] else None}
    class Target:
        def reconcile_saved(self, job):
            nonlocal active, peak
            with lock: active += 1; peak = max(peak, active); seen.append(job['job_id'])
            time.sleep(.001)
            with lock: active -= 1
            return {'status': 'received'}
    worker = VirtualProductionReconciler(Target(), Backend(), clock=lambda: 1)
    try:
        for _ in range(5): worker.run_once(1)
        assert set(seen) == {job['job_id'] for job in jobs}
        assert peak <= 4
        worker.start(); worker.close()
        assert not worker.running
    finally: worker.close()


def test_backend_unavailable_polling_backs_off_without_persistent_writes():
    from app.production_simulation.reconciler import VirtualProductionReconciler
    seen = []
    class Backend:
        def pending(self, now, cursor='', limit=50):
            return {'items': [{'job_id': 'SIM-JOB-' + 'a' * 64}], 'next_cursor': None}
    class Target:
        def reconcile_saved(self, job):
            seen.append(job['job_id'])
            raise OSError('isolated backend unavailable')
    worker = VirtualProductionReconciler(Target(), Backend(), clock=lambda: 0)
    try:
        for now in [0, 2, 4, 5, 10, 14, 15, 20, 34, 35, 40, 64, 65]: worker.run_once(now)
        assert len(seen) == 5  # 0, 5, 15, 35, 65; then continue at 30-second intervals.
    finally: worker.close()
