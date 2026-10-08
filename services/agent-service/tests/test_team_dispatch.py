from app.agents.workorder.agent import WorkOrderAgent
import pytest


def test_registered_candidates_require_online_machine_owner_then_workload():
    values = [
        {'technician_id': 'A', 'primary_device_id': 'M2', 'workload': 0, 'available': True, 'online': True, 'registered': True},
        {'technician_id': 'B', 'primary_device_id': 'M1', 'workload': 2, 'available': True, 'online': True, 'registered': True},
        {'technician_id': 'C', 'primary_device_id': 'M1', 'workload': 0, 'available': False, 'online': True, 'registered': True},
        {'technician_id': 'D', 'primary_device_id': 'M1', 'workload': 1, 'available': True, 'online': True, 'registered': True},
    ]
    result = WorkOrderAgent.rank_candidates({'device_id': 'M1', 'candidates': values}, {}, {})
    assert [v['technician_id'] for v in result] == ['D', 'B']
    values[1]['online'] = False
    values[3]['available'] = False
    assert WorkOrderAgent.rank_candidates({'device_id': 'M1', 'candidates': values}, {}, {}) == []


def candidate(**changes):
    return {'technician_id': 'MULTI', 'primary_device_id': 'M1', 'responsible_device_ids': ['M1', 'M2'],
            'workload': 0, 'available': True, 'online': True, 'registered': True, **changes}


def test_multidevice_technician_can_receive_any_selected_device_only():
    for device_id in ('M1', 'M2'):
        ranked = WorkOrderAgent.rank_candidates({'device_id': device_id, 'candidates': [candidate()]}, {}, {})
        assert [person['technician_id'] for person in ranked] == ['MULTI']
    assert WorkOrderAgent.rank_candidates({'device_id': 'M3', 'candidates': [candidate()]}, {}, {}) == []


@pytest.mark.parametrize('scope', [[], None, 'M1,M2', {'M1': True}, ['M1', None], ['M1', '']])
def test_explicit_invalid_device_scope_never_falls_back_to_primary_device(scope):
    assert WorkOrderAgent.rank_candidates({'device_id': 'M1', 'candidates': [candidate(responsible_device_ids=scope)]}, {}, {}) == []


@pytest.mark.parametrize('change', [{'registered': False}, {'online': False}, {'available': False}])
def test_multiple_devices_do_not_bypass_personnel_eligibility(change):
    assert WorkOrderAgent.rank_candidates({'device_id': 'M2', 'candidates': [candidate(**change)]}, {}, {}) == []


def test_multiple_eligible_owners_still_rank_by_workload_then_user_id():
    people = [candidate(technician_id='B', workload=1), candidate(technician_id='C', workload=0), candidate(technician_id='A', workload=0)]
    ranked = WorkOrderAgent.rank_candidates({'device_id': 'M2', 'candidates': people}, {}, {})
    assert [person['technician_id'] for person in ranked] == ['A', 'C', 'B']
