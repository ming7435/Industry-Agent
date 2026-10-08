"""诊断超时的只读回查和事件归属回归；不连接现场设备和收费模型。"""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from collections import deque
from concurrent.futures import Future, ThreadPoolExecutor
from threading import Event, Lock, Thread
from time import sleep
from types import SimpleNamespace
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

import monitor_web_server as monitor
from app.api.server import create_app
from app.runtime.event_store import EventResultStore


EVENT = {"event_id": "E-1", "device_id": "D-1", "event_revision": 2, "alarm_code": "700002", "task_id": "T-2"}
RESULT = {"event": EVENT, "status": "blocked", "stop_reason": "replan_limit_exceeded",
          "diagnosis": {"status": "completed", "confidence": 0.465, "maintenance_required": False, "summary": "证据不足，不能确认根因"}}


def _client(monkeypatch, path=None):
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    if path:
        monkeypatch.setenv("EVENT_STORE_PATH", str(path))
    else:
        monkeypatch.delenv("EVENT_STORE_PATH", raising=False)
    calls = []

    class Runtime:
        container = SimpleNamespace()

        def run_abnormal_event(self, event):
            calls.append(event)
            return {**RESULT, "event": event, "trace": [{"state": "不能复制整个运行上下文"}]}

    return TestClient(create_app(Runtime())), calls


def test_result_lookup_is_exact_authenticated_and_never_runs_event(monkeypatch):
    client, calls = _client(monkeypatch)
    assert client.post("/api/v1/agent/event", json={"event": EVENT}).status_code == 200
    query = {"device_id": "D-1", "event_revision": 2}
    response = client.get("/api/v1/agent/event/E-1/result", params=query)
    assert response.status_code == 200
    assert response.json()["result"]["diagnosis"]["confidence"] == 0.465
    assert "trace" not in response.json()["result"]
    for wrong in ({**query, "device_id": "D-2"}, {**query, "event_revision": 1}, {**query, "tenant_id": "other"}):
        assert client.get("/api/v1/agent/event/E-1/result", params=wrong).status_code == 202
    assert client.get("/api/v1/agent/event/E-1/result").status_code == 422
    monkeypatch.setenv("AGENT_API_TOKEN", "test-read-token")
    assert client.get("/api/v1/agent/event/E-1/result", params=query).status_code == 401
    assert client.get("/api/v1/agent/event/E-1/result", params=query,
                      headers={"Authorization": "Bearer test-read-token"}).status_code == 200
    assert len(calls) == 1


def test_result_lookup_reads_persisted_result_after_app_recreation(tmp_path, monkeypatch):
    path = tmp_path / "isolated-events.sqlite3"
    client, calls = _client(monkeypatch, path)
    client.post("/api/v1/agent/event", json={"event": EVENT})
    recreated, new_calls = _client(monkeypatch, path)
    response = recreated.get("/api/v1/agent/event/E-1/result", params={"device_id": "D-1", "event_revision": 2})
    assert response.status_code == 200
    assert response.json()["result"]["status"] == "blocked"
    assert len(calls) == 1 and new_calls == []


def test_store_read_does_not_claim_or_execute_missing_result(monkeypatch):
    monkeypatch.delenv("EVENT_STORE_PATH", raising=False)
    store = EventResultStore()
    assert store.get_result("missing") is None
    assert store._results == {} and store._key_locks == {}
    store.get_or_create("scoped", lambda: RESULT, fingerprint="original")
    assert store.get_result("scoped") == RESULT


class Response:
    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.body).encode()


def test_monitor_recovers_timeout_by_get_without_reposting(monkeypatch):
    calls, progress = [], []
    responses = [{"status": "pending_or_unknown"}, {"status": "available", "result": RESULT}]

    def external_http(request, **_):
        calls.append(request)
        if request.get_method() == "POST":
            raise TimeoutError("timed out")
        return Response(responses.pop(0))

    monkeypatch.setattr(monitor, "urlopen", external_http)
    monkeypatch.setattr(monitor, "AGENT_RESULT_POLL_SECONDS", 0)
    result = monitor.dispatch_agent_event(EVENT, on_recovery=progress.append)
    assert result == RESULT
    assert [request.get_method() for request in calls] == ["POST", "GET", "GET"]
    assert parse_qs(urlparse(calls[1].full_url).query)["event_revision"] == ["2"]
    assert progress and progress[0]["status"] == "recovering"
    assert progress[0]["alarm_code"] == "700002"


def test_monitor_missing_result_remains_unknown_not_success(monkeypatch):
    def external_http(request, **_):
        if request.get_method() == "POST":
            raise TimeoutError("timed out")
        return Response({"status": "pending_or_unknown"})

    monkeypatch.setattr(monitor, "urlopen", external_http)
    monkeypatch.setattr(monitor, "AGENT_RESULT_RECOVERY_SECONDS", 0.01)
    monkeypatch.setattr(monitor, "AGENT_RESULT_POLL_SECONDS", 0.02)
    result = monitor.dispatch_agent_event(EVENT)
    assert result["diagnosis"]["status"] == "unknown"
    assert result["diagnosis"]["event_id"] == "E-1"
    assert "error" in result["diagnosis"]


def test_monitor_does_not_retry_rejected_post(monkeypatch):
    calls = []

    def external_http(request, **_):
        calls.append(request.get_method())
        raise HTTPError(request.full_url, 422, "invalid event", {}, None)

    monkeypatch.setattr(monitor, "urlopen", external_http)
    with pytest.raises(HTTPError):
        monitor.dispatch_agent_event(EVENT)
    assert calls == ["POST"]


def test_post_completes_at_wait_timeout_boundary_without_losing_its_result(monkeypatch):
    """模拟等待边界与 POST 完成交错；使用真实线程执行 POST，不重复提交。"""
    calls = []
    class BoundaryFuture:
        def __init__(self, actual):
            self.actual, self.first_wait = actual, True
        def done(self):
            return self.actual.done()
        def result(self, timeout=None):
            if self.first_wait:
                self.first_wait = False
                self.actual.result(timeout=2)
                raise TimeoutError("等待超时刚触发，另一线程已完成 POST")
            return self.actual.result(timeout=timeout)
    class BoundaryExecutor(ThreadPoolExecutor):
        def submit(self, fn, *args, **kwargs):
            return BoundaryFuture(super().submit(fn, *args, **kwargs))
    def external_http(request, **_):
        calls.append(request.get_method())
        if request.get_method() == "POST":
            return Response(RESULT)
        raise HTTPError(request.full_url, 404, "回查不可用", {}, None)
    monkeypatch.setattr(monitor, "ThreadPoolExecutor", BoundaryExecutor)
    monkeypatch.setattr(monitor, "urlopen", external_http)
    assert monitor.dispatch_agent_event(EVENT) == RESULT
    assert calls == ["POST"]


def _state():
    state = monitor.MonitorWebState.__new__(monitor.MonitorWebState)
    state.lock = Lock()
    state._diagnosis_generation = 0
    state.diagnosis_pending = 1
    state.latest_diagnosis = None
    state.latest_pipeline = None
    state.latest_diagnoses_by_device = {}
    state.latest_pipelines_by_device = {}
    state.diagnosis_history = deque(maxlen=30)
    state._diagnosis_events_by_device = {"D-1": EVENT}
    return state


def test_monitor_failure_keeps_identity_for_current_alarm_display():
    state, future = _state(), Future()
    future.set_exception(ConnectionError("服务断开"))
    state._on_diagnosis_done(future, 0, EVENT)
    assert state.latest_diagnosis["device_id"] == "D-1"
    assert state.latest_diagnosis["alarm_code"] == "700002"
    assert state.latest_diagnosis["event_revision"] == 2
    assert state.latest_diagnosis["error"]


def test_old_revision_cannot_overwrite_current_diagnosis():
    state, future = _state(), Future()
    state.latest_diagnosis = {"summary": "当前任务"}
    future.set_result({"diagnosis": {"summary": "旧任务"}})
    state._on_diagnosis_done(future, 0, {**EVENT, "event_revision": 1})
    assert state.latest_diagnosis["summary"] == "当前任务"
    assert state.diagnosis_pending == 0


def test_plan_progress_is_visible_before_final_and_stale_callback_cannot_replace_it():
    state = _state()
    state._latest_diagnosis_event = EVENT
    progress = {'diagnosis':RESULT['diagnosis'],'maintenance_plan':{'plan_id':'P-STAGE','created_at':'2026-10-07T13:02:00Z'}}
    state._on_pipeline_progress(progress,0,EVENT)
    assert state.latest_pipeline['status']=='running'
    assert state.latest_pipeline['maintenance_plan']['plan_id']=='P-STAGE'
    assert state.latest_pipeline['maintenance_plan']['created_at']=='2026-10-07T13:02:00Z'
    state._on_pipeline_progress({'maintenance_plan':{'plan_id':'OLD'}},0,{**EVENT,'event_revision':1})
    assert state.latest_pipeline['maintenance_plan']['plan_id']=='P-STAGE'
    state.latest_diagnoses_by_device['D-1']={**RESULT['diagnosis'],'status':'completed'}
    future=Future()
    future.set_exception(ConnectionError('final connection unavailable'))
    state._on_diagnosis_done(future,0,EVENT)
    assert state.latest_pipeline['maintenance_plan']['plan_id']=='P-STAGE'
    assert state.latest_pipeline['status']=='unknown'


def test_old_session_callback_cannot_decrement_new_session_pending_count():
    state, future = _state(), Future()
    future.set_result(RESULT)
    state._on_diagnosis_done(future, -1, EVENT)
    assert state.diagnosis_pending == 1
    assert state.latest_diagnosis is None


def test_late_response_error_cannot_erase_completed_stage():
    state, future = _state(), Future()
    state.latest_diagnoses_by_device['D-1'] = {**RESULT['diagnosis'], **EVENT, 'workflow_status':'running'}
    future.set_exception(ConnectionError('后续 HTTP 断开'))
    state._on_diagnosis_done(future, 0, EVENT)
    assert state.latest_diagnosis['summary'] == RESULT['diagnosis']['summary']
    assert state.latest_diagnosis['confidence'] == 0.465
    assert state.latest_diagnosis['status'] == 'completed'
    assert state.latest_diagnosis['workflow_status'] == 'unknown'
    assert state.latest_pipeline['status'] == 'unknown'
    assert state.diagnosis_pending == 0


def test_real_http_timeout_recovers_actual_api_result_with_one_submission(monkeypatch):
    """真实 HTTP 超时后原调用继续；回查真实 API/存储，不伪造查询结果。"""

    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.delenv("EVENT_STORE_PATH", raising=False)
    executed = []

    class SlowRuntime:
        container = SimpleNamespace()

        def run_abnormal_event(self, event):
            executed.append(event)
            sleep(0.12)
            return RESULT

    with TestClient(create_app(SlowRuntime())) as client:
        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                self.respond(client.post(self.path, json=body))

            def do_GET(self):
                self.respond(client.get(self.path))

            def respond(self, response):
                try:
                    self.send_response(response.status_code)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(response.content)
                except OSError:
                    pass  # 原 POST 超时后客户端断开；服务端依旧完成原任务。

            def log_message(self, *_):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            monkeypatch.setattr(monitor, "AGENT_SERVICE_BASE_URL", "http://127.0.0.1:%s" % server.server_port)
            monkeypatch.setattr(monitor, "AGENT_EVENT_TIMEOUT_SECONDS", 0.02)
            monkeypatch.setattr(monitor, "AGENT_RESULT_RECOVERY_SECONDS", 2)
            monkeypatch.setattr(monitor, "AGENT_RESULT_POLL_SECONDS", 0.02)
            progress = []
            result = monitor.dispatch_agent_event(EVENT, on_recovery=progress.append)
            assert result["diagnosis"]["summary"] == RESULT["diagnosis"]["summary"]
            assert result["status"] == "blocked"
            assert result["diagnosis"]["confidence"] == 0.465
            assert result["diagnosis"]["maintenance_required"] is False
            assert progress[0]["status"] == "recovering"
            assert executed == [EVENT]
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


def test_monitor_displays_real_stage_while_post_is_still_pending(monkeypatch):
    """真实 HTTP/API/进度存储：后续动作等待时，Monitor 先收到诊断正文。"""
    stage_ready, release = Event(), Event()
    executed, progress = [], []
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.delenv("EVENT_STORE_PATH", raising=False)

    class StageRuntime:
        container = SimpleNamespace()

        def run_abnormal_event(self, event):
            executed.append(event)
            self.container.event_results.record_stage(event, {**RESULT, "status": "running"})
            stage_ready.set()
            assert release.wait(2), "Monitor 必须在 POST 结束前回查阶段进度"
            return RESULT

    with TestClient(create_app(StageRuntime())) as client:
        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                self.respond(client.post(self.path, json=body))
            def do_GET(self):
                self.respond(client.get(self.path))
            def respond(self, response):
                self.send_response(response.status_code)
                self.end_headers()
                self.wfile.write(response.content)
            def log_message(self, *_):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            monkeypatch.setattr(monitor, "AGENT_SERVICE_BASE_URL", "http://127.0.0.1:%s" % server.server_port)
            monkeypatch.setattr(monitor, "AGENT_EVENT_TIMEOUT_SECONDS", 4)
            monkeypatch.setattr(monitor, "AGENT_RESULT_POLL_SECONDS", 0.02)

            def shown(diagnosis):
                progress.append(diagnosis)
                if diagnosis.get("summary") == RESULT["diagnosis"]["summary"]:
                    assert stage_ready.is_set() and not release.is_set()
                    assert diagnosis["workflow_status"] == "running"
                    assert client.get('/api/v1/agent/event/E-1/result',
                        params={"device_id":"D-1", "event_revision":2}).json()["status"] == "in_progress"
                    release.set()

            result = monitor.dispatch_agent_event(EVENT, on_recovery=shown)
            assert result["status"] == "blocked"
            assert progress[0]["status"] == "completed"
            assert executed == [EVENT]
        finally:
            release.set()
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


def test_stage_diagnosis_is_not_erased_when_workflow_response_times_out(monkeypatch):
    calls = []
    def external_http(request, **_):
        calls.append(request.get_method())
        if request.get_method() == "POST":
            sleep(0.06)
            raise TimeoutError("整流程响应超时")
        return Response({"status":"in_progress", "result":{**RESULT, "status":"running"}})
    monkeypatch.setattr(monitor, "urlopen", external_http)
    monkeypatch.setattr(monitor, "AGENT_RESULT_POLL_SECONDS", 0.01)
    monkeypatch.setattr(monitor, "AGENT_RESULT_RECOVERY_SECONDS", 0.03)
    progress = []
    result = monitor.dispatch_agent_event(EVENT, on_recovery=progress.append)
    assert result["status"] == "unknown"
    assert result["diagnosis"]["summary"] == RESULT["diagnosis"]["summary"]
    assert result["diagnosis"]["confidence"] == 0.465
    assert result["diagnosis"]["status"] == "completed"
    assert result["diagnosis"]["workflow_status"] == "unknown"
    assert all(item["summary"] == RESULT["diagnosis"]["summary"] for item in progress)
    assert calls.count("POST") == 1
