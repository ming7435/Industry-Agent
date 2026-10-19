"""移除外部消息队列后，实际事件 API 的执行、鉴权和幂等边界。"""
from concurrent.futures import ThreadPoolExecutor
from threading import Event
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app


EVENT = {'tenant_id': 'plant-test', 'device_id': 'D-1', 'event_id': 'DIRECT-1',
         'event_revision': 1, 'alarm_code': '700001'}
QUERY = {'tenant_id': 'plant-test', 'device_id': 'D-1', 'event_revision': 1}
RESULT_URL = '/api/v1/agent/event/DIRECT-1/result'


class Runtime:
    def __init__(self, handler=None):
        self.container = SimpleNamespace()
        self.calls = []
        self.handler = handler

    def run_abnormal_event(self, event):
        self.calls.append(dict(event))
        if self.handler:
            return self.handler(event)
        return {'event': event, 'status': 'blocked', 'task_id': 'TASK-DIRECT',
                'diagnosis': {'status': 'completed', 'summary': '证据不足，等待复核'}}


def test_external_queue_status_endpoint_is_removed():
    with TestClient(create_app(Runtime())) as client:
        assert client.get('/api/v1/runtime/event-queue').status_code == 404


def test_old_broker_environment_does_not_activate_a_transport(monkeypatch):
    monkeypatch.setenv('AGENT_EVENT_TRANSPORT', 'rabbitmq')
    monkeypatch.setenv('RABBITMQ_URL', 'amqp://unused:unused@127.0.0.1:9/%2F')
    runtime = Runtime()
    try:
        app = create_app(runtime)
    except Exception as error:
        pytest.fail('旧队列环境变量仍使直接事件入口依赖外部队列: ' + type(error).__name__)
    with TestClient(app) as client:
        response = client.post('/api/v1/agent/event', json={'event': EVENT})
        assert response.status_code == 200
        assert response.json()['diagnosis']['summary'] == '证据不足，等待复核'
        assert runtime.calls == [EVENT]


def test_direct_event_returns_original_business_result_and_deduplicates():
    runtime = Runtime()
    with TestClient(create_app(runtime)) as client:
        first = client.post('/api/v1/agent/event', json={'event': EVENT})
        second = client.post('/api/v1/agent/event', json={'event': EVENT})
        assert first.status_code == second.status_code == 200
        assert first.json() == second.json()
        assert first.json()['status'] == 'blocked'
        assert client.get(RESULT_URL, params=QUERY).json()['result']['task_id'] == 'TASK-DIRECT'
        assert runtime.calls == [EVENT]


def test_changed_parameters_conflict_but_new_revision_is_independent():
    runtime = Runtime()
    with TestClient(create_app(runtime)) as client:
        assert client.post('/api/v1/agent/event', json={'event': EVENT}).status_code == 200
        changed = {**EVENT, 'alarm_code': '700002'}
        assert client.post('/api/v1/agent/event', json={'event': changed}).status_code == 409
        revised = {**changed, 'event_revision': 2}
        assert client.post('/api/v1/agent/event', json={'event': revised}).status_code == 200
        assert runtime.calls == [EVENT, revised]


def test_direct_event_and_result_keep_authentication(monkeypatch):
    runtime = Runtime()
    monkeypatch.setenv('AGENT_API_TOKEN', 'test-direct-token')
    with TestClient(create_app(runtime)) as client:
        assert client.post('/api/v1/agent/event', json={'event': EVENT}).status_code == 401
        assert client.get(RESULT_URL, params=QUERY).status_code == 401
        headers = {'Authorization': 'Bearer test-direct-token'}
        assert client.post('/api/v1/agent/event', json={'event': EVENT}, headers=headers).status_code == 200
        assert client.get(RESULT_URL, params=QUERY, headers=headers).status_code == 200
        assert runtime.calls == [EVENT]


def test_timeout_does_not_reexecute_original_write():
    def uncertain(_):
        raise TimeoutError('response lost after an external operation')
    runtime = Runtime(uncertain)
    with TestClient(create_app(runtime)) as client:
        assert client.post('/api/v1/agent/event', json={'event': EVENT}).status_code == 504
        assert client.post('/api/v1/agent/event', json={'event': EVENT}).status_code == 409
        assert client.get(RESULT_URL, params=QUERY).status_code == 202
        assert runtime.calls == [EVENT]


def test_concurrent_duplicate_executes_once_and_progress_reads_do_not_wait():
    entered, release = Event(), Event()
    def delayed(event):
        entered.set()
        assert release.wait(5)
        return {'status': 'completed', 'event': event, 'task_id': 'ONE-TASK'}
    runtime = Runtime(delayed)
    with TestClient(create_app(runtime)) as client, ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(client.post, '/api/v1/agent/event', json={'event': EVENT})
        try:
            assert entered.wait(3)
            repeated = pool.submit(client.post, '/api/v1/agent/event', json={'event': EVENT})
            assert client.get(RESULT_URL, params=QUERY).status_code == 202
        finally:
            release.set()
        assert first.result(timeout=3).json() == repeated.result(timeout=3).json()
        assert runtime.calls == [EVENT]
