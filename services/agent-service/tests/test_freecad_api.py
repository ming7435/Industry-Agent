"""FreeCAD API 的认领、原始需求、安全下载与无需 OAuth 的边界。"""
from copy import deepcopy
from hashlib import sha256
from threading import Lock
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Event
import json
import time

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.agents.cad import modeling_api


PREFIX = "/api/cad/freecad"


class MemoryStore:
    def __init__(self):
        self.rows = {}
        self.lock = Lock()

    def get(self, key):
        with self.lock:
            return deepcopy(self.rows.get(key))

    def create(self, key, value):
        with self.lock:
            if key in self.rows:
                return False
            self.rows[key] = deepcopy(value)
            return True

    def set(self, key, value):
        with self.lock:
            self.rows[key] = deepcopy(value)


class LocalClient:
    def status(self):
        return {"connected": True, "transport": "stdio", "tools": [{"name": "execute_code"}]}

    def close(self):
        pass

    def call_tool(self, *args, **kwargs):
        pytest.fail("缺尺寸的 API 请求不能执行建模")


def api():
    app = FastAPI()
    app.state.freecad_run_store = MemoryStore()
    app.state.freecad_client_factory = LocalClient
    app.state.freecad_model_factory = lambda: None
    app.include_router(modeling_api.build_freecad_router(lambda: None))
    return TestClient(app), app.state.freecad_run_store


def test_original_prompt_survives_lookup_and_idempotency_without_oauth():
    client, store = api()
    prompt = "  做一根销轴\n孔径待定。  "
    body = {"prompt": prompt, "command_id": "first"}
    created = client.post(PREFIX + "/runs", json=body)
    assert created.status_code == 202, created.text
    run_id = "FC-" + sha256(b"first").hexdigest()
    assert created.json()["run_id"] == run_id
    result = client.get(PREFIX + "/runs/" + run_id).json()
    assert result["prompt"] == prompt
    assert result["status"] == "needs_input"
    assert client.post(PREFIX + "/runs", json=body).json() == result
    assert client.post(PREFIX + "/runs", json={**body, "prompt": "其他需求"}).status_code == 409
    assert len(store.rows) == 1
    assert client.post(PREFIX + "/auth/start", json={}).status_code == 404
    assert client.get(PREFIX + "/status").json()["connected"] is True


@pytest.mark.parametrize("extra", [{"code": "exec('x')"}, {"endpoint": "http://evil"}, {"spec": {"code": "evil"}}])
def test_api_rejects_arbitrary_execution_inputs(extra):
    client, store = api()
    response = client.post(PREFIX + "/runs", json={"prompt": "销轴", "command_id": "bad", **extra})
    assert response.status_code == 422
    assert not store.rows


@pytest.mark.parametrize('change', [{'type': []}, {'mode': []}, {'axis': []}, {'diameter': 10 ** 400}])
def test_malformed_spec_returns_422_without_claiming_a_command(change):
    client, store = api()
    client = TestClient(client.app, raise_server_exceptions=False)
    spec = {'units': 'mm', 'operations': [
        {'type': 'cylinder', 'mode': 'add', 'diameter': 30, 'length': 50, 'axis': 'z', 'position': [0, 0, 0], **change},
    ]}
    response = client.post(PREFIX + '/runs', json={'prompt': '销轴', 'command_id': 'malformed', 'spec': spec})
    assert response.status_code == 422, response.text
    assert not store.rows


def test_unknown_run_and_non_artifact_name_are_not_downloadable():
    client, _ = api()
    run_id = "FC-" + "1" * 64
    assert client.get(PREFIX + "/runs/" + run_id).status_code == 404
    assert client.get(PREFIX + "/runs/" + run_id + "/artifacts/secrets.txt").status_code == 404


def test_storage_outage_does_not_claim_or_disclose_connection_details():
    client, _ = api()

    class FailedStore:
        def get(self, key):
            raise RuntimeError("redis://private-password@internal-host")

    client.app.state.freecad_run_store = FailedStore()
    result = client.post(PREFIX + "/runs", json={"prompt": "销轴", "command_id": "one"})
    assert result.status_code == 503
    assert "private-password" not in result.text and "internal-host" not in result.text


def test_two_runs_are_bounded_and_inflight_duplicate_is_read_only():
    client, store = api()
    entered = Barrier(3)
    release = Event()

    class SlowModel:
        available = True
        timeout = 90

        def chat(self, messages, **kwargs):
            entered.wait(timeout=5)
            assert release.wait(5)
            return {"choices": [{"message": {"content": '{"status":"needs_input","questions":["请给出尺寸"]}'}}]}

    client.app.state.freecad_model_factory = SlowModel
    body = {"prompt": "销轴", "command_id": "one"}
    with ThreadPoolExecutor(max_workers=2) as pool:
        one = pool.submit(client.post, PREFIX + "/runs", json=body)
        two = pool.submit(client.post, PREFIX + "/runs", json={**body, "command_id": "two"})
        try:
            entered.wait(timeout=5)
            assert client.post(PREFIX + "/runs", json=body).json()["status"] == "running"
            assert client.post(PREFIX + "/runs", json={**body, "command_id": "three"}).status_code == 429
            assert len(store.rows) == 2
        finally:
            release.set()
        assert one.result().status_code == two.result().status_code == 202


def test_atomic_claim_survives_two_simultaneous_missing_reads():
    client, _ = api()
    barrier = Barrier(2)

    class RacingStore(MemoryStore):
        reads = 0
        def get(self, key):
            with self.lock:
                self.reads += 1
                race = self.reads <= 2
                row = deepcopy(self.rows.get(key))
            if race:
                barrier.wait(timeout=5)
            return row

    store = RacingStore()
    client.app.state.freecad_run_store = store
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(client.post, PREFIX + "/runs", json={"prompt": "销轴", "command_id": "same"}) for _ in range(2)]
        results = [future.result() for future in futures]
    assert [response.status_code for response in results] == [202, 202]
    assert len(store.rows) == 1


def test_result_storage_failure_never_replays_and_turns_unknown():
    client, _ = api()

    class FailedResultStore(MemoryStore):
        def set(self, key, value):
            raise RuntimeError("结果存储中断")

    store = FailedResultStore()
    client.app.state.freecad_run_store = store
    body = {"prompt": "销轴", "command_id": "same"}
    result = client.post(PREFIX + "/runs", json=body)
    run_id = result.json()["run_id"]
    store.rows[run_id]["created_at"] = time.time() - 301
    duplicate = client.post(PREFIX + "/runs", json=body).json()
    assert duplicate["status"] == "outcome_unknown"
    assert client.get(PREFIX + "/runs/" + run_id).json() == duplicate
    assert len(store.rows) == 1


def test_downloads_only_recorded_artifacts_from_server_owned_path(tmp_path, monkeypatch):
    import app.tools.cad.freecad_mcp as tool
    run_id = "FC-" + "f" * 64
    model_file = tmp_path / "model.stl"
    model_file.write_bytes(b"solid model\nendsolid model\n")
    monkeypatch.setattr(tool, "artifact_path", lambda identifier, name: model_file)
    client, store = api()
    store.set(run_id, {"run_id": run_id, "status": "completed", "artifacts": [{"name": "model.stl"}]})
    response = client.get(PREFIX + "/runs/" + run_id + "/artifacts/model.stl")
    assert response.status_code == 200
    assert response.content == b"solid model\nendsolid model\n"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert client.get(PREFIX + "/runs/" + run_id + "/artifacts/model.step").status_code == 404


def test_default_redis_claim_is_nx_with_one_day_ttl(monkeypatch):
    import redis
    rows, options = {}, []

    class RedisBoundary:
        def set(self, key, value, **kwargs):
            options.append(kwargs)
            if kwargs.get("nx") and key in rows:
                return False
            rows[key] = value
            return True
        def get(self, key):
            return rows.get(key)

    monkeypatch.setattr(redis.Redis, "from_url", lambda *args, **kwargs: RedisBoundary())
    store = modeling_api.FreeCADRunStore()
    assert store.create("same", {"status": "running"}) is True
    assert store.create("same", {"status": "running"}) is False
    store.set("same", {"status": "completed"})
    assert store.get("same") == {"status": "completed"}
    assert options == [{"nx": True, "ex": 86400}, {"nx": True, "ex": 86400}, {"ex": 86400}]


def test_every_active_endpoint_keeps_service_authentication():
    from app.api.server import require_write_auth
    import os
    previous = os.environ.get("AGENT_API_TOKEN", "")
    os.environ["AGENT_API_TOKEN"] = "isolated-test-token"
    try:
        app = FastAPI()
        app.include_router(modeling_api.build_freecad_router(require_write_auth))
        client = TestClient(app)
        run_id = "FC-" + "a" * 64
        for path in ("/status", "/runs/" + run_id, "/runs/" + run_id + "/artifacts/model.stl"):
            assert client.get(PREFIX + path).status_code == 401
        assert client.post(PREFIX + "/runs", json={"prompt": "销轴", "command_id": "one"}).status_code == 401
    finally:
        os.environ["AGENT_API_TOKEN"] = previous


def test_api_runs_real_graph_skill_tool_and_serves_generated_artifacts(tmp_path, monkeypatch):
    from freecad_test_kernel import ScriptMCP
    from app.harness.trace import TraceRecorder

    class Client(ScriptMCP, LocalClient):
        pass

    monkeypatch.setenv("FREECAD_ARTIFACT_ROOT", str(tmp_path))
    app = FastAPI()
    app.state.freecad_run_store = MemoryStore()
    app.state.freecad_client_factory = Client
    app.state.freecad_model_factory = lambda: None
    trace = TraceRecorder()
    app.include_router(modeling_api.build_freecad_router(lambda: None, trace=trace))
    client = TestClient(app)
    body = {"prompt": "外径30mm、长50mm的销轴，带同轴通孔直径10mm", "command_id": "actual-chain"}
    accepted = client.post(PREFIX + "/runs", json=body)
    assert accepted.status_code == 202
    run_id = accepted.json()["run_id"]
    result = client.get(PREFIX + "/runs/" + run_id).json()
    assert result["status"] == "completed", result
    assert result["validation"]["solid_count"] == 1
    assert result["execution"]["tool"] == "freecad_mcp"
    for artifact in result["artifacts"]:
        assert client.get(artifact["url"]).status_code == 200
    assert client.post(PREFIX + "/runs", json=body).json() == result
    assert len([row for row in trace.list() if row.get("event") == "tool_completed"]) == 1
