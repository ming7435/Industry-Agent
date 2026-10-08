"""真实账号、并发席位及会话的隔离回归。"""
from concurrent.futures import ThreadPoolExecutor
import sqlite3
import pytest

from app.team.repository import TeamRepository
from app.team.service import TeamService


@pytest.fixture
def team(tmp_path):
    return TeamService(TeamRepository(sqlite_path=str(tmp_path / 'team.db')), devices=lambda: [{'device_id': 'M-1'}, {'device_id': 'M-2'}])


def test_password_hash_session_and_logout(team):
    account = team.register('维修甲', 'test-password-123', 'technician', 'M-1')
    assert account['role'] == 'technician'
    assert 'password_hash' not in account
    with sqlite3.connect(team.repository.sqlite_path) as db:
        stored = db.execute('SELECT password_hash FROM team_accounts').fetchone()[0]
    assert stored != 'test-password-123'
    with pytest.raises(ValueError):
        team.login('维修甲', 'wrong-password')
    user, token = team.login('维修甲', 'test-password-123')
    assert team.resolve_session(token)['user_id'] == user['user_id']
    team.logout(token)
    assert team.resolve_session(token) is None


def test_equivalent_username_conflicts(team):
    team.register('CAFÉ', 'test-password-123', 'technician', 'M-1')
    with pytest.raises(ValueError):
        team.register('cafe\u0301', 'test-password-123', 'technician', 'M-1')


def test_registration_caps_roles_atomically(team):
    for n in range(3):
        team.register(f'tech{n}', 'test-password-123', 'technician', 'M-1')
    def register(n):
        try:
            team.register(f'last{n}', 'test-password-123', 'technician', 'M-2')
            return True
        except ValueError:
            return False
    with ThreadPoolExecutor(2) as pool:
        assert sorted(pool.map(register, [1, 2])) == [False, True]
    assert len(team.technicians()) == 4


def test_unknown_device_and_invalid_role_rejected(team):
    with pytest.raises(ValueError):
        team.register('unknown', 'test-password-123', 'technician', 'fake')
    with pytest.raises(ValueError):
        team.register('admin', 'test-password-123', 'admin')


def test_sessions_persist_and_expire(team):
    team.register('owner', 'test-password-123', 'technician', 'M-1')
    _, token = team.login('owner', 'test-password-123')
    reopened = TeamService(TeamRepository(sqlite_path=team.repository.sqlite_path), devices=lambda: [])
    assert reopened.resolve_session(token)['username'] == 'owner'
    with reopened.repository.transaction() as db:
        db.execute('UPDATE team_sessions SET expires_at=0')
    assert reopened.resolve_session(token) is None


def test_supervisor_registration_cannot_create_account(team):
    with pytest.raises(ValueError, match='仅支持维修人员注册'):
        team.register('监督', 'test-password-123', 'supervisor')
    with team.repository.transaction() as db:
        assert db.execute('SELECT COUNT(*) AS n FROM team_accounts').fetchone()['n'] == 0


def test_legacy_supervisor_password_cannot_create_session(team, legacy_supervisor):
    legacy_supervisor(team, '监督', 'test-password-123')
    with pytest.raises(ValueError):
        team.login('监督', 'test-password-123')
    assert team.repository.active_session_user_ids() == set()


def test_removed_supervisor_session_is_rejected_on_every_public_read(team, legacy_supervisor):
    import hashlib
    import time
    from types import SimpleNamespace
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.team.routes import create_router

    supervisor = legacy_supervisor(team)
    token = 'isolated-historical-supervisor-session'
    team.repository.save_session(hashlib.sha256(token.encode()).hexdigest(), supervisor['user_id'], time.time() + 600)
    app = FastAPI()
    service = SimpleNamespace(team=team, list_workorders=lambda: {'items': []})
    app.include_router(create_router(lambda: service))
    client = TestClient(app)
    client.cookies.set('maintenance_session', token)
    for path in ('me', 'workorders', 'reminders'):
        assert client.get('/api/team/' + path).status_code == 401
    assert team.resolve_session(token) is None
    assert client.post('/api/team/login', json={'username': '监督', 'password': 'password-123'}).status_code == 401
    assert client.post('/api/team/register', json={'username': '新监督', 'password': 'password-123', 'role': 'supervisor'}).status_code == 409
    assert client.post('/api/team/logout').status_code == 200
    assert team.repository.active_session_user_ids() == set()
    with team.repository.transaction() as db:
        assert db.execute('SELECT COUNT(*) AS n FROM team_accounts').fetchone()['n'] == 1


def test_technician_registration_login_and_order_scope_still_work(team):
    from types import SimpleNamespace
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.team.routes import create_router

    own = team.register('本人', 'password-123', 'technician', 'M-1')
    app = FastAPI()
    service = SimpleNamespace(team=team, list_workorders=lambda: {'items': [
        {'workorder_id': 'WO-OWN', 'assignee': own['user_id']}, {'workorder_id': 'WO-OTHER', 'assignee': 'other'}]})
    app.include_router(create_router(lambda: service))
    client = TestClient(app)
    response = client.post('/api/team/register', json={'username': '维修乙', 'password': 'password-123', 'role': 'technician', 'primary_device_id': 'M-2'})
    assert response.status_code == 201
    assert response.json()['user']['primary_device_id'] == 'M-2'
    assert client.post('/api/team/login', json={'username': '本人', 'password': 'password-123'}).status_code == 200
    assert client.get('/api/team/me').json()['user']['user_id'] == own['user_id']
    assert client.get('/api/team/workorders').json()['items'] == [{'workorder_id': 'WO-OWN', 'assignee': own['user_id']}]


@pytest.mark.parametrize('rollback', [False, True])
def test_reentrant_team_transaction_reuses_connection_and_releases_after_exit(team, rollback):
    def nested_write():
        with team.repository.transaction() as db:
            team.repository.save_state(db, 'outer', {'saved': True})
            with team.repository.transaction() as nested:
                team.repository.save_state(nested, 'inner', {'saved': True})
            if rollback:
                raise RuntimeError('abort-isolated-transaction')

    if rollback:
        with pytest.raises(RuntimeError, match='abort-isolated-transaction'):
            nested_write()
    else:
        nested_write()
    with team.repository.transaction() as db:
        assert team.repository.state(db, 'outer') == (None if rollback else {'saved': True})
        assert team.repository.state(db, 'inner') == (None if rollback else {'saved': True})
        team.repository.save_state(db, 'after-exit', {'saved': True})
    with team.repository.transaction() as db:
        assert team.repository.state(db, 'after-exit') == {'saved': True}
