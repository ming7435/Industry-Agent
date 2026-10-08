from datetime import datetime, timezone
import pytest
from test_team_dispatch import service


def test_prestart_confirmation_cannot_close_or_be_spoofed(service, legacy_supervisor):
    tech = service.team.register('维修', 'password-123', 'technician', 'M1')
    supervisor = legacy_supervisor(service.team)
    service.team.login('维修', 'password-123')
    order_id = service.create_workorder(device_id='M1', event_id='E1')['workorder_id']
    service.assign_workorder(order_id, tech['user_id'])
    sample = {'device_id': 'M1', 'status': 'stopped', 'metrics': {'pressure': 1}, 'checked_at': datetime.now(timezone.utc).isoformat()}
    with pytest.raises(PermissionError):
        service.confirm_team_repair(order_id, supervisor['user_id'], '已修好', sample)
    with pytest.raises(ValueError):
        service.confirm_team_repair(order_id, tech['user_id'], '已修好', {**sample, 'device_id': 'M2'})
    result = service.confirm_team_repair(order_id, tech['user_id'], '已修好', sample)
    assert result['workorder']['status'] == 'completed'
    assert result['workorder']['repair_verification']['phase'] == 'prestart'
    assert result['workorder']['maintenance_confirmed_by'] == tech['user_id']
    with pytest.raises(ValueError):
        service.close_workorder(order_id)
    service.finalize_team_repair(order_id, {**sample, 'status': 'running'})
    assert service.close_workorder(order_id)['workorder']['status'] == 'closed'


def test_repeated_confirmation_preserves_poststart_verification(service):
    tech = service.team.register('维修', 'password-123', 'technician', 'M1')
    service.team.login('维修', 'password-123')
    order_id = service.create_workorder(device_id='M1', event_id='E1')['workorder_id']
    service.assign_workorder(order_id, tech['user_id'])
    sample = {'device_id': 'M1', 'status': 'stopped', 'metrics': {'pressure': 1}, 'checked_at': datetime.now(timezone.utc).isoformat()}
    service.confirm_team_repair(order_id, tech['user_id'], '已修好', sample)
    service.finalize_team_repair(order_id, {**sample, 'status': 'running'})
    result = service.confirm_team_repair(order_id, tech['user_id'], '重复提交', {**sample, 'status': 'running'})
    assert result['workorder']['repair_verification']['phase'] == 'poststart'
    assert result['workorder']['repair_feedback']['feedback'] == '已修好'
