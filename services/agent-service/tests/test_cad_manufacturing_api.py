"""加工 API 必须实际验证设计版本、工艺及超时，不调用正式工厂。"""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import time
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app


def setup_payload(digest):
    return {
        "command_id": "prepare-one", "design_digest": digest,
        "device_id": "TRAK-TC820LTYSI-001", "postprocessor": "virtual-trak-turning-v1",
        "stock_diameter_mm": 34, "stock_length_mm": 70, "grip_length_mm": 20,
        "clearance_mm": 2, "pass_depth_mm": 1, "spindle_rpm": 1200,
        "feed_mm_per_rev": 0.1, "tolerance_mm": 0.02, "tool_id": 1,
        "drill_tool_id": 2, "drill_diameter_mm": 10,
    }


@pytest.fixture
def designed(tmp_path):
    app = create_app(SimpleNamespace(container=SimpleNamespace()))
    app.state.cad_modeling_root = tmp_path / "cad"
    with TestClient(app) as client:
        body = {"name": "套筒", "material": "C45", "technical_requirements": "按确认尺寸加工",
            "spec": {"units": "mm", "operations": [
                {"type": "cylinder", "diameter": 30, "length": 50},
                {"type": "cylinder", "diameter": 10, "length": 50, "mode": "cut"}]}}
        response = client.post("/api/cad/designs", json=body)
        assert response.status_code == 202
        identifier = response.json()["design_id"]
        deadline = time.monotonic() + 80
        while time.monotonic() < deadline:
            design = client.get(f"/api/cad/designs/{identifier}").json()
            if design["status"] == "ready":
                break
            assert design["status"] not in {"failed", "needs_input"}, design
            time.sleep(0.1)
        assert design["status"] == "ready"
        yield client, app, design


def confirm(client, design):
    response = client.post(f"/api/cad/designs/{design['design_id']}/confirm", json={"digest": design["digest"]})
    assert response.status_code == 200


def prepare(client, design):
    return client.post(f"/api/cad/designs/{design['design_id']}/manufacturing", json=setup_payload(design["digest"]))


def test_manufacturing_requires_confirmed_design(designed):
    client, _, design = designed
    assert prepare(client, design).status_code == 409


def test_real_model_generates_bound_program_and_verified_downloads(designed):
    client, _, design = designed
    confirm(client, design)
    response = prepare(client, design)
    assert response.status_code == 201, response.text
    program = response.json()
    assert program["program"]["simulation_only"] is True
    assert program["program"]["design_digest"] == design["digest"]
    assert program["program"]["simulation"]["simulated_volume_mm3"] == pytest.approx(31415.9265359)
    assert program["status"] == "prepared"
    base = f"/api/cad/designs/{design['design_id']}/manufacturing/{program['program_id']}"
    download = client.get(base + "/files/nc?download=1")
    assert download.status_code == 200
    assert "attachment" in download.headers["content-disposition"]
    assert b"VIRTUAL ONLY" in download.content
    assert client.get(base + "/files/package").json()["design_id"] == design["design_id"]
    listing = client.get(f"/api/cad/designs/{design['design_id']}/manufacturing").json()
    assert [item["program_id"] for item in listing["items"]] == [program["program_id"]]


def test_machining_parameters_change_cannot_reuse_command(designed):
    client, _, design = designed
    confirm(client, design)
    first, second = prepare(client, design), prepare(client, design)
    assert first.status_code == second.status_code == 201
    assert first.json()["program_id"] == second.json()["program_id"]
    changed = setup_payload(design["digest"])
    changed["spindle_rpm"] = 1300
    assert client.post(f"/api/cad/designs/{design['design_id']}/manufacturing", json=changed).status_code == 409


def test_program_confirmation_and_artifact_integrity_are_separate(designed):
    client, app, design = designed
    confirm(client, design)
    value = prepare(client, design)
    assert value.status_code == 201
    program = value.json()
    base = f"/api/cad/designs/{design['design_id']}/manufacturing/{program['program_id']}"
    assert client.post(base + "/dispatch", json={"command_id": "dispatch-one", "digest": program["digest"], "acknowledge_simulation_only": False}).status_code == 422
    assert client.post(base + "/dispatch", json={"command_id": "dispatch-one", "digest": "a" * 64, "acknowledge_simulation_only": True}).status_code == 409
    nc = app.state.cad_manufacturing_service.file(design["design_id"], program["program_id"], "nc")[0]
    nc.write_text("M3 S999999", encoding="utf-8")
    assert client.get(base + "/files/nc").status_code == 409
    assert client.post(base + "/dispatch", json={"command_id": "dispatch-one", "digest": program["digest"], "acknowledge_simulation_only": True}).status_code == 409


def test_timeout_does_not_repeat_program_write(designed):
    from app.agents.cad.manufacturing_client import FactoryProductionClient

    received = []

    class Adapter(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            if self.path.endswith("capabilities"):
                self.wfile.write(json.dumps({"ready": True, "simulation_only": True, "postprocessors": ["virtual-trak-turning-v1"]}).encode())
            else:
                self.wfile.write(b'{"found":false}')

        def do_POST(self):
            received.append(self.path)
            self.rfile.read(int(self.headers["Content-Length"]))
            self.connection.close()  # 已收到写入，但响应丢失。

        def log_message(self, *args):
            pass

    adapter = ThreadingHTTPServer(("127.0.0.1", 0), Adapter)
    Thread(target=adapter.serve_forever, daemon=True).start()
    try:
        client, app, design = designed
        confirm(client, design)
        program = prepare(client, design).json()
        app.state.cad_manufacturing_service.factory = FactoryProductionClient(f"http://127.0.0.1:{adapter.server_port}", timeout=1)
        base = f"/api/cad/designs/{design['design_id']}/manufacturing/{program['program_id']}"
        payload = {"command_id": "dispatch-one", "digest": program["digest"], "acknowledge_simulation_only": True}
        response = client.post(base + "/dispatch", json=payload)
        assert response.status_code == 200
        assert response.json()["status"] == "uncertain"
        repeat = client.post(base + "/dispatch", json=payload)
        assert repeat.status_code == 200
        assert repeat.json()["status"] == "uncertain"
        client.get(base + "/production")
        assert received == ["/api/production/jobs"]
    finally:
        adapter.shutdown()
        adapter.server_close()


@pytest.mark.parametrize("field,value", [("spindle_rpm", True), ("feed_mm_per_rev", 0), ("pass_depth_mm", -1), ("tool_id", 1.5), ("unexpected", "input")])
def test_api_rejects_invalid_machining_parameters_without_work(designed, field, value):
    client, _, design = designed
    confirm(client, design)
    body = setup_payload(design["digest"])
    body[field] = value
    response = client.post(f"/api/cad/designs/{design['design_id']}/manufacturing", json=body)
    assert response.status_code == 422
    assert client.get(f"/api/cad/designs/{design['design_id']}/manufacturing").json()["items"] == []


def test_manufacturing_routes_retain_service_authorization(designed, monkeypatch):
    from app.config import get_settings
    client, _, design = designed
    monkeypatch.setenv("AGENT_API_TOKEN", "isolated-test-service-token")
    get_settings.cache_clear()
    response = client.post(f"/api/cad/designs/{design['design_id']}/manufacturing", json=setup_payload(design["digest"]))
    assert response.status_code in {401, 403}


def test_factory_client_rejects_external_credentials_redirect_addresses():
    from app.agents.cad.manufacturing_client import FactoryProductionClient
    for address in ("https://real.example:4529", "http://192.168.1.10:4529", "http://user:secret@127.0.0.1:4529", "http://127.0.0.1:4529/other", "http://127.0.0.1:4529?key=secret"):
        with pytest.raises(ValueError):
            FactoryProductionClient(address)


def test_same_root_rejects_concurrent_manufacturing_executor_and_can_reopen(designed):
    from app.agents.cad.manufacturing_service import CADManufacturingService
    from app.agents.cad.modeling_service import CADDesignConflict
    client, app, design = designed
    confirm(client, design)
    assert prepare(client, design).status_code == 201
    original = app.state.cad_manufacturing_service
    with pytest.raises(CADDesignConflict, match="已有加工服务"):
        CADManufacturingService(app.state.cad_modeling_service, "http://127.0.0.1:9")
    original.close()
    replacement = CADManufacturingService(app.state.cad_modeling_service, "http://127.0.0.1:9")
    try:
        assert len(replacement.list(design["design_id"])) == 1
    finally:
        replacement.close()
