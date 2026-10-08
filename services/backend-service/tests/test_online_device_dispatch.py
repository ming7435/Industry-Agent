"""在线设备负责人派工：真实隔离账号、会话与工单，不调用现场服务。"""
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
import json
import sqlite3
import time

import pytest

from app.team.repository import TeamRepository
from app.team.service import TeamService
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


@pytest.fixture
def service(tmp_path):
    team = TeamService(
        TeamRepository(sqlite_path=str(tmp_path / "team.db")),
        devices=lambda: [{"device_id": "M1"}, {"device_id": "M2"}],
    )
    return BackendBusinessService(SQLiteRepository(str(tmp_path / "orders.db")), team_service=team)


def registered(service, name="owner", device="M1", *, online=True, role="technician"):
    user = service.team.register(name, "isolated-test-password", role, device)
    token = service.team.login(name, "isolated-test-password")[1] if online else None
    return user, token


def test_unlogged_registered_owner_is_unavailable(service):
    user, _ = registered(service, online=False)
    item = service.query_technicians(device_id="M1")["items"][0]
    assert item["technician_id"] == user["user_id"]
    assert item["online"] is False
    assert item["available"] is False
    assert item["registered"] is True
    assert service.query_team_availability(device_id="M1")["available_count"] == 0


def test_device_candidates_and_availability_never_fall_back(service, legacy_supervisor):
    owner, _ = registered(service)
    registered(service, "other-owner", "M2")
    legacy_supervisor(service.team)
    items = service.query_technicians(device_id="M1")["items"]
    assert [item["technician_id"] for item in items] == [owner["user_id"]]
    assert items[0]["online"] is True
    assert items[0]["available"] is True
    assert service.query_technicians(device_id="UNKNOWN")["items"] == []
    assert service.query_team_availability(device_id="UNKNOWN")["available"] is False
    assert service.query_team_availability(device_id="M1")["available_count"] == 1
    assert service.query_team_availability()["available_count"] == 2


def test_multiple_sessions_are_deduplicated_and_logout_keeps_other_session(service):
    user, first = registered(service)
    _, second = service.team.login("owner", "isolated-test-password")
    assert service.team.repository.active_session_user_ids() == {user["user_id"]}
    assert service.query_team_availability(device_id="M1")["available_count"] == 1
    service.team.logout(first)
    assert service.query_technicians(device_id="M1")["items"][0]["online"] is True
    service.team.logout(second)
    assert service.query_technicians(device_id="M1")["items"][0]["online"] is False


@pytest.mark.parametrize("state", ["unlogged", "expired", "logged_out", "disabled", "other_device", "supervisor"])
def test_new_assignment_rejects_ineligible_owner_without_changing_order(service, state):
    user, token = registered(
        service, device="M2" if state == "other_device" else "M1",
        online=state != "unlogged",
    )
    if state == "supervisor":
        # Existing sessions must not turn a historical supervisor into a dispatch candidate.
        with service.team.repository.transaction() as db:
            db.execute("UPDATE team_accounts SET role='supervisor' WHERE user_id=?", (user["user_id"],))
    elif state == "expired":
        with service.team.repository.transaction() as db:
            db.execute("UPDATE team_sessions SET expires_at=0")
    elif state == "logged_out":
        service.team.logout(token)
    elif state == "disabled":
        with service.team.repository.transaction() as db:
            db.execute("UPDATE team_accounts SET enabled=0 WHERE user_id=?", (user["user_id"],))
    order = service.create_workorder(device_id="M1", idempotency_key="event:eligibility")["workorder"]
    with pytest.raises(ValueError):
        service.assign_workorder(order["workorder_id"], user["user_id"])
    assert service.get_workorder(order["workorder_id"])["workorder"] == order


@pytest.mark.parametrize("change", ["logout", "device", "disable"])
def test_assignment_rechecks_eligibility_after_candidate_list(service, change):
    user, token = registered(service)
    assert service.query_technicians(device_id="M1")["items"][0]["available"] is True
    if change == "logout":
        service.team.logout(token)
    elif change == "device":
        service.team.update_responsibilities(user['user_id'], ['M2'])
    else:
        with service.team.repository.transaction() as db:
            db.execute("UPDATE team_accounts SET enabled=0 WHERE user_id=?", (user["user_id"],))
    order = service.create_workorder(device_id="M1")["workorder"]
    with pytest.raises(ValueError):
        service.assign_workorder(order["workorder_id"], user["user_id"])
    assert service.get_workorder(order["workorder_id"])["workorder"] == order


def test_assignment_is_idempotent_after_logout_and_never_reassigns(service):
    owner, token = registered(service)
    other, _ = registered(service, "second-owner")
    order_id = service.create_workorder(device_id="M1", idempotency_key="event:once")["workorder_id"]
    first = service.assign_workorder(order_id, owner["user_id"])["workorder"]
    assert first["status"] == "in_progress"
    assert first["assignee_name"] == "owner"
    service.team.logout(token)
    assert service.assign_workorder(order_id, owner["user_id"])["workorder"] == first
    with pytest.raises(ValueError):
        service.assign_workorder(order_id, other["user_id"])
    duplicate = service.create_workorder(device_id="M1", idempotency_key="event:once")["workorder"]
    assert duplicate == first
    assert len(service.repository.list()) == 1


def test_online_users_are_filtered_by_enabled_technician_role(service, legacy_supervisor):
    owner, _ = registered(service)
    disabled, _ = registered(service, "disabled-owner")
    legacy_supervisor(service.team)
    with service.team.repository.transaction() as db:
        db.execute("UPDATE team_accounts SET enabled=0 WHERE user_id=?", (disabled["user_id"],))
    assert [item["technician_id"] for item in service.query_technicians()["items"]] == [owner["user_id"]]
    assert service.query_technicians()["items"][0]["online"] is True


def redis_repository(monkeypatch, entries=None, *, unavailable=False):
    """只替换远程 Redis I/O；运行真实会话归集和真实 TeamService。"""
    class Client:
        def scan_iter(self, *, match, count):
            if match != "industry:team:sessions:*":
                raise AssertionError("会话读取超出自己的命名空间")
            if unavailable:
                raise OSError("private-session-detail")
            yield from entries

        def get(self, key):
            return entries[key]

    class Cache:
        def __init__(self, *, prefix):
            self.prefix = prefix.rstrip(":") + ":"
            self.client = Client()

    monkeypatch.setattr("app.team.repository.RedisJsonCache", Cache)
    repository = TeamRepository.__new__(TeamRepository)
    repository.sqlite_path = None
    return repository


def test_redis_sessions_ignore_expired_malformed_foreign_and_deleted_entries(monkeypatch):
    future = time.time() + 600
    values = {
        "industry:team:sessions:one": json.dumps({"user_id": "U1", "expires_at": future}),
        "industry:team:sessions:two": json.dumps({"user_id": "U1", "expires_at": future}),
        "industry:team:sessions:old": json.dumps({"user_id": "U2", "expires_at": 0}),
        "industry:team:sessions:deleted": None,
        "industry:team:sessions:malformed": "not-json",
        "industry:team:sessions:invalid": json.dumps({"user_id": "U3", "expires_at": "nan"}),
        "industry:team:sessions:missing": json.dumps({"expires_at": future}),
        "other:cache:entry": json.dumps({"user_id": "FOREIGN", "expires_at": future}),
    }
    repository = redis_repository(monkeypatch, values)
    assert repository.active_session_user_ids() == {"U1"}


def test_redis_failure_blocks_candidates_and_new_assignment_without_details(service, monkeypatch):
    user, _ = registered(service)
    online = redis_repository(monkeypatch, unavailable=True)
    monkeypatch.setattr(service.team.repository, "active_session_user_ids", online.active_session_user_ids, raising=False)
    order = service.create_workorder(device_id="M1")["workorder"]
    for read in (lambda: service.query_technicians(device_id="M1"),
                 lambda: service.assign_workorder(order["workorder_id"], user["user_id"])):
        with pytest.raises(RuntimeError) as error:
            read()
        assert "private-session-detail" not in str(error.value)
    assert service.get_workorder(order["workorder_id"])["workorder"] == order


def test_already_assigned_owner_is_stable_when_session_store_is_down(service, monkeypatch):
    user, _ = registered(service)
    order_id = service.create_workorder(device_id="M1")["workorder_id"]
    first = service.assign_workorder(order_id, user["user_id"])["workorder"]
    online = redis_repository(monkeypatch, unavailable=True)
    monkeypatch.setattr(service.team.repository, "active_session_user_ids", online.active_session_user_ids, raising=False)
    assert service.assign_workorder(order_id, user["user_id"])["workorder"] == first


def test_competing_assignment_cannot_overwrite_first_owner(service):
    users = [registered(service, name)[0] for name in ("first-owner", "second-owner")]
    other_service = BackendBusinessService(
        SQLiteRepository(str(service.repository.path)),
        team_service=TeamService(TeamRepository(sqlite_path=service.team.repository.sqlite_path), devices=service.team.devices),
    )
    order_id = service.create_workorder(device_id="M1")["workorder_id"]
    start = Barrier(2)

    def assign(pair):
        backend, user = pair
        start.wait(timeout=5)
        try:
            return backend.assign_workorder(order_id, user["user_id"])["workorder"]["assignee"]
        except ValueError:
            return None

    with ThreadPoolExecutor(2) as pool:
        results = list(pool.map(assign, [(service, users[0]), (other_service, users[1])]))
    winners = [value for value in results if value]
    assert len(winners) == 1
    saved = service.get_workorder(order_id)["workorder"]
    assert saved["assignee"] == winners[0]
    assert len([event for event in saved["events"] if event["action"] == "status_changed"]) == 1


@pytest.fixture
def single_file_service(tmp_path):
    path = str(tmp_path / 'backend.db')
    team = TeamService(TeamRepository(sqlite_path=path), devices=lambda: [{'device_id': 'M1'}])
    return BackendBusinessService(SQLiteRepository(path), team_service=team)


def test_single_file_assignment_uses_team_transaction(single_file_service):
    user, _ = registered(single_file_service)
    order_id = single_file_service.create_workorder(device_id='M1')['workorder_id']
    result = single_file_service.assign_workorder(order_id, user['user_id'])['workorder']
    assert result['assignee'] == user['user_id']
    assert result['status'] == 'in_progress'
    assert single_file_service.repository.get(order_id) == result


def test_failed_second_part_reservation_restores_inventory(single_file_service):
    service = single_file_service
    user, _ = registered(service)
    service._inventory = {
        'SP-A': {'part_no': 'SP-A', 'stock': 2, 'reserved': 0},
        'SP-B': {'part_no': 'SP-B', 'stock': 0, 'reserved': 0},
    }
    order = service.create_workorder(device_id='M1', required_parts=['SP-A', 'SP-B'])['workorder']
    with pytest.raises(ValueError):
        service.assign_workorder(order['workorder_id'], user['user_id'])
    assert service.repository.get(order['workorder_id']) == order
    assert service.query_spare_part('SP-A')['items'][0]['reserved'] == 0
    assert service.query_spare_part('SP-B')['items'][0]['reserved'] == 0


def test_final_assignment_write_failure_rolls_back_order_and_inventory(single_file_service):
    service = single_file_service
    user, _ = registered(service)
    service._inventory = {'SP-A': {'part_no': 'SP-A', 'stock': 2, 'reserved': 0}}
    order = service.create_workorder(device_id='M1', required_parts=['SP-A'])['workorder']
    with service.team.repository.transaction() as db:
        db.execute("CREATE TRIGGER reject_assignment BEFORE UPDATE ON workorders "
                   "WHEN json_extract(new.payload,'$.status')='in_progress' "
                   "BEGIN SELECT RAISE(ABORT,'isolated-assignment-abort'); END")
    with pytest.raises(sqlite3.IntegrityError, match='isolated-assignment-abort'):
        service.assign_workorder(order['workorder_id'], user['user_id'])
    assert service.repository.get(order['workorder_id']) == order
    assert service.query_spare_part('SP-A')['items'][0]['reserved'] == 0
    with service.team.repository.transaction() as db:
        db.execute('DROP TRIGGER reject_assignment')
    assigned = service.assign_workorder(order['workorder_id'], user['user_id'])['workorder']
    assert assigned['assignee'] == user['user_id']
    assert service.query_spare_part('SP-A')['items'][0]['reserved'] == 1


def test_borrowed_team_transaction_rolls_back_order_and_business_record(single_file_service):
    service = single_file_service
    order = service.create_workorder(device_id='M1')['workorder']
    service.repository.save_record('inventory', 'SP-A', {'reserved': 0})
    with pytest.raises(RuntimeError, match='abort-borrowed-transaction'):
        with service.team.repository.transaction() as db:
            with service.repository.borrow_transaction(db, service.team.repository.sqlite_path):
                service.repository.update({**order, 'title': 'changed-inside-transaction'})
                service.repository.save_record('inventory', 'SP-A', {'reserved': 1})
                assert service.repository.list()[0]['title'] == 'changed-inside-transaction'
                assert service.repository.get_record('inventory', 'SP-A') == {'reserved': 1}
                raise RuntimeError('abort-borrowed-transaction')
    assert service.repository.get(order['workorder_id']) == order
    assert service.repository.get_record('inventory', 'SP-A') == {'reserved': 0}
