from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.runtime.durable_store import DurableJsonStore


def test_event_endpoint_reprocesses_new_revision_but_deduplicates_same_revision(monkeypatch):
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.delenv("EVENT_STORE_PATH", raising=False)
    calls = []

    class Runtime:
        container = SimpleNamespace()

        def run_abnormal_event(self, event):
            calls.append(dict(event))
            return {"revision": event["event_revision"], "call": len(calls)}

    client = TestClient(create_app(orchestrator=Runtime()))
    url = "/api/v1/agent/event"

    first = client.post(url, json={"event": {"event_id": "EVT-1", "event_revision": 1}})
    escalated = client.post(url, json={"event": {"event_id": "EVT-1", "event_revision": 2}})
    repeated = client.post(url, json={"event": {"event_id": "EVT-1", "event_revision": 2}})

    assert first.json() == {"revision": 1, "call": 1}
    assert escalated.json() == {"revision": 2, "call": 2}
    assert repeated.json() == escalated.json()
    assert len(calls) == 2


def test_same_event_revision_rejects_changed_payload_instead_of_reusing_result(monkeypatch):
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.delenv("EVENT_STORE_PATH", raising=False)
    calls = []

    class Runtime:
        container = SimpleNamespace()

        def run_abnormal_event(self, event):
            calls.append(dict(event))
            return {"temperature": event["temperature"]}

    client = TestClient(create_app(orchestrator=Runtime()))
    url = "/api/v1/agent/event"
    first = {"event_id": "EVT-2", "event_revision": 1, "device_id": "D-1", "temperature": 40}
    changed = {**first, "temperature": 80}

    assert client.post(url, json={"event": first}).status_code == 200
    response = client.post(url, json={"event": changed})

    assert response.status_code == 409
    assert calls == [first]


def test_durable_uncertain_event_returns_explicit_conflict_without_retry(tmp_path, monkeypatch):
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.setenv("EVENT_STORE_PATH", str(tmp_path / "events.sqlite3"))
    calls = []

    class Runtime:
        container = SimpleNamespace()

        def run_abnormal_event(self, event):
            calls.append(dict(event))
            raise TimeoutError("外部执行结果未知")

    client = TestClient(create_app(orchestrator=Runtime()), raise_server_exceptions=False)
    event = {"event_id": "EVT-UNCERTAIN", "event_revision": 1}
    client.post("/api/v1/agent/event", json={"event": event})
    response = client.post("/api/v1/agent/event", json={"event": event})

    assert response.status_code == 409
    assert len(calls) == 1


def test_event_endpoint_rejects_nonpositive_revision(monkeypatch):
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.delenv("EVENT_STORE_PATH", raising=False)

    class Runtime:
        container = SimpleNamespace()

        def run_abnormal_event(self, _event):
            raise AssertionError("无效修订不能进入 Runtime")

    client = TestClient(create_app(orchestrator=Runtime()))
    for revision in (0, -1, "bad", True):
        response = client.post("/api/v1/agent/event", json={"event": {"event_id": "EVT-INVALID", "event_revision": revision}})
        assert response.status_code == 422


def test_legacy_event_cache_requires_reconciliation_before_scoped_replay(tmp_path, monkeypatch):
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.setenv("APP_ENV", "testing")
    path = str(tmp_path / "events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    DurableJsonStore(path).set("agent_event", "EVT-LEGACY", {"task_id": "TASK-OLD"})
    calls = []

    class Runtime:
        container = SimpleNamespace()

        def run_abnormal_event(self, event):
            calls.append(event)
            return {"task_id": "TASK-NEW"}

    client = TestClient(create_app(orchestrator=Runtime()))
    response = client.post(
        "/api/v1/agent/event",
        json={"event": {"event_id": "EVT-LEGACY", "event_revision": 1, "device_id": "D-1"}},
    )

    assert response.status_code == 409
    assert calls == []
