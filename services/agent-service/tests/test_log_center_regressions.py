"""运行索引和真实生命周期回归，不连接业务数据库。"""
import json
from contextlib import contextmanager
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.harness.runs import build_run_records
from app.harness.run_business import reconcile_run_business_facts
from app.harness.trace import TraceRecorder
from app.harness.trace_store import MySQLTraceStore
import pytest


def event(event_name, agent='runtime', **values):
    return {'timestamp': '2026-10-07T02:00:00+00:00', 'trace_id': 'T-1', 'task_id': 'TASK-1',
            'event': event_name, 'agent': agent, **values}


def trigger():
    return event('goal_parsed', state_change={'source': 'trigger', 'raw': {'event_id': 'EV-1', 'device_id': 'D-1'}})


def test_tool_completion_does_not_complete_an_active_agent_phase():
    run = build_run_records([trigger(), event('agent_started', 'diagnosis', type='agent'),
                             event('tool_completed', 'diagnosis', type='tool', tool_name='get_alarm_definition')])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'


@pytest.mark.parametrize('name', ['action_selected', 'policy_decision'])
def test_runtime_dispatcher_does_not_start_workorder_phase(name):
    run = build_run_records([trigger(), event('agent_started', 'diagnosis'),
        event(name, name='runtime_dispatcher', node='runtime', type='runtime')])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'
    assert next(p for p in run['phases'] if p['id'] == 'workorder')['status'] == 'pending'


@pytest.mark.parametrize('report_status,with_experience,expected', [
    ('incomplete', False, 'blocked'), ('completed', True, 'completed'),
])
def test_runs_api_reconciles_saved_business_results(report_status, with_experience, expected):
    trace = TraceRecorder()
    for record in [trigger(), event('agent_completed', 'diagnosis'),
                   event('agent_completed', 'maintenance'),
                   event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'replan_limit_exceeded'})]:
        trace.record(**record)
    facts = {
        'workorders': [{'workorder_id': 'WO-1', 'event_id': 'EV-1', 'device_id': 'D-1',
                       'status': 'completed', 'assignee': 'U-1', 'updated_at': '2026-10-07T02:01:00+00:00'}],
        'reports': [{'report_id': 'RPT-1', 'report_type': 'full_case_report', 'event_ids': ['EV-1'],
                     'device_ids': ['D-1'], 'workorder_ids': ['WO-1'], 'status': report_status,
                     'validation_findings': ['报告缺少有效维修依据'] if report_status == 'incomplete' else []}],
        'experiences': [{'experience_id': 'EXP-1', 'source_workorder': 'WO-1',
                         'validation_status': 'accepted', 'experience_quality_score': .9,
                         'rag_saved': True}] if with_experience else [],
    }
    calls = []
    def call(domain, tool, arguments):
        calls.append((domain, tool, arguments))
        return {'success': True, **facts}
    registry = SimpleNamespace(backend_base_url='http://isolated-backend', mcp=SimpleNamespace(call=call))
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace(trace=trace, registry=registry))))

    response = client.get('/api/v1/runs')
    assert response.status_code == 200
    run = response.json()['runs'][0]
    phases = {p['id']: p['status'] for p in run['phases']}
    assert phases['workorder'] == 'completed'
    assert phases['report'] == ('completed' if report_status == 'completed' else 'blocked')
    assert phases['experience'] == ('completed' if with_experience else 'pending')
    assert run['status'] == expected
    assert calls == [('mes', 'get_run_lifecycle', {'event_ids': ['EV-1']})]
    if report_status == 'incomplete':
        assert '报告缺少有效维修依据' in run['status_reason']


@pytest.mark.parametrize('failure', ['exception', 'unsuccessful'])
def test_runs_api_warns_when_business_state_cannot_be_read(failure):
    trace = TraceRecorder()
    trace.record(**trigger())
    def call(*args):
        if failure == 'unsuccessful':
            return {'success': False, 'error': 'private-backend-detail'}
        raise RuntimeError('private-backend-detail')
    registry = SimpleNamespace(backend_base_url='http://isolated-backend', mcp=SimpleNamespace(call=call))
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace(trace=trace, registry=registry))))
    response = client.get('/api/v1/runs')
    assert response.status_code == 200
    assert response.json()['storage_warning']
    assert 'private-backend-detail' not in response.text


def test_business_results_from_another_fault_or_device_do_not_complete_this_run():
    run = build_run_records([trigger()])[0]
    facts = {
        'workorders': [{'workorder_id': 'WO-OTHER', 'event_id': 'EV-OTHER', 'device_id': 'D-1',
                       'status': 'completed', 'assignee': 'U-1'},
                      {'workorder_id': 'WO-WRONG-DEVICE', 'event_id': 'EV-1', 'device_id': 'D-2',
                       'status': 'completed', 'assignee': 'U-1'}],
        'reports': [{'report_id': 'RPT-OTHER', 'event_ids': ['EV-1'], 'device_ids': ['D-2'], 'status': 'completed'}],
        'experiences': [{'experience_id': 'EXP-OTHER', 'source_workorder': 'WO-OTHER',
                         'validation_status': 'accepted', 'experience_quality_score': .9}],
    }
    reconcile_run_business_facts([run], facts)
    assert {p['id']: p['status'] for p in run['phases'] if p['id'] in {'workorder', 'report', 'experience'}} == {
        'workorder': 'pending', 'report': 'pending', 'experience': 'pending'}


@pytest.mark.parametrize('order_time', [None, '2026-10-07T02:00:00'])
def test_legacy_business_timestamps_do_not_break_the_run_index(order_time):
    run = build_run_records([trigger(), event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'root'})])[0]
    reconcile_run_business_facts([run], {'workorders': [{'workorder_id': 'WO-1', 'event_id': 'EV-1',
        'device_id': 'D-1', 'status': 'completed', 'assignee': 'U-1', 'updated_at': order_time}]})
    assert next(p for p in run['phases'] if p['id'] == 'workorder')['status'] == 'completed'
    assert run['status'] == 'blocked'
    assert run['stop_reason'] == 'root'


def test_later_saved_report_supersedes_the_runtime_stop_reason():
    run = build_run_records([trigger(), event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'root'})])[0]
    reconcile_run_business_facts([run], {'reports': [{'report_id': 'RPT-1', 'event_ids': ['EV-1'],
        'device_ids': ['D-1'], 'status': 'incomplete', 'updated_at': '2026-10-07T02:01:00+00:00',
        'validation_findings': ['未关联质检记录']}]})
    assert run['status'] == 'blocked'
    assert run['stop_reason'] == 'report_incomplete'
    assert run['runtime_stop_reason'] == 'root'
    assert run['status_reason'] == '未关联质检记录'


@pytest.mark.parametrize('name', ['tool_called', 'tool_completed', 'step_completed'])
def test_partial_history_without_agent_terminal_does_not_complete_phase(name):
    run = build_run_records([trigger(), event(name, 'diagnosis', type='tool', tool_name='get_alarm_definition')])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'


def test_late_previous_attempt_completion_does_not_end_current_agent():
    run = build_run_records([trigger(), event('agent_started', 'diagnosis', agent_run_id='D-1'),
                             event('agent_started', 'diagnosis', agent_run_id='D-2'),
                             event('agent_completed', 'diagnosis', agent_run_id='D-1', output={'success': True})])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'


def test_node_started_and_tool_completion_without_node_terminal_is_running():
    run = build_run_records([trigger(), event('node_started', 'diagnosis', node='diagnosis'),
                             event('tool_completed', 'diagnosis', type='tool')])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'


def test_diagnosis_owner_node_terminal_can_complete_legacy_phase():
    run = build_run_records([trigger(), event('node_started', 'diagnosis', node='diagnosis'),
                             event('node_completed', 'diagnosis', node='diagnosis')])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'completed'


def test_child_agent_only_history_does_not_complete_unobserved_owner():
    run = build_run_records([trigger(), event('agent_started', 'knowledge'), event('agent_completed', 'knowledge')])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'


@pytest.mark.parametrize(('owner', 'output'), [
    ('quality', {'quality_check': {'status': 'open', 'result': 'insufficient_data'}}),
    ('report', {'status': 'incomplete'}),
])
def test_node_terminal_without_output_preserves_agent_business_gate(owner, output):
    records = ([trigger()] if owner == 'report' else []) + [
        event('node_started', owner, node=owner), event('agent_started', owner, agent_run_id='A-1'),
        event('agent_completed', owner, agent_run_id='A-1', output=output),
        event('node_completed', owner, node=owner),
    ]
    run = build_run_records(records)[0]
    assert next(p for p in run['phases'] if p['id'] == owner)['status'] == 'blocked'
    assert run['status'] == 'blocked'


def test_new_agent_attempt_is_running_after_previous_attempt_completed():
    run = build_run_records([trigger(), event('agent_completed', 'maintenance', type='agent', agent_run_id='A-1'),
                             event('agent_started', 'maintenance', type='agent', agent_run_id='A-2')])[0]
    assert next(p for p in run['phases'] if p['id'] == 'maintenance')['status'] == 'running'


def test_nested_agent_completion_does_not_complete_diagnosis_owner():
    run = build_run_records([trigger(), event('agent_started', 'diagnosis', agent_run_id='D-1'),
                             event('agent_started', 'knowledge', agent_run_id='K-1'),
                             event('agent_completed', 'knowledge', agent_run_id='K-1', output={'success': True})])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'


def test_successful_retry_does_not_inherit_previous_agent_error():
    run = build_run_records([trigger(), event('agent_started', 'diagnosis', agent_run_id='D-1'),
                             event('agent_error', 'diagnosis', agent_run_id='D-1', error='old failure'),
                             event('agent_started', 'diagnosis', agent_run_id='D-2'),
                             event('agent_completed', 'diagnosis', agent_run_id='D-2', output={'success': True})])[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'completed'
    assert run['status'] == 'running'


def test_new_runtime_iteration_does_not_inherit_previous_blocked_phase():
    run = build_run_records([trigger(), event('loop_start'),
                             event('agent_completed', 'diagnosis', output={'status': 'blocked'}),
                             event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'old'}),
                             event('loop_start')])[0]
    assert run['status'] == 'running'
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'pending'
    assert run['phases'][0]['status'] == 'completed'
    assert run.get('stop_reason', '') == ''


@pytest.mark.parametrize('late', ['node_completed', 'loop_stop'])
def test_late_previous_runtime_event_cannot_complete_or_block_current_execution(late):
    records = [trigger(), event('loop_start'), event('agent_started', 'diagnosis', agent_run_id='D-1'),
               event('loop_start', trace_id='T-2', task_id='TASK-2', event_id='EV-1'),
               event('agent_started', 'diagnosis', trace_id='T-2', task_id='TASK-2', agent_run_id='D-2'),
               event(late, 'diagnosis' if late == 'node_completed' else 'runtime',
                     node='diagnosis' if late == 'node_completed' else 'runtime',
                     state_change={'status': 'blocked', 'stop_reason': 'old'})]
    run = build_run_records(records)[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'running'
    assert run['status'] == 'running'
    assert run.get('stop_reason', '') == ''


def test_learning_loop_is_not_the_root_runtime_restart_or_terminal():
    records = [trigger(), event('loop_start', node='runtime'),
               event('agent_completed', 'diagnosis'),
               event('loop_stop', node='runtime', state_change={'status': 'blocked', 'stop_reason': 'root'}),
               event('loop_start', node='learning', name='learning'),
               event('loop_stop', node='learning', name='learning', state_change={'status': 'completed'})]
    run = build_run_records(records)[0]
    assert next(p for p in run['phases'] if p['id'] == 'diagnosis')['status'] == 'completed'
    assert run['status'] == 'blocked'
    assert run['stop_reason'] == 'root'


def test_runtime_blocked_stop_controls_run_status_and_reason():
    run = build_run_records([trigger(), event('agent_completed', 'diagnosis', type='agent'),
                             event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'replan_limit_exceeded'})])[0]
    assert run['status'] == 'blocked'
    assert run['stop_reason'] == 'replan_limit_exceeded'
    assert next(p for p in run['phases'] if p['id'] == 'maintenance')['status'] == 'pending'


def test_new_runtime_start_does_not_reuse_old_blocked_terminal():
    run = build_run_records([trigger(), event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'old'}),
                             event('loop_start'), event('agent_started', 'diagnosis', type='agent')])[0]
    assert run['status'] == 'running'
    assert run.get('stop_reason', '') == ''


def test_runs_api_uses_lightweight_storage_index_without_reading_full_bodies():
    class Store:
        def list(self, **values):
            raise AssertionError('运行索引不能读取完整 JSON 正文')

        def list_run_index(self, limit):
            return [trigger(), event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'evidence_missing'})]

    trace = TraceRecorder(store=Store())
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace(trace=trace))))
    body = client.get('/api/runs').json()
    assert body['count'] == 1
    assert body['runs'][0]['status'] == 'blocked'
    assert body['runs'][0]['stop_reason'] == 'evidence_missing'
    assert not body.get('storage_warning')


def test_run_index_preserves_quality_gate_and_failed_persistence_memory_events():
    class Store:
        def append(self, record):
            raise OSError('isolated storage offline')

        def list_run_index(self, limit):
            return []

    trace = TraceRecorder(store=Store())
    trace.record(type='agent', event='agent_completed', agent='quality', trace_id='Q-1',
                 context={'run_type': 'quality', 'device_id': 'D-1'},
                 output={'quality_check': {'status': 'open', 'result': 'insufficient_data'}, 'huge': 'x' * 10000})
    trace.record(type='agent', event='agent_completed', agent='report', trace_id='Q-1',
                 context={'run_type': 'quality'}, output={'status': 'completed'})
    records = trace.list_run_index(limit=5000)
    assert len(records) == 2
    assert '持久化不可用' in trace.storage_error
    assert 'huge' not in records[0]['output']
    run = build_run_records(records)[0]
    assert run['status'] == 'blocked'
    assert run['device_id'] == 'D-1'


def test_mysql_run_index_projects_json_in_query_and_preserves_sequence(monkeypatch):
    queries = []

    class Cursor:
        def execute(self, sql, parameters=()):
            queries.append((sql, parameters))

        def fetchall(self):
            if len(queries) == 1:
                return [(2,), (1,)]
            return [(2, json.dumps(event('loop_stop', state_change={'status': 'blocked', 'stop_reason': 'gate'}))),
                    (1, json.dumps(trigger()))]

        def close(self):
            pass

    @contextmanager
    def session(config):
        yield SimpleNamespace(cursor=lambda: Cursor())

    import app.harness.trace_store as module
    monkeypatch.setattr(module, 'mysql_session', session)
    store = object.__new__(MySQLTraceStore)
    store._config = {'database': 'isolated'}
    rows = store.list_run_index(limit=10)
    assert [row['event'] for row in rows] == ['goal_parsed', 'loop_stop']
    assert build_run_records(rows)[0]['status'] == 'blocked'
    assert 'JSON_EXTRACT' in queries[1][0]
    assert 'JSON_MERGE_PATCH' in queries[1][0]
    assert 'JSON_TYPE' in queries[1][0]
    assert 'SELECT sequence_id,payload FROM' not in queries[1][0]
    assert queries[0][1] == (10,)
