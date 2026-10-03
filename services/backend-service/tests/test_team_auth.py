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
    team.register('CAFÉ', 'test-password-123', 'supervisor')
    with pytest.raises(ValueError):
        team.register('cafe\u0301', 'test-password-123', 'supervisor')


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
    team.register('owner', 'test-password-123', 'supervisor')
    _, token = team.login('owner', 'test-password-123')
    reopened = TeamService(TeamRepository(sqlite_path=team.repository.sqlite_path), devices=lambda: [])
    assert reopened.resolve_session(token)['username'] == 'owner'
    with reopened.repository.transaction() as db:
        db.execute('UPDATE team_sessions SET expires_at=0')
    assert reopened.resolve_session(token) is None
