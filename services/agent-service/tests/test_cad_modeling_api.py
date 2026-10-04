"""CAD 生产建模接口回归；只使用临时目录和隔离模型配置。"""

import base64
import time
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app


@pytest.fixture
def client(tmp_path):
    app = create_app(SimpleNamespace(container=SimpleNamespace()))
    app.state.cad_modeling_root = tmp_path / "cad"
    with TestClient(app) as value:
        yield value
    service = getattr(app.state, "cad_modeling_service", None)
    if service:
        service.close()


def request_spec():
    return {"name": "带孔销轴", "material": "C45", "spec": {
        "units": "mm", "operations": [
            {"type": "cylinder", "diameter": 30, "length": 50},
            {"type": "cylinder", "diameter": 10, "length": 50, "mode": "cut"},
        ]}}


def finished(client, task_id):
    deadline = time.monotonic() + 80
    while time.monotonic() < deadline:
        response = client.get(f"/api/cad/designs/{task_id}")
        assert response.status_code == 200
        value = response.json()
        if value["status"] in {"ready", "confirmed", "needs_input", "failed", "interrupted"}:
            return value
        time.sleep(0.15)
    pytest.fail("CAD 任务未在隔离测试时限内结束")


def test_create_generates_real_validated_solid_and_downloads(client):
    response = client.post("/api/cad/designs", json=request_spec())
    assert response.status_code == 202
    result = finished(client, response.json()["design_id"])
    assert result["status"] == "ready", result
    assert result["geometry"]["solid_count"] == 1
    assert result["geometry"]["step_roundtrip_valid"] is True
    assert result["geometry"]["volume_mm3"] == pytest.approx(31415.9265359, rel=1e-6)
    assert result["geometry"]["bounds_mm"] == pytest.approx([30, 30, 50])
    assert result["production_status"] == "not_connected"
    formats = {item["format"]: item for item in result["artifacts"]}
    assert {"step", "stl", "svg", "dxf", "pdf", "json"} <= formats.keys()
    step = client.get(formats["step"]["url"] + "?download=1")
    assert step.status_code == 200
    assert b"ISO-10303-21" in step.content
    assert "attachment" in step.headers["content-disposition"]
    assert client.get(formats["pdf"]["url"]).content.startswith(b"%PDF")
    assert result["events"][0]["input"]["spec"]["operations"][0]["diameter"] == 30
    assert any(item["tool"] == "cad_kernel" for item in result["events"])


@pytest.mark.parametrize("spec", [
    {"units": "mm", "operations": [{"type": "cylinder", "diameter": -1, "length": 50}]},
    {"units": "feet", "operations": [{"type": "cylinder", "diameter": 30, "length": 50}]},
    {"units": "mm", "operations": [{"type": "exec", "code": "delete_files()"}]},
])
def test_rejects_invalid_or_executable_geometry(client, spec):
    assert client.post("/api/cad/designs", json={"spec": spec}).status_code == 422


def test_missing_dimensions_never_returns_default_model(client):
    response = client.post("/api/cad/designs", json={"prompt": "做一个零件"})
    assert response.status_code == 202
    value = finished(client, response.json()["design_id"])
    assert value["status"] == "needs_input"
    assert value["artifacts"] == []
    assert value["missing_information"]


def test_idempotency_distinguishes_parameters(client):
    headers = {"Idempotency-Key": "same-command"}
    first = client.post("/api/cad/designs", json=request_spec(), headers=headers)
    assert first.status_code == 202
    second = client.post("/api/cad/designs", json=request_spec(), headers=headers)
    assert second.json()["design_id"] == first.json()["design_id"]
    changed = request_spec()
    changed["spec"]["operations"][0]["length"] = 60
    assert client.post("/api/cad/designs", json=changed, headers=headers).status_code == 409


def test_body_command_identity_survives_monitor_proxy(client):
    payload = {**request_spec(), "command_id": "frontend-command"}
    first = client.post("/api/cad/designs", json=payload)
    assert first.status_code == 202
    second = client.post("/api/cad/designs", json=payload)
    assert second.json()["design_id"] == first.json()["design_id"]
    payload["spec"]["operations"][0]["length"] = 60
    assert client.post("/api/cad/designs", json=payload).status_code == 409


def test_cad_writes_and_files_preserve_auth_boundary(client, monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "isolated-token")
    assert client.post("/api/cad/designs", json=request_spec()).status_code == 401
    assert client.get("/api/cad/designs").status_code == 401


def test_upload_rejects_path_and_wrong_content(client):
    payload = {"filename": "../../evil.step", "content_base64": base64.b64encode(b"bad").decode()}
    assert client.post("/api/cad/designs/import", json=payload).status_code == 422
    payload["filename"] = "part.step"
    response = client.post("/api/cad/designs/import", json=payload)
    assert response.status_code == 202
    result = finished(client, response.json()["design_id"])
    assert result["status"] == "failed"
    assert not result["artifacts"]


def test_confirmation_is_revision_bound(client):
    response = client.post("/api/cad/designs", json=request_spec())
    assert response.status_code == 202
    result = finished(client, response.json()["design_id"])
    task_id = result["design_id"]
    assert client.post(f"/api/cad/designs/{task_id}/confirm", json={"digest": "old"}).status_code == 409
    confirmed = client.post(f"/api/cad/designs/{task_id}/confirm", json={"digest": result["digest"]})
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "confirmed"
    revised = client.post(f"/api/cad/designs/{task_id}/revisions", json={"prompt": "还没有确认的新需求"})
    assert revised.status_code == 202
    new = finished(client, revised.json()["design_id"])
    assert new["parent_id"] == task_id
    assert new["status"] == "needs_input"
    assert not new.get("confirmed_by")
