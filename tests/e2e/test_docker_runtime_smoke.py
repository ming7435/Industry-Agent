import os
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from urllib.request import urlopen

import pytest


def _request(method: str, url: str, payload: dict | None = None) -> dict | str:
    body = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = Request(url, data=body, method=method, headers={"Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urlopen(request, timeout=45) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            value = json.loads(raw)
        except json.JSONDecodeError:
            value = {"error": raw}
        if isinstance(value, dict):
            value.setdefault("http_status", error.code)
        return value
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def _get(url: str) -> str:
    value = _request("GET", url)
    return json.dumps(value, ensure_ascii=False) if isinstance(value, dict) else str(value)


@pytest.mark.skipif(os.getenv("RUN_DOCKER_E2E") != "1", reason="requires a running RC compose stack")
def test_rc_stack_health_and_monitor_frontend():
    assert '"status":"ok"' in _get(os.getenv("AGENT_HEALTH_URL", "http://127.0.0.1:8010/health")).replace(" ", "")
    assert '"status":"ok"' in _get(os.getenv("RAG_HEALTH_URL", "http://127.0.0.1:8020/health")).replace(" ", "")
    assert "document-cad-service" in _get(os.getenv("CAD_HEALTH_URL", "http://127.0.0.1:8011/health"))
    assert "<!doctype html" in _get(os.getenv("MONITOR_URL", "http://127.0.0.1:8001/")).lower()


@pytest.mark.skipif(os.getenv("RUN_DOCKER_E2E") != "1", reason="requires a running five-service compose stack")
def test_five_service_runtime_business_closure():
    agent = os.getenv("AGENT_BASE_URL", "http://127.0.0.1:8010")
    backend = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:8030")
    rag = os.getenv("RAG_BASE_URL", "http://127.0.0.1:8020")
    cad = os.getenv("CAD_BASE_URL", "http://127.0.0.1:8011")
    model = os.getenv("MODEL_BASE_URL", "http://127.0.0.1:8040")

    model_health = _request("GET", model + "/health")
    backend_health = _request("GET", backend + "/health")
    cad_health = _request("GET", cad + "/health")
    assert model_health["provider"] == "fake"
    assert backend_health["ready"] is True
    assert "mysql" in str(backend_health["dependencies"]).lower()
    assert "demo" not in str(cad_health.get("backend", "")).lower()

    seeded = _request("POST", rag + "/documents/upsert", {
        "document_id": "E2E-KNOWLEDGE-001",
        "content": "主轴振动报警 E102 时，应检查主轴轴承、温度传感器和装配关系。",
        "collection": "maint_fault_events",
        "metadata": {"source_name": "e2e-manual", "corpus": "cases", "alarm_code": "E102"},
    })
    assert seeded["success"] is True
    assert seeded["pipeline_ready"] is True
    assert not seeded.get("degraded", False)

    event = {"event_id": "E2E-FIVE-SERVICE-001", "device_id": "CNC-E2E-001", "alarm_code": "E102", "event_type": "alarm", "abnormal_metrics": {"vibration_rms": 8.1}}
    first = _request("POST", agent + "/api/v1/agent/event", {"event": event})
    second = _request("POST", agent + "/api/v1/agent/event", {"event": event})
    assert first["task_id"] == second["task_id"]
    assert first["runtime_result"]["status"] == "completed"
    assert first["status"] == "waiting_repair"
    assert not any(item.get("degraded") for item in first.get("trace", []) if isinstance(item, dict))
    trace_events = {item.get("event") for item in first.get("trace", [])}
    assert {"planner_start", "planner_end", "capability_selected", "action_selected", "execution_start", "execution_end", "evidence_added", "evaluation_result", "loop_continue", "loop_stop"} <= trace_events

    orders = _request("POST", backend + "/tools/call", {"tool": "list_workorders", "arguments": {"device_id": "CNC-E2E-001"}})
    assert orders["total"] == 1
    order = orders["items"][0]
    workorder_id = order["workorder_id"]
    assert _request("GET", backend + "/api/workorders/" + workorder_id)["workorder_id"] == workorder_id
    denied = _request("POST", backend + "/tools/call", {"tool": "close_workorder", "arguments": {"workorder_id": workorder_id}})
    assert denied.get("detail") or denied.get("error") or denied.get("success") is False

    completed = _request("POST", agent + "/api/v1/workorders/%s/complete" % workorder_id, {"feedback": "更换主轴轴承并复测", "verification": {"passed": True, "method": "vibration_retest"}})
    assert completed["status"] == "completed"
    closed = _request("POST", agent + "/api/workorders/%s/action" % workorder_id, {"action": "close", "feedback": "维修验证通过"})
    assert closed["status"] == "closed"
    assert closed["learning_loop"]["status"] == "completed"
    assert closed["memory_result"]["experience"]["memory_saved"] is True
    assert closed["memory_result"]["experience"]["rag_saved"] is True
    assert closed["report"]["persisted"] is True

    repeated = _request("POST", agent + "/api/workorders/%s/action" % workorder_id, {"action": "close", "feedback": "重复关闭"})
    assert repeated["status"] == "closed"
    reports = _request("POST", backend + "/tools/call", {"tool": "list_reports", "arguments": {"workorder_id": workorder_id}})
    assert reports["count"] == 1
