"""方案删除保留原始证据和工单；身份不能由客户端参数伪造。"""
from types import SimpleNamespace
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
import app.api.server as server
from app.runtime.durable_store import DurableJsonStore


@pytest.fixture
def plans(tmp_path, monkeypatch):
    path = str(tmp_path / "events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    store = DurableJsonStore(path)
    for name in ("PLAN-A", "PLAN-B"):
        store.set("agent_event", name, {"maintenance_plan": {"plan_id": name}, "event": {"device_id": "M-1"}, "workorder": {"workorder_id": "WO-" + name}})
    # 仅替换外部身份解析边界；存储、路由和删除规则均真实执行。
    def actor(request):
        if request.cookies.get("maintenance_session") != "test-session":
            raise HTTPException(401, "请先登录")
        return {"user_id": "U-1", "role": "technician"}
    monkeypatch.setattr(server, "team_actor", actor)
    with TestClient(server.create_app(orchestrator=SimpleNamespace(container=SimpleNamespace()))) as client:
        yield client, store


def test_delete_requires_personal_session_not_body_actor(plans):
    client, _ = plans
    assert client.delete("/api/maintenance/plans/PLAN-A").status_code == 401
    response = client.post("/api/maintenance/plans/delete", json={"plan_ids": ["PLAN-A"], "actor_id": "U-1", "approved": True})
    assert response.status_code in (401, 422)
    assert client.get("/api/maintenance/plans").json()["count"] == 2


def test_single_delete_survives_refresh_and_preserves_event_and_order(plans):
    client, store = plans
    client.cookies.set("maintenance_session", "test-session")
    for _ in range(2):
        response = client.delete("/api/maintenance/plans/PLAN-A")
        assert response.status_code == 200
        assert response.json()["deleted_plan_ids"] == ["PLAN-A"]
    body = client.get("/api/maintenance/plans").json()
    assert [item["plan_id"] for item in body["items"]] == ["PLAN-B"]
    assert body["deleted_plan_ids"] == ["PLAN-A"]
    assert store.get("agent_event", "PLAN-A")["workorder"]["workorder_id"] == "WO-PLAN-A"
    assert store.get("maintenance_plan_deleted", "PLAN-A")["actor_id"] == "U-1"


def test_batch_delete_is_atomic_and_limited(plans):
    client, _ = plans
    client.cookies.set("maintenance_session", "test-session")
    assert client.post("/api/maintenance/plans/delete", json={"plan_ids": ["PLAN-A", "NOT-EXIST"]}).status_code == 404
    assert client.get("/api/maintenance/plans").json()["count"] == 2
    assert client.post("/api/maintenance/plans/delete", json={"plan_ids": ["x"] * 101}).status_code == 422
    assert client.post("/api/maintenance/plans/delete", json={"plan_ids": ["PLAN-A", "PLAN-B"]}).status_code == 200
    assert client.get("/api/maintenance/plans").json()["count"] == 0


def test_delete_preserves_service_authentication(plans, monkeypatch):
    client, _ = plans
    client.cookies.set("maintenance_session", "test-session")
    monkeypatch.setenv("AGENT_API_TOKEN", "test-service-only")
    assert client.delete("/api/maintenance/plans/PLAN-A").status_code == 401
    assert client.delete("/api/maintenance/plans/PLAN-A", headers={"X-API-Key": "test-service-only"}).status_code == 200
