"""A real saved manual repair produces one factual summary after a successful restart."""
from types import SimpleNamespace

import pytest

from app.agents.memory.agent import MemoryAgent
from app.clients.backend import BackendServiceError
from app.harness.run_business import reconcile_run_business_facts
from app.harness.runs import build_run_records
from app.memory import ExperienceLearningModule
from app.memory.store import BackendLongMemoryStore, ShortMemoryStore
from app.monitor.line_control import LineController
from app.runtime.operations import RuntimeOperations
from test_manual_restart_integration import DirectFactory
from test_simple_manual_repair import IsolatedBackend, create_wrong_order, order


class NoRag:
    def upsert(self, *args, **kwargs):
        raise AssertionError('An unverified manual case summary must not enter verified RAG knowledge')


class MemoryRequests:
    def __init__(self, backend):
        store = object.__new__(BackendLongMemoryStore)
        store.client = backend
        self.agent = MemoryAgent(ExperienceLearningModule(ShortMemoryStore(), store, NoRag()))
        self.calls = []

    def access_memory(self, state, action, from_agent):
        self.calls.append((state, action, from_agent))
        return self.agent.run({**state, 'action': action}).model_dump(mode='json')


@pytest.fixture
def context(tmp_path, monkeypatch):
    monkeypatch.setenv('APP_ENV', 'testing')
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    backend = IsolatedBackend(tmp_path)
    factory = DirectFactory(backend)
    controller = LineController(factory, backend)
    requests = MemoryRequests(backend)
    operations = RuntimeOperations(requests, backend, factory_client=factory, repair_controller=controller)
    order_id = create_wrong_order(backend)
    controller.handle_fault('E1', 'M1', '刀塔旋转超时')
    try:
        yield SimpleNamespace(backend=backend, factory=factory, controller=controller,
                              requests=requests, operations=operations, order_id=order_id)
    finally:
        backend.shutdown()


def complete(ctx):
    return ctx.operations.execute_workorder('mark_repair_completed', {
        'workorder_id': ctx.order_id, 'repair_feedback': {'feedback': '完成'}
    }, actor_id=ctx.backend.actors['owner']['user_id'])


def test_confirmation_automatically_saves_factual_summary_and_repeat_does_not_duplicate(context):
    ctx = context
    result = complete(ctx)
    assert result['machine_control']['state'] == 'running'
    summary = result['memory_result']['experience']
    assert result['memory_result']['success']
    assert summary['source_workorder'] == ctx.order_id and summary['source_event_id'] == 'E1'
    assert summary['source_report'] and summary['cycle_id']
    assert summary['validation_status'] == 'manual_confirmed'
    assert summary['automatic_verification'] is False and summary['rag_saved'] is False
    assert 'passed' not in summary
    assert summary['treatment'] == '完成'
    assert '刀塔旋转超时' in summary['content'] and '人工确认' in summary['content']
    assert '方案建议' in summary['content'] and '完成' in summary['content']
    assert '已执行旧互锁' not in summary['content']
    original = order(ctx.backend, ctx.order_id)
    assert original['status'] == 'completed'
    assert original['repair_verification']['automatic_verification'] is False
    starts = list(ctx.factory.controls)
    assert complete(ctx)['memory_result']['experience']['experience_id'] == summary['experience_id']
    restarted = RuntimeOperations(MemoryRequests(ctx.backend), ctx.backend)
    assert restarted.summarize_repair(ctx.order_id)['experience']['experience_id'] == summary['experience_id']
    assert len(ctx.backend.call('search_experience')['items']) == 1
    assert ctx.factory.controls == starts


def test_summary_business_phase_waits_for_index_receipt(context):
    ctx = context
    complete(ctx)
    records = [{'event': 'goal_parsed', 'timestamp': '2026-10-08T00:00:00Z', 'trace_id': 'T1',
                'state_change': {'source': 'event', 'raw': {'event_id': 'E1', 'device_id': 'M1'}}}]
    records += [{'event': 'agent_completed', 'type': 'agent', 'agent': owner, 'trace_id': 'T1',
                 'timestamp': '2026-10-08T00:00:01Z', 'output': {'success': True}}
                for owner in ['diagnosis', 'maintenance', 'workorder', 'report']]
    facts = ctx.backend.call('get_run_lifecycle', {'event_ids': ['E1']})
    run = reconcile_run_business_facts(build_run_records(records), facts)[0]
    phase = next(p for p in run['phases'] if p['id'] == 'experience')
    assert phase['status'] == 'blocked' and phase['business_record_ids']
    assert '自动同步' in phase['status_reason']
    assert run['status'] == 'blocked'


def test_failed_start_does_not_generate_summary(context):
    ctx = context
    def fail_start(device, action):
        if action == 'start':
            raise RuntimeError('isolated factory start failed')
    ctx.factory.before_control = fail_start
    result = complete(ctx)
    assert result['machine_control']['state'] != 'running'
    assert not ctx.requests.calls
    assert ctx.backend.call('search_experience')['items'] == []


def test_summary_failure_does_not_undo_saved_repair_or_restart_and_can_retry(context):
    ctx = context
    normal = ctx.requests.access_memory
    ctx.requests.access_memory = lambda *a, **k: (_ for _ in ()).throw(OSError('summary storage offline'))
    result = complete(ctx)
    assert result['machine_control']['state'] == 'running'
    assert order(ctx.backend, ctx.order_id)['status'] == 'completed'
    assert result['memory_result']['success'] is False
    assert all(s == 'running' for s in ctx.factory.states.values())
    starts = list(ctx.factory.controls)
    ctx.requests.access_memory = normal
    retried = ctx.operations.summarize_repair(ctx.order_id)
    assert retried['success'], retried
    assert ctx.factory.controls == starts


def test_backend_rejects_summary_before_restart_and_rebuilds_content_from_saved_source(context):
    ctx = context
    confirmed = ctx.backend.request('/internal/team/repair/confirm', {'workorder_id': ctx.order_id,
        'actor_id': ctx.backend.actors['owner']['user_id'], 'feedback': '完成',
        'manual_restart': True})['workorder']
    proposed = {'source_workorder': ctx.order_id, 'validation_status': 'manual_confirmed',
                'learning_scope': 'manual_case_summary', 'content': '编造换件和自动核验通过', 'passed': True}
    with pytest.raises(BackendServiceError, match='成功启动记录'):
        ctx.backend.call('save_experience', {'experience': proposed})
    complete(ctx)
    saved = ctx.backend.call('save_experience', {'experience': proposed})['experience']
    assert '编造' not in saved['content'] and 'passed' not in saved
    assert saved['treatment'] == confirmed['repair_feedback']['feedback']
    assert len(ctx.backend.call('search_experience')['items']) == 1


def test_real_memory_a2a_trace_is_grouped_with_source_fault_and_contains_summary(context):
    from app.a2a.client import A2AClient
    from app.a2a.endpoints import A2AEndpoints
    from app.a2a.requests import A2ARequests
    from app.harness import AgentHarness, TraceRecorder
    ctx = context
    trace = TraceRecorder()
    trace.record(type='loop', event='goal_parsed', trace_id='SOURCE-TRACE',
                 state_change={'source': 'event', 'raw': {'event_id': 'E1', 'device_id': 'M1'}})
    client = A2AClient(trace=trace)
    A2AEndpoints({'memory': AgentHarness(ctx.requests.agent, trace=trace)}).register(client)
    ctx.operations.requests = A2ARequests(client)
    result = complete(ctx)
    assert result['memory_result']['success'], result['memory_result']
    runs = build_run_records(trace.list())
    assert len(runs) == 1 and runs[0]['run_id'] == 'fault:E1'
    assert len(runs[0]['trace_ids']) == 2
    invocation = next(r for r in trace.list() if r.get('agent') == 'memory' and r.get('event') == 'agent_completed')
    assert invocation['output']['experience']['source_workorder'] == ctx.order_id
    assert '实际处理说明：完成' in invocation['output']['experience']['content']
    # Lightweight polling must retain the correlation, without loading the body.
    indexed = build_run_records(trace.list_run_index(5000))
    assert len(indexed) == 1 and indexed[0]['run_id'] == 'fault:E1'


def test_completed_summary_survives_a_new_fault_but_backfill_sends_no_device_commands(context):
    ctx = context
    first = complete(ctx)['memory_result']['experience']
    ctx.controller.handle_fault('NEW-FAULT', 'M1', 'new fault')
    controls = list(ctx.factory.controls)
    backfill = ctx.operations.summarize_repair(ctx.order_id)
    assert backfill['success'] and backfill['experience']['experience_id'] == first['experience_id']
    assert ctx.factory.controls == controls and ctx.backend.status()['state'] == 'stopped'


def test_unconfirmed_or_forged_source_cannot_create_a_manual_summary(context):
    ctx = context
    rejected = ctx.requests.agent.run({'action': 'summarize', 'workorder': order(ctx.backend, ctx.order_id),
                                      'report': {'state': 'running', 'restart_method': 'manual_confirmation'}})
    assert not rejected.success and ctx.backend.call('search_experience')['items'] == []
    complete(ctx)
    ctx.backend.rpc(op='patch', workorder_id=ctx.order_id, remove=['technician_confirmation'])
    rejected = ctx.operations.summarize_repair(ctx.order_id)
    assert not rejected['success']


@pytest.mark.parametrize('runtime_stop,expected', [('00:00:01', 'completed'), ('00:00:03', 'blocked')])
def test_summary_completion_compares_business_progress_to_runtime_stop_not_later_summary_trace(runtime_stop, expected):
    records = [{'type': 'loop', 'event': 'goal_parsed', 'trace_id': 'SOURCE',
                'timestamp': '2026-10-09T00:00:00Z',
                'state_change': {'source': 'event', 'raw': {'event_id': 'E1', 'device_id': 'M1'}}}]
    records += [{'type': 'agent', 'event': 'agent_completed', 'agent': agent, 'trace_id': 'SOURCE',
                 'timestamp': '2026-10-09T00:00:00Z', 'output': {'success': True}}
                for agent in ['diagnosis', 'maintenance', 'workorder', 'report']]
    records += [{'type': 'loop', 'event': 'loop_stop', 'agent': 'runtime', 'node': 'runtime',
                 'trace_id': 'SOURCE', 'timestamp': f'2026-10-09T{runtime_stop}Z',
                 'state_change': {'status': 'blocked', 'stop_reason': 'replan_limit_exceeded'}},
                {'type': 'agent', 'event': 'agent_completed', 'agent': 'memory', 'trace_id': 'SUMMARY',
                 'timestamp': '2026-10-09T00:00:04Z', 'context': {'event_id': 'E1', 'device_id': 'M1'},
                 'output': {'success': True}}]
    saved_at = '2026-10-09T00:00:02Z'
    facts = {'workorders': [{'workorder_id': 'WO1', 'event_id': 'E1', 'device_id': 'M1',
                            'status': 'completed', 'assignee': 'U1', 'updated_at': saved_at}],
             'reports': [{'report_id': 'R1', 'workorder_ids': ['WO1'], 'status': 'completed', 'created_at': saved_at}],
             'experiences': [{'experience_id': 'X1', 'source_workorder': 'WO1', 'validation_status': 'manual_confirmed',
                              'learning_scope': 'manual_case_summary', 'confirmation_receipt_id': 'TCF1',
                              'memory_saved': True, 'rag_saved': True, 'created_at': saved_at}]}
    run = reconcile_run_business_facts(build_run_records(records), facts)[0]
    assert run['status'] == expected
