from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.runtime.approval import ApprovalManager, PendingTaskStore


def _pending(manager):
    return manager.create_pending(
        action={"action_id": "ACT-API-1", "target": "workorder", "payload": {"required_capability": "workorder_create"}},
        state={"task_id": "TASK-API-1", "trace_id": "TRACE-API-1"},
        plan={"goal": "repair", "actions": []},
        next_index=0,
        policy={"status": "require_approval", "reason": "approval_required"},
    )


def _client(tmp_path):
    manager = ApprovalManager(
        PendingTaskStore(str(tmp_path / "pending.sqlite3")),
        resume_callback=lambda _record: {"runtime_result": {"status": "completed", "stop_reason": "evidence_ready"}},
    )
    orchestrator = SimpleNamespace(container=SimpleNamespace(approvals=manager))
    return TestClient(create_app(orchestrator=orchestrator)), manager


def test_approval_api_get_approve_and_retrieve_final_record(tmp_path):
    client, manager = _client(tmp_path)
    pending = _pending(manager)

    fetched = client.get("/api/v1/runtime/approvals/%s" % pending["pending_id"])
    approved = client.post(
        "/api/v1/runtime/approvals/%s/approve" % pending["pending_id"],
        json={"approved_by": "operator-1", "note": "confirmed"},
    )

    assert fetched.status_code == 200
    assert fetched.json()["status"] == "pending_approval"
    assert approved.status_code == 200
    assert approved.json()["status"] == "completed"


def test_approval_api_reject_and_unknown_pending_task(tmp_path):
    client, manager = _client(tmp_path)
    pending = _pending(manager)

    rejected = client.post(
        "/api/v1/runtime/approvals/%s/reject" % pending["pending_id"],
        json={"rejected_by": "operator-1", "reason": "unsafe"},
    )
    unknown = client.get("/api/v1/runtime/approvals/PENDING-NOT-FOUND")

    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert unknown.status_code == 404


def test_approval_api_requires_an_explicit_actor(tmp_path):
    client, manager = _client(tmp_path)
    pending = _pending(manager)

    response = client.post(
        "/api/v1/runtime/approvals/%s/approve" % pending["pending_id"],
        json={"note": "missing actor"},
    )

    assert response.status_code == 422
