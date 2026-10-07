"""An audited new plan revision changes no repair completion or device authority."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from threading import Barrier

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.team.routes import create_router
from test_online_device_dispatch import service, registered


@pytest.fixture
def context(service, monkeypatch):
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'replace-plan-isolated-only')
    owner, _ = registered(service)
    diagnosis = {'device_id': 'M1', 'fault': '刀塔旋转超时', 'confidence': .865,
                 'maintenance_required': True, 'evidence_status': 'ready', 'evidence': ['保存报警定义'],
                 'raw': {'device_id': 'M1', 'alarm_code': '700006',
                         'alarm_definition': {'found': True, 'name': '刀塔旋转超时'}}}
    old = {'plan_id': 'PLAN-OLD', 'device_id': 'M1', 'event_id': 'EV-OLD', 'diagnosis': diagnosis,
           'plan_kind': 'repair', 'maintenance_required': True, 'workorder_ready': True,
           'repair_target': '安全门与接料器互锁系统', 'repair_steps': ['旧错误模板'],
           'required_parts': [], 'cad_required': False, 'validation_findings': [], 'requires_approval': False}
    initial = service.create_workorder(device_id='M1', event_id='EV-OLD', plan_id='PLAN-OLD', alarm_code='',
                                      steps=old['repair_steps'], diagnosis_snapshot=diagnosis,
                                      maintenance_plan_snapshot=old)
    order_id = initial['workorder_id']
    service.assign_workorder(order_id, owner['user_id'])
    service.submit_repair_feedback(order_id, {'feedback': '已记录现场现象，尚未维修', 'operator': owner['user_id']})
    order = service.update_workorder(order_id, 'in_progress', repair_verification={'passed': False, 'source': 'device_recovery'})['workorder']
    candidate = {**deepcopy(old), 'plan_id': 'PLAN-CORRECT', 'repair_target': '刀塔位置反馈系统',
                 'repair_steps': ['依设备资料核查刀塔位置反馈', '维修后重新采集设备恢复数据'],
                 'target_part': {'part_no': 'ISOLATED-TURRET', 'part_name': '刀塔位置反馈组件'},
                 'engineering_context': {'drawing_url': '/drawings/isolated-turret', 'model_url': '/models/isolated-turret'},
                 'validation_errors': []}
    body = {'workorder_id': order_id, 'actor_id': owner['user_id'], 'expected_plan_id': order['plan_id'],
            'expected_updated_at': order['updated_at'], 'request_id': 'REPLAN-1', 'maintenance_plan': candidate}
    app = FastAPI()
    app.include_router(create_router(lambda: service))
    return service, TestClient(app), body, deepcopy(order)


def replace(client, body, authenticated=True):
    return client.post('/internal/team/workorder/replace-plan', json=body,
                       headers={'Authorization': 'Bearer replace-plan-isolated-only'} if authenticated else {})


def test_correct_revision_preserves_same_order_owner_and_unfinished_repair_facts(context):
    service, client, body, before = context
    response = replace(client, body)
    assert response.status_code == 200, response.text
    result = response.json()
    order = result['workorder']
    for field in ('workorder_id', 'device_id', 'event_id', 'assignee', 'assignee_name', 'status',
                  'diagnosis_snapshot', 'repair_feedback', 'started_at', 'created_at', 'idempotency_key'):
        assert order[field] == before[field]
    assert order['plan_id'] == body['maintenance_plan']['plan_id']
    assert order['maintenance_plan_snapshot'] == body['maintenance_plan']
    assert order['steps'] == body['maintenance_plan']['repair_steps']
    assert order['repair_target'] == body['maintenance_plan']['target_part']
    assert order['drawing_context']['drawing_url'] == '/drawings/isolated-turret'
    assert order['repair_verification'] == {}
    assert not order.get('maintenance_confirmed_by')
    assert order['status'] == 'in_progress' and not order.get('completed_at')
    assert result['request_id'] == body['request_id'] and result['plan_revision_id']
    revision = order['plan_revisions'][-1]
    assert revision['previous_plan_id'] == 'PLAN-OLD'
    assert revision['plan_id'] == 'PLAN-CORRECT'
    assert revision['previous_plan_snapshot'] == before['maintenance_plan_snapshot']
    assert revision['previous_repair_verification'] == before['repair_verification']
    assert revision['actor_id'] == body['actor_id'] and revision['request_id'] == body['request_id']
    assert any(event['action'] == 'maintenance_plan_replaced' and event['payload']['plan_revision_id'] == result['plan_revision_id']
               for event in order['events'])
    assert len(service.list_workorders()['items']) == 1


def test_same_request_replay_is_durable_and_different_payload_conflicts(context):
    service, client, body, _ = context
    first = replace(client, body)
    assert first.status_code == 200, first.text
    stored = deepcopy(service.get_workorder(body['workorder_id'])['workorder'])
    second = replace(client, body)
    assert second.status_code == 200, second.text
    assert second.json()['replayed'] is True
    assert second.json()['plan_revision_id'] == first.json()['plan_revision_id']
    assert service.get_workorder(body['workorder_id'])['workorder'] == stored
    changed = deepcopy(body)
    changed['maintenance_plan']['repair_steps'].append('另一版本')
    assert replace(client, changed).status_code == 409
    assert service.get_workorder(body['workorder_id'])['workorder'] == stored


def test_completed_order_with_prior_receipt_can_reconcile_same_command_but_cannot_apply_another(context):
    service, client, body, _ = context
    first = replace(client, body)
    assert first.status_code == 200, first.text
    closed = service.repository.get(body['workorder_id'])
    closed['status'] = 'closed'
    service.repository.update(closed)
    response = replace(client, body)
    assert response.status_code == 200, response.text
    assert response.json()['replayed'] is True
    assert response.json()['plan_revision_id'] == first.json()['plan_revision_id']
    assert response.json()['workorder']['status'] == 'closed'
    stored_closed = deepcopy(service.repository.get(body['workorder_id']))
    changed = deepcopy(body)
    changed['maintenance_plan']['repair_steps'].append('已关单后的变参')
    assert replace(client, changed).status_code == 409
    assert service.repository.get(body['workorder_id']) == stored_closed
    body['request_id'] = 'NEW-AFTER-CLOSED'
    assert replace(client, body).status_code == 409


@pytest.mark.parametrize('actor', ['unknown', 'other_device', 'same_device_other', 'supervisor'])
def test_only_current_device_assignee_technician_can_replace(context, actor):
    service, client, body, before = context
    if actor == 'unknown':
        body['actor_id'] = 'UNKNOWN'
    else:
        role = 'supervisor' if actor == 'supervisor' else 'technician'
        user, _ = registered(service, actor, 'M2' if actor == 'other_device' else 'M1', role=role)
        body['actor_id'] = user['user_id']
    assert replace(client, body).status_code == 403
    assert service.get_workorder(body['workorder_id'])['workorder'] == before


@pytest.mark.parametrize('status', ['awaiting_verification', 'completed', 'closed', 'rejected', 'timeout'])
def test_finished_or_verifying_order_cannot_change_plan(context, status):
    service, client, body, before = context
    before['status'] = status
    service.repository.update(before)
    body['expected_updated_at'] = before['updated_at']
    assert replace(client, body).status_code == 409
    assert service.get_workorder(body['workorder_id'])['workorder']['maintenance_plan_snapshot'] == before['maintenance_plan_snapshot']


@pytest.mark.parametrize('change', [
    {'device_id': 'M2'}, {'event_id': 'OTHER'}, {'alarm_code': 'OTHER'}, {'plan_id': 'PLAN-OLD'},
    {'workorder_ready': False, 'passed': True}, {'validation_findings': ['资料缺项'], 'passed': True},
    {'validation_errors': ['校验失败']}, {'requires_approval': True, 'approved': True},
    {'synthetic': True}, {'repair_steps': []}, {'plan_kind': 'inspection'},
])
def test_unready_wrong_scope_or_client_claims_cannot_replace(context, change):
    service, client, body, before = context
    body['maintenance_plan'].update(change)
    assert replace(client, body).status_code == 409
    assert service.get_workorder(body['workorder_id'])['workorder'] == before


@pytest.mark.parametrize('field', ['device_id', 'fault'])
def test_new_plan_cannot_change_original_diagnosis_identity(context, field):
    service, client, body, before = context
    body['maintenance_plan']['diagnosis'][field] = 'OTHER'
    assert replace(client, body).status_code == 409
    assert service.get_workorder(body['workorder_id'])['workorder'] == before


def test_original_explicit_approval_cannot_be_removed(context):
    service, client, body, before = context
    before['maintenance_plan_snapshot']['requires_approval'] = True
    service.repository.update(before)
    body['maintenance_plan'].update(requires_approval=False, approved=True)
    assert replace(client, body).status_code == 409


@pytest.mark.parametrize('source', ['order', 'original_raw', 'new_raw', 'original_target_plan', 'new_target_plan'])
def test_nested_original_or_new_explicit_approval_cannot_be_hidden_by_outer_false(context, source):
    service, client, body, before = context
    if source == 'order':
        before['requires_approval'] = True
    elif source == 'original_raw':
        before['diagnosis_snapshot']['raw']['requires_approval'] = True
    elif source == 'new_raw':
        body['maintenance_plan']['diagnosis']['raw']['requires_approval'] = True
    elif source == 'original_target_plan':
        before['maintenance_plan_snapshot']['target_input'] = {'plan': {'requires_approval': True}}
    else:
        body['maintenance_plan']['target_input'] = {'maintenance_plan': {'requires_approval': True}}
    service.repository.update(before)
    response = replace(client, body)
    assert response.status_code == 409
    assert '审批' in response.json()['detail']


@pytest.mark.parametrize('field', ['expected_updated_at', 'expected_plan_id'])
def test_compare_tokens_are_mandatory_and_must_match(context, field):
    service, client, body, before = context
    body[field] = 'stale'
    assert replace(client, body).status_code == 409
    body[field] = ''
    assert replace(client, body).status_code == 422
    assert service.get_workorder(body['workorder_id'])['workorder'] == before


def test_internal_endpoint_requires_service_auth_and_rejects_extra_authorization(context):
    _, client, body, _ = context
    assert replace(client, body, authenticated=False).status_code == 401
    body['approved'] = True
    assert replace(client, body).status_code == 422


def test_missing_original_diagnosis_identity_is_not_invented(context):
    service, client, body, before = context
    before['diagnosis_snapshot'] = {}
    service.repository.update(before)
    assert replace(client, body).status_code == 409


def wrapped_diagnosis(diagnosis):
    # Actual Maintenance normalization keeps the complete DiagnosisView in raw,
    # whose own raw retains the authoritative alarm definition/code.
    return {'device_id': diagnosis['device_id'], 'fault': diagnosis['fault'],
            'confidence': diagnosis['confidence'], 'maintenance_required': True,
            'evidence': diagnosis['evidence'], 'raw': deepcopy(diagnosis)}


def test_formal_maintenance_two_layer_raw_alarm_is_valid_without_rewriting_original(context):
    service, client, body, before = context
    body['maintenance_plan']['diagnosis'] = wrapped_diagnosis(before['diagnosis_snapshot'])
    response = replace(client, body)
    assert response.status_code == 200, response.text
    assert response.json()['workorder']['diagnosis_snapshot'] == before['diagnosis_snapshot']
    assert service.repository.get(body['workorder_id'])['plan_id'] == 'PLAN-CORRECT'


@pytest.mark.parametrize('field', ['alarm_code', 'device_id', 'event_id', 'requires_approval'])
def test_deep_raw_conflicting_identity_or_explicit_approval_is_rejected(context, field):
    service, client, body, before = context
    body['maintenance_plan']['diagnosis'] = wrapped_diagnosis(before['diagnosis_snapshot'])
    body['maintenance_plan']['diagnosis']['raw']['raw'][field] = True if field == 'requires_approval' else 'OTHER'
    assert replace(client, body).status_code == 409
    assert service.repository.get(body['workorder_id']) == before


def test_missing_candidate_alarm_cannot_be_filled_from_original_order(context):
    service, client, body, before = context
    body['maintenance_plan']['diagnosis'] = wrapped_diagnosis(before['diagnosis_snapshot'])
    body['maintenance_plan']['diagnosis']['raw']['raw'].pop('alarm_code')
    assert replace(client, body).status_code == 409
    assert service.repository.get(body['workorder_id']) == before


def test_original_nested_explicit_approval_stays_required(context):
    service, client, body, before = context
    before['diagnosis_snapshot'] = wrapped_diagnosis(before['diagnosis_snapshot'])
    before['diagnosis_snapshot']['raw']['raw']['requires_approval'] = True
    service.repository.update(before)
    response = replace(client, body)
    assert response.status_code == 409
    assert '审批' in response.json()['detail']


def test_concurrent_feedback_is_not_overwritten_even_after_initial_token_check(context, monkeypatch):
    service, client, body, _ = context
    original_update = service.repository.update
    def raced_update(candidate):
        current = service.repository.get(candidate['workorder_id'])
        current['repair_feedback'] = {'feedback': '并发提交的新现场记录'}
        original_update(current)
        return original_update(candidate)
    monkeypatch.setattr(service.repository, 'update', raced_update)
    response = replace(client, body)
    assert response.status_code == 409
    current = service.get_workorder(body['workorder_id'])['workorder']
    assert current['repair_feedback']['feedback'] == '并发提交的新现场记录'
    assert current['plan_id'] == 'PLAN-OLD' and not current.get('plan_revisions')


def test_concurrent_same_command_creates_one_revision(context):
    service, _, body, _ = context
    start = Barrier(2)
    def apply():
        start.wait()
        return service.replace_team_workorder_plan(**deepcopy(body))
    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(lambda _: apply(), range(2)))
    assert len({result['plan_revision_id'] for result in results}) == 1
    assert sorted(result['replayed'] for result in results) == [False, True]
    assert len(service.get_workorder(body['workorder_id'])['workorder']['plan_revisions']) == 1


def setup_inventory(service, body):
    order = service.repository.get(body['workorder_id'])
    order['required_parts'] = [{'part_no': 'OLD', 'quantity': 2}]
    order['inventory_reservations'] = {'OLD': {'reservation_id': 'RES-OLD', 'quantity': 2}}
    service.repository.update(order)
    service._inventory = {'OLD': {'part_no': 'OLD', 'stock': 8, 'reserved': 2, 'consumed': 0, 'synthetic': False},
                          'NEW': {'part_no': 'NEW', 'stock': 6, 'reserved': 0, 'consumed': 0, 'synthetic': False}}
    body['maintenance_plan']['required_parts'] = [{'part_no': 'NEW', 'quantity': 3}]


def test_replaced_parts_reconcile_real_reservations_without_double_reserving_on_replay(context):
    service, client, body, _ = context
    setup_inventory(service, body)
    response = replace(client, body)
    assert response.status_code == 200, response.text
    assert service._inventory['OLD']['reserved'] == 0
    assert service._inventory['NEW']['reserved'] == 3
    current = service.get_workorder(body['workorder_id'])['workorder']
    assert current['required_parts'] == body['maintenance_plan']['required_parts']
    assert set(current['inventory_reservations']) == {'NEW'}
    assert replace(client, body).status_code == 200
    assert service._inventory['NEW']['reserved'] == 3


def test_insufficient_new_inventory_restores_old_reservation_and_order(context):
    service, client, body, _ = context
    setup_inventory(service, body)
    service._inventory['NEW']['stock'] = 1
    before = deepcopy(service.repository.get(body['workorder_id']))
    inventory = deepcopy(service._inventory)
    assert replace(client, body).status_code == 409
    assert service.repository.get(body['workorder_id']) == before
    assert service._inventory == inventory


def test_inventory_changes_are_rolled_back_if_order_revision_compare_fails(context, monkeypatch):
    service, client, body, _ = context
    setup_inventory(service, body)
    inventory = deepcopy(service._inventory)
    def conflict(_):
        raise ValueError('工单已被其他操作更新')
    monkeypatch.setattr(service.repository, 'update', conflict)
    assert replace(client, body).status_code == 409
    assert service._inventory == inventory
