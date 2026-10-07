"""读取既有方案必须独立于工单派发，也不得把未验证方案变成工单。"""
from types import SimpleNamespace
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.request import urlopen
import json

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.runtime.durable_store import DurableJsonStore


def saved_pipeline(plan_id="PLAN-UNASSIGNED", device_id="M-1"):
    return {
        "event": {"event_id": "EVT-1", "event_revision": 2, "device_id": device_id, "alarm_code": "700001"},
        "task_id": "TASK-1", "trace_id": "TRACE-1", "status": "blocked", "stop_reason": "replan_limit_exceeded",
        "diagnosis": {"device_id": device_id, "alarm_code": "700001", "confidence": 0.886,
                      "evidence_status": "ready", "maintenance_required": True, "created_at": "2026-10-04T19:07:50+08:00"},
        "maintenance_plan": {
            "plan_id": plan_id, "diagnosis": {"device_id": device_id, "fault": "润滑压力未达到", "confidence": 0.886},
            "repair_steps": ["隔离电源后检查润滑油路"], "tools": ["压力表"], "parts": [],
            "safety": ["停机并断电挂牌"], "evidence": [{"type": "diagnosis", "content": "润滑压力低于阈值"}],
            "workorder_ready": False, "validation_findings": ["缺少 CAD/BOM 依据", "备件库存为演示数据"],
        },
        "workorder": {},
    }


def store_result(path, key, result, *, wrapped=True):
    value = {"_event_result_store_version": 2, "fingerprint": "test-only", "result": result} if wrapped else result
    DurableJsonStore(path).set("agent_event", key, value)


def test_plan_api_returns_persisted_unassigned_plan_and_original_blockers(tmp_path, monkeypatch):
    path = str(tmp_path / "events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    store_result(path, "event-key", saved_pipeline())
    # 空容器证明方案读取不会调用派工、模型或设备控制。
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace())))

    response = client.get("/api/maintenance/plans")

    assert response.status_code == 200
    assert response.json()["count"] == 1
    plan = response.json()["items"][0]
    assert plan["plan_id"] == "PLAN-UNASSIGNED"
    assert plan["device_id"] == "M-1"
    assert plan["alarm_code"] == "700001"
    assert plan["event_revision"] == 2
    assert plan["workorder_ready"] is False
    assert plan["validation_findings"] == ["缺少 CAD/BOM 依据", "备件库存为演示数据"]
    assert plan["stop_reason"] == "replan_limit_exceeded"
    assert plan["dispatch"]["allowed"] is False
    assert "就绪" in plan["dispatch"]["reason"]
    assert plan["evidence"] == [{"type": "diagnosis", "content": "润滑压力低于阈值"}]
    assert "workorder" not in plan


def test_plan_api_filters_device_and_does_not_fabricate_missing_plans(tmp_path, monkeypatch):
    path = str(tmp_path / "events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    store_result(path, "one", saved_pipeline("PLAN-1", "M-1"))
    store_result(path, "two", saved_pipeline("PLAN-2", "M-2"), wrapped=False)
    store_result(path, "diagnosis-only", {"diagnosis": {"device_id": "M-1", "summary": "诊断完成"}})
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace())))

    response = client.get("/api/maintenance/plans?device_id=M-2")

    assert response.status_code == 200
    assert [item["plan_id"] for item in response.json()["items"]] == ["PLAN-2"]
    assert client.get("/api/maintenance/plans").json()["count"] == 2


def test_plan_read_still_requires_configured_service_identity(tmp_path, monkeypatch):
    monkeypatch.setenv("AGENT_API_TOKEN", "test-secret")
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace())))
    assert client.get("/api/maintenance/plans").status_code == 401
    assert client.get("/api/maintenance/plans", headers={"X-API-Key": "test-secret"}).status_code == 200


def test_plan_api_keeps_real_confidence_gate_when_plan_is_structurally_ready(tmp_path, monkeypatch):
    path = str(tmp_path / "events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    pipeline = saved_pipeline()
    pipeline["diagnosis"]["confidence"] = 0.45
    pipeline["maintenance_plan"]["workorder_ready"] = True
    pipeline["maintenance_plan"]["validation_findings"] = []
    store_result(path, "low-confidence", pipeline)
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace())))

    response = client.get("/api/maintenance/plans")

    assert response.status_code == 200
    plan = response.json()["items"][0]
    assert plan["workorder_ready"] is True
    assert plan["dispatch"]["allowed"] is False
    assert "0.45" in plan["dispatch"]["reason"]


def test_saved_high_risk_plan_needs_no_manual_dispatch_approval_but_explicit_requirement_remains():
    from app.api.maintenance_plans import list_saved_maintenance_plans
    pipeline = saved_pipeline()
    pipeline.update(status="waiting_approval", stop_reason="approval_required")
    pipeline["maintenance_plan"].update(workorder_ready=True, validation_findings=[], risk_level="high")
    plan = list_saved_maintenance_plans([pipeline])["items"][0]
    assert plan["workorder_ready"] is True
    assert plan['dispatch']['allowed'] is True
    assert plan['dispatch'].get('status') != 'waiting_approval'
    pipeline['maintenance_plan']['requires_approval'] = True
    plan = list_saved_maintenance_plans([pipeline])['items'][0]
    assert plan["dispatch"]["allowed"] is False
    assert plan["dispatch"]["status"] == "waiting_approval"
    assert "审批" in plan["dispatch"]["reason"]


def test_pending_approval_does_not_hide_a_real_confidence_blocker():
    from app.api.maintenance_plans import list_saved_maintenance_plans
    pipeline = saved_pipeline()
    pipeline.update(status="waiting_approval", stop_reason="approval_required")
    pipeline["diagnosis"]["confidence"] = 0.45
    pipeline["maintenance_plan"].update(workorder_ready=True, validation_findings=[])
    plan = list_saved_maintenance_plans([pipeline])["items"][0]
    assert plan["dispatch"]["allowed"] is False
    assert "0.45" in plan["dispatch"]["reason"]
    assert plan["dispatch"].get("status") != "waiting_approval"


def test_monitor_compact_pipeline_preserves_plan_evidence_and_gate_fields():
    from monitor_web_server import compact_public_pipeline
    result = compact_public_pipeline(saved_pipeline())
    assert result["maintenance_plan"]["evidence"] == [{"type": "diagnosis", "content": "润滑压力低于阈值"}]
    assert result["maintenance_plan"]["workorder_ready"] is False
    assert result["maintenance_plan"]["validation_findings"] == ["缺少 CAD/BOM 依据", "备件库存为演示数据"]
    assert result["stop_reason"] == "replan_limit_exceeded"


def test_monitor_serves_independent_plans_through_existing_authenticated_proxy(monkeypatch):
    import monitor_web_server as monitor
    class Agent(BaseHTTPRequestHandler):
        def do_GET(self):
            assert self.path == "/api/maintenance/plans"
            assert self.headers.get("Authorization") == "Bearer test-only"
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"items": [{"plan_id": "PLAN-PROXY"}], "count": 1}).encode())
        def log_message(self, *args):
            pass
    agent = ThreadingHTTPServer(("127.0.0.1", 0), Agent)
    proxy = ThreadingHTTPServer(("127.0.0.1", 0), monitor.MonitorRequestHandler)
    monkeypatch.setattr(monitor, "AGENT_SERVICE_BASE_URL", f"http://127.0.0.1:{agent.server_port}")
    monkeypatch.setenv("AGENT_API_TOKEN", "test-only")
    for server in (agent, proxy):
        Thread(target=server.serve_forever, daemon=True).start()
    try:
        with urlopen(f"http://127.0.0.1:{proxy.server_port}/api/maintenance/plans", timeout=5) as response:
            assert response.status == 200
            assert json.load(response)["items"] == [{"plan_id": "PLAN-PROXY"}]
    finally:
        for server in (agent, proxy):
            server.shutdown()
            server.server_close()


def test_plan_api_never_decodes_unrelated_large_execution_context(tmp_path, monkeypatch):
    """巨大 Trace 不能作为方案列表的 Python JSON 输入，历史全文仍保留。"""
    path = str(tmp_path / "large-events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    pipeline = saved_pipeline()
    pipeline["trace"] = [{"context": "历史工具返回" * 200000}]
    store_result(path, "large-history", pipeline)
    decoded_sizes = []
    original_loads = json.loads

    def observed_loads(value, *args, **kwargs):
        decoded_sizes.append(len(value))
        return original_loads(value, *args, **kwargs)

    # 仅记录解析输入大小，仍调用真实 JSON 解析和实际数据库/API。
    monkeypatch.setattr(json, "loads", observed_loads)
    with TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace()))) as client:
        response = client.get("/api/maintenance/plans")
        assert response.status_code == 200
        assert response.json()["items"][0]["plan_id"] == "PLAN-UNASSIGNED"
        assert max(decoded_sizes) < 128 * 1024
    assert DurableJsonStore(path).get("agent_event", "large-history")["result"]["trace"] == pipeline["trace"]


def test_plan_api_reports_history_loading_state_without_claiming_no_plan(tmp_path, monkeypatch):
    path = str(tmp_path / "events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    store_result(path, "saved-plan", saved_pipeline())
    with TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace()))) as client:
        response = client.get("/api/maintenance/plans")
        assert response.status_code == 200
        assert response.json()["history"]["status"] == "ready"
        assert response.json()["history"]["loaded_records"] == 1
        assert response.json()["history"]["total_records"] == 1


def test_plan_history_refresh_observes_updates_from_another_store_instance(tmp_path, monkeypatch):
    import time
    path = str(tmp_path / "events.sqlite3")
    monkeypatch.setenv("EVENT_STORE_PATH", path)
    store_result(path, "event-key", saved_pipeline())
    with TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace()))) as client:
        assert client.get("/api/maintenance/plans").json()["items"][0]["workorder_ready"] is False
        changed = saved_pipeline()
        changed["maintenance_plan"]["workorder_ready"] = True
        changed["maintenance_plan"]["validation_findings"] = []
        store_result(path, "event-key", changed)
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            value = client.get("/api/maintenance/plans").json()
            if value["items"] and value["items"][0]["workorder_ready"] is True:
                break
        assert value["items"][0]["workorder_ready"] is True
        assert value["items"][0]["dispatch"]["allowed"] is True
