"""Persistent plan projections retain dispatch and approval facts for both stored formats."""
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from app.api.server import create_app
from test_maintenance_plan_returns import saved_pipeline, store_result


@pytest.mark.parametrize('wrapped', [False, True])
@pytest.mark.parametrize('state', ['assigned', 'approval', 'waiting'])
def test_persistent_plan_does_not_lose_dispatch_facts(tmp_path, monkeypatch, wrapped, state):
    path = str(tmp_path / 'events.db')
    monkeypatch.setenv('EVENT_STORE_PATH', path)
    pipeline = saved_pipeline()
    pipeline['maintenance_plan'].update(workorder_ready=True, validation_findings=[])
    if state == 'assigned':
        pipeline.update(status='completed', stop_reason='')
        pipeline['workorder'] = {'workorder_id': 'WO-PERSISTED', 'assignee': 'TECH-1',
                                'device_id': 'M-1', 'event_id': 'EVT-1', 'plan_id': 'PLAN-UNASSIGNED'}
    elif state == 'approval':
        pipeline.update(status='waiting_approval', requires_approval=True)
    else:
        pipeline.update(status='waiting_for_personnel', dispatch_reason='设备负责人员当前未登录')
    store_result(path, 'plan-projection', pipeline, wrapped=wrapped)
    with TestClient(create_app(SimpleNamespace(container=SimpleNamespace()))) as client:
        response = client.get('/api/maintenance/plans')
        assert response.status_code == 200, response.text
        plan = response.json()['items'][0]
    assert plan['event_id'] == 'EVT-1' and plan['event_revision'] == 2
    if state == 'assigned':
        assert plan['dispatch']['status'] == 'dispatched'
        assert plan['dispatch']['workorder_id'] == 'WO-PERSISTED'
        assert plan['dispatch']['assignee'] == 'TECH-1'
    elif state == 'approval':
        assert plan['dispatch']['status'] == 'waiting_approval'
        assert plan['dispatch']['allowed'] is False
    else:
        assert plan['dispatch']['status'] == 'waiting_for_personnel'
        assert plan['dispatch']['reason'] == '设备负责人员当前未登录'
