"""重新校验只读当前设备，不执行生产控制，并复用正式 Runtime。"""
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.api.server import create_app
from app.runtime.event_store import EventResultStore
from runtime_slimming_adapter import build_fault_scenario


def setup_retry(tmp_path, monkeypatch):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch)
    monkeypatch.setattr('app.api.business_returns.team_actor', lambda _: {'user_id':'TEST-USER','role':'technician'})
    EventResultStore().get_or_create('test-old-plan', lambda: {'event':event, 'maintenance_plan':{'plan_id':'PLAN-OLD','workorder_ready':False}})
    runtime.test_boundary.responses[('plc','get_device_status')] = {**event['realtime_snapshot'],'found':True,'success':True,
        'alarm_code':event['alarm_code'],'checked_at':datetime.now(timezone.utc).isoformat()}
    return TestClient(create_app(orchestrator=runtime)),runtime


def test_retry_runs_real_agents_and_same_command_is_not_reexecuted(tmp_path, monkeypatch):
    client, runtime = setup_retry(tmp_path,monkeypatch)
    response = client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'RETRY-1'})
    assert response.status_code == 200,response.text
    result = response.json()
    assert result['maintenance_plan']['plan_id'] != 'PLAN-OLD'
    assert result['maintenance_plan']['repair_steps']
    assert result['workorder']['workorder_id']
    saved = runtime.container.workorder_service.list()[0]
    assert saved['status'] == 'in_progress'
    assert saved['assignee'] == 'TEST-REGISTERED-U1'
    calls_before = len(runtime.test_boundary.calls)
    repeat = client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'RETRY-1'})
    assert repeat.json()['task_id'] == result['task_id']
    assert len(runtime.test_boundary.calls) == calls_before
    names = {r['name'] for r in runtime.container.trace.list(trace_id=result['trace_id']) if r['event']=='agent_completed'}
    assert names >= {'diagnosis','maintenance','workorder'}
    assert not any(operation in {'stop_line','start_line','restart_line'} for _,operation,_ in runtime.test_boundary.calls)


def test_changed_or_stale_device_blocks_replaying_history(tmp_path,monkeypatch):
    client,runtime = setup_retry(tmp_path,monkeypatch)
    status = runtime.test_boundary.responses[('plc','get_device_status')]
    status['alarm_code'] = 'OTHER'
    denied=client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'R1'})
    assert denied.status_code == 409
    assert denied.json()['detail']['execution_started'] is False
    status['alarm_code'] = '700001'
    status['checked_at'] = '2000-01-01T00:00:00+00:00'
    assert client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'R2'}).status_code == 409
    assert runtime.container.workorder_service.list() == []


def test_temporary_read_failure_allows_new_command_without_unknown_write_claim(tmp_path,monkeypatch):
    client,runtime=setup_retry(tmp_path,monkeypatch)
    current=runtime.test_boundary.responses[('plc','get_device_status')]
    current['found']=False
    first=client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'R1'})
    assert first.status_code==502
    assert first.json()['detail']['execution_started'] is False
    current['found']=True
    repeated=client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'R1'})
    assert repeated.status_code==502  # 同一确定性拒绝仍可对账，不转成 uncertain。
    assert client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'R2'}).status_code==200


def test_client_cannot_supply_diagnosis_approval_or_plan(tmp_path,monkeypatch):
    client,_ = setup_retry(tmp_path,monkeypatch)
    assert client.post('/api/maintenance/plans/PLAN-OLD/retry',json={'request_id':'R1','workorder_ready':True}).status_code == 422
