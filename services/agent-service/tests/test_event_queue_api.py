"""真实 API → MySQL 发件箱 → Worker → 原事件结果存储的契约。"""
from types import SimpleNamespace
from fastapi.testclient import TestClient

from queue_test_support import event, jobs, queue_mysql_config


def client_and_queue(jobs):
    from app.api.server import create_app
    from app.runtime.event_queue import EventQueue, QueueSettings
    calls, services = [], []
    class Runtime:
        container = SimpleNamespace()
        def run_abnormal_event(self, e):
            calls.append(e)
            return {'event': e, 'status': 'completed', 'diagnosis': {'summary': '已验证的测试适配器结果'}}
    def factory(handler, lookup, trace):
        service = EventQueue(jobs, handler, lookup, settings=QueueSettings(partitions=4))
        services.append(service)
        return service
    runtime = Runtime()
    app = create_app(runtime, event_queue_factory=factory)
    client = TestClient(app)
    client.runtime = runtime
    return client, services[0], calls


def test_post_accepts_without_inline_execution_and_get_never_executes(jobs):
    client, service, calls = client_and_queue(jobs)
    response = client.post('/api/v1/agent/event', json={'event': event()})
    assert response.status_code == 202
    receipt = response.json()
    assert receipt['status'] == 'queued' and receipt['job_id']
    query = {'device_id': 'D-1', 'tenant_id': 'plant-1', 'event_revision': 1}
    for _ in range(2):
        status = client.get('/api/v1/agent/event/E-1/result', params=query)
        assert status.status_code == 202 and status.json()['status'] == 'queued'
    assert calls == []
    service.process(receipt['job_id'])
    result = client.get('/api/v1/agent/event/E-1/result', params=query)
    assert result.status_code == 200
    assert result.json()['status'] == 'available'
    assert result.json()['result']['diagnosis']['summary'] == '已验证的测试适配器结果'
    assert len(calls) == 1
    client.post('/api/v1/agent/event', json={'event': event()})
    service.process(receipt['job_id'])
    assert len(calls) == 1


def test_api_rejects_changed_parameters_and_missing_device(jobs):
    client, service, calls = client_and_queue(jobs)
    assert client.post('/api/v1/agent/event', json={'event': event()}).status_code == 202
    assert client.post('/api/v1/agent/event', json={'event': event(alarm_code='700002')}).status_code == 409
    assert client.post('/api/v1/agent/event', json={'event': event(device='')}).status_code == 422
    assert calls == []


def test_queue_submit_and_read_keep_existing_authentication(jobs, monkeypatch):
    client, service, calls = client_and_queue(jobs)
    monkeypatch.setenv('AGENT_API_TOKEN', 'isolated-test-token')
    assert client.post('/api/v1/agent/event', json={'event': event()}).status_code == 401
    assert client.get('/api/v1/runtime/event-queue').status_code == 401
    result = client.get('/api/v1/runtime/event-queue', headers={'Authorization': 'Bearer isolated-test-token'})
    assert result.status_code == 200
    assert result.json()['ready'] is False
    assert calls == []


def test_unknown_job_is_not_hidden_by_an_old_progress_snapshot(jobs):
    client, service, calls = client_and_queue(jobs)
    receipt = service.submit(event())
    jobs.claim(receipt['job_id'], 'lost-worker')
    jobs.finish(receipt['job_id'], 'lost-worker', 'unknown')
    # 使用 API 创建的真实仓库，不能 mock 掉查询或状态判断。
    client.runtime.container.event_results.record_stage(event(), {'diagnosis': {'status': 'completed', 'summary': '诊断已完成'}})
    response = client.get('/api/v1/agent/event/E-1/result', params={'device_id': 'D-1', 'tenant_id': 'plant-1', 'event_revision': 1})
    assert response.status_code == 202
    assert response.json()['status'] == 'unknown'
    assert response.json()['result']['diagnosis']['summary'] == '诊断已完成'
    assert calls == []


def test_migration_rejects_different_payload_against_existing_event_result(jobs):
    from app.runtime.event_store import scoped_event_key, EventResultConflict
    from app.runtime.recovery import RecoveryManager
    import pytest
    client, service, calls = client_and_queue(jobs)
    original = event()
    client.runtime.container.event_results.get_or_create(scoped_event_key(original),
        lambda: {'status': 'completed', 'event': original}, fingerprint=RecoveryManager.event_fingerprint(original))
    changed = event(alarm_code='700002')
    response = client.post('/api/v1/agent/event', json={'event': changed})
    assert response.status_code == 409
    assert jobs.pending() == []
    with pytest.raises(EventResultConflict):
        service.lookup(changed)
    assert calls == []
