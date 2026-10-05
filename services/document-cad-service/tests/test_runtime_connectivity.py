"""通过临时 SQL 数据库验证真实仓库和 HTTP 行为，不接触正式数据库。"""

from concurrent.futures import ThreadPoolExecutor
import json
import os
import sqlite3
from threading import Event, Lock
import time

import pymysql
import pytest
from fastapi.testclient import TestClient

from app import repository
from app.main import app


class SQLiteCursor:
    """只转换数据库方言，查询筛选与业务规则仍由被测源码执行。"""

    def __init__(self, connection):
        self.connection = connection
        self.cursor = connection.database.cursor()

    def __enter__(self):
        if not self.connection.cursor_lock.acquire(blocking=False):
            raise pymysql.err.OperationalError(2014, "连接被并发查询占用")
        return self

    def __exit__(self, *_):
        self.cursor.close()
        self.connection.cursor_lock.release()

    def execute(self, sql, params=()):
        if self.connection.closed or self.connection.stale:
            raise pymysql.err.OperationalError(2006, "连接已失效")
        if sql.startswith("ALTER TABLE"):
            raise pymysql.err.OperationalError(1060, "列已存在")
        if sql.startswith("CREATE TABLE"):
            return
        if sql.startswith("SELECT"):
            if self.connection.fail_reads:
                self.connection.fail_reads -= 1
                raise pymysql.err.OperationalError(2013, "查询期间连接中断")
            if self.connection.pause_read:
                self.connection.pause_read = False
                self.connection.query_entered.set()
                if not self.connection.release_query.wait(3):
                    raise AssertionError("并发测试未及时释放查询")
            if not self.connection.autocommit and not self.connection.database.in_transaction:
                self.connection.database.execute("BEGIN")
        sql = sql.replace("INSERT IGNORE", "INSERT OR IGNORE").replace("%s", "?")
        self.cursor.execute(sql, params)

    def fetchall(self):
        return [dict(row) for row in self.cursor.fetchall()]

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row is not None else None


class SQLiteConnection:
    def __init__(self, path, **kwargs):
        self.database = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self.database.row_factory = sqlite3.Row
        self.database.create_function("JSON_UNQUOTE", 1, lambda value: value)
        self.autocommit = kwargs.get("autocommit", False)
        self.cursor_lock = Lock()
        self.closed = False
        self.stale = False
        self.fail_reads = 0
        self.pause_read = False
        self.query_entered = Event()
        self.release_query = Event()

    def cursor(self):
        return SQLiteCursor(self)

    def ping(self, reconnect=False):
        if self.closed or self.stale:
            raise pymysql.err.OperationalError(2006, "连接已失效")

    def commit(self):
        self.database.commit()

    def close(self):
        if not self.closed:
            self.database.close()
        self.closed = True


class TemporaryMySQLAdapter:
    def __init__(self, path):
        self.path = path
        self.connections = []
        self.unavailable = False
        self.disconnect_reads = False
        self.connection_error = "临时数据库不可用"
        with sqlite3.connect(path) as database:
            database.execute("PRAGMA journal_mode=WAL")
            database.executescript(
                "CREATE TABLE cad_drawings (drawing_id TEXT PRIMARY KEY, drawing_name TEXT DEFAULT '', "
                "version_id TEXT DEFAULT '', version_label TEXT DEFAULT '', is_current INTEGER DEFAULT 1, "
                "source_format TEXT DEFAULT '', object_ref TEXT DEFAULT '');"
                "CREATE TABLE cad_entities (entity_id TEXT PRIMARY KEY, entity_type TEXT DEFAULT '', "
                "layer_name TEXT DEFAULT '', block_name TEXT DEFAULT '', device_id TEXT DEFAULT '', "
                "text_content TEXT, raw_json TEXT, drawing_id TEXT);"
                "CREATE TABLE cad_entity_relations (source_entity_id TEXT, target_entity_id TEXT, "
                "relation_type TEXT, evidence_text TEXT, metadata_json TEXT);"
            )

    def connect(self, **kwargs):
        assert kwargs["host"] == "cad-test.invalid", "测试禁止连接正式地址"
        if self.unavailable:
            raise pymysql.err.OperationalError(2003, self.connection_error)
        connection = SQLiteConnection(self.path, **kwargs)
        connection.fail_reads = 1 if self.disconnect_reads else 0
        self.connections.append(connection)
        return connection

    def add(self, entity_id="TEST-PART", part_no="TEST-PN", version_id="TEST-VERSION", version_label="A", tenant="T-A", project="P-A"):
        drawing_id = "TEST-DWG-" + entity_id
        with sqlite3.connect(self.path) as database:
            database.execute(
                "INSERT INTO cad_drawings (drawing_id, drawing_name, version_id, version_label) VALUES (?, ?, ?, ?)",
                (drawing_id, "临时测试图", version_id, version_label),
            )
            database.execute(
                "INSERT INTO cad_entities (entity_id, block_name, text_content, raw_json, drawing_id) VALUES (?, ?, ?, ?, ?)",
                (entity_id, entity_id, "临时测试部件", json.dumps({"part_no": part_no, "tenant_id": tenant, "project_id": project, "position": "临时测试位置"}), drawing_id),
            )


@pytest.fixture
def database(monkeypatch, tmp_path):
    for name in tuple(os.environ):
        if name.startswith(("MYSQL_", "CAD_")):
            monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.setenv("PYTHON_DOTENV_DISABLED", "1")
    monkeypatch.setenv("CAD_MYSQL_HOST", "cad-test.invalid")
    monkeypatch.setenv("CAD_MYSQL_USER", "test-only")
    monkeypatch.setenv("CAD_MYSQL_DATABASE", "test-only")
    adapter = TemporaryMySQLAdapter(tmp_path / "engineering.sqlite3")
    monkeypatch.setattr(pymysql, "connect", adapter.connect)
    repository.reset_repository()
    yield adapter
    repository.reset_repository()
    for connection in adapter.connections:
        connection.close()


def test_shared_connection_serializes_parallel_search_and_health(database):
    database.add()
    repo = repository.get_repository()
    connection = database.connections[0]
    connection.pause_read = True
    with ThreadPoolExecutor(max_workers=2) as pool:
        search = pool.submit(repo.search, "TEST-PART")
        assert connection.query_entered.wait(1)
        count = pool.submit(repo.count)
        time.sleep(0.05)
        connection.release_query.set()
        assert count.result(timeout=2) == 1
        assert [item["component_id"] for item in search.result(timeout=2)] == ["TEST-PART"]


def test_stale_connection_recovers_without_demo(database):
    database.add()
    repo = repository.get_repository()
    database.connections[0].stale = True
    assert repo.count() == 1
    assert repo.backend == "mysql-engineering-metadata"


def test_read_disconnect_is_retried_once(database):
    database.add()
    repo = repository.get_repository()
    database.connections[0].fail_reads = 1
    assert [item["component_id"] for item in repo.search("TEST-PART")] == ["TEST-PART"]


def test_count_observes_new_committed_rows(database):
    database.add()
    repo = repository.get_repository()
    assert repo.count() == 1
    database.add(entity_id="TEST-SECOND", part_no="TEST-PN-SECOND")
    assert repo.count() == 2


def test_failed_connection_is_evicted_from_repository_cache(database):
    database.add()
    first = repository.get_repository()
    database.connections[0].stale = True
    database.unavailable = True
    with pytest.raises(repository.CADRepositoryError):
        first.count()
    database.unavailable = False
    recovered = repository.get_repository()
    assert recovered is not first
    assert recovered.count() == 1


def test_config_change_invalidates_cached_repository(database, monkeypatch):
    database.add()
    first = repository.get_repository()
    monkeypatch.delenv("CAD_MYSQL_HOST")
    with pytest.raises(repository.CADRepositoryError):
        repository.get_repository()
    assert database.connections[0].closed


def test_reset_closes_owned_connection(database):
    repository.get_repository()
    connection = database.connections[0]
    repository.reset_repository()
    assert connection.closed


@pytest.mark.parametrize("path", ["/health", "/ready"])
def test_unavailable_database_reports_503_and_false_readiness(database, path):
    database.unavailable = True
    response = TestClient(app).get(path)
    assert response.status_code == 503
    assert response.json()["ready"] is False
    assert response.json()["status"] == "unavailable"


@pytest.mark.parametrize("path", ["/health", "/ready"])
def test_available_database_reports_200_and_true_readiness(database, path):
    database.add()
    response = TestClient(app).get(path)
    assert response.status_code == 200
    assert response.json()["ready"] is True
    assert response.json()["records"] == 1


def test_health_reports_cached_connection_failure_and_later_recovers(database):
    database.add()
    repository.get_repository()
    database.connections[0].fail_reads = 1
    database.disconnect_reads = True
    response = TestClient(app).get("/health")
    assert response.status_code == 503
    assert response.json()["ready"] is False
    database.disconnect_reads = False
    recovered = TestClient(app).get("/health")
    assert recovered.status_code == 200
    assert recovered.json()["records"] == 1
    assert recovered.json()["synthetic"] is False


def test_health_does_not_disclose_driver_connection_details(database):
    database.unavailable = True
    database.connection_error = "private-connection-detail"
    response = TestClient(app).get("/health")
    assert response.status_code == 503
    assert "private-connection-detail" not in response.text


@pytest.mark.parametrize("environment", ["production", "prod"])
def test_ci_fixture_is_rejected_before_production_database_writes(database, monkeypatch, environment):
    monkeypatch.setenv("APP_ENV", environment)
    monkeypatch.setenv("CAD_CI_FIXTURE", "true")
    with pytest.raises(repository.CADRepositoryError):
        repository.get_repository()
    with sqlite3.connect(database.path) as temporary:
        assert temporary.execute("SELECT COUNT(*) FROM cad_entities").fetchone()[0] == 0


def test_demo_fallback_cannot_bypass_ci_fixture_environment_guard(database, monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("CAD_CI_FIXTURE", "true")
    monkeypatch.setenv("CAD_ALLOW_DEMO_FALLBACK", "true")
    with pytest.raises(repository.CADRepositoryError):
        repository.get_repository()


def test_production_cannot_fallback_to_demo_when_database_unavailable(database, monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("CAD_ALLOW_DEMO_FALLBACK", "true")
    database.unavailable = True
    response = TestClient(app).post("/tools/call", json={"tool": "query_part", "arguments": {"query": "主轴"}})
    assert response.status_code == 503


def test_exact_identifier_does_not_return_extended_part_identifier(database):
    database.add(entity_id="TEST-PART-EXTENDED", part_no="TEST-PN-EXTENDED")
    database.add()
    repo = repository.get_repository()
    assert [item["component_id"] for item in repo.search("TEST-PART")] == ["TEST-PART"]
    assert [item["component_id"] for item in repo.search("TEST-PN")] == ["TEST-PART"]


def test_api_accepts_version_label_when_version_id_is_present(database):
    database.add()
    response = TestClient(app).post("/tools/call", json={"tool": "query_part", "arguments": {"component": "TEST-PART", "version": "A"}})
    assert response.status_code == 200
    assert [item["component_id"] for item in response.json()["parts"]] == ["TEST-PART"]


@pytest.mark.parametrize("tool,result_key", [
    ("query_part", "parts"), ("query_bom", "bom_items"),
    ("query_drawing", "drawings"), ("query_relation", "locations"),
    ("fetch_engineering_record", "components"),
])
def test_tools_preserve_tenant_and_project_scope(database, tool, result_key):
    database.add(entity_id="TEST-OTHER", tenant="T-B", project="P-B")
    database.add()
    response = TestClient(app).post("/tools/call", json={"tool": tool, "arguments": {"query": "临时测试", "tenant_id": "T-A", "project_id": "P-A"}})
    assert response.status_code == 200
    result = response.json()[result_key]
    assert [item["component_id"] for item in result] == ["TEST-PART"]
