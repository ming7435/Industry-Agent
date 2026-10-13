from types import SimpleNamespace
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
import pytest

from app.api.task_recovery import build_task_recovery_router
from app.runtime.recovery import RecoveryManager
from app.runtime.durable_store import DurableJsonStore
from test_runtime_recovery import snapshot


def client(tmp_path, actor):
    manager = RecoveryManager(DurableJsonStore(str(tmp_path / 'r.sqlite3')))
    saved = manager.checkpoint({**snapshot(), 'recovery_actor_id': 'owner'}, 'failed')
    calls = []
    def resume(record):
        calls.append(record['state']['runtime_next_index'])
        return {**record['state'], 'runtime_result': {'status': 'completed'}}
    app = FastAPI()
    runtime = SimpleNamespace(container=SimpleNamespace(recovery=manager, coordinator=SimpleNamespace(resume_failed=resume)))
    def auth(request: Request): return 'test'
    app.include_router(build_task_recovery_router(runtime, auth, actor_lookup=lambda request: actor))
    return TestClient(app), saved, calls


def test_retired_resume_cannot_execute_or_replay_server_checkpoint(tmp_path):
    api, saved, calls = client(tmp_path, {'user_id': 'owner', 'role': 'technician'})
    listing = api.get('/api/runtime/recovery').json()['items']
    assert len(listing) == 1 and 'state' not in listing[0]
    url = '/api/runtime/recovery/' + saved['recovery_id'] + '/resume'
    first = api.post(url, json={'request_id': 'one'})
    second = api.post(url, json={'request_id': 'one'})
    assert first.status_code == 404 and second.status_code == 404
    assert calls == []
    assert listing[0]['can_resume'] is False


def test_api_denies_other_actor_and_client_plan_injection(tmp_path):
    api, saved, calls = client(tmp_path, {'user_id': 'other', 'role': 'technician'})
    assert api.get('/api/runtime/recovery').json()['items'] == []
    url = '/api/runtime/recovery/' + saved['recovery_id'] + '/resume'
    assert api.post(url, json={'request_id': 'one'}).status_code == 404
    assert api.post(url, json={'request_id': 'one', 'plan': {}, 'actor_id': 'owner'}).status_code == 404
    assert calls == []


def test_supervisor_can_read_but_cannot_resume_unowned_system_runtime(tmp_path):
    api, saved, calls = client(tmp_path, {'user_id': 'reviewer', 'role': 'supervisor'})
    assert api.get('/api/runtime/recovery').json()['items']
    assert api.post('/api/runtime/recovery/' + saved['recovery_id'] + '/resume', json={'request_id': 'one'}).status_code == 404
    assert calls == []


def test_cross_origin_recovery_is_rejected_before_execution(tmp_path):
    api, saved, calls = client(tmp_path, {'user_id':'owner','role':'technician'})
    response=api.post('/api/runtime/recovery/'+saved['recovery_id']+'/resume',json={'request_id':'one'},headers={'Origin':'https://evil.example'})
    assert response.status_code==404 and calls==[]
