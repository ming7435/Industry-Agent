import os

from fastapi.testclient import TestClient

os.environ.setdefault("BACKEND_STORAGE", "sqlite")

from app.main import app


def test_workorder_verification_close_and_idempotency(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "backend.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)
    payload = {"device_id": "CNC-001", "title": "主轴异常", "idempotency_key": "e2e-1"}
    first = client.post("/tools/call", json={"tool": "create_workorder", "arguments": payload}).json()
    second = client.post("/tools/call", json={"tool": "create_workorder", "arguments": payload}).json()
    assert first["workorder_id"] == second["workorder_id"]
    workorder_id = first["workorder_id"]
    denied = client.post("/tools/call", json={"tool": "close_workorder", "arguments": {"workorder_id": workorder_id}})
    assert denied.status_code == 409
    complete = client.post("/tools/call", json={"tool": "mark_repair_completed", "arguments": {"workorder_id": workorder_id, "feedback": {"feedback": "已更换"}, "repair_verification": {"passed": True}}})
    assert complete.status_code == 200
    closed = client.post("/tools/call", json={"tool": "close_workorder", "arguments": {"workorder_id": workorder_id}})
    assert closed.status_code == 200
    assert closed.json()["workorder"]["status"] == "closed"


def test_backend_quality_closure_audit_and_report_are_persisted(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "business.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)
    quality = client.post("/tools/call", json={"tool": "create_quality_check", "arguments": {"part_id": "PART-001", "result": "passed"}})
    assert quality.status_code == 200
    check_id = quality.json()["quality_check_id"]
    assert client.post("/tools/call", json={"tool": "submit_quality_appeal", "arguments": {"check_id": check_id, "reason": "复核"}}).status_code == 200
    closure = client.post("/tools/call", json={"tool": "create_closure_task", "arguments": {"workorder_id": "WO-Q-1", "quality_check_id": check_id}})
    assert closure.status_code == 200
    task_id = closure.json()["closure_task_id"]
    assert client.post("/tools/call", json={"tool": "complete_closure_task", "arguments": {"task_id": task_id, "note": "已整改"}}).status_code == 200
    report = client.post("/tools/call", json={"tool": "persist_report", "arguments": {"workorder_id": "WO-Q-1", "report_type": "quality_report"}}).json()
    assert client.post("/tools/call", json={"tool": "list_audit_logs", "arguments": {}}).json()["count"] >= 2
    assert client.post("/tools/call", json={"tool": "get_report", "arguments": {"report_id": report["report_id"]}}).json()["found"] is True


def test_backend_qms_part_inspection_is_deterministic(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "qms.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)
    part = client.post("/tools/call", json={"tool": "get_production_part", "arguments": {"part_id": "PART-001"}}).json()["part"]
    result = client.post("/tools/call", json={"tool": "inspect_part_dimensions", "arguments": {"part": part}}).json()
    assert result["passed"] is True
