"""多设备负责范围：真实临时数据库与 HTTP 会话，不连接现场服务。"""
import hashlib
import sqlite3
import time
from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.team.repository import TeamRepository
from app.team.routes import create_router
from app.team.service import TeamService
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


@pytest.fixture
def service(tmp_path):
    team = TeamService(
        TeamRepository(sqlite_path=str(tmp_path / 'team.db')),
        devices=lambda: [{'device_id': 'M1'}, {'device_id': 'M2'}, {'device_id': 'M3'}],
    )
    return BackendBusinessService(SQLiteRepository(str(tmp_path / 'orders.db')), team_service=team)


@pytest.fixture
def client(service):
    app = FastAPI()
    app.include_router(create_router(lambda: service))
    with TestClient(app) as value:
        yield value


def register(client, **fields):
    return client.post('/api/team/register', json={
        'username': 'owner', 'password': 'isolated-password', 'role': 'technician', **fields,
    })


def login(client):
    response = client.post('/api/team/login', json={'username': 'owner', 'password': 'isolated-password'})
    assert response.status_code == 200
    return response.json()['user']


def test_registration_deduplicates_multiple_devices_and_dispatches_second_selection(client, service):
    response = register(client, primary_device_id='M3', responsible_device_ids=['M2', 'M1', 'M2'])
    assert response.status_code == 201
    account = response.json()['user']
    assert account['primary_device_id'] == 'M2'
    assert account['responsible_device_ids'] == ['M2', 'M1']
    assert login(client) == account
    assert client.get('/api/team/me').json()['user'] == account
    for device in ('M2', 'M1'):
        candidate = service.query_technicians(device_id=device)['items'][0]
        assert candidate['technician_id'] == account['user_id']
        assert candidate['responsible_device_ids'] == ['M2', 'M1']
        assert candidate['available'] is True
        order_id = service.create_workorder(device_id=device)['workorder_id']
        assert service.assign_workorder(order_id, account['user_id'])['workorder']['assignee'] == account['user_id']
    assert service.query_technicians(device_id='M3')['items'] == []
    unrelated = service.create_workorder(device_id='M3')['workorder']
    with pytest.raises(ValueError):
        service.assign_workorder(unrelated['workorder_id'], account['user_id'])
    assert service.repository.get(unrelated['workorder_id']) == unrelated


def test_old_single_device_registration_stays_compatible(service):
    account = service.team.register('old-api', 'isolated-password', 'technician', 'M1')
    assert account['primary_device_id'] == 'M1'
    assert account['responsible_device_ids'] == ['M1']
    assert service.team.login('old-api', 'isolated-password')[0] == account
    assert service.team.technicians(device_id='M2') == []


def test_legacy_account_without_mapping_falls_back_only_to_existing_primary(service):
    salt = '01' * 16
    digest = hashlib.scrypt(b'isolated-password', salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    with service.team.repository.transaction() as db:
        db.execute('INSERT INTO team_accounts VALUES (?,?,?,?,?,?,?,?)',
                   ('LEGACY', 'legacy', 'legacy', salt + ':' + digest, 'technician', 'M2', 1, time.time()))
    reopened = TeamService(TeamRepository(sqlite_path=service.team.repository.sqlite_path), devices=service.team.devices)
    user, token = reopened.login('legacy', 'isolated-password')
    assert user['responsible_device_ids'] == ['M2']
    assert reopened.resolve_session(token)['responsible_device_ids'] == ['M2']
    assert [item['user_id'] for item in reopened.technicians(device_id='M2')] == ['LEGACY']
    assert reopened.technicians(device_id='M1') == []
    with reopened.repository.transaction() as db:
        assert db.execute('SELECT COUNT(*) AS n FROM team_account_devices').fetchone()['n'] == 0


@pytest.mark.parametrize('ids', [[], [''], ['M1', 'UNKNOWN'], ['M1', 2], 'M1'])
def test_invalid_registration_scope_never_creates_an_account(client, service, ids):
    response = register(client, primary_device_id='M1', responsible_device_ids=ids)
    assert response.status_code in (409, 422)
    assert service.team.technicians() == []


def test_responsibility_update_changes_existing_sessions_and_final_assignment_immediately(client, service):
    assert register(client, primary_device_id='M1').status_code == 201
    owner = login(client)
    _, other_session = service.team.login('owner', 'isolated-password')
    assert service.query_team_availability(device_id='M1')['available_count'] == 1
    old_candidate = service.query_technicians(device_id='M1')['items'][0]
    old_order = service.create_workorder(device_id='M1')['workorder']
    response = client.post('/api/team/responsibilities', json={'responsible_device_ids': ['M3', 'M2', 'M3']})
    assert response.status_code == 200
    updated = response.json()['user']
    assert updated['user_id'] == owner['user_id']
    assert updated['primary_device_id'] == 'M3'
    assert updated['responsible_device_ids'] == ['M3', 'M2']
    assert client.get('/api/team/me').json()['user'] == updated
    assert service.team.resolve_session(other_session) == updated
    assert service.query_team_availability(device_id='M1')['available_count'] == 0
    assert service.query_team_availability(device_id='M2')['available_count'] == 1
    with pytest.raises(ValueError):
        service.assign_workorder(old_order['workorder_id'], old_candidate['technician_id'])
    assert service.repository.get(old_order['workorder_id']) == old_order
    new_order_id = service.create_workorder(device_id='M2')['workorder_id']
    assert service.assign_workorder(new_order_id, owner['user_id'])['workorder']['status'] == 'in_progress'
    reopened = TeamService(TeamRepository(sqlite_path=service.team.repository.sqlite_path), devices=service.team.devices)
    assert reopened.resolve_session(other_session) == updated


@pytest.mark.parametrize('ids', [[], ['UNKNOWN'], ['M1', 'UNKNOWN'], None, 'M1'])
def test_invalid_scope_update_keeps_current_responsibilities(client, ids):
    assert register(client, primary_device_id='M1').status_code == 201
    original = login(client)
    response = client.post('/api/team/responsibilities', json={'responsible_device_ids': ids})
    assert response.status_code in (409, 422)
    assert client.get('/api/team/me').json()['user'] == original


def test_scope_update_requires_current_session_and_same_origin(client, service):
    account = service.team.register('owner', 'isolated-password', 'technician', 'M1')
    other = service.team.register('other', 'isolated-password', 'technician', 'M2')
    payload = {'responsible_device_ids': ['M3']}
    assert client.post('/api/team/responsibilities', json=payload).status_code == 401
    login(client)
    assert client.post('/api/team/responsibilities', json=payload, headers={'origin': 'https://foreign.invalid'}).status_code == 403
    for forged in ({'user_id': other['user_id']}, {'actor_id': other['user_id']}, {'role': 'supervisor'}):
        assert client.post('/api/team/responsibilities', json={**payload, **forged}).status_code == 422
    assert client.get('/api/team/me').json()['user']['primary_device_id'] == 'M1'
    assert service.team.technicians(device_id='M2')[0]['user_id'] == other['user_id']
    assert client.post('/api/team/responsibilities', json=payload, headers={'origin': 'http://testserver'}).status_code == 200
    assert client.get('/api/team/me').json()['user']['user_id'] == account['user_id']
    assert service.team.technicians(device_id='M2')[0]['user_id'] == other['user_id']


@pytest.mark.parametrize('mutation', ["role='supervisor'", 'enabled=0'])
def test_disabled_or_non_technician_session_cannot_modify_responsibilities(client, service, mutation):
    assert register(client, primary_device_id='M1').status_code == 201
    account = login(client)
    with service.team.repository.transaction() as db:
        db.execute('UPDATE team_accounts SET ' + mutation + ' WHERE user_id=?', (account['user_id'],))
    assert client.post('/api/team/responsibilities', json={'responsible_device_ids': ['M2']}).status_code == 401
    with service.team.repository.transaction() as db:
        assert db.execute('SELECT primary_device_id FROM team_accounts WHERE user_id=?', (account['user_id'],)).fetchone()['primary_device_id'] == 'M1'


def test_account_and_responsibilities_are_saved_atomically(service):
    with service.team.repository.transaction() as db:
        db.execute("CREATE TRIGGER reject_scope BEFORE INSERT ON team_account_devices "
                   "WHEN new.device_id='M2' BEGIN SELECT RAISE(ABORT,'isolated-scope-abort'); END")
    with pytest.raises(sqlite3.IntegrityError, match='isolated-scope-abort'):
        service.team.register('owner', 'isolated-password', 'technician', responsible_device_ids=['M1', 'M2'])
    assert service.team.technicians() == []
    account = service.team.register('owner', 'isolated-password', 'technician', 'M1')
    with pytest.raises(sqlite3.IntegrityError, match='isolated-scope-abort'):
        service.team.update_responsibilities(account['user_id'], ['M3', 'M2'])
    assert service.team.login('owner', 'isolated-password')[0] == account


@pytest.mark.parametrize('archived', [False, True])
def test_unfinished_assigned_work_blocks_removal_but_allows_adding_devices(client, service, archived):
    assert register(client, primary_device_id='M1').status_code == 201
    owner = login(client)
    order_id = service.create_workorder(device_id='M1')['workorder_id']
    service.assign_workorder(order_id, owner['user_id'])
    if archived:
        service.delete_workorder(order_id, actor_id=owner['user_id'])
    original_order = service.repository.get(order_id)
    response = client.post('/api/team/responsibilities', json={'responsible_device_ids': ['M2']})
    assert response.status_code == 409
    assert order_id in response.json()['detail']
    assert 'M1' in response.json()['detail']
    assert client.get('/api/team/me').json()['user'] == owner
    added = client.post('/api/team/responsibilities', json={'responsible_device_ids': ['M1', 'M2']})
    assert added.status_code == 200
    assert added.json()['user']['responsible_device_ids'] == ['M1', 'M2']
    assert service.repository.get(order_id) == original_order


@pytest.mark.parametrize('terminal', ['completed', 'closed', 'rejected'])
def test_device_can_be_removed_after_assigned_task_is_terminated(client, service, terminal):
    assert register(client, primary_device_id='M1').status_code == 201
    owner = login(client)
    order_id = service.create_workorder(device_id='M1')['workorder_id']
    service.assign_workorder(order_id, owner['user_id'])
    payload = {'responsible_device_ids': ['M2']}
    assert client.post('/api/team/responsibilities', json=payload).status_code == 409
    if terminal == 'rejected':
        service.update_workorder(order_id, status='rejected')
    else:
        snapshot = {'device_id': 'M1', 'status': 'stopped', 'alarm_code': '',
                    'metrics': {'pressure': 1}, 'interlocks_ok': True,
                    'checked_at': datetime.now(timezone.utc).isoformat()}
        service.confirm_team_repair(order_id, owner['user_id'], '已维修完成并复测', snapshot)
        if terminal == 'closed':
            service.finalize_team_repair(order_id, {**snapshot, 'status': 'running'})
            service.update_workorder(order_id, status='closed')
    finished = service.repository.get(order_id)
    response = client.post('/api/team/responsibilities', json=payload)
    assert response.status_code == 200
    assert response.json()['user']['responsible_device_ids'] == ['M2']
    assert service.repository.get(order_id) == finished
