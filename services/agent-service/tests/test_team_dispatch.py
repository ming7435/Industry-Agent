from app.agents.workorder.agent import WorkOrderAgent


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
