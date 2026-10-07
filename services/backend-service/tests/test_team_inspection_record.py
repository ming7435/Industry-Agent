"""Real isolated Backend inspection closure never grants repair/restart authority."""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.team.routes import create_router
from test_team_dispatch import service


def snapshot(**values):
    return {'device_id': 'M1', 'status': 'stopped', 'alarm_code': '',
            'active_alarms': [], 'metrics': {'pressure': 1},
            'checked_at': datetime.now(timezone.utc).isoformat(), **values}


@pytest.fixture
def context(service, monkeypatch):
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'inspection-test-only')
    tech = service.team.register('检查员', 'password-123', 'technician', 'M1')
    service.team.login('检查员', 'password-123')
    order = service.create_workorder(device_id='M1', event_id='WARNING-EVENT',
                                    maintenance_plan_snapshot={'plan_kind': 'inspection'})
    service.assign_workorder(order['workorder_id'], tech['user_id'])
    app = FastAPI()
    app.include_router(create_router(lambda: service))
    client = TestClient(app)
    body = {'workorder_id': order['workorder_id'], 'actor_id': tech['user_id'],
            'feedback': '已核查当前报警、外观与压力并记录', 'snapshot': snapshot()}
    return service, client, body


def record(client, body):
    return client.post('/internal/team/inspection/record', json=body,
                       headers={'Authorization': 'Bearer inspection-test-only'})


@pytest.mark.parametrize('status', ['stopped', 'running', 'idle', 'ready'])
def test_safe_clear_inspection_closes_even_when_another_fault_keeps_line_stopped(context, status):
    service, client, body = context
    body['snapshot']['status'] = status
    response = record(client, body)
    assert response.status_code == 200, response.text
    result = response.json()
    order = result['workorder']
    assert order['status'] == 'closed'
    assert order['maintenance_plan_snapshot']['plan_kind'] == 'inspection'
    assert order['repair_feedback']['operator'] == body['actor_id']
    verification = order['repair_verification']
    assert verification['source'] == verification['phase'] == 'inspection'
    assert verification['passed'] is True and verification['validation_findings'] == []
    assert verification['inspection_snapshot'] == body['snapshot']
    assert not order.get('maintenance_confirmed_by')
    assert any(event['action'] == 'inspection_completed' for event in order['events'])
    assert service.get_workorder(body['workorder_id'])['workorder']['status'] == 'closed'
    with pytest.raises(ValueError, match='恢复验证'):
        service.save_experience(source_workorder=body['workorder_id'], validation_status='accepted',
                                experience_quality_score=0.95)


@pytest.mark.parametrize('values', [
    {'device_id': 'M2'}, {'status': 'warning'}, {'alarm_code': 'W101'},
    {'active_alarms': ['W101']}, {'metrics': {}}, {'metrics': {'pressure': True}},
    {'checked_at': '2000-01-01T00:00:00Z'},
    {'checked_at': (datetime.now(timezone.utc) + timedelta(minutes=2)).isoformat()},
    {'expires_at': '2000-01-01T00:00:00Z'}, {'stale': True},
    {'interlocks_ok': False}, {'safety_interlock_active': True},
    {'metric_details': {'pressure': {'normal_range': [0, 0.5], 'warn_range': [0.6, 2]}}},
    {'found': False}, {'success': False}, {'synthetic': True},
])
def test_unresolved_or_untrusted_snapshot_saves_inspection_without_closing(context, values):
    service, client, body = context
    body['snapshot'].update(values)
    response = record(client, body)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['success'] is True
    order = result['workorder']
    assert order['status'] == 'in_progress'
    assert order['repair_feedback']['feedback'] == body['feedback']
    assert order['repair_verification']['source'] == 'inspection'
    assert order['repair_verification']['passed'] is False
    assert result['inspection_result']['validation_findings']
    assert service.get_workorder(body['workorder_id'])['workorder']['status'] == 'in_progress'


def test_snapshot_must_explicitly_report_alarm_state_and_current_time(context):
    _, client, body = context
    body['snapshot'].pop('alarm_code')
    body['snapshot'].pop('active_alarms')
    response = record(client, body)
    assert response.status_code == 200
    assert response.json()['workorder']['status'] == 'in_progress'
    assert response.json()['inspection_result']['passed'] is False


def test_snapshot_older_than_five_minutes_cannot_close_current_inspection(context):
    _, client, body = context
    body['snapshot']['checked_at'] = (datetime.now(timezone.utc) - timedelta(minutes=6)).isoformat()
    response = record(client, body)
    assert response.status_code == 200
    assert response.json()['workorder']['status'] == 'in_progress'


def test_verified_inspection_replay_preserves_original_frozen_record(context):
    _, client, body = context
    first = record(client, body)
    assert first.status_code == 200
    body.update(feedback='重复请求不能改写原检查事实', snapshot=snapshot(status='warning', alarm_code='W101'))
    second = record(client, body)
    assert second.status_code == 200
    assert second.json()['already_recorded'] is True
    assert second.json()['workorder'] == first.json()['workorder']


@pytest.mark.parametrize('actor', ['supervisor', 'another_technician', 'unknown'])
def test_inspection_endpoint_requires_registered_current_assignee(context, actor):
    service, client, body = context
    if actor == 'unknown':
        body['actor_id'] = 'FAKE'
    else:
        role = 'supervisor' if actor == 'supervisor' else 'technician'
        body['actor_id'] = service.team.register(actor, 'password-123', role, 'M1' if role == 'technician' else '')['user_id']
    response = record(client, body)
    assert response.status_code == 403
    assert service.get_workorder(body['workorder_id'])['workorder'].get('repair_feedback') in ({}, None)


@pytest.mark.parametrize('case', ['ordinary_repair', 'not_assigned', 'blank_feedback'])
def test_inspection_endpoint_does_not_relax_repair_or_assignment_lifecycle(context, case):
    service, client, body = context
    if case != 'blank_feedback':
        order = service.create_workorder(device_id='M1', maintenance_plan_snapshot={'plan_kind': 'repair' if case == 'ordinary_repair' else 'inspection'})
        body['workorder_id'] = order['workorder_id']
        if case == 'ordinary_repair': service.assign_workorder(order['workorder_id'], body['actor_id'])
    else:
        body['feedback'] = '  '
    response = record(client, body)
    assert response.status_code == 409


def test_inspection_endpoint_retains_internal_service_authentication(context):
    _, client, body = context
    assert client.post('/internal/team/inspection/record', json=body).status_code == 401


def test_generic_repair_confirm_cannot_turn_inspection_into_repair_authority(context):
    service, _, body = context
    with pytest.raises(ValueError, match='检查'):
        service.confirm_team_repair(body['workorder_id'], body['actor_id'], body['feedback'], body['snapshot'])


def test_client_repair_verification_boolean_does_not_override_actual_inspection_snapshot(context):
    _, client, body = context
    body['snapshot']['alarm_code'] = 'W101'
    body['repair_verification'] = {'passed': True, 'source': 'device_recovery'}
    response = record(client, body)
    assert response.status_code == 200
    assert response.json()['workorder']['status'] == 'in_progress'
    assert response.json()['inspection_result']['passed'] is False


def test_generic_repair_completion_cannot_relabel_inspection_as_repair(context):
    service, _, body = context
    with pytest.raises(ValueError, match='检查'):
        service.mark_repair_completed(body['workorder_id'], feedback=body['feedback'],
                                      repair_verification={'device_recovery': snapshot(status='running')})


def test_inspection_can_never_be_accepted_as_repair_learning_provenance(context):
    service, _, body = context
    order = service.get_workorder(body['workorder_id'])['workorder']
    recovery = snapshot(status='running')
    verification = service._build_repair_verification(order, recovery, {'feedback': body['feedback']})
    assert verification['passed'] is True
    assert service._verification_is_valid(verification, order) is False
