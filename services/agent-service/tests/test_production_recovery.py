from types import SimpleNamespace
import pytest
from app.harness import TraceRecorder
from app.runtime.recovery import RecoveryManager, RecoveryConflict
from app.runtime.durable_store import DurableJsonStore
from app.production_simulation.coordinator import VirtualProductionCoordinator
from shared.virtual_turning import VirtualProductionError
from virtual_production_test_support import production_backend, OWNER
from test_virtual_factory_client import isolated_factory, run, setup
from test_virtual_production_reconciliation import coordinator


def test_failed_production_resumes_original_job_and_never_prepares_again(tmp_path):
    store = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    calls = []
    job = {'job_id': 'SIM-JOB-original', 'status': 'prepared', 'sync_status': 'synced', 'actor_id': 'owner',
           'program': {'device_id': 'D'}, 'revision': 1, 'factory_command_id': 'original-command'}
    def execute(action, arguments, context):
        calls.append((action, dict(arguments)))
        if len(calls) == 1: raise VirtualProductionError('connection_failed', '本地连接断开', 503)
        job['status'] = 'received'
        return dict(job)
    backend = SimpleNamespace(get=lambda actor, identity: dict(job))
    production = VirtualProductionCoordinator(backend, SimpleNamespace(), SimpleNamespace(execute_virtual_production=execute), TraceRecorder())
    production.recovery = store
    actor = {'user_id': 'owner', 'role': 'technician'}
    with pytest.raises(VirtualProductionError):
        production.sync(actor, job['job_id'])
    saved = store.list()[0]
    result = store.resume(saved['recovery_id'], 'one', lambda record: production.resume_failed(record, actor))
    assert result['status'] == 'completed'
    assert calls == [('sync', {'job_id': job['job_id']})] * 2


def test_production_recovery_requires_original_owner(tmp_path):
    production = VirtualProductionCoordinator(None, None, None, None)
    with pytest.raises(RecoveryConflict):
        production.resume_failed({'state': {'recovery_actor_id': 'owner'}}, {'user_id': 'other'})


def test_saved_inspection_is_reused_without_inspecting_again(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    job = {'job_id': 'SIM-JOB-original', 'actor_id': 'owner', 'status': 'completed', 'sync_status': 'confirmed',
           'part_id': 'SIM-PART-original', 'inspection': {'job_id': 'SIM-JOB-original', 'actor_id': 'owner',
           'part_id': 'SIM-PART-original', 'output_digest': 'frozen', 'check_id': 'CHECK-original'}}
    backend = SimpleNamespace(get=lambda *args: job)
    production = VirtualProductionCoordinator(backend, None, None, None)
    state = {'task_id': job['job_id'] + ':inspect', 'recovery_actor_id': 'owner',
             'production_job_id': job['job_id'], 'production_action': 'inspect',
             'production_arguments': {'part_id': job['part_id'], 'output_digest': 'frozen'},
             'next_action': {'target': 'quality', 'side_effect': True},
             'runtime_execution': {'side_effect_status': 'unknown'}}
    saved = manager.checkpoint(state, 'failed', kind='production')
    result = manager.resume(saved['recovery_id'], 'one', lambda record: production.resume_failed(record, {'user_id': 'owner'}))
    assert result['status'] == 'completed'


def test_actual_factory_submit_receipt_recovery_does_not_submit_twice(tmp_path, production_backend, isolated_factory, monkeypatch):
    target, backend = coordinator(production_backend, isolated_factory)
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3'))); target.recovery = manager
    job = target.prepare(OWNER, {'command_id': 'recovery-submit', 'run': run(), 'setup': setup(), 'material': '钢', 'batch_id': 'A'})
    original = target.operations.execute_virtual_production
    def lost(action, arguments, context):
        result = original(action, arguments, context)
        if action == 'submit': raise VirtualProductionError('response_lost', '回执丢失', 503)
        return result
    monkeypatch.setattr(target.operations, 'execute_virtual_production', lost)
    with pytest.raises(VirtualProductionError): target.submit(OWNER, job['job_id'], job['program_digest'])
    identity = manager.identifier(job['job_id'] + ':submit', 'production')
    assert manager.resume(identity, 'one', lambda record: target.resume_failed(record, OWNER))['status'] == 'completed'
    assert manager.resume(identity, 'one', lambda record: pytest.fail('repeated recovery'))['status'] == 'completed'
    assert len([call for call in isolated_factory[2] if call['method'] == 'POST']) == 1
    assert len(production_backend.repository.list_records('sim_production_job')) == 1


def test_actual_saved_inspection_is_recovered_without_creating_a_second_check(tmp_path, production_backend, isolated_factory, monkeypatch):
    target, backend = coordinator(production_backend, isolated_factory)
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3'))); target.recovery = manager
    job = target.prepare(OWNER, {'command_id': 'recovery-inspect', 'run': run(), 'setup': setup(), 'material': '钢', 'batch_id': 'A'})
    target.submit(OWNER, job['job_id'], job['program_digest']);target.start(OWNER, job['job_id'], job['program_digest'])
    isolated_factory[1].tick(20);target.reconcile_saved(backend.get(OWNER, job['job_id']))
    complete = backend.get(OWNER, job['job_id']);original = target.operations.inspect_virtual_output
    def lost(*args):
        original(*args)
        raise VirtualProductionError('response_lost', '回执丢失', 503)
    monkeypatch.setattr(target.operations, 'inspect_virtual_output', lost)
    with pytest.raises(VirtualProductionError): target.inspect(OWNER, job['part_id'], complete['output']['output_digest'])
    posts = len([call for call in isolated_factory[2] if call['method'] == 'POST'])
    identity = manager.identifier(job['job_id'] + ':inspect', 'production')
    assert manager.resume(identity, 'one', lambda record: target.resume_failed(record, OWNER))['status'] == 'completed'
    assert len(production_backend.repository.list_records('sim_quality_check')) == 1
    assert len(production_backend.repository.list_records('sim_production_job')) == 1
    assert len([call for call in isolated_factory[2] if call['method'] == 'POST']) == posts


def test_unknown_start_without_confirmed_receipt_does_not_issue_a_start(tmp_path):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')));reads=[]
    job={'job_id':'SIM-JOB-original','actor_id':'owner','status':'received','sync_status':'outcome_unknown',
         'program_digest':'fixed','factory_command_id':'original','revision':1}
    backend=SimpleNamespace(get=lambda *args:dict(job),sync_receipt=lambda *args:reads.append('save_receipt') or dict(job))
    factory=SimpleNamespace(by_command=lambda *args:reads.append('read_factory') or {})
    target=VirtualProductionCoordinator(backend,factory,None,None)
    state={'task_id':job['job_id']+':start','recovery_actor_id':'owner','production_job_id':job['job_id'],
           'production_action':'start','production_arguments':{'job_id':job['job_id'],'digest':'fixed'},
           'next_action':{'target':'cad','side_effect':True},'runtime_execution':{'side_effect_status':'unknown'}}
    saved=manager.checkpoint(state,'failed',kind='production')
    result=manager.resume(saved['recovery_id'],'one',lambda record:target.resume_failed(record,{'user_id':'owner'}))
    assert result['status']=='blocked' and reads==['read_factory','save_receipt']
