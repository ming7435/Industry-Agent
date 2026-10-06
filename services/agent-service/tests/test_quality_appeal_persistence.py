"""Run the real closure service/store against a temporary SQL database.

Only the unavailable MySQL driver is adapted: production reads, writes, CAS and
transaction handling remain real, with no production database or model calls.
"""

from concurrent.futures import ThreadPoolExecutor
from contextvars import ContextVar
import sqlite3
from threading import Barrier

import pytest

from app.closure import ClosureService
from app.closure.store import MySQLClosureStore


class SQLiteCursor:
    def __init__(self, cursor, connector, dictionary):
        self.cursor = cursor
        self.connector = connector
        self.dictionary = dictionary

    def execute(self, sql, parameters=()):
        if "INSERT INTO closure_audit_logs" in sql and parameters[1] == self.connector.fail_audit_action:
            raise RuntimeError("audit unavailable")
        if sql == "START TRANSACTION":
            sql = "BEGIN IMMEDIATE"
        sql = sql.replace(" FOR UPDATE", "").replace("%s", "?")
        return self.cursor.execute(sql, parameters)

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row is not None and self.dictionary else row

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(row) for row in rows] if self.dictionary else rows

    @property
    def rowcount(self):
        return self.cursor.rowcount

    def close(self):
        self.cursor.close()


class SQLiteConnection:
    def __init__(self, connector):
        self.connector = connector
        self.connection = sqlite3.connect(str(connector.path), timeout=15, isolation_level=None)
        self.connection.row_factory = sqlite3.Row

    def cursor(self, dictionary=False):
        return SQLiteCursor(self.connection.cursor(), self.connector, dictionary)

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()


class SQLiteConnector:
    fail_audit_action = ""

    def __init__(self, path):
        self.path = path

    def connect(self, **_config):
        return SQLiteConnection(self)


@pytest.fixture
def connector(tmp_path):
    path = tmp_path / "appeals.sqlite3"
    with sqlite3.connect(str(path)) as connection:
        connection.executescript("""
            CREATE TABLE quality_checks (
                quality_check_id TEXT PRIMARY KEY, target_type TEXT, target_id TEXT,
                workorder_id TEXT, part_id TEXT, part_no TEXT, batch_id TEXT,
                production_order_id TEXT, inspection_type TEXT, score REAL, result TEXT,
                findings TEXT, items TEXT, reviewer TEXT, risk_level TEXT, status TEXT,
                appeal_ids TEXT, reinspection TEXT, quality_validation TEXT,
                created_at TEXT, updated_at TEXT
            );
            CREATE TABLE quality_appeals (
                appeal_id TEXT PRIMARY KEY, quality_check_id TEXT, reason TEXT,
                evidence TEXT, applicant TEXT, status TEXT, created_at TEXT
            );
            CREATE TABLE closure_tasks (
                closure_task_id TEXT PRIMARY KEY, quality_check_id TEXT, status TEXT
            );
            CREATE TABLE closure_audit_logs (
                audit_id TEXT PRIMARY KEY, action TEXT, object_id TEXT, operator TEXT,
                changes TEXT, created_at TEXT
            );
        """)
    return SQLiteConnector(path)


def service_for(connector):
    store = MySQLClosureStore.__new__(MySQLClosureStore)
    store.config = {}
    store._connector = connector
    store._active_connection = ContextVar("appeal_test_connection", default=None)
    return ClosureService(store=store)


def pending_appeal(service):
    check = service.create_quality_check({"target_id": "PART-APPEAL", "batch_id": "BATCH-APPEAL", "result": "failed"})
    appeal = service.submit_appeal(check["quality_check_id"], {"reason": "Supplement inspection evidence"})
    return check["quality_check_id"], appeal["appeal_id"]


@pytest.mark.parametrize("decision,status", [("approved", "rectification"), ("rejected", "rejected"), ("withdrawn", "withdrawn")])
def test_appeal_resolution_persists_across_service_instances(connector, decision, status):
    first = service_for(connector)
    check_id, appeal_id = pending_appeal(first)
    first.resolve_appeal(check_id, appeal_id, decision=decision, reason="Verified evidence", operator="QA-1")

    with sqlite3.connect(str(connector.path)) as connection:
        assert connection.execute("SELECT status FROM quality_appeals WHERE appeal_id = ?", (appeal_id,)).fetchone()[0] == decision

    restored = service_for(connector)
    appeal = restored.store.list_appeals(check_id)[0]
    assert appeal["status"] == decision
    assert appeal["resolution_reason"] == "Verified evidence"
    assert appeal["resolved_by"] == "QA-1"
    assert appeal["resolved_at"]
    assert restored.get_quality_check(check_id)["status"] == status
    with pytest.raises(ValueError, match="不能重复处理"):
        restored.resolve_appeal(check_id, appeal_id, decision="rejected")
    assert restored.get_quality_check(check_id)["status"] == status


def test_stale_pending_cache_cannot_override_resolved_appeal(connector):
    first = service_for(connector)
    check_id, appeal_id = pending_appeal(first)
    stale = service_for(connector)
    stale._appeals[check_id] = stale.store.list_appeals(check_id)
    first.resolve_appeal(check_id, appeal_id, decision="approved")

    with pytest.raises(ValueError, match="不能重复处理"):
        stale.resolve_appeal(check_id, appeal_id, decision="rejected")
    assert stale.get_quality_check(check_id)["status"] == "rectification"
    assert stale.store.list_appeals(check_id)[0]["status"] == "approved"


def test_concurrent_service_instances_resolve_appeal_only_once(connector):
    first = service_for(connector)
    check_id, appeal_id = pending_appeal(first)
    second = service_for(connector)
    second._appeals[check_id] = second.store.list_appeals(check_id)
    start = Barrier(2)

    def resolve(service, decision):
        start.wait(timeout=5)
        try:
            return "accepted", service.resolve_appeal(check_id, appeal_id, decision=decision)["appeal"]["status"]
        except ValueError:
            return "rejected", decision

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(resolve, first, "approved"), pool.submit(resolve, second, "rejected")]
        results = [future.result(timeout=15) for future in futures]
    accepted = [decision for outcome, decision in results if outcome == "accepted"]
    assert len(accepted) == 1
    fresh = service_for(connector)
    assert fresh.store.list_appeals(check_id)[0]["status"] == accepted[0]
    assert len(fresh.audit_logs(check_id, "quality_appeal_resolved")) == 1


def test_appeal_and_quality_status_rollback_when_resolution_audit_fails(connector):
    service = service_for(connector)
    check_id, appeal_id = pending_appeal(service)
    connector.fail_audit_action = "quality_appeal_resolved"
    with pytest.raises(RuntimeError, match="audit unavailable"):
        service.resolve_appeal(check_id, appeal_id, decision="approved")

    restored = service_for(connector)
    assert restored.store.list_appeals(check_id)[0]["status"] == "pending"
    with sqlite3.connect(str(connector.path)) as connection:
        assert connection.execute("SELECT status FROM quality_appeals WHERE appeal_id = ?", (appeal_id,)).fetchone()[0] == "pending"
    assert restored.get_quality_check(check_id)["status"] == "appealed"
    assert not restored.audit_logs(check_id, "quality_appeal_resolved")
    assert not any(item["changes"].get("status") == "rectification" for item in restored.audit_logs(check_id, "quality_status_changed"))
    connector.fail_audit_action = ""
    service.resolve_appeal(check_id, appeal_id, decision="approved")
    assert restored.store.list_appeals(check_id)[0]["status"] == "approved"


def test_store_rejects_second_terminal_update_using_pending_condition(connector):
    service = service_for(connector)
    check_id, appeal_id = pending_appeal(service)
    service.store.update_appeal(check_id, appeal_id, {"status": "approved"})
    with pytest.raises(ValueError, match="不能重复处理"):
        service.store.update_appeal(check_id, appeal_id, {"status": "rejected"})
    assert service.store.list_appeals(check_id)[0]["status"] == "approved"


def test_legacy_pending_row_with_resolution_audit_cannot_be_resolved_again(connector):
    service = service_for(connector)
    check_id, appeal_id = pending_appeal(service)
    # The old bug persisted QC/audit but left the appeal row pending.
    with service.store.quality_transaction():
        service.store.update_quality_check(check_id, {"status": "rectification"})
        service.store.create_audit({"audit_id": "AUDIT-LEGACY", "action": "quality_appeal_resolved", "object_id": check_id, "operator": "QA-LEGACY", "changes": {"appeal_id": appeal_id, "decision": "approved"}, "created_at": service._now()})

    restored = service_for(connector)
    with pytest.raises(ValueError, match="不能重复处理"):
        restored.resolve_appeal(check_id, appeal_id, decision="rejected")
    assert restored.get_quality_check(check_id)["status"] == "rectification"
    assert restored.store.list_appeals(check_id)[0]["status"] == "approved"
