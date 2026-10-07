"""Personal list reads use Backend authority without scheduling an Agent execution."""
from copy import deepcopy
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

        def resolve_session(self, token):
            return users.get(token)

        def call(self, tool, arguments):
            backend_calls.append((tool, deepcopy(arguments)))
            if isinstance(self.outcome, Exception):
                raise self.outcome
            return self.outcome

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
