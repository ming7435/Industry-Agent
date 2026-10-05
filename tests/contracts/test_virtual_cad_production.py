"""实际 CAD API → 临时 HTTP 工厂 → 虚拟加工执行器，不访问运行产线。"""

import importlib.util
import os
from pathlib import Path
from http.server import ThreadingHTTPServer
from threading import Thread
import time
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app
from app.agents.cad.manufacturing_client import FactoryProductionClient


@pytest.fixture
def local_pair(tmp_path, monkeypatch):
    source = Path(os.environ.get("VIRTUAL_FACTORY_SOURCE", "C:/Users/12587/Desktop/Factory"))
    assert (source / "server.py").is_file(), "跨服务验证需本地 Factory 源码，可用 VIRTUAL_FACTORY_SOURCE 指定；不下载替代代码"
    monkeypatch.syspath_prepend(str(source))
    spec = importlib.util.spec_from_file_location("isolated_factory_cad_contract", source / "server.py")
    factory_api = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(factory_api)
    store = factory_api.ProductionStore(tmp_path / "factory-production", factory_api.VirtualFactory())
    factory_api.production, factory_api.factory = store, store.factory
    writes = []

    class Handler(factory_api.AppHandler):
        def do_POST(self):
            writes.append(self.path)
            super().do_POST()

    http = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    Thread(target=http.serve_forever, daemon=True).start()
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.setenv("PYTHON_DOTENV_DISABLED", "1")
    monkeypatch.setenv("AGENT_API_TOKEN", "")
    monkeypatch.setenv("FACTORY_API_BASE_URL", "http://127.0.0.1:9")
    from app.config import get_settings
    get_settings.cache_clear()
    app = create_app(SimpleNamespace(container=SimpleNamespace()))
    app.state.cad_modeling_root = tmp_path / "designs"
    app.state.isolated_factory_api = factory_api
    try:
        with TestClient(app) as client:
            response = client.post("/api/cad/designs", json={"name": "套筒", "material": "C45", "technical_requirements": "按确认尺寸加工",
                "spec": {"units": "mm", "operations": [{"type": "cylinder", "diameter": 30, "length": 50},
                    {"type": "cylinder", "diameter": 10, "length": 50, "mode": "cut"}]}})
            assert response.status_code == 202, response.text
            design_id = response.json()["design_id"]
            deadline = time.monotonic() + 80
            while time.monotonic() < deadline:
                design = client.get(f"/api/cad/designs/{design_id}").json()
                if design["status"] == "ready":
                    break
                assert design["status"] not in {"failed", "needs_input"}, design
                time.sleep(0.1)
            assert design["status"] == "ready"
            assert client.post(f"/api/cad/designs/{design_id}/confirm", json={"digest": design["digest"]}).status_code == 200
            payload = {"command_id": "prepare-contract", "design_digest": design["digest"], "device_id": "TRAK-TC820LTYSI-001", "postprocessor": "virtual-trak-turning-v1",
                "stock_diameter_mm": 34, "stock_length_mm": 70, "grip_length_mm": 20, "clearance_mm": 2, "pass_depth_mm": 1,
                "spindle_rpm": 1200, "feed_mm_per_rev": 0.1, "tolerance_mm": 0.02, "tool_id": 1, "drill_tool_id": 2, "drill_diameter_mm": 10}
            prepared = client.post(f"/api/cad/designs/{design_id}/manufacturing", json=payload)
            assert prepared.status_code == 201, prepared.text
            program = prepared.json()
            app.state.cad_manufacturing_service.factory = FactoryProductionClient(f"http://127.0.0.1:{http.server_port}")
            yield client, store, program, writes
    finally:
        http.shutdown()
        http.server_close()
        store.close()
        get_settings.cache_clear()


def test_actual_cad_http_execution_fault_pause_manual_resume_complete(local_pair):
    client, store, program, writes = local_pair
    base = f"/api/cad/designs/{program['design_id']}/manufacturing/{program['program_id']}"
    assert client.get("/api/cad/designs/status").json()["production_connected"] is True
    assert writes == []  # 建模、下载及能力探测绝不自动下发。
    command = {"command_id": "production-contract", "digest": program["digest"], "acknowledge_simulation_only": True}
    result = client.post(base + "/dispatch", json=command)
    assert result.status_code == 200, result.text
    assert result.json()["status"] == "running", result.text
    job_id = result.json()["job"]["job_id"]
    assert writes == ["/api/production/jobs", f"/api/production/jobs/{job_id}/start"]
    repeat = client.post(base + "/dispatch", json=command)
    assert repeat.status_code == 200
    assert len(writes) == 2
    store.tick(1)
    running = client.get(base + "/production").json()
    assert 0 < running["job"]["progress"] < 1
    assert running["job"]["executed_points"] > 0
    device = next(device for device in store.factory.devices.values() if device.device_id != "TRAK-TC820LTYSI-001")
    device.status = "stopped"  # 只改变临时模拟器；不调用真实控制接口。
    store.tick(1)
    assert client.get(base + "/production").json()["status"] == "paused"
    paused_time = store.get(job_id)["elapsed_seconds"]
    device.status = "running"
    store.tick(10)
    assert store.get(job_id)["status"] == "paused"
    assert store.get(job_id)["elapsed_seconds"] == paused_time
    client.get(base + "/production")
    assert len(writes) == 2
    command["command_id"] = "human-resume"
    resumed = client.post(base + "/dispatch", json=command)
    assert resumed.status_code == 200, resumed.text
    assert resumed.json()["status"] == "running", resumed.text
    assert len(writes) == 3
    store.tick(program["program"]["simulation"]["duration_seconds"])
    completed = client.get(base + "/production").json()
    assert completed["status"] == "completed"
    assert completed["job"]["progress"] == 1
    assert completed["job"]["simulated_volume_mm3"] == pytest.approx(program["program"]["simulation"]["expected_volume_mm3"])
    assert len(writes) == 3


def test_received_job_reconciliation_never_automatically_starts(local_pair):
    client, store, program, writes = local_pair
    service = client.app.state.cad_manufacturing_service
    base = f"/api/cad/designs/{program['design_id']}/manufacturing/{program['program_id']}"
    with service.lock:
        record = service._load(program["design_id"], program["program_id"])
        record.update(status="uncertain", factory_command_id=f"{program['program_id']}:response-lost")
        service._save(record)
    job = store.submit(f"{program['program_id']}:response-lost", program["program"])
    reconciled = client.get(base + "/production").json()
    assert reconciled["status"] == "received"
    assert reconciled["job"]["job_id"] == job["job_id"]
    assert writes == []
    store.tick(100)
    assert store.get(job["job_id"])["status"] == "received"
    confirmed = client.post(base + "/dispatch", json={"command_id": "fresh-human-confirmation", "digest": program["digest"], "acknowledge_simulation_only": True})
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["status"] == "running", confirmed.text
    assert writes == [f"/api/production/jobs/{job['job_id']}/start"]


def test_factory_restart_requires_fresh_manual_confirmation(local_pair):
    client, store, program, writes = local_pair
    base = f"/api/cad/designs/{program['design_id']}/manufacturing/{program['program_id']}"
    payload = {"command_id": "initial-start", "digest": program["digest"], "acknowledge_simulation_only": True}
    assert client.post(base + "/dispatch", json=payload).json()["status"] == "running"
    store.tick(1)
    store.close()
    api = client.app.state.isolated_factory_api
    reopened = api.ProductionStore(store.root, store.factory)
    api.production = reopened
    try:
        state = client.get(base + "/production").json()
        assert state["status"] == "interrupted"
        reopened.tick(20)
        assert client.get(base + "/production").json()["status"] == "interrupted"
        assert len(writes) == 2
        payload["command_id"] = "after-restart-human-confirmation"
        restarted = client.post(base + "/dispatch", json=payload)
        assert restarted.status_code == 200, restarted.text
        assert restarted.json()["status"] == "running", restarted.text
        assert len(writes) == 3
        assert restarted.json()["job"]["events"][-1]["type"] == "resumed_after_restart"
    finally:
        reopened.close()


def test_workbench_http_model_files_manual_dispatch_and_execution(local_pair, monkeypatch):
    """工作台代理不能丢失模型文件、确认请求或真实工厂执行回执。"""
    import json
    import socket
    from urllib.request import Request, build_opener, ProxyHandler

    import fitz
    import uvicorn
    import monitor_web_server as monitor

    client, store, _, writes = local_pair
    listener = socket.socket()
    listener.bind(("127.0.0.1", 0))
    listener.listen(128)
    agent_port = listener.getsockname()[1]
    agent = uvicorn.Server(uvicorn.Config(client.app, host="127.0.0.1", port=agent_port,
        access_log=False, log_level="error", timeout_graceful_shutdown=3))
    agent_thread = Thread(target=lambda: agent.run(sockets=[listener]), daemon=True)
    agent_thread.start()
    workbench = ThreadingHTTPServer(("127.0.0.1", 0), monitor.MonitorRequestHandler)
    workbench_thread = Thread(target=lambda: workbench.serve_forever(poll_interval=0.02), daemon=True)
    monkeypatch.setattr(monitor, "AGENT_SERVICE_BASE_URL", f"http://127.0.0.1:{agent_port}")
    workbench_thread.start()
    origin = f"http://127.0.0.1:{workbench.server_port}"
    opener = build_opener(ProxyHandler({}))

    def request(path, body=None):
        headers = {"Content-Type": "application/json", "Origin": origin}
        data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
        with opener.open(Request(origin + path, data=data, headers=headers), timeout=10) as response:
            return response.status, response.headers, response.read()

    def api(path, body=None):
        status, _, payload = request(path, body)
        assert status in {200, 201, 202}
        return json.loads(payload)

    try:
        deadline = time.monotonic() + 10
        while not agent.started and time.monotonic() < deadline:
            assert agent_thread.is_alive(), "临时 Agent HTTP 服务提前退出"
            time.sleep(0.02)
        assert agent.started
        assert request("/")[0] == 200
        assert api("/api/cad/designs/status")["production_connected"] is True
        # 需求由工作台 HTTP 输入，不替换建模函数或几何内核。
        created = api("/api/cad/designs", {"name": "工作台圆柱验收", "prompt": "直径30mm、长度50mm的圆柱",
            "material": "C45", "technical_requirements": "仅虚拟加工验收，按明确尺寸和填写公差计算"})
        base = f"/api/cad/designs/{created['design_id']}"
        deadline = time.monotonic() + 80
        while time.monotonic() < deadline:
            design = api(base)
            if design["status"] == "ready":
                break
            assert design["status"] not in {"failed", "needs_input", "interrupted"}, design
            time.sleep(0.05)
        assert design["status"] == "ready"
        assert design["geometry"]["bounds_mm"] == pytest.approx([30, 30, 50])
        assert design["geometry"]["volume_mm3"] == pytest.approx(35342.9173529)
        assert design["geometry"]["step_roundtrip_valid"] is True
        for artifact in design["artifacts"]:
            status, headers, data = request(artifact["url"] + "?download=1")
            assert status == 200 and data
            assert "attachment" in headers["Content-Disposition"]
            assert len(data) == artifact["size"]
            if artifact["format"] == "step":
                assert b"ISO-10303-21" in data
            if artifact["format"] == "pdf":
                with fitz.open(stream=data, filetype="pdf") as document:
                    assert "工作台圆柱验收" in "".join(page.get_text() for page in document)
        assert writes == []
        assert api(base + "/confirm", {"digest": design["digest"]})["status"] == "confirmed"
        program = api(base + "/manufacturing", {"command_id": "workbench-prepare", "design_digest": design["digest"],
            "device_id": "TRAK-TC820LTYSI-001", "postprocessor": "virtual-trak-turning-v1",
            "stock_diameter_mm": 34, "stock_length_mm": 70, "grip_length_mm": 20, "clearance_mm": 2,
            "pass_depth_mm": 1, "spindle_rpm": 1200, "feed_mm_per_rev": 0.1, "tolerance_mm": 0.02, "tool_id": 1})
        program_base = base + "/manufacturing/" + program["program_id"]
        assert writes == []
        assert b"VIRTUAL ONLY" in request(program_base + "/files/nc?download=1")[2]
        assert api(program_base + "/files/package")["design_digest"] == design["digest"]
        payload = {"command_id": "workbench-manual-confirmation", "digest": program["digest"], "acknowledge_simulation_only": True}
        dispatched = api(program_base + "/dispatch", payload)
        assert dispatched["status"] == "running"
        assert len(writes) == 2
        assert api(program_base + "/dispatch", payload)["job"]["job_id"] == dispatched["job"]["job_id"]
        assert len(writes) == 2
        store.tick(program["program"]["simulation"]["duration_seconds"])
        result = api(program_base + "/production")
        assert result["status"] == "completed"
        assert result["job"]["progress"] == 1
        assert result["job"]["simulated_volume_mm3"] == pytest.approx(35342.9173529)
        assert result["job"]["result_profile"] == {"outer_diameter_mm": 30, "inner_diameter_mm": 0, "length_mm": 50}
        assert len(writes) == 2
    finally:
        workbench.shutdown()
        workbench.server_close()
        workbench_thread.join(timeout=3)
        agent.should_exit = True
        agent_thread.join(timeout=10)
        listener.close()
        assert not agent_thread.is_alive(), "临时 HTTP 服务必须退出，不影响正式端口"
