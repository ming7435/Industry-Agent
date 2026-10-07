"""Server technician feedback proof binds the real order and recovery evidence."""
from copy import deepcopy
from datetime import datetime, timedelta, timezone

import pytest
from test_team_dispatch import service


def sample(**values):
    return {'device_id': 'M1', 'status': 'stopped', 'alarm_code': '',
            'metrics': {'pressure': 1}, 'interlocks_ok': True,
            'checked_at': datetime.now(timezone.utc).isoformat(), **values}


@pytest.fixture
def context(service):
    actor = service.team.register('维修确认', 'password-123', 'technician', 'M1')
    service.team.login('维修确认', 'password-123')
    plan = {'plan_id': 'PLAN-OLD', 'device_id': 'M1', 'plan_kind': 'repair',
            'repair_target': '安全门与接料器互锁系统', 'repair_steps': ['旧互锁核查步骤'],
            'workorder_ready': True, 'validation_findings': []}
    order_id = service.create_workorder(device_id='M1', event_id='E1', plan_id=plan['plan_id'],
        diagnosis_snapshot={'device_id': 'M1', 'fault': '刀塔旋转超时', 'raw': {'alarm_code': '700006'}},
        maintenance_plan_snapshot=plan)['workorder_id']
    service.assign_workorder(order_id, actor['user_id'])
    return service, actor, order_id


def confirmed(context):
    service, actor, order_id = context
    result = service.confirm_team_repair(order_id, actor['user_id'], '已完成刀塔处理并复测，报警已解除', sample())
    order = result['workorder']
    assert order.get('technician_confirmation'), 'Successful real prestart must issue a server confirmation receipt'
    return order


def test_creates_bound_technician_receipt_without_changing_wrong_plan(context):
    service, actor, order_id = context
    original = service.get_workorder(order_id)['workorder']
    order = confirmed(context)
    receipt = order['technician_confirmation']
    assert receipt['confirmation_method'] == 'technician_feedback'
    assert receipt['source'] == 'backend_team_repair_confirmation'
    assert all(receipt[key] == order[key] for key in ('workorder_id', 'device_id', 'event_id', 'plan_id'))
    assert receipt['actor_id'] == actor['user_id'] == order['maintenance_confirmed_by']
    assert order['maintenance_plan_snapshot'] == original['maintenance_plan_snapshot']
    assert order['diagnosis_snapshot'] == original['diagnosis_snapshot']
    assert order['status'] == 'completed' and order['repair_verification']['phase'] == 'prestart'
    assert any(event.get('payload', {}).get('technician_confirmation', {}).get('receipt_id') == receipt['receipt_id']
               for event in order['events'])
    from shared.technician_confirmation import trusted_technician_confirmation
    assert trusted_technician_confirmation(order)


@pytest.mark.parametrize('mutation', ['order_id', 'device', 'event', 'plan_id', 'plan_snapshot', 'actor',
    'confirmed_by', 'feedback', 'feedback_actor', 'diagnosis', 'receipt_method', 'receipt_source', 'receipt_id',
    'passed_flag', 'verification_source', 'phase', 'missing_snapshot', 'wrong_snapshot', 'old_snapshot',
    'active_alarm', 'missing_metrics', 'missing_checks', 'failed_checks', 'inspection', 'uncompleted'])
def test_previous_receipt_cannot_authorize_changed_context_or_forged_evidence(context, mutation):
    order = deepcopy(confirmed(context))
    receipt = order['technician_confirmation']
    verification = order['repair_verification']
    if mutation == 'order_id': order['workorder_id'] = 'OTHER'
    elif mutation == 'device': order['device_id'] = 'M2'
    elif mutation == 'event': order['event_id'] = 'E2'
    elif mutation == 'plan_id': order['plan_id'] = 'PLAN-NEW'
    elif mutation == 'plan_snapshot': order['maintenance_plan_snapshot']['repair_steps'] = ['替换后的步骤']
    elif mutation == 'actor': order['assignee'] = 'OTHER'
    elif mutation == 'confirmed_by': order['maintenance_confirmed_by'] = 'OTHER'
    elif mutation == 'feedback': order['repair_feedback']['feedback'] = '新的反馈'
    elif mutation == 'feedback_actor': order['repair_feedback']['operator'] = 'OTHER'
    elif mutation == 'diagnosis': order['diagnosis_snapshot']['raw']['alarm_code'] = 'OTHER'
    elif mutation == 'receipt_method': receipt['confirmation_method'] = 'client_approved'
    elif mutation == 'receipt_source': receipt['source'] = 'frontend'
    elif mutation == 'receipt_id': receipt['receipt_id'] = ''
    elif mutation == 'passed_flag': verification['passed'] = False
    elif mutation == 'verification_source': verification['source'] = 'client'
    elif mutation == 'phase': verification['phase'] = 'client_passed'
    elif mutation == 'missing_snapshot': verification.pop('device_recovery')
    elif mutation == 'wrong_snapshot': verification['device_recovery']['device_id'] = 'M2'
    elif mutation == 'old_snapshot': verification['device_recovery']['checked_at'] = '2000-01-01T00:00:00Z'
    elif mutation == 'active_alarm': verification['device_recovery']['alarm_code'] = '700006'
    elif mutation == 'missing_metrics': verification['device_recovery']['metrics'] = {}
    elif mutation == 'missing_checks': verification.pop('checks')
    elif mutation == 'failed_checks': verification['checks']['alarms_clear'] = False
    elif mutation == 'inspection': order['maintenance_plan_snapshot']['plan_kind'] = 'inspection'
    elif mutation == 'uncompleted': order['status'] = 'in_progress'
    from shared.technician_confirmation import trusted_technician_confirmation
    assert not trusted_technician_confirmation(order)


def test_marker_or_client_boolean_cannot_replace_server_receipt(context):
    order = confirmed(context)
    order.pop('technician_confirmation')
    order.update(approved=True, passed=True, manual_confirmation=True)
    from shared.technician_confirmation import trusted_technician_confirmation
    assert not trusted_technician_confirmation(order)


@pytest.mark.parametrize('bad_sample', [sample(device_id='M2'), sample(alarm_code='F1'),
    sample(metrics={}), sample(interlocks_ok=False), sample(checked_at='2000-01-01T00:00:00Z')])
def test_failed_prestart_never_creates_confirmation_receipt(context, bad_sample):
    service, actor, order_id = context
    with pytest.raises(ValueError):
        service.confirm_team_repair(order_id, actor['user_id'], '已维修', bad_sample)
    assert not service.get_workorder(order_id)['workorder'].get('technician_confirmation')


def test_completed_prestart_retry_can_issue_new_verified_feedback_receipt(context):
    first = confirmed(context)
    service, actor, order_id = context
    result = service.confirm_team_repair(order_id, actor['user_id'], '补充：已重新复测确认', sample())['workorder']
    assert result['technician_confirmation']['receipt_id'] != first['technician_confirmation']['receipt_id']
    assert result['repair_feedback']['feedback'] == '补充：已重新复测确认'
    from shared.technician_confirmation import trusted_technician_confirmation
    assert trusted_technician_confirmation(result)


def test_poststart_preserves_receipt_and_repeated_confirmation_preserves_facts(context):
    first = confirmed(context)
    service, actor, order_id = context
    result = service.finalize_team_repair(order_id, sample(status='running'))['workorder']
    assert result['technician_confirmation'] == first['technician_confirmation']
    from shared.technician_confirmation import trusted_technician_confirmation
    assert trusted_technician_confirmation(result)
    repeated = service.confirm_team_repair(order_id, actor['user_id'], '不得改写已复核事实', sample(status='running'))['workorder']
    assert repeated['technician_confirmation'] == result['technician_confirmation']
    assert repeated['repair_feedback'] == result['repair_feedback']
    closed = service.close_workorder(order_id)['workorder']
    assert trusted_technician_confirmation(closed)


def test_forged_actor_and_blank_feedback_cannot_create_receipt(context):
    service, actor, order_id = context
    with pytest.raises(PermissionError):
        service.confirm_team_repair(order_id, 'OTHER', '已维修', sample())
    with pytest.raises(ValueError):
        service.confirm_team_repair(order_id, actor['user_id'], ' ', sample())
    assert not service.get_workorder(order_id)['workorder'].get('technician_confirmation')


def test_legacy_completed_poststart_without_receipt_can_be_actually_reconfirmed(context):
    service, actor, order_id = context
    service.confirm_team_repair(order_id, actor['user_id'], '旧版本反馈', sample())
    service.finalize_team_repair(order_id, sample(status='running'))
    legacy = service.get_workorder(order_id)['workorder']
    legacy.pop('technician_confirmation', None)
    service.repository.update(legacy)
    result = service.confirm_team_repair(order_id, actor['user_id'], '本次实际处理与复测确认', sample(status='running'))['workorder']
    assert result.get('technician_confirmation'), 'Legacy completed order needs actual new server confirmation'
    assert result['repair_feedback']['feedback'] == '本次实际处理与复测确认'
    from shared.technician_confirmation import trusted_technician_confirmation
    assert trusted_technician_confirmation(result)
