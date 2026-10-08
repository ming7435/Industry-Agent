"""正式候选与监督催办只关联注册账号和具体工单。"""
import pytest
from app.team.repository import TeamRepository
from app.team.service import TeamService
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


@pytest.fixture
def service(tmp_path):
    team = TeamService(TeamRepository(sqlite_path=str(tmp_path / 'team.db')), devices=lambda: [{'device_id': 'M1'}])
    return BackendBusinessService(SQLiteRepository(str(tmp_path / 'orders.db')), team_service=team)


def test_candidates_are_registered_and_workload_is_real(service, legacy_supervisor):
    assert service.query_technicians()['items'] == []
    legacy_supervisor(service.team)
    tech = service.team.register('维修', 'password-123', 'technician', 'M1')
    service.team.login('维修', 'password-123')
    order = service.create_workorder(device_id='M1')['workorder_id']
    service.assign_workorder(order, tech['user_id'])
    candidates = service.query_technicians()['items']
    assert len(candidates) == 1
    assert candidates[0]['technician_id'] == tech['user_id']
    assert candidates[0]['workload'] == 1
    assert not candidates[0].get('synthetic')
    with pytest.raises(ValueError):
        service.assign_workorder(order, 'TECH-001')


def test_supervisor_reminder_targets_actual_assignee(service, legacy_supervisor):
    supervisor = legacy_supervisor(service.team)
    tech = service.team.register('维修', 'password-123', 'technician', 'M1')
    service.team.login('维修', 'password-123')
    order = service.create_workorder(device_id='M1')['workorder_id']
    service.assign_workorder(order, tech['user_id'])
    with pytest.raises(PermissionError):
        service.remind(order, tech, '请处理')
    reminder = service.remind(order, supervisor, '请处理')
    assert reminder['recipient_id'] == tech['user_id']
    assert reminder['workorder_id'] == order
    assert service.team.reminders(tech)[0]['text'] == '请处理'


def test_repeated_assignment_is_stable_and_cannot_silently_reassign(service):
    first = service.team.register('维修一', 'password-123', 'technician', 'M1')
    second = service.team.register('维修二', 'password-123', 'technician', 'M1')
    service.team.login('维修一', 'password-123')
    service.team.login('维修二', 'password-123')
    order = service.create_workorder(device_id='M1')['workorder_id']
    service.assign_workorder(order, first['user_id'])
    before = service.get_workorder(order)['workorder']
    service.assign_workorder(order, first['user_id'])
    with pytest.raises(ValueError):
        service.assign_workorder(order, second['user_id'])
    after = service.get_workorder(order)['workorder']
    assert after['assignee'] == first['user_id']
    assert after['events'] == before['events']


def test_reminder_read_status_requires_actual_recipient(service, legacy_supervisor):
    supervisor = legacy_supervisor(service.team)
    tech = service.team.register('维修', 'password-123', 'technician', 'M1')
    reminder = service.team.create_reminder('WO1', supervisor['user_id'], tech['user_id'], '请接单')
    with pytest.raises(PermissionError):
        service.team.read_reminder(reminder['reminder_id'], supervisor)
    service.team.read_reminder(reminder['reminder_id'], tech)
    assert service.team.reminders(supervisor)[0]['read'] is True
