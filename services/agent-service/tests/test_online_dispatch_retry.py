"""已创建未派工的旧单经显式重试继续，页面读取与正常设备不产生派工。"""
from datetime import datetime, timezone
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.api.business_returns import build_business_return_router
from app.api.maintenance_plans import list_saved_maintenance_plans
from app.runtime.event_store import EventResultStore
from test_online_device_dispatch import agent_with_candidates, person, plan


def source():
    return {'event': {'event_id': 'EV-1', 'device_id': 'M-1', 'alarm_code': '700001'},
            'diagnosis': plan()['diagnosis'], 'maintenance_plan': plan(), 'workorder': {}}


@pytest.fixture
def retry(tmp_path, monkeypatch):
    candidates = []
    agent, orders = agent_with_candidates(candidates)
    orders.order = {'workorder_id': 'WO-EXISTING', 'device_id': 'M-1', 'event_id': 'EV-1',
                    'status': 'open', 'assignee': '', 'idempotency_key': 'original-create-key',
                    'diagnosis_snapshot': plan()['diagnosis'], 'maintenance_plan_snapshot': plan()}
    calls = []
    current = {'device_id': 'M-1', 'found': True, 'success': True, 'status': 'fault',
               'alarm_code': '700001', 'checked_at': datetime.now(timezone.utc).isoformat()}
    def tool(name, arguments, **kwargs):
        calls.append(name)
        if name == 'list_workorders':
            return {'success': True, 'items': [dict(orders.order)]}
        assert name == 'get_device_status'
        return dict(current)
    def execute_workorder(action, payload, **kwargs):
        calls.append(('continue', action, payload))
        return agent.run({'action': action, **payload}).model_dump(mode='json')
    def unexpected(*args):
        raise AssertionError('Existing order must not rerun diagnosis or generate another plan')
    runtime = SimpleNamespace(container=SimpleNamespace(registry=SimpleNamespace(execute=tool),
                              operations=SimpleNamespace(execute_workorder=execute_workorder)),
                              run_abnormal_event=unexpected)
    store = EventResultStore(path=str(tmp_path / 'retry.sqlite3'))
    store.list_plan_results = lambda: ([source()], {})
    deleted = set()
    store.deleted_plan_ids = lambda: deleted
    monkeypatch.setattr('app.api.business_returns.team_actor', lambda _: {'user_id': 'USER-1', 'role': 'technician'})
    app = FastAPI()
    app.include_router(build_business_return_router(runtime, store, lambda: None))
    with TestClient(app) as client:
        yield client, candidates, orders, calls, current, deleted


def test_old_open_order_waits_then_new_command_assigns_same_id_without_recreation(retry):
    client, candidates, orders, calls, _, _ = retry
    first = client.post('/api/maintenance/plans/PLAN-1/retry', json={'request_id': 'R1'})
    assert first.status_code == 200, first.text
    assert first.json()['status'] == 'waiting_for_personnel'
    assert first.json()['workorder']['workorder_id'] == 'WO-EXISTING'
    assert 'get_device_status' in calls
    candidates.append(person())

    second = client.post('/api/maintenance/plans/PLAN-1/retry', json={'request_id': 'R2'})
    repeat = client.post('/api/maintenance/plans/PLAN-1/retry', json={'request_id': 'R2'})

    assert second.status_code == 200, second.text
    assert second.json()['status'] == 'dispatched'
    assert second.json()['workorder']['workorder_id'] == 'WO-EXISTING'
    assert second.json()['workorder']['assignee'] == 'USER-1'
    assert repeat.json() == second.json()
    assert orders.created == 0
    assert orders.assigned == ['USER-1']
    payload = next(call[2] for call in calls if isinstance(call, tuple))
    assert payload['idempotency_key'] == 'original-create-key'
    assert payload['maintenance_plan_snapshot'] == plan()
    assert 'online' not in payload['maintenance_plan_snapshot']


@pytest.mark.parametrize('changes', [
    {'alarm_code': '', 'status': 'running'}, {'alarm_code': 'OTHER'},
    {'checked_at': '2000-01-01T00:00:00+00:00'}, {'found': False},
])
def test_old_unassigned_order_never_dispatches_if_current_fault_is_gone_or_unverified(retry, changes):
    client, candidates, orders, _, current, _ = retry
    candidates.append(person())
    current.update(changes)
    response = client.post('/api/maintenance/plans/PLAN-1/retry', json={'request_id': 'R1'})
    assert response.status_code in {409, 502}
    assert orders.assigned == []
    assert orders.created == 0


def test_assigned_order_returns_authoritative_identity_without_new_operations(retry):
    client, _, orders, calls, _, _ = retry
    orders.order.update(status='in_progress', assignee='USER-REAL', assignee_name='真实负责人')
    response = client.post('/api/maintenance/plans/PLAN-1/retry', json={'request_id': 'R1'})
    assert response.status_code == 200
    assert response.json()['workorder']['assignee'] == 'USER-REAL'
    assert response.json()['workorder']['assignee_name'] == '真实负责人'
    assert calls == ['list_workorders']


def test_deleted_plan_never_reappears_or_dispatches(retry):
    client, candidates, orders, calls, _, deleted = retry
    candidates.append(person())
    deleted.add('PLAN-1')
    assert client.post('/api/maintenance/plans/PLAN-1/retry', json={'request_id': 'R1'}).status_code == 404
    assert calls == []
    assert orders.assigned == []


def test_projection_keeps_personnel_wait_separate_from_business_blockers():
    result = source()
    result['workorder'] = {'workorder_id': 'WO-1', 'success': False, 'status': 'waiting_for_personnel',
                           'stop_reason': 'waiting_for_personnel', 'error': '等待该设备对应负责人员登录',
                           'workorder': {'workorder_id': 'WO-1', 'status': 'open', 'device_id': 'M-1'}}
    projection = list_saved_maintenance_plans([result])['items'][0]
    assert projection['dispatch']['status'] == 'waiting_for_personnel'
    assert projection['dispatch']['allowed'] is False
    result['maintenance_plan']['validation_findings'] = ['缺少库存证据']
    blocked = list_saved_maintenance_plans([result])['items'][0]
    assert blocked['dispatch']['allowed'] is False
    assert '库存' in blocked['dispatch']['reason']
    assert blocked['dispatch'].get('status') != 'waiting_for_personnel'


def test_projection_dispatched_uses_only_actual_backend_order_identity():
    result = source()
    result['workorder'] = {'success': True, 'workorder': {'workorder_id': 'WO-1', 'status': 'in_progress',
                           'device_id': 'M-1', 'assignee': 'USER-REAL', 'assignee_name': '真实负责人'}}
    dispatch = list_saved_maintenance_plans([result])['items'][0]['dispatch']
    assert dispatch['status'] == 'dispatched'
    assert dispatch['assignee'] == 'USER-REAL'
    assert dispatch['assignee_name'] == '真实负责人'
    assert dispatch['device_id'] == 'M-1'


def test_projection_actual_assigned_order_does_not_wait_for_already_resolved_approval():
    result = source()
    result['maintenance_plan']['requires_approval'] = True
    result['workorder'] = {'success': True, 'workorder': {'workorder_id': 'WO-1', 'status': 'in_progress',
                           'device_id': 'M-1', 'assignee': 'USER-REAL', 'assignee_name': '真实负责人'}}
    dispatch = list_saved_maintenance_plans([result])['items'][0]['dispatch']
    assert dispatch['allowed'] is True
    assert dispatch['status'] == 'dispatched'
    assert dispatch['assignee'] == 'USER-REAL'


def test_historical_risk_wait_does_not_require_manual_dispatch_but_explicit_approval_still_does():
    result = source()
    result.update(status='waiting_approval', stop_reason='approval_required')
    assert list_saved_maintenance_plans([result])['items'][0]['dispatch']['allowed'] is True
    result['maintenance_plan']['requires_approval'] = True
    dispatch = list_saved_maintenance_plans([result])['items'][0]['dispatch']
    assert dispatch['allowed'] is False
    assert dispatch['status'] == 'waiting_approval'


def test_projection_directory_query_failure_is_blocked_with_accurate_reason():
    result = source()
    result['workorder'] = {'success': False, 'status': 'blocked', 'stop_reason': 'personnel_query_failed',
                           'error': '对应设备负责人员查询失败，请稍后重试',
                           'workorder': {'workorder_id': 'WO-1', 'device_id': 'M-1', 'status': 'open'}}
    dispatch = list_saved_maintenance_plans([result])['items'][0]['dispatch']
    assert dispatch['allowed'] is False
    assert dispatch['status'] == 'blocked'
    assert '查询失败' in dispatch['reason']


@pytest.mark.parametrize('location', ['stored_plan', 'source_plan', 'source_target', 'event_target'])
def test_old_open_order_retry_cannot_bypass_original_explicit_approval(retry, monkeypatch, location):
    client, candidates, orders, calls, _, _ = retry
    candidates.append(person())
    saved = source()
    if location == 'stored_plan':
        orders.order['maintenance_plan_snapshot']['requires_approval'] = True
    elif location == 'source_plan':
        saved['maintenance_plan']['requires_approval'] = True
    elif location == 'source_target':
        saved['target_input'] = {'requires_approval': True}
    else:
        saved['event']['target_input'] = {'requires_approval': True}
    monkeypatch.setitem(globals(), 'source', lambda: saved)
    response = client.post('/api/maintenance/plans/PLAN-1/retry', json={'request_id': 'R1'})
    assert response.status_code == 409
    assert '审批' in response.json()['detail']['message']
    assert not any(isinstance(call, tuple) for call in calls)
    assert orders.assigned == []
