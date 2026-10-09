"""Public API reads persisted facts and only executes server-authorized actions."""
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
import pytest
from virtual_production_test_support import production_backend
from test_virtual_factory_client import isolated_factory, run, setup
from test_virtual_production_reconciliation import coordinator


@pytest.fixture
def production_api(production_backend, isolated_factory):
    from app.api.production_simulation import build_virtual_production_router
    target, backend = coordinator(production_backend, isolated_factory)
    cad_calls, records = [], {run()['run_id']: run()}
    def reader(request, run_id):
        cad_calls.append(run_id)
        if run_id not in records: raise HTTPException(404, 'CAD expired')
        return records[run_id]
    def auth(): return 'isolated-write'
    app = FastAPI(); app.include_router(build_virtual_production_router(target, backend, auth, reader))
    with TestClient(app) as client:
        client.cookies.set('maintenance_session', 'owner-session')
        yield client, target, backend, cad_calls, records


def plan_body(command='api-plan'):
    return {'command_id': command, 'design_run_id': run()['run_id'], 'setup': setup(), 'material': '钢', 'batch_id': 'A'}


PREFIX = '/api/production/virtual'


def test_authenticated_production_api_uses_server_design(production_api, isolated_factory):
    client, target, backend, calls, _ = production_api
    assert client.get(PREFIX + '/capabilities').status_code == 200
    assert client.get(PREFIX + '/jobs').json()['items'] == []
    assert not any(call['method'] == 'POST' for call in isolated_factory[2])
    for field, value in [('run', run()), ('qualified', True), ('actor_id', 'USER-2'), ('role', 'supervisor')]:
        assert client.post(PREFIX + '/plans', json={**plan_body(), field: value}).status_code == 422
    result = client.post(PREFIX + '/plans', json=plan_body())
    assert result.status_code == 200
    job = result.json()
    assert calls == [run()['run_id']]
    assert job['status'] == 'prepared'
    assert not any(call['method'] == 'POST' for call in isolated_factory[2])
    receipt = client.post(PREFIX + '/jobs/' + job['job_id'] + '/submit', json={'digest': job['program_digest']})
    assert receipt.status_code == 200
    assert receipt.json()['status'] == 'received'
    assert client.post(PREFIX + '/jobs/' + job['job_id'] + '/start', json={'digest': job['program_digest']}).json()['status'] == 'running'
    isolated_factory[1].tick(20)
    # GET does not query and persist a fresh factory completion.
    assert client.get(PREFIX + '/jobs/' + job['job_id']).json()['status'] == 'running'
    completed = client.post(PREFIX + '/jobs/' + job['job_id'] + '/sync', json={}).json()
    check = client.post(PREFIX + '/parts/' + completed['part_id'] + '/inspect', json={'output_digest': completed['output']['output_digest']})
    assert check.status_code == 200
    assert check.json()['status'] == 'pass'
    summary = client.get(PREFIX + '/quality', params={'design_run_id': job['design_run_id'], 'batch_id': 'A'})
    assert summary.json()['rates']['consistent'] == 100


def test_cross_owner_job_is_not_accessible(production_api):
    client, *_ = production_api
    job = client.post(PREFIX + '/plans', json=plan_body()).json()
    client.cookies.clear()
    assert client.get(PREFIX + '/jobs/' + job['job_id']).status_code == 401
    client.cookies.set('maintenance_session', 'other-session')
    assert client.get(PREFIX + '/jobs/' + job['job_id']).status_code == 403
    client.cookies.clear(); client.cookies.set('maintenance_session', 'supervisor-session')
    assert client.get(PREFIX + '/jobs/' + job['job_id']).status_code == 200


def test_saved_plan_retry_survives_cad_ttl_but_new_command_cannot_use_old_snapshot(production_api):
    client, _, _, calls, records = production_api
    job = client.post(PREFIX + '/plans', json=plan_body()).json()
    records.clear()
    replay = client.post(PREFIX + '/plans', json=plan_body())
    assert replay.status_code == 200
    assert replay.json()['job_id'] == job['job_id']
    assert calls == [run()['run_id']]
    assert client.post(PREFIX + '/plans', json=plan_body('new-command')).status_code == 404
    config = setup(); config['spindle_rpm'] = 2000
    assert client.post(PREFIX + '/plans', json={**plan_body(), 'setup': config}).status_code == 409


def test_post_cannot_forge_completion_and_query_limit_is_bounded(production_api):
    client, *_ = production_api
    job = client.post(PREFIX + '/plans', json=plan_body()).json()
    for action in ['start', 'submit', 'sync']:
        assert client.post(PREFIX + '/jobs/' + job['job_id'] + '/' + action, json={'digest': job['program_digest'], 'status': 'completed'}).status_code == 422
    assert client.get(PREFIX + '/jobs', params={'limit': 51}).status_code == 422
    assert client.post(PREFIX + '/jobs/' + job['job_id'] + '/submit', json={'digest': 'b' * 64}).status_code == 409
    assert client.post(PREFIX + '/plans', json=plan_body('cross-origin'), headers={'Origin': 'http://evil.example'}).status_code == 403
