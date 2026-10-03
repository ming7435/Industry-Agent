from app.agents.workorder.agent import WorkOrderAgent


def test_registered_candidates_prefer_machine_then_workload():
    values = [
        {'technician_id': 'A', 'primary_device_id': 'M2', 'workload': 0, 'available': True},
        {'technician_id': 'B', 'primary_device_id': 'M1', 'workload': 2, 'available': True},
        {'technician_id': 'C', 'primary_device_id': 'M1', 'workload': 0, 'available': False},
    ]
    result = WorkOrderAgent.rank_candidates({'device_id': 'M1', 'candidates': values}, {}, {})
    assert [v['technician_id'] for v in result] == ['B', 'A']
    values[1]['available'] = False
    assert WorkOrderAgent.rank_candidates({'device_id': 'M1', 'candidates': values}, {}, {})[0]['technician_id'] == 'A'
