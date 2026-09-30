from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.runtime.approval import ApprovalManager, PendingTaskStore


def _client(tmp_path):
    manager = ApprovalManager(PendingTaskStore(str(tmp_path / "pending.sqlite3")))
    orchestrator = SimpleNamespace(container=SimpleNamespace(approvals=manager))
    return TestClient(create_app(orchestrator=orchestrator)), manager


def _pending(manager):
    return manager.create_pending(
        action={"action_id": "ACT-AUTH-1", "target": "workorder", "payload": {}},
        state={"task_id": "TASK-AUTH-1"},
        plan={"goal": "repair", "actions": []},
        next_index=0,
        policy={"status": "require_approval", "reason": "approval_required"},
    )


def test_write_endpoint_rejects_missing_or_invalid_token_when_configured(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "test-secret")
    client, manager = _client(tmp_path)
    pending = _pending(manager)
    url = f"/api/v1/runtime/approvals/{pending['pending_id']}/reject"
    payload = {"rejected_by": "operator-1", "reason": "unsafe"}

    assert client.post(url, json=payload).status_code == 401
    assert client.post(url, json=payload, headers={"Authorization": "Bearer wrong"}).status_code == 401


def test_write_endpoint_accepts_configured_token_and_uses_authenticated_actor(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "test-secret")
    client, manager = _client(tmp_path)
    pending = _pending(manager)

    response = client.post(
        f"/api/v1/runtime/approvals/{pending['pending_id']}/approve",
        json={"approved_by": "untrusted-body", "note": "confirmed"},
        headers={"X-API-Key": "test-secret"},
    )

    assert response.status_code == 200
    assert response.json()["approved_by"] == "api-token"


def test_production_write_endpoint_fails_closed_without_token(tmp_path, monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("AGENT_API_TOKEN", raising=False)
    monkeypatch.setenv("EVENT_STORE_PATH", str(tmp_path / "events.sqlite3"))
    client, manager = _client(tmp_path)
    pending = _pending(manager)

    response = client.post(
        f"/api/v1/runtime/approvals/{pending['pending_id']}/reject",
        json={"rejected_by": "operator-1", "reason": "unsafe"},
    )

    assert response.status_code == 503
    assert manager.get(pending["pending_id"])["status"] == "pending_approval"


def test_sensitive_read_requires_token_when_configured(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "test-secret")
    client, manager = _client(tmp_path)
    _pending(manager)

    assert client.get("/api/v1/runtime/approvals").status_code == 401
    response = client.get("/api/v1/runtime/approvals", headers={"Authorization": "Bearer test-secret"})
    assert response.status_code == 200
    assert response.json()["count"] == 1
