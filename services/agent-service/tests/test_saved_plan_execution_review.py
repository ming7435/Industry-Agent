"""Saved incorrect repair templates must stay visible without gaining execution authority."""
from copy import deepcopy
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.api.maintenance_plans import list_saved_maintenance_plans
from app.api.team_auth import human_action
from app.monitor.line_control import LineController
from app.runtime.action import ActionModel
from app.runtime.policy import RuntimePolicy
from app.workorder.repair_profile import interlock_inspection_steps
from app.workorder.service import WorkOrderService


def saved_order():
    diagnosis = {'device_id': 'TC', 'fault': '刀塔旋转超时', 'confidence': .865,
                 'maintenance_required': True, 'evidence_status': 'ready', 'evidence': ['报警定义'],
                 'raw': {'device_id': 'TC', 'alarm_code': '700006',
                         'alarm_definition': {'name': '刀塔旋转超时', 'description': '刀塔无旋转响应'}}}
    plan = {'plan_id': 'P1', 'device_id': 'TC', 'diagnosis': diagnosis, 'plan_kind': 'repair',
            'repair_target': '安全门与接料器互锁系统', 'repair_steps': interlock_inspection_steps(),
            'workorder_ready': True, 'maintenance_required': True, 'cad_required': False,
            'validation_findings': [], 'required_parts': [], 'parts': [], 'safety': ['保持互锁有效']}
    return {'workorder_id': 'W1', 'plan_id': 'P1', 'device_id': 'TC', 'event_id': 'E1',
            'alarm_code': '', 'status': 'in_progress', 'assignee': 'U1', 'assignee_name': 'lmy',
            'maintenance_plan_snapshot': plan, 'diagnosis_snapshot': diagnosis}


def test_saved_plan_shows_review_without_erasing_actual_assignment():
    order = saved_order()
    source = {'event': {'device_id': 'TC', 'event_id': 'E1', 'alarm_code': '700006'},
              'maintenance_plan': order['maintenance_plan_snapshot'], 'diagnosis': order['diagnosis_snapshot'],
              'workorder': order, 'status': 'in_progress'}
    before = deepcopy(source)
    item = list_saved_maintenance_plans([source])['items'][0]
    assert item.get('execution_review', {}).get('required') is True
    assert item['dispatch']['allowed'] is False
    assert item['dispatch']['status'] == 'dispatched'
    assert item['dispatch']['workorder_id'] == 'W1'
    assert source == before


def test_wrong_template_cannot_create_even_with_nonempty_reference_cad():
    order = saved_order()
    state = {'diagnosis': order['diagnosis_snapshot'], 'maintenance_plan': order['maintenance_plan_snapshot'],
             'knowledge': {'documents': [{'text': '刀塔检查'}]},
             'cad': {'drawings': [{'evidence_scope': 'device_reference'}]}}
    action = ActionModel.agent('workorder', {'action': 'create', 'required_capability': 'workorder_create'},
                               side_effect=True, idempotency_key='current-event')
    decision = RuntimePolicy().evaluate(action, state)
    assert decision.status.value == 'deny'
    assert 'profile' in decision.reason or '不匹配' in decision.reason


def test_wrong_template_allows_authenticated_assignee_to_request_manual_confirmation(monkeypatch):
    order = saved_order()
    backend = SimpleNamespace(call=lambda *_: {'workorder': order})
    monkeypatch.setattr('app.api.team_auth.team_actor', lambda _: {'user_id': 'U1', 'role': 'technician'})
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient', lambda: backend)
    calls = []
    operations = SimpleNamespace(execute_workorder=lambda *a, **k: calls.append(a) or {'workorder': order})
    human_action('W1', 'mark_repair_completed', {'feedback': '已核查并完成维修'},
                 Request({'type': 'http', 'headers': []}), operations)
    assert calls == [('mark_repair_completed', {'feedback': '已核查并完成维修', 'workorder_id': 'W1'})]


def test_manual_confirmation_of_old_template_still_requires_current_device_evidence(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    controller = object.__new__(LineController)
    controller.ledger = SimpleNamespace(call=lambda *_: {'workorder': saved_order()}, status=lambda: {'state': 'stopped'})
    controller._pending = lambda: []
    controller.sample = lambda _: {}
    result = controller.confirm_and_restart('W1', 'U1', '检查完毕并完成维修')
    assert result['machine_control']['state'] == 'blocked'
    assert result['machine_control']['checks']['device_identity'] is False
    assert result['workorder']['status'] == 'in_progress'


def test_old_template_cannot_close_without_trusted_human_receipt(monkeypatch):
    order = {**saved_order(), 'status': 'completed', 'maintenance_confirmed_by': 'U1'}
    monkeypatch.setattr('app.api.team_auth.team_actor', lambda _: {'user_id': 'U1', 'role': 'technician'})
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient', lambda: SimpleNamespace(call=lambda *_: {'workorder': order}))
    with pytest.raises(HTTPException) as error:
        human_action('W1', 'close', {}, Request({'type': 'http', 'headers': []}))
    assert error.value.status_code == 409


def test_manual_repair_does_not_teach_the_incorrect_original_template():
    from app.workorder.validator import WorkOrderValidator
    from datetime import datetime, timezone
    order = {**saved_order(), 'status': 'closed', 'repair_feedback': {'feedback': '已完成现场实际处理'}}
    order['repair_verification'] = WorkOrderValidator.build_repair_verification(order, {
        'device_id': 'TC', 'status': 'running', 'alarm_code': '', 'metrics': {'pressure': 1},
        'checked_at': datetime.now(timezone.utc).isoformat()})
    assert WorkOrderValidator.verification_passed(order)
    assert not WorkOrderValidator.can_learn(order, order['repair_feedback'])


def test_reading_assigned_order_exposes_review_and_preserves_owner_filter(monkeypatch):
    from app.api.server import create_app
    order = saved_order()
    other = {**order, 'workorder_id': 'W2', 'assignee': 'U2'}
    monkeypatch.setattr('app.api.server.team_actor', lambda _: {'user_id': 'U1', 'role': 'technician'})
    backend = SimpleNamespace(call=lambda *a, **k: {'success': True, 'items': [order, other]})
    monkeypatch.setattr('app.api.server.BackendServiceClient', lambda: backend)
    response = TestClient(create_app(SimpleNamespace(container=SimpleNamespace()))).get('/api/workorders')
    assert response.status_code == 200
    items = response.json()['items']
    assert [item['workorder_id'] for item in items] == ['W1']
    assert items[0].get('execution_review', {}).get('required') is True
    assert 'execution_review' not in order


def test_failed_workorder_read_is_not_reported_as_empty_success(monkeypatch):
    from app.api.server import create_app
    monkeypatch.setattr('app.api.server.team_actor', lambda _: {'user_id': 'U1', 'role': 'technician'})
    backend = SimpleNamespace(call=lambda *a, **k: {'success': False, 'error': 'backend unavailable', 'items': []})
    monkeypatch.setattr('app.api.server.BackendServiceClient', lambda: backend)
    response = TestClient(create_app(SimpleNamespace(container=SimpleNamespace()))).get('/api/workorders')
    assert response.status_code == 502


def test_new_workorder_preserves_alarm_from_saved_raw_diagnosis():
    order = saved_order()
    plan = {**order['maintenance_plan_snapshot'], 'repair_target': '刀塔系统', 'repair_steps': ['记录刀塔状态']}
    calls = []
    def execute(name, payload):
        calls.append((name, payload))
        return {'workorder_id': 'W1', **payload}
    WorkOrderService(SimpleNamespace(execute=execute)).create_from_plan(plan)
    assert calls[0][1]['alarm_code'] == '700006'


def test_saving_feedback_keeps_the_current_execution_review(monkeypatch):
    order = saved_order()
    calls = []
    def call(tool, payload):
        calls.append(tool)
        return {'success': True, 'workorder': order, **order}
    monkeypatch.setattr('app.api.team_auth.team_actor', lambda _: {'user_id': 'U1', 'role': 'technician'})
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient', lambda: SimpleNamespace(call=call))
    result = human_action('W1', 'submit_feedback', {'feedback': '记录现场现象'}, Request({'type': 'http', 'headers': []}))
    assert result['workorder'].get('execution_review', {}).get('required') is True
    assert calls == ['get_workorder', 'submit_repair_feedback']
