import pytest
from test_team_dispatch import service
from shared.technician_confirmation import trusted_technician_confirmation


def assigned(service):
    tech = service.team.register('维修', 'password-123', 'technician', 'M1')
    service.team.login('维修', 'password-123')
    order_id = service.create_workorder(device_id='M1', event_id='E1')['workorder_id']
    service.assign_workorder(order_id, tech['user_id'])
    return order_id, tech['user_id']


def test_manual_confirmation_completes_without_device_verification(service, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    order_id, actor = assigned(service)
    result = service.confirm_team_repair(order_id, actor, '完成', {}, manual_restart=True)
    order = result['workorder']
    assert order['status'] == 'completed'
    assert order['repair_feedback'] == {'feedback': '完成', 'operator': actor}
    assert order['repair_verification']['phase'] == 'manual_confirmation'
    assert order['repair_verification']['automatic_verification'] is False
    assert 'passed' not in order['repair_verification']
    assert trusted_technician_confirmation(order)
    repeated = service.confirm_team_repair(order_id, actor, '重复确认', {}, manual_restart=True)
    assert repeated['workorder']['technician_confirmation'] == order['technician_confirmation']


def test_manual_confirmation_keeps_actor_feedback_and_virtual_mode_requirements(service, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    order_id, actor = assigned(service)
    with pytest.raises(PermissionError):
        service.confirm_team_repair(order_id, 'another-user', '完成', {}, manual_restart=True)
    with pytest.raises(ValueError):
        service.confirm_team_repair(order_id, actor, '  ', {}, manual_restart=True)
    monkeypatch.delenv('FACTORY_CONTROL_MODE')
    with pytest.raises(ValueError):
        service.confirm_team_repair(order_id, actor, '完成', {}, manual_restart=True)
    assert service.get_workorder(order_id)['workorder']['status'] == 'in_progress'
