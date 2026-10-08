"""Personal list reads use Backend authority without scheduling an Agent execution."""
from copy import deepcopy
from datetime import datetime, timezone
from types import SimpleNamespace
import logging
import re

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app
from app.clients.backend import BackendServiceError


@pytest.fixture
def read_api(monkeypatch):
    orders = [
        {'workorder_id': 'WO-LMY', 'device_id': 'TC', 'event_id': 'EVT-700006',
         'status': 'in_progress', 'assignee': 'U-LMY', 'assignee_name': 'lmy',
         'alarm_code': '', 'steps': ['记录刀塔状态'],
         'diagnosis_snapshot': {'device_id': 'TC', 'fault': '刀塔旋转超时',
                                'raw': {'alarm_code': '700006'}},
         'maintenance_plan_snapshot': {'plan_id': 'P-LMY', 'repair_target': '刀塔系统',
                                       'repair_steps': ['记录刀塔状态']}},
        {'workorder_id': 'WO-OTHER', 'device_id': 'OTHER', 'status': 'in_progress',
         'assignee': 'U-OTHER', 'assignee_name': 'other'},
        {'workorder_id': 'WO-UNASSIGNED', 'device_id': 'TC', 'status': 'open'},
    ]
    backend_calls = []
    agent_calls = []
    trace_events = []
    users = {
        'session-lmy': {'user_id': 'U-LMY', 'role': 'technician'},
        'session-other': {'user_id': 'U-OTHER', 'role': 'technician'},
        'session-supervisor': {'user_id': 'U-SUPERVISOR', 'role': 'supervisor'},
    }

    class Backend:
        outcome = {'success': True, 'items': orders, 'backend': 'backend-service'}
        line = None
        line_reads = 0

        def resolve_session(self, token):
            return users.get(token)

        def call(self, tool, arguments):
            backend_calls.append((tool, deepcopy(arguments)))
            if isinstance(self.outcome, Exception):
                raise self.outcome
            return self.outcome

        def status(self):
            self.line_reads += 1
            if isinstance(self.line, Exception):
                raise self.line
            return deepcopy(self.line)

    backend = Backend()
    monkeypatch.setattr('app.api.server.BackendServiceClient', lambda: backend)
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient', lambda: backend)

    def execute_workorder(*args, **kwargs):
        # Identifies the former HTTP path; real isolated replay recorded 22 trace events.
        agent_calls.append((args, kwargs))
        trace_events.extend(['synchronous-trace'] * 22)
        return {'success': True, 'items': orders}

    operations = SimpleNamespace(execute_workorder=execute_workorder)
    client = TestClient(create_app(SimpleNamespace(container=SimpleNamespace(operations=operations))))
    return SimpleNamespace(client=client, backend=backend, backend_calls=backend_calls,
                           agent_calls=agent_calls, trace_events=trace_events, orders=orders)


def test_personal_list_reads_backend_once_without_agent_execution(read_api):
    before = deepcopy(read_api.orders)
    response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert response.status_code == 200
    body = response.json()
    assert [order['workorder_id'] for order in body['items']] == ['WO-LMY']
    assert body['count'] == 1
    assert body['items'][0]['diagnosis_snapshot']['raw']['alarm_code'] == '700006'
    assert body['items'][0]['execution_review']['required'] is False
    assert read_api.agent_calls == [], f'Pure GET entered Agent operations: {read_api.agent_calls}'
    assert read_api.trace_events == []
    assert read_api.backend_calls == [('list_workorders', {})]
    assert read_api.orders == before


def test_supervisor_can_read_all_authoritative_records(read_api):
    response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-supervisor'})
    assert response.status_code == 200
    assert [o['workorder_id'] for o in response.json()['items']] == ['WO-LMY', 'WO-OTHER', 'WO-UNASSIGNED']
    assert response.json()['count'] == 3
    assert read_api.backend_calls == [('list_workorders', {})]
    assert read_api.agent_calls == []


def test_legacy_query_cannot_enable_deleted_record_view(read_api):
    read_api.orders.append({'workorder_id':'WO-OLD-HIDDEN', 'device_id':'TC', 'assignee':'U-LMY',
                            'plan_id':'P-OLD-HIDDEN', 'deleted_at':'2026-09-28T10:00:00Z'})
    response = read_api.client.get('/api/workorders?include_deleted=true',
                                   headers={'Cookie':'maintenance_session=session-lmy'})
    assert response.status_code==200
    assert [o['workorder_id'] for o in response.json()['items']]==['WO-LMY']
    assert response.json()['deleted_plan_ids']==['P-OLD-HIDDEN']
    assert read_api.agent_calls==[]


def test_request_headers_cannot_expand_personal_scope(read_api):
    response = read_api.client.get('/api/workorders', headers={
        'Cookie': 'maintenance_session=session-other', 'X-Actor-Role': 'supervisor', 'X-Actor-Id': 'U-LMY'})
    assert response.status_code == 200
    assert [o['workorder_id'] for o in response.json()['items']] == ['WO-OTHER']
    assert read_api.backend_calls == [('list_workorders', {})]
    assert read_api.agent_calls == []


@pytest.mark.parametrize('cookie', [None, 'expired-session'])
def test_missing_or_expired_session_does_not_read_business_records(read_api, cookie):
    headers = {'Cookie': 'maintenance_session=' + cookie} if cookie else {}
    response = read_api.client.get('/api/workorders', headers=headers)
    assert response.status_code == 401
    assert read_api.backend_calls == []
    assert read_api.agent_calls == []


@pytest.mark.parametrize('outcome', [
    BackendServiceError('isolated backend unavailable'),
    {'success': False, 'items': []},
    {'success': True},
    {'success': True, 'items': {}},
    {'success': True, 'items': ['invalid-order']},
    None,
])
def test_failed_or_malformed_list_is_a_502_not_empty_success(read_api, outcome, caplog):
    read_api.backend.outcome = outcome
    response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert response.status_code == 502
    assert 'items' not in response.json()
    assert '工单读取失败' in response.json()['detail']
    assert read_api.backend_calls == [('list_workorders', {})]
    assert read_api.agent_calls == []
    assert not any(record.getMessage().startswith('workorder_list_read ') for record in caplog.records)


def test_legitimate_empty_personal_list_stays_successful(read_api):
    read_api.backend.outcome = {'success': True, 'items': [], 'backend': 'backend-service'}
    response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert response.status_code == 200
    assert response.json()['items'] == [] and response.json()['count'] == 0
    assert read_api.backend_calls == [('list_workorders', {})]
    assert read_api.agent_calls == []


def test_successive_lists_observe_current_authority_without_query_cache(read_api):
    first = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    read_api.backend.outcome = {'success': True, 'items': []}
    second = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert first.json()['count'] == 1 and second.json()['count'] == 0
    assert read_api.backend_calls == [('list_workorders', {}), ('list_workorders', {})]
    assert read_api.agent_calls == []


def test_successful_read_logs_only_role_counts_and_elapsed_time(read_api, caplog):
    with caplog.at_level(logging.INFO, logger='uvicorn.error'):
        response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert response.status_code == 200
    entries = [record.getMessage() for record in caplog.records
               if record.name == 'uvicorn.error' and record.getMessage().startswith('workorder_list_read ')]
    assert len(entries) == 1
    message = entries[0]
    assert 'role=technician' in message and 'visible_count=1' in message and 'source_count=3' in message
    assert float(re.search(r'elapsed_ms=(\d+(?:\.\d+)?)', message).group(1)) >= 0
    for private_value in ('U-LMY', 'WO-LMY', 'session-lmy', '700006', '刀塔'):
        assert private_value not in message


def completed_order_and_line(read_api):
    from shared.technician_confirmation import confirmation_digest, trusted_technician_confirmation
    current = read_api.orders[0]
    sample = {'device_id': current['device_id'], 'status': 'running', 'alarm_code': '',
              'metrics': {'pressure': 1}, 'checked_at': datetime.now(timezone.utc).isoformat()}
    checks = {key: True for key in ('device_identity', 'operational', 'alarms_clear',
                                   'metrics_available', 'interlocks_clear', 'recovery_fresh')}
    current.update(status='closed', plan_id='P-LMY', maintenance_confirmed_by=current['assignee'],
        repair_feedback={'operator': current['assignee'], 'feedback': '现场已处理并复测'},
        repair_verification={'source': 'device_recovery', 'phase': 'poststart', 'passed': True,
                             'checks': checks, 'device_recovery': sample})
    receipt = {'schema_version': 1, 'receipt_id': 'ISOLATED-RECEIPT',
        'confirmation_method': 'technician_feedback', 'source': 'backend_team_repair_confirmation',
        'workorder_id': current['workorder_id'], 'device_id': current['device_id'],
        'event_id': current['event_id'], 'plan_id': current['plan_id'], 'actor_id': current['assignee'],
        'plan_snapshot_digest': confirmation_digest(current['maintenance_plan_snapshot']),
        'diagnosis_snapshot_digest': confirmation_digest(current['diagnosis_snapshot']),
        'feedback_digest': confirmation_digest(current['repair_feedback']),
        'confirmed_at': sample['checked_at'],
        'prestart_checks': {**checks, 'ready_to_start': True}}
    current.update(technician_confirmation=receipt, events=[{'payload': {'technician_confirmation': receipt}}])
    assert trusted_technician_confirmation(current)
    outcome = {'state': 'verified', 'device_id': current['device_id'], 'action': 'start', 'snapshot': sample}
    read_api.backend.line = {'state': 'running', 'generation': 20,
        'faults': [{'event_id': current['event_id'], 'device_id': current['device_id'], 'resolved': True}],
        'devices': {current['device_id']: outcome},
        'completed_cycles': [{'cycle_id': 'CYCLE-VERIFIED', 'generation': 20, 'state': 'running',
            'device_ids': [current['device_id']], 'event_ids': [current['event_id']],
            'faults': [{'event_id': current['event_id'], 'device_id': current['device_id']}],
            'devices': {current['device_id']: deepcopy(outcome)}, 'restarted_at': 1791445404.0}]}
    return current


def test_completed_order_read_returns_authoritative_restart_result_for_old_open_tabs(read_api):
    current = completed_order_and_line(read_api)
    before = deepcopy(current)
    response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert response.status_code == 200
    control = response.json()['items'][0]['machine_control']
    assert control['state'] == 'running' and control['generation'] == 20
    assert control['source'] == 'persisted_line_restart' and control['cycle_id'] == 'CYCLE-VERIFIED'
    assert read_api.backend.line_reads == 1
    assert current == before and read_api.agent_calls == []
    assert read_api.backend_calls == [('list_workorders', {})]


@pytest.mark.parametrize('issue', ['prestart_only', 'unconfirmed', 'different_event', 'wrong_device',
                                  'stale_cycle', 'unresolved_fault', 'stopped', 'unverified_readback',
                                  'wrong_snapshot', 'no_cycle', 'unavailable'])
def test_read_result_cannot_turn_incomplete_or_unrelated_recovery_into_success(read_api, issue):
    current = completed_order_and_line(read_api)
    line = read_api.backend.line
    if issue == 'prestart_only': current['repair_verification']['phase'] = 'prestart'
    if issue == 'unconfirmed': current['maintenance_confirmed_by'] = 'other-person'
    if issue == 'different_event': line['completed_cycles'][0]['event_ids'] = ['OTHER-EVENT']
    if issue == 'wrong_device': line['completed_cycles'][0]['faults'][0]['device_id'] = 'OTHER'
    if issue == 'stale_cycle': line['generation'] += 1
    if issue == 'unresolved_fault': line['faults'].append({'event_id': 'NEW', 'device_id': 'OTHER', 'resolved': False})
    if issue == 'stopped': line['state'] = 'stopped'
    if issue == 'unverified_readback': line['completed_cycles'][0]['devices']['TC']['state'] = 'pending'
    if issue == 'wrong_snapshot': line['completed_cycles'][0]['devices']['TC']['snapshot']['device_id'] = 'OTHER'
    if issue == 'no_cycle': line['completed_cycles'] = []
    if issue == 'unavailable': read_api.backend.line = BackendServiceError('isolated line unavailable')
    response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert response.status_code == 200
    assert response.json()['items'][0].get('machine_control', {}).get('state') != 'running'
    assert read_api.agent_calls == []


def test_restart_projection_is_not_cached_across_a_new_fault(read_api):
    completed_order_and_line(read_api)
    first = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    read_api.backend.line.update(state='stopped', generation=21)
    second = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert first.json()['items'][0]['machine_control']['state'] == 'running'
    assert second.json()['items'][0].get('machine_control', {}).get('state') != 'running'
    assert read_api.backend.line_reads == 2 and read_api.agent_calls == []


def test_current_restart_projection_overrides_an_old_stored_denial_without_rewriting_it(read_api):
    current = completed_order_and_line(read_api)
    current['machine_control'] = {'state': 'blocked', 'reason': '还有未确认完成的故障工单'}
    before = deepcopy(current)
    response = read_api.client.get('/api/workorders', headers={'Cookie': 'maintenance_session=session-lmy'})
    assert response.json()['items'][0]['machine_control']['state'] == 'running'
    assert current == before and read_api.agent_calls == []
