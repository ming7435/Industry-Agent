"""真实 MySQL/Redis 隔离存储测试，不调用模型、设备或现有业务表。"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import Event, Lock
from uuid import uuid4
import json
import time

import pytest


class SafeConfig(dict):
    """失败断言也不能通过参数展示泄露连接凭据。"""
    def __repr__(self):
        return "<隔离 MySQL 测试配置，连接凭据已隐藏>"


def storage_class():
    try:
        from shared.persistence import MySQLJsonStore
    except ModuleNotFoundError:
        MySQLJsonStore = None
    assert MySQLJsonStore is not None, "在线长期 JSON 存储尚未提供 MySQL 实现"
    return MySQLJsonStore


@pytest.fixture(scope="module")
def mysql_config():
    import mysql.connector
    from dotenv import dotenv_values
    values = dotenv_values(Path(__file__).resolve().parents[2] / ".env")
    config = {"host": values.get("MYSQL_HOST") or "127.0.0.1", "port": int(values.get("MYSQL_PORT") or 3306),
              "user": values.get("MYSQL_USER") or "root", "password": values.get("MYSQL_PASSWORD") or "",
              "connection_timeout": 5}
    database = "industry_storage_test_" + uuid4().hex[:12]
    connection = mysql.connector.connect(**config)
    try:
        cursor = connection.cursor()
        cursor.execute("CREATE DATABASE `" + database + "` CHARACTER SET utf8mb4")
        cursor.close()
    finally:
        connection.close()
    # 保留独立测试库，不删除数据库或已有业务数据；配置/密码不输出。
    return SafeConfig({**config, "database": database})


def test_json_persists_across_store_reconstruction(mysql_config):
    cls = storage_class()
    first = cls(mysql_config)
    first.set("persist", "中文键", {"status": "completed", "detail": "维修已完成"})
    assert cls(mysql_config).get("persist", "中文键") == {"status": "completed", "detail": "维修已完成"}


def test_large_record_encoding_does_not_materialize_multiple_full_json_copies():
    import tracemalloc
    from shared.persistence import _encode, _decode
    value = {"trace": ["维修上下文" * 1000] * 1500}
    tracemalloc.start()
    try:
        encoded = _encode(value)
        peak = tracemalloc.get_traced_memory()[1]
    finally:
        tracemalloc.stop()
    assert peak < 12 * 1024 * 1024, "压缩编码不应同时复制多份巨大 JSON 正文"
    assert _decode(encoded) == value


def test_encoding_one_huge_context_string_is_also_bounded():
    import tracemalloc
    from shared.persistence import _encode, _decode
    value = {"context": '维修"上下文\\\n' * 180000, "nested": [None, True, 1.2, {2: "编号"}]}
    tracemalloc.start()
    try:
        encoded = _encode(value)
        peak = tracemalloc.get_traced_memory()[1]
    finally:
        tracemalloc.stop()
    assert peak < 2 * 1024 * 1024, "单个巨大上下文字符串也必须分段转义/压缩"
    assert _decode(encoded) == {"context": value["context"], "nested": [None, True, 1.2, {"2": "编号"}]}


@pytest.mark.parametrize("value", [
    {"内容": '中文 😀 "\\\r\n\t\b\u0000'},
    {"空": {}, "列表": [], "元组": (1, "二")},
    {None: "空键", False: "布尔键", 2.5: "浮点键"},
    {"非有限数": [float("inf"), float("-inf"), float("nan")]},
])
def test_stream_encoding_preserves_standard_json_bytes(value):
    import zlib
    from shared.persistence import _encode
    assert zlib.decompress(_encode(value)) == json.dumps(value, ensure_ascii=False, default=str).encode("utf-8")


def test_stream_encoding_rejects_circular_data_and_invalid_keys():
    from shared.persistence import _encode
    circular = {}
    circular["self"] = circular
    with pytest.raises(ValueError, match="Circular"):
        _encode(circular)
    with pytest.raises(TypeError):
        _encode({("元组键",): 1})


def test_mysql_failure_reports_code_without_leaking_connection_values(monkeypatch):
    import mysql.connector
    from shared.persistence import mysql_session, StorageUnavailable
    def fail(**kwargs):
        raise mysql.connector.Error("机密测试连接密码，禁止输出", errno=1045)
    monkeypatch.setattr(mysql.connector, "connect", fail)
    with pytest.raises(StorageUnavailable) as captured:
        with mysql_session({"host": "unused"}):
            pass
    assert "1045" in str(captured.value)
    assert "机密测试连接密码" not in str(captured.value)


def test_mysql_disconnect_rollback_failure_does_not_mask_sanitized_error(monkeypatch):
    import mysql.connector
    from shared.persistence import mysql_session, StorageUnavailable
    class LostConnection:
        def commit(self):
            raise mysql.connector.Error("包含机密的原始连接失败", errno=2013)
        def rollback(self):
            raise mysql.connector.Error("包含机密的回滚失败", errno=2055)
        def close(self):
            pass
    monkeypatch.setattr(mysql.connector, "connect", lambda **kw: LostConnection())
    with pytest.raises(StorageUnavailable) as captured:
        with mysql_session({"host": "unused"}):
            pass
    assert "2013" in str(captured.value) and "机密" not in str(captured.value)


def test_compare_and_set_only_one_concurrent_approval_wins(mysql_config):
    cls = storage_class()
    cls(mysql_config).set("approval", "pending", {"status": "pending", "scope": "TASK-1"})
    def claim(_):
        return cls(mysql_config).compare_and_set("approval", "pending", "status", "pending", {"status": "resuming"})
    with ThreadPoolExecutor(max_workers=4) as executor:
        outcomes = list(executor.map(claim, range(4)))
    assert sum(item is not None for item in outcomes) == 1
    assert cls(mysql_config).get("approval", "pending")["scope"] == "TASK-1"


def test_get_or_create_runs_producer_once_across_instances(mysql_config):
    cls = storage_class()
    calls = []
    guard = Lock()
    def produce():
        with guard:
            calls.append(1)
        time.sleep(0.1)
        return {"workorder_id": "WO-ONE"}
    with ThreadPoolExecutor(max_workers=4) as executor:
        outcomes = list(executor.map(lambda _: cls(mysql_config).get_or_create("command", "same", produce), range(4)))
    assert calls == [1]
    assert outcomes == [{"workorder_id": "WO-ONE"}] * 4


def test_concurrent_existing_claims_do_not_upgrade_shared_insert_locks(mysql_config):
    from threading import Barrier
    stores = [storage_class()(mysql_config) for _ in range(4)]
    for index in range(8):
        ready, calls = Barrier(4), []
        def run(store):
            ready.wait(timeout=5)
            def produce():
                calls.append(True)
                time.sleep(0.015)
                return {"round": index}
            return store.get_or_create("claim-contention", str(index), produce)
        with ThreadPoolExecutor(max_workers=4) as executor:
            assert list(executor.map(run, stores)) == [{"round": index}] * 4
        assert len(calls) == 1


def test_slow_producer_does_not_hold_database_transaction(mysql_config):
    cls = storage_class()
    entered, release = Event(), Event()
    store = cls(mysql_config)
    def produce():
        entered.set()
        assert release.wait(3)
        return {"done": True}
    with ThreadPoolExecutor(max_workers=2) as executor:
        slow = executor.submit(store.get_or_create, "slow", "one", produce)
        assert entered.wait(2)
        try:
            quick = executor.submit(cls(mysql_config).set, "slow", "other", {"done": True})
            quick.result(timeout=1)
        finally:
            release.set()
        assert slow.result(timeout=2) == {"done": True}


def test_uncertain_write_is_not_retried(mysql_config):
    cls = storage_class()
    store = cls(mysql_config)
    def fail_after_write():
        raise TimeoutError("返回丢失")
    with pytest.raises(TimeoutError):
        store.get_or_create("write", "uncertain", fail_after_write)
    calls = []
    with pytest.raises(RuntimeError, match="不确定|未知"):
        cls(mysql_config).get_or_create("write", "uncertain", lambda: calls.append(1) or {"done": True})
    assert calls == []


def test_plan_projection_never_loads_large_execution_body(mysql_config):
    store = storage_class()(mysql_config)
    value = {"_event_result_store_version": 2, "fingerprint": "fixture", "result": {
        "maintenance_plan": {"plan_id": "PLAN-SMALL", "repair_steps": ["检查润滑"]},
        "diagnosis": {"device_id": "M-1"}, "trace": [{"context": "大工具正文" * 500000}]}}
    store.set("agent_event", "huge", value)
    projections, history = store.plan_results()
    assert any(item["maintenance_plan"]["plan_id"] == "PLAN-SMALL" for item in projections)
    assert all("trace" not in item for item in projections)
    assert history["status"] == "ready"
    assert store.get("agent_event", "huge") == value


def test_redis_cache_expiry_never_removes_mysql_business_record(mysql_config):
    store = storage_class()(mysql_config)
    try:
        from shared.temporary_cache import RedisJsonCache
    except ModuleNotFoundError:
        RedisJsonCache = None
    assert RedisJsonCache is not None, "临时 JSON 缓存尚未提供 Redis 实现"
    cache = RedisJsonCache("redis://127.0.0.1:6379/0", prefix="storage-test:" + uuid4().hex, ttl_seconds=1)
    store.set("cache", "one", {"persisted": True})
    cache.set("one", {"cached": True})
    assert cache.get("one") == {"cached": True}
    time.sleep(1.1)
    assert cache.get("one") is None
    assert store.get("cache", "one") == {"persisted": True}


def test_plan_deletion_batch_is_atomic_and_does_not_delete_event(mysql_config):
    store = storage_class()(mysql_config)
    store.set("agent_event", "delete-event", {"maintenance_plan": {"plan_id": "PLAN-KEEP-AUDIT"}, "event": {"device_id": "M-DELETE"}})
    with pytest.raises(KeyError):
        store.delete_plans(["PLAN-KEEP-AUDIT", "PLAN-NOT-FOUND"], actor_id="USER-1")
    assert "PLAN-KEEP-AUDIT" not in store.deleted_plan_ids()
    assert store.delete_plans(["PLAN-KEEP-AUDIT"], actor_id="USER-1") == ["PLAN-KEEP-AUDIT"]
    assert store.delete_plans(["PLAN-KEEP-AUDIT"], actor_id="USER-1") == ["PLAN-KEEP-AUDIT"]
    assert store.get("agent_event", "delete-event")=={'event':{'device_id':'M-DELETE'}}
    assert "PLAN-KEEP-AUDIT" in store.deleted_plan_ids()


def test_permanent_workorder_delete_removes_mysql_row_projection_and_nested_plan_in_one_transaction(mysql_config, monkeypatch):
    from shared.persistence import mysql_session, _decode
    module = load_local_module('hard_delete_backend_repository', 'services/backend-service/app/workorder/repository.py')
    for key, value in mysql_config.items():
        if key != 'connection_timeout':
            monkeypatch.setenv('MYSQL_' + key.upper(), str(value))
    store = storage_class()(mysql_config)
    repository = module.MySQLRepository()
    original = {'workorder_id':'WO-PURGE','plan_id':'PLAN-PURGE','idempotency_key':'DELETE-EVENT','status':'in_progress',
                'assignee':'USER-1','maintenance_plan_snapshot':{'plan_id':'PLAN-PURGE','repair_steps':['原方案正文']}}
    order = repository.create(original)
    event = {'_event_result_store_version':2,'fingerprint':'fp','result':{'event':{'event_id':'DELETE-EVENT'},
             'diagnosis':{'fault':'保留独立诊断'},'maintenance_plan':original['maintenance_plan_snapshot'],'workorder':original,
             'nested':{'maintenance_plan':original['maintenance_plan_snapshot'],'workorder':original}}}
    store.set('agent_event','purge-event',event)
    audit = {'audit_id':'PURGE-AUDIT','operator':'USER-1','created_at':'2026-10-08T00:00:00Z'}
    repository.purge(order,audit,['PLAN-PURGE'])
    assert repository.get('WO-PURGE') is None
    saved = storage_class()(mysql_config).get('agent_event','purge-event')
    assert saved=={'_event_result_store_version':2,'fingerprint':'fp','result':{'event':{'event_id':'DELETE-EVENT'},'diagnosis':{'fault':'保留独立诊断'},'nested':{}}}
    with mysql_session(mysql_config) as db, db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT COUNT(*) AS n FROM maintenance_plan_projection WHERE plan_id='PLAN-PURGE'")
        assert cursor.fetchone()['n']==0
    store.set('agent_event','purge-event',event)
    assert store.get('agent_event','purge-event')==saved
    with pytest.raises(ValueError, match='已删除'):
        repository.create({**original,'workorder_id':'WO-STALE'})


def test_mysql_delete_failure_rolls_back_workorder_plan_and_receipt(mysql_config, monkeypatch):
    import shared.persistence as persistence
    module = load_local_module('rollback_delete_backend_repository', 'services/backend-service/app/workorder/repository.py')
    for key, value in mysql_config.items():
        if key != 'connection_timeout':
            monkeypatch.setenv('MYSQL_' + key.upper(), str(value))
    store = storage_class()(mysql_config)
    repository = module.MySQLRepository()
    order = repository.create({'workorder_id':'WO-ROLLBACK','plan_id':'PLAN-ROLLBACK','status':'open'})
    original = {'maintenance_plan':{'plan_id':'PLAN-ROLLBACK'},'event':{'event_id':'ROLLBACK'}}
    store.set('agent_event','rollback-event',original)
    purge = persistence.purge_mysql_plans
    def fail_after_purge(*args, **kwargs):
        purge(*args, **kwargs)
        raise RuntimeError('isolated failure after plan deletion')
    monkeypatch.setattr(persistence,'purge_mysql_plans',fail_after_purge)
    with pytest.raises(RuntimeError, match='isolated'):
        repository.purge(order,{'audit_id':'ROLLBACK-AUDIT','operator':'USER-1','created_at':'now'},['PLAN-ROLLBACK'])
    assert repository.get('WO-ROLLBACK')==order
    assert repository.get_record('workorder_deleted','WO-ROLLBACK') is None
    assert store.get('agent_event','rollback-event')==original
    assert 'PLAN-ROLLBACK' not in store.deleted_plan_ids()


def test_late_producer_and_plan_first_deletion_cannot_retain_deleted_task_body(mysql_config, monkeypatch):
    module = load_local_module('late_delete_backend_repository', 'services/backend-service/app/workorder/repository.py')
    for key, value in mysql_config.items():
        if key != 'connection_timeout':
            monkeypatch.setenv('MYSQL_' + key.upper(), str(value))
    store = storage_class()(mysql_config)
    repository = module.MySQLRepository()
    order = repository.create({'workorder_id':'WO-LATE','plan_id':'PLAN-LATE','status':'in_progress'})
    event = {'maintenance_plan':{'plan_id':'PLAN-LATE','repair_steps':['不可恢复的正文']},'workorder':order,'event':{'event_id':'LATE'}}
    store.set('agent_event','late-original',event)
    store.delete_plans(['PLAN-LATE'],'USER-1')
    assert store.get('agent_event','late-original')['workorder']==order
    started, release = Event(), Event()
    def produce():
        started.set()
        assert release.wait(15)
        return event
    with ThreadPoolExecutor(max_workers=1) as workers:
        future = workers.submit(store.get_or_create,'agent_event','late-new',produce)
        assert started.wait(15)
        try:
            repository.purge(order,{'audit_id':'LATE-AUDIT','operator':'USER-1','created_at':'now'},['PLAN-LATE'])
        finally:
            release.set()
        assert future.result(timeout=15)=={'event':{'event_id':'LATE'}}
    assert storage_class()(mysql_config).get('agent_event','late-original')=={'event':{'event_id':'LATE'}}
    assert store.get('agent_event','late-new')=={'event':{'event_id':'LATE'}}


def test_existing_different_record_cannot_be_overwritten_by_migration(mysql_config):
    store = storage_class()(mysql_config)
    assert store.import_record("legacy", "key", {"version": 1}) is True
    assert store.import_record("legacy", "key", {"version": 1}) is False
    with pytest.raises(ValueError, match="冲突"):
        store.import_record("legacy", "key", {"version": 2})
    assert store.get("legacy", "key") == {"version": 1}


def test_migration_encodes_once_and_does_not_update_unchanged_record(mysql_config, monkeypatch):
    from shared import persistence
    original_encode = persistence._encode
    calls = []
    def counted(value):
        calls.append(True)
        return original_encode(value)
    monkeypatch.setattr(persistence, "_encode", counted)
    store = storage_class()(mysql_config)
    assert store.import_record("encode-once", "one", {"a": 1, "b": 2}) is True
    assert len(calls) == 1
    with store._session() as cursor:
        cursor.execute("SELECT updated_at FROM runtime_records_mysql WHERE namespace='encode-once'")
        before = cursor.fetchone()["updated_at"]
    # 键顺序变化不属于业务冲突，旧记录的更新时间不能因迁移重跑而变化。
    assert store.import_record("encode-once", "one", {"b": 2, "a": 1}) is False
    with store._session() as cursor:
        cursor.execute("SELECT updated_at FROM runtime_records_mysql WHERE namespace='encode-once'")
        assert cursor.fetchone()["updated_at"] == before


def test_binary_migration_uses_prepared_protocol_without_escape_expansion(mysql_config, monkeypatch):
    from contextlib import contextmanager
    from shared import persistence
    original = persistence.mysql_session
    protocols = []
    @contextmanager
    def tracked(config=None):
        with original(config) as connection:
            class Proxy:
                def cursor(self, **kwargs):
                    protocols.append(bool(kwargs.get("prepared")))
                    return connection.cursor(**kwargs)
            yield Proxy()
    monkeypatch.setattr(persistence, "mysql_session", tracked)
    store = storage_class()(mysql_config)
    protocols.clear()
    store.import_record("binary-protocol", "one", {"正文": "中文二进制压缩正文"})
    assert protocols and all(protocols), "二进制日志不能按 SQL 字面量转义膨胀，触发包大小限制"
    assert store.get("binary-protocol", "one") == {"正文": "中文二进制压缩正文"}


def test_online_agent_stores_never_create_sqlite_files(mysql_config, tmp_path, monkeypatch):
    for key in ("host", "port", "user", "password", "database"):
        monkeypatch.setenv("MYSQL_" + key.upper(), str(mysql_config[key]))
    monkeypatch.setenv("APP_ENV", "development")
    from app.runtime.durable_store import DurableJsonStore
    from app.runtime.event_store import EventResultStore
    from app.report.store import build_report_store
    from app.monitor.safety_store import SafetyStore
    durable = DurableJsonStore(str(tmp_path / "legacy.sqlite3"))
    assert isinstance(durable, storage_class())
    event = EventResultStore(path=str(tmp_path / "events.sqlite3"))
    event.get_or_create("online-test", lambda: {"maintenance_plan": {"plan_id": "PLAN-ONLINE"}})
    assert event.list_plan_results()[1]["storage"] == "mysql"
    reports = build_report_store(str(tmp_path / "reports.sqlite3"))
    reports["RPT-ONLINE"] = {"summary": "中文报告"}
    assert build_report_store()["RPT-ONLINE"]["summary"] == "中文报告"
    safety = SafetyStore(str(tmp_path / "safety.sqlite3"))
    safety.add("E-ONLINE", "M-1", ["M-1"], "故障")
    assert SafetyStore().pending()[0]["event_id"] == "E-ONLINE"
    assert safety.claim_command("E-ONLINE", "M-1", "stop") is True
    assert SafetyStore().claim_command("E-ONLINE", "M-1", "stop") is False
    assert list(tmp_path.iterdir()) == []


@pytest.fixture
def online_environment(mysql_config, monkeypatch):
    for key in ("host", "port", "user", "password", "database"):
        monkeypatch.setenv("MYSQL_" + key.upper(), str(mysql_config[key]))
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("BACKEND_STORAGE", "mysql")
    monkeypatch.setenv("WORKORDER_BACKEND", "mysql")


def test_online_workorder_uses_mysql_and_rejects_concurrent_old_revision(online_environment, tmp_path):
    from app.workorder.repository import build_workorder_repository, MySQLWorkOrderRepository
    first = build_workorder_repository(str(tmp_path / "orders.sqlite3"))
    assert isinstance(first, MySQLWorkOrderRepository)
    order = first.create({"workorder_id": "WO-PERSIST", "idempotency_key": "persist", "status": "pending"})
    other = build_workorder_repository()
    one = first.update({**order, "status": "dispatched"})
    with pytest.raises(ValueError, match="更新|刷新"):
        other.update({**order, "status": "cancelled"})
    assert other.get("WO-PERSIST")["status"] == "dispatched"
    assert one["_revision"] == 1
    assert not hasattr(first, "connection") or first.connection is None
    assert list(tmp_path.iterdir()) == []


def test_short_memory_has_redis_ttl(online_environment, monkeypatch):
    from app.memory.store import RedisShortMemoryStore
    monkeypatch.setenv("SHORT_MEMORY_TTL_SECONDS", "1")
    store = RedisShortMemoryStore("redis://127.0.0.1:6379/0", key="storage-short:" + uuid4().hex)
    store.add({"detail": "临时上下文"})
    assert store.recent()[0]["detail"] == "临时上下文"
    assert 0 < store.client.ttl(store.key) <= 1
    time.sleep(1.1)
    assert store.recent() == []


def load_local_module(name, relative_path):
    # 独立文件模块用于同名 app 服务；避免跨服务 app 包互相覆盖。
    import importlib.util
    spec = importlib.util.spec_from_file_location(name, Path(__file__).resolve().parents[2] / relative_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_online_rag_document_store_is_mysql_and_filters_structured_metadata(online_environment, tmp_path):
    module = load_local_module("rag_documents_storage_test", "services/rag-service/app/api/documents.py")
    store = module.DocumentStore(str(tmp_path / "documents.sqlite3"))
    store.upsert("DOC-1", "润滑压力检测", {"device_id": "M-1", "corpus": "sop"}, "sop",
                 [{"chunk_id": "CHUNK-1", "text": "检查压力", "metadata": {"part_no": "P-1"}}])
    module.DocumentStore().upsert("DOC-2", "检查压力", {"device_id": "M-2"}, "sop")
    assert module.DocumentStore().get_chunk("DOC-1", "CHUNK-1")["metadata"]["part_no"] == "P-1"
    assert [item["metadata"]["document_id"] for item in store.search("压力", filters={"device_id": "M-1"})] == ["DOC-1"]
    store.upsert("DOC-1", "更新的操作", {"device_id": "M-1"}, "sop", [{"chunk_id": "CHUNK-NEW", "text": "新操作"}])
    assert store.get_chunk("DOC-1", "CHUNK-1") is None
    assert list(tmp_path.iterdir()) == []


def test_online_team_sessions_are_ephemeral_in_redis(online_environment, monkeypatch):
    module = load_local_module("team_session_storage_test", "services/backend-service/app/team/repository.py")
    repository = module.TeamRepository()
    monkeypatch.setenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    key = "session-test-" + uuid4().hex
    assert hasattr(repository, "save_session"), "会话仍直接持久化在业务表中"
    repository.save_session(key, "USER-TEST", time.time() + 1)
    assert repository.session_user(key) == "USER-TEST"
    time.sleep(1.1)
    assert repository.session_user(key) is None
    with repository.transaction() as db:
        assert db.execute("SELECT user_id FROM team_sessions WHERE token_hash=?", (key,)).fetchone() is None


def test_backend_rejects_online_sqlite_even_when_path_configured(online_environment, tmp_path, monkeypatch):
    module = load_local_module("backend_repository_storage_test", "services/backend-service/app/workorder/repository.py")
    team = load_local_module("team_repository_storage_test", "services/backend-service/app/team/repository.py")
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    with pytest.raises(RuntimeError, match="SQLite|sqlite|MySQL"):
        module.build_repository()
    with pytest.raises(RuntimeError, match="SQLite|sqlite|MySQL"):
        team.TeamRepository(sqlite_path=str(tmp_path / "team.sqlite3"))


def test_legacy_migration_is_readonly_resumable_and_conflict_safe(mysql_config, tmp_path):
    import sqlite3
    migration = load_local_module("legacy_migration_storage_test", "scripts/migrate_sqlite_storage.py")
    path = tmp_path / "legacy.sqlite3"
    with sqlite3.connect(path) as connection:
        connection.execute("CREATE TABLE runtime_state(namespace TEXT,state_key TEXT,payload TEXT)")
        connection.execute("CREATE TABLE runtime_claims(namespace TEXT,state_key TEXT,status TEXT,created_at TEXT)")
        connection.execute("INSERT INTO runtime_state VALUES (?,?,?)", ("migrated", "one", json.dumps({"内容": "维修记录"}, ensure_ascii=False)))
        connection.execute("INSERT INTO runtime_claims VALUES ('migrated','uncertain','running','2026-10-06 00:00:00')")
    original = path.read_bytes()
    target = storage_class()(mysql_config)
    assert migration.migrate_file(path, target, apply=False)["written"] == 0
    assert target.get("migrated", "one") is None
    assert migration.migrate_file(path, target, apply=True)["written"] == 2
    assert migration.migrate_file(path, target, apply=True)["written"] == 0
    assert target.get("migrated", "one") == {"内容": "维修记录"}
    with pytest.raises(RuntimeError, match="未知"):
        target.get_or_create("migrated", "uncertain", lambda: {"bad": True})
    assert path.read_bytes() == original
    target.set("migrated", "one", {"内容": "新记录"})
    with pytest.raises(ValueError, match="冲突"):
        migration.migrate_file(path, target, apply=True)
    assert target.get("migrated", "one")["内容"] == "新记录"


def test_large_legacy_event_migration_preserves_raw_body_and_builds_light_projection(mysql_config, tmp_path, monkeypatch):
    import sqlite3
    migration = load_local_module("large_event_migration_test", "scripts/migrate_sqlite_storage.py")
    monkeypatch.setattr(migration, "LARGE_RECORD_CHARACTERS", 1, raising=False)
    path = tmp_path / "huge.sqlite3"
    value = {"_event_result_store_version": 2, "fingerprint": "large-fixture", "result": {"maintenance_plan": {"plan_id": "PLAN-LARGE-MIGRATION"}, "diagnosis": {"summary": "检查完成 😀"}, "event": {"device_id": "M-1"}, "trace": [{"context": "大型上下文" * 100000}]}}
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE runtime_state(namespace TEXT,state_key TEXT,payload TEXT)")
        db.execute("INSERT INTO runtime_state VALUES ('agent_event','large',?)", (json.dumps(value, ensure_ascii=True),))
    target = storage_class()(mysql_config)
    assert hasattr(target, "import_serialized_record"), "大旧记录迁移仍需展开整个上下文树"
    with sqlite3.connect(path) as db:
        db.row_factory = sqlite3.Row
        # 仅提供定位键，原文必须由被测函数增量读取，不能要求整列进入 Python。
        assert migration._runtime_record(target, db, {"namespace": "agent_event", "state_key": "large"}) is True
    assert migration.migrate_file(path, target, apply=True)["unchanged"] == 1
    assert target.get("agent_event", "large") == value
    plans, _ = target.plan_results()
    plan = next(item for item in plans if item["maintenance_plan"]["plan_id"] == "PLAN-LARGE-MIGRATION")
    assert "trace" not in plan


def test_migration_preflight_detects_conflict_without_writing(mysql_config, tmp_path):
    import sqlite3
    migration = load_local_module("preflight_migration_storage_test", "scripts/migrate_sqlite_storage.py")
    path = tmp_path / "preflight.sqlite3"
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE runtime_state(namespace TEXT,state_key TEXT,payload TEXT)")
        db.execute("INSERT INTO runtime_state VALUES ('preflight','key','{\"v\":1}')")
    target = storage_class()(mysql_config)
    target.set("preflight", "key", {"v": 2})
    assert hasattr(migration, "check_target"), "缺少只读迁移冲突预检"
    assert migration.check_target(path, mysql_config)["conflicts"] == 1
    assert target.get("preflight", "key") == {"v": 2}


def test_online_documents_coexist_with_legacy_offline_schema(mysql_config):
    from shared.persistence import mysql_session
    from shared.document_store import MySQLDocumentStore
    config = SafeConfig({**mysql_config, "database": "industry_storage_test_" + uuid4().hex[:12]})
    with mysql_session(mysql_config) as db:
        with db.cursor() as cursor:
            cursor.execute("CREATE DATABASE `" + config["database"] + "` CHARACTER SET utf8mb4")
    # 旧离线表的必填来源字段、正文列名与在线版本不同，不能争用同名表。
    with mysql_session(config) as db:
        with db.cursor() as cursor:
            cursor.execute("CREATE TABLE rag_documents(document_id CHAR(64) PRIMARY KEY,source_name VARCHAR(512) NOT NULL,source_path VARCHAR(2048) NOT NULL,source_format VARCHAR(32) NOT NULL,content_hash CHAR(64) NOT NULL,status VARCHAR(32) NOT NULL,metadata_json JSON NOT NULL)")
            cursor.execute("CREATE TABLE rag_chunks(chunk_id VARCHAR(128) PRIMARY KEY,document_id CHAR(64) NOT NULL,chunk_text MEDIUMTEXT NOT NULL,metadata_json JSON NOT NULL)")
            cursor.execute("INSERT INTO rag_documents VALUES ('offline','原手册','manual.pdf','pdf','hash','complete','{}')")
            cursor.execute("INSERT INTO rag_chunks VALUES ('offline-0','offline','离线正文','{}')")
    store = MySQLDocumentStore(config)
    store.upsert("online", "在线维修正文", {"device_id": "M-1"}, "sop")
    assert store.search("维修", filters={"device_id": "M-1"})[0]["text"] == "在线维修正文"
    with mysql_session(config) as db:
        with db.cursor() as cursor:
            cursor.execute("SELECT chunk_text FROM rag_chunks WHERE chunk_id='offline-0'")
            assert cursor.fetchone()[0] == "离线正文"


def test_document_migration_normalizes_chunk_aliases_on_repeated_import(mysql_config, tmp_path):
    import sqlite3
    migration = load_local_module("document_alias_migration_test", "scripts/migrate_sqlite_storage.py")
    path = tmp_path / "documents.sqlite3"
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE rag_documents(document_id TEXT,content TEXT,collection TEXT,metadata_json TEXT)")
        db.execute("CREATE TABLE rag_chunks(document_id TEXT,chunk_id TEXT,text TEXT,metadata_json TEXT)")
        db.execute("INSERT INTO rag_documents VALUES ('alias-document','维修经验','sop','{}')")
        db.execute("INSERT INTO rag_chunks VALUES ('alias-document','alias-0','经验分块','{\"corpus\":\"experience\"}')")
    original = path.read_bytes()
    target = storage_class()(mysql_config)
    assert migration.migrate_file(path, target, apply=True)["written"] == 1
    assert migration.migrate_file(path, target, apply=True)["unchanged"] == 1
    from shared.document_store import MySQLDocumentStore
    assert MySQLDocumentStore(mysql_config).get_chunk("alias-document", "alias-0")["metadata"]["corpus"] == "cases"
    assert path.read_bytes() == original


def test_migration_archives_old_orders_without_overwriting_authority_and_excludes_owned_fixture(mysql_config, tmp_path):
    import sqlite3
    migration = load_local_module("archive_migration_test", "scripts/migrate_sqlite_storage.py")
    path = tmp_path / "archive.sqlite3"
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE workorders(workorder_id TEXT,idempotency_key TEXT,payload TEXT)")
        db.execute("INSERT INTO workorders VALUES ('WO-OLD','old','{\"status\":\"pending\"}')")
        db.execute("CREATE TABLE rag_documents(document_id TEXT,content TEXT,collection TEXT,metadata_json TEXT)")
        db.execute("INSERT INTO rag_documents VALUES ('OWNED-TEST','测试隔离夹具','sop','{}')")
    target = storage_class()(mysql_config)
    original = path.read_bytes()
    result = migration.migrate_file(path, target, apply=True, archive_workorders=True, excluded_documents={"OWNED-TEST"})
    assert result["written"] == 1 and result["excluded"] == 1
    assert target.get("legacy_workorder_archive", "WO-OLD")["status"] == "pending"
    from shared.document_store import MySQLDocumentStore
    assert MySQLDocumentStore(mysql_config).get("OWNED-TEST") is None
    assert path.read_bytes() == original
