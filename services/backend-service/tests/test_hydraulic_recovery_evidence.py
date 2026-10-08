"""Order-bound hydraulic recovery validation using only temporary databases."""
from copy import deepcopy
from datetime import datetime, timezone

import pytest

from app.team.repository import TeamRepository
from app.team.service import TeamService
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


DEVICE = 'TRAK-TC820LTYSI-001'


@pytest.fixture
def repair(tmp_path):
    team = TeamService(TeamRepository(sqlite_path=str(tmp_path / 'team.db')),
                       devices=lambda: [{'device_id': DEVICE}])
    service = BackendBusinessService(SQLiteRepository(str(tmp_path / 'orders.db')), team_service=team)
    technician = team.register('hydraulic-owner', 'isolated-password', 'technician', DEVICE)
    team.login('hydraulic-owner', 'isolated-password')
    order_id = service.create_workorder(device_id=DEVICE, alarm_code='700010', event_id='HYD-EVENT',
        diagnosis_snapshot={'device_id': DEVICE, 'alarm_code': '700010',
                            'evidence': ['hydraulic_pressure_psi falling', 'quill_pressure_psi falling']},
        maintenance_plan_snapshot={'plan_kind': 'repair', 'repair_target': '液压系统停机核查'})['workorder_id']
    service.assign_workorder(order_id, technician['user_id'])
    sample = {'device_id': DEVICE, 'status': 'stopped', 'alarm_code': '',
        'checked_at': datetime.now(timezone.utc).isoformat(),
        'metrics': {'hydraulic_pressure_psi': 45, 'quill_pressure_psi': 15},
        'metric_details': {'hydraulic_pressure_psi': {'normal_range': [40, 50]},
                           'quill_pressure_psi': {'normal_range': [10, 20]}}}
    return service, order_id, technician['user_id'], sample


@pytest.mark.parametrize('missing', ['metric', 'range'])
def test_backend_rejects_missing_hydraulic_evidence_before_changing_order(repair, missing):
    service, order_id, actor_id, sample = repair
    before = deepcopy(service.repository.get(order_id))
    if missing == 'metric':
        sample['metrics'].pop('quill_pressure_psi')
        sample['metric_details'].pop('quill_pressure_psi')
    else:
        sample['metric_details'].pop('hydraulic_pressure_psi')
    with pytest.raises(ValueError, match='预启动验证'):
        service.confirm_team_repair(order_id, actor_id, '完成', sample)
    assert service.repository.get(order_id) == before


def test_hydraulic_completion_and_poststart_keep_existing_lifecycle(repair):
    service, order_id, actor_id, sample = repair
    confirmed = service.confirm_team_repair(order_id, actor_id, '完成', sample)['workorder']
    assert confirmed['status'] == 'completed'
    assert confirmed['repair_verification']['phase'] == 'prestart'
    before = deepcopy(service.repository.get(order_id))
    missing = {**sample, 'status': 'running', 'metrics': {'spindle_speed_rpm': 0},
               'metric_details': {'spindle_speed_rpm': {'normal_range': [0, 10]}}}
    with pytest.raises(ValueError):
        service.finalize_team_repair(order_id, missing)
    assert service.repository.get(order_id) == before
    service.finalize_team_repair(order_id, {**sample, 'status': 'running'})
    assert service.close_workorder(order_id)['workorder']['status'] == 'closed'
