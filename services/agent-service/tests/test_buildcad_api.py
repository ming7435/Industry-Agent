"""真实 FastAPI → CAD 节点 → Markdown Skill → Tool；仅替换存储与远程网络边界。"""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from hashlib import sha256
import json
from threading import Barrier, Event, Lock
import time
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.agents.cad.modeling_api import build_modeling_router
from app.api.server import require_write_auth
from app.clients.buildcad import BuildCADError
from app.harness.trace import TraceRecorder


PREFIX = "/api/cad/buildcad"
REDIRECT = "http://127.0.0.1:8001/?view=cad"
PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="


class MemoryRunStore:
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


@pytest.fixture
def api(monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "api-test-token")
    monkeypatch.setenv("MONITOR_WEB_HOST", "127.0.0.1")
    monkeypatch.setenv("MONITOR_WEB_PORT", "8001")
    store, trace = MemoryRunStore(), TraceRecorder()
    state = SimpleNamespace(calls=[], closed=0, auth=[], nonce="", outcome=None, block=False, started=Event(), release=Event(), lock=Lock())

    class RemoteClient:
        def status(self):
            return {"connected": True, "endpoint": "https://buildcad.ai/api/mcp", "transport": "streamableHttp", "tools": self.list_tools()}

        def list_tools(self):
            return [{"name": "render_preview", "description": "渲染远程设计预览", "inputSchema": {
                "type": "object", "properties": {"code": {"type": "string"}, "views": {
                    "type": "array", "items": {"type": "string", "enum": ["front", "back", "right", "left", "top", "bottom", "iso"]}}},
                "required": ["code"], "additionalProperties": False}}]

        def call_tool(self, name, arguments):
            with state.lock:
                state.calls.append((name, arguments))
                if len(state.calls) == 2:
                    state.started.set()
            if state.block:
                assert state.release.wait(10), "isolated test release was not delivered"
            if isinstance(state.outcome, Exception):
                raise state.outcome
            return state.outcome if state.outcome is not None else {"content": [
                {"type": "text", "text": "远程设计预览结果"},
                {"type": "image", "mimeType": "image/png", "data": PNG},
            ], "isError": False}

        def begin_auth(self, redirect_uri, browser_nonce):
            state.nonce = browser_nonce
            state.auth.append(("start", redirect_uri, browser_nonce))
            return {"authorization_url": "https://buildcad.ai/oauth/authorize?state=server-state", "state": "server-state"}

        def complete_auth(self, code, oauth_state, browser_nonce, redirect_uri):
            state.auth.append(("complete", code, oauth_state, browser_nonce, redirect_uri))
            if browser_nonce != state.nonce or oauth_state != "server-state":
                raise BuildCADError("invalid_oauth_state", "授权状态与当前浏览器不匹配。", 400)
            return {"authorized": True, "access_token": "never-expose-token"}

        def disconnect(self):
            state.auth.append(("disconnect",))

        def close(self):
            state.closed += 1

    class RemoteModel:
        available = True
        timeout = 45

        def __init__(self):
            self.count = 0

        def chat(self, messages, tools=None):
            self.count += 1
            if self.count == 1:
                message = {"role": "assistant", "content": None, "tool_calls": [{"id": "call-one", "type": "function", "function": {"name": "render_preview", "arguments": json.dumps({"code": "from llmcad import *\n# 仅交给远端的设计代码", "views": ["iso"]})}}]}
            else:
                message = {"role": "assistant", "content": "BuildCAD 已返回预览结果。"}
            return {"choices": [{"message": message}]}

    app = FastAPI()
    app.state.buildcad_client_factory = RemoteClient
    app.state.buildcad_model_factory = RemoteModel
    app.state.buildcad_run_store = store
    app.include_router(build_modeling_router(require_write_auth, trace=trace))
    with TestClient(app, headers={"Authorization": "Bearer api-test-token"}) as client:
        yield SimpleNamespace(client=client, app=app, state=state, store=store, trace=trace)


def submit(api, command="command-one", prompt="外径30mm、长50mm的销轴"):
    return api.client.post(PREFIX + "/runs", json={"prompt": prompt, "command_id": command})


def test_real_api_executes_one_cad_node_skill_and_tool_then_get_is_read_only(api):
    created = submit(api)
    assert created.status_code == 202, created.text
    assert created.json()["status"] == "running"
    run_id = created.json()["run_id"]
    result = api.client.get(PREFIX + "/runs/" + run_id).json()
    assert result["status"] == "completed", result
    assert result["calls"][0]["tool"] == "render_preview"
    assert result["calls"][0]["arguments"] == {"code": "from llmcad import *\n# 仅交给远端的设计代码", "views": ["iso"]}
    assert result["calls"][0]["result"]["content"] == [
        {"type": "text", "text": "远程设计预览结果"},
        {"type": "image", "mimeType": "image/png", "data": PNG},
    ]
    assert result["execution"]["agent"] == "cad"
    assert result["execution"]["node"] == "model_3d"
    assert result["execution"]["skill"] == "production_modeling_skill"
    assert result["execution"]["tool"] == "buildcad_mcp"
    rows = [row for row in api.trace.list() if row.get("event") == "tool_completed"]
    assert len(rows) == 1 and rows[0]["task_id"] == run_id
    assert rows[0]["skill"] == "production_modeling_skill"
    assert len(api.state.calls) == 1 and api.state.closed == 1
    assert api.client.get(PREFIX + "/runs/" + run_id).json() == result
    assert len(api.state.calls) == 1
    assert api.client.get("/api/cad/designs").status_code == 404


def test_same_command_is_atomic_and_different_prompt_conflicts(api):
    first = submit(api)
    second = submit(api)
    assert first.json()["run_id"] == second.json()["run_id"]
    assert second.json()["status"] == "completed"
    assert len(api.state.calls) == 1
    assert submit(api, prompt="不同的尺寸").status_code == 409
    assert len(api.state.calls) == 1


@pytest.mark.parametrize("body", [
    {"prompt": "   ", "command_id": "one"},
    {"prompt": "x" * 10001, "command_id": "one"},
    {"prompt": "销轴", "command_id": "../outside"},
    {"prompt": "销轴", "command_id": "x" * 129},
    {"prompt": "销轴", "command_id": "one", "endpoint": "http://evil.test"},
    {"prompt": "销轴", "command_id": "one", "tool": "save_design"},
    {"prompt": "销轴", "command_id": "one", "code": "exec('evil')"},
])
def test_invalid_input_and_untrusted_execution_fields_are_rejected(api, body):
    assert api.client.post(PREFIX + "/runs", json=body).status_code == 422
    assert api.state.calls == [] and api.store.rows == {}


@pytest.mark.parametrize("method,path,body", [
    ("GET", "/status", None), ("GET", "/runs/BC-test", None),
    ("POST", "/auth/start", {"redirect_uri": REDIRECT}),
    ("POST", "/auth/complete", {"code": "code", "state": "state", "redirect_uri": REDIRECT}),
    ("POST", "/auth/disconnect", {}),
    ("POST", "/runs", {"prompt": "销轴", "command_id": "one"}),
])
def test_every_endpoint_keeps_service_authorization(api, method, path, body):
    response = api.client.request(method, PREFIX + path, json=body, headers={"Authorization": "Bearer wrong"})
    assert response.status_code == 401
    assert api.state.calls == [] and api.state.auth == []


def test_status_uses_real_client_discovery_and_disconnected_error_is_readable(api):
    response = api.client.get(PREFIX + "/status")
    assert response.status_code == 200
    assert response.json()["connected"] is True
    assert response.json()["tools"][0]["name"] == "render_preview"
    assert api.state.closed == 1

    class Disconnected:
        def status(self):
            return {"connected": False, "endpoint": "https://buildcad.ai/api/mcp", "transport": "streamableHttp", "error": {"code": "authorization_required", "message": "请连接 BuildCAD"}}
        def close(self):
            pass
    api.app.state.buildcad_client_factory = Disconnected
    value = api.client.get(PREFIX + "/status").json()
    assert value["connected"] is False and value["error"] == "请连接 BuildCAD"


def test_oauth_cookie_is_bound_http_only_short_lived_and_cleared_without_tokens(api):
    started = api.client.post(PREFIX + "/auth/start", json={"redirect_uri": REDIRECT})
    assert started.status_code == 200
    cookie = started.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and "Max-Age=600" in cookie
    assert "Path=/api/cad/buildcad" in cookie
    assert api.state.nonce and api.state.nonce in cookie
    finished = api.client.post(PREFIX + "/auth/complete", json={"code": "only-code", "state": "server-state", "redirect_uri": REDIRECT})
    assert finished.status_code == 200
    assert finished.json() == {"authorized": True}
    assert "never-expose-token" not in finished.text
    assert "Max-Age=0" in finished.headers["set-cookie"]
    assert api.state.auth[-1] == ("complete", "only-code", "server-state", api.state.nonce, REDIRECT)
    assert api.client.post(PREFIX + "/auth/complete", json={"code": "only-code", "state": "server-state", "redirect_uri": REDIRECT}).status_code == 400


@pytest.mark.parametrize("redirect", [
    "https://evil.test/?view=cad", "http://127.0.0.1:9999/?view=cad", "http://127.0.0.1:8001/other",
    "http://user@127.0.0.1:8001/?view=cad", "http://127.0.0.1:8001/?view=cad#fragment",
    "http://localhost.evil.test:8001/?view=cad", "http://127.0.0.1:8001/?view=cad&next=https://evil.test",
])
def test_oauth_redirect_is_exact_server_config_not_untrusted_origin_or_forwarded_host(api, redirect):
    response = api.client.post(PREFIX + "/auth/start", json={"redirect_uri": redirect}, headers={"Origin": "https://evil.test", "X-Forwarded-Host": "evil.test"})
    assert response.status_code == 400
    assert api.state.auth == []


def test_localhost_on_configured_port_is_valid_and_failed_callback_clears_cookie(api):
    redirect = "http://localhost:8001/?view=cad"
    assert api.client.post(PREFIX + "/auth/start", json={"redirect_uri": redirect}).status_code == 200
    bad = api.client.post(PREFIX + "/auth/complete", json={"code": "one", "state": "wrong-state", "redirect_uri": redirect})
    assert bad.status_code == 400 and "Max-Age=0" in bad.headers["set-cookie"]
    disconnected = api.client.post(PREFIX + "/auth/disconnect", json={})
    assert disconnected.status_code == 200 and disconnected.json()["connected"] is False


@pytest.mark.parametrize("outcome,expected", [
    ({"isError": True, "content": [{"type": "text", "text": "远端拒绝设计"}]}, "failed"),
    (BuildCADError("outcome_unknown", "请求超时，请先核对设计。", 504), "outcome_unknown"),
])
def test_remote_error_and_unknown_outcome_are_never_success_or_replayed(api, outcome, expected):
    api.state.outcome = outcome
    created = submit(api)
    value = api.client.get(PREFIX + "/runs/" + created.json()["run_id"]).json()
    assert value["status"] == expected
    assert value["error"] and value["calls"][0]["tool"] == "render_preview"
    assert submit(api).json()["status"] == expected
    assert len(api.state.calls) == 1 and api.state.closed == 1


def test_abandoned_running_record_becomes_unknown_without_reexecution(api):
    run_id = "BC-" + sha256(b"abandoned").hexdigest()
    api.store.set(run_id, {"run_id": run_id, "status": "running", "created_at": time.time() - 301, "input_digest": sha256("旧需求".encode()).hexdigest(), "calls": [], "answer": ""})
    value = api.client.get(PREFIX + "/runs/" + run_id).json()
    assert value["status"] == "outcome_unknown" and value["error"]
    assert api.state.calls == []


def test_storage_failure_fails_closed_and_hides_connection_details(api):
    class FailedStore:
        def get(self, key):
            raise RuntimeError("redis://secret-password@internal-host")
    api.app.state.buildcad_run_store = FailedStore()
    response = submit(api)
    assert response.status_code == 503
    assert "secret-password" not in response.text and "internal-host" not in response.text
    assert api.state.calls == []


def test_only_two_runs_execute_concurrently_and_duplicate_inflight_request_is_read_only(api):
    api.state.block = True
    with ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(submit, api, "concurrent-one")
        second = pool.submit(submit, api, "concurrent-two")
        try:
            assert api.state.started.wait(5)
            duplicate = submit(api, "concurrent-one")
            assert duplicate.status_code == 202 and duplicate.json()["status"] == "running"
            assert submit(api, "concurrent-three").status_code == 429
            assert len(api.state.calls) == 2
        finally:
            api.state.release.set()
        assert first.result().status_code == second.result().status_code == 202
    assert submit(api, "concurrent-three").status_code == 202
    assert len(api.state.calls) == 3


def test_two_simultaneous_missing_reads_still_claim_the_same_command_only_once(api):
    barrier = Barrier(2)

    class RacingStore(MemoryRunStore):
        def __init__(self):
            super().__init__()
            self.read_count = 0

        def get(self, key):
            with self.lock:
                self.read_count += 1
                first_reads = self.read_count <= 2
                value = deepcopy(self.rows.get(key))
            if first_reads:
                barrier.wait(timeout=5)
            return value

    api.app.state.buildcad_run_store = RacingStore()
    with ThreadPoolExecutor(max_workers=2) as pool:
        requests = [pool.submit(submit, api, "racing-command") for _ in range(2)]
        responses = [pending.result() for pending in requests]
    assert [response.status_code for response in responses] == [202, 202]
    assert len({response.json()["run_id"] for response in responses}) == 1
    assert len(api.state.calls) == 1


def test_result_storage_failure_keeps_claim_and_does_not_replay_remote_call(api):
    class ResultWriteFailure(MemoryRunStore):
        def set(self, key, value):
            raise RuntimeError("redis://secret-password@internal-host")

    storage = ResultWriteFailure()
    api.app.state.buildcad_run_store = storage
    first = submit(api)
    assert first.status_code == 202
    assert submit(api).json()["status"] == "running"
    assert len(api.state.calls) == 1
    run_id = first.json()["run_id"]
    storage.rows[run_id]["created_at"] = time.time() - 301
    assert api.client.get(PREFIX + "/runs/" + run_id).json()["status"] == "outcome_unknown"
    assert submit(api).json()["status"] == "outcome_unknown"
    assert len(api.state.calls) == 1
    assert "secret-password" not in json.dumps(api.trace.list())


def test_default_redis_store_uses_atomic_nx_and_twenty_four_hour_ttl(monkeypatch):
    import redis
    from app.agents.cad.modeling_api import BuildCADRunStore

    class RedisBoundary:
        def __init__(self):
            self.rows, self.options = {}, []

        def set(self, key, value, **options):
            self.options.append(options)
            if options.get("nx") and key in self.rows:
                return False
            self.rows[key] = value
            return True

        def get(self, key):
            return self.rows.get(key)

    boundary = RedisBoundary()
    monkeypatch.setattr(redis.Redis, "from_url", lambda *args, **kwargs: boundary)
    store = BuildCADRunStore()
    assert store.create("same", {"status": "running"}) is True
    assert store.create("same", {"status": "running"}) is False
    store.set("same", {"status": "completed"})
    assert store.get("same") == {"status": "completed"}
    assert boundary.options == [{"nx": True, "ex": 86400}, {"nx": True, "ex": 86400}, {"ex": 86400}]
