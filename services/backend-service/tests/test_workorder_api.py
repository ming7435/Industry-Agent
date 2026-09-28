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
    complete = client.post("/tools/call", json={"tool": "mark_repair_completed", "arguments": {"workorder_id": workorder_id, "feedback": {"feedback": "已更换"}, "repair_verification": {"device_recovery": {"device_id": "CNC-001", "status": "running", "alarm_code": "", "active_alarms": [], "metrics": {"spindle_vibration_rms": 0.2}, "checked_at": "2026-09-28T12:00:00Z"}}}})
    assert complete.status_code == 200
    assert complete.json()["workorder"]["repair_verification"]["source"] == "device_recovery"
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


def test_backend_quality_tool_preserves_production_metadata(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "quality-metadata.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    response = client.post(
        "/tools/call",
        json={
            "tool": "create_quality_check",
            "arguments": {
                "part_id": "PART-META-001",
                "batch_id": "BATCH-META-001",
                "production_order_id": "PO-META-001",
                "inspection_type": "part_quality",
                "risk_level": "R3",
                "result": "passed",
            },
        },
    )
    assert response.status_code == 200
    check = response.json()["quality_check"]
    assert check["batch_id"] == "BATCH-META-001"
    assert check["production_order_id"] == "PO-META-001"
    assert check["inspection_type"] == "part_quality"
    assert check["risk_level"] == "R3"

    appealed = client.post(
        "/tools/call",
        json={
            "tool": "submit_quality_appeal",
            "arguments": {
                "check_id": response.json()["quality_check_id"],
                "reason": "review",
                "applicant": "operator-1",
            },
        },
    )
    assert appealed.status_code == 200
    assert appealed.json()["appeal"]["applicant"] == "operator-1"


def test_backend_supports_explicit_deletion_for_workorders_and_reports(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "delete.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    created = client.post("/tools/call", json={"tool": "create_workorder", "arguments": {"device_id": "CNC-DELETE", "title": "待删除"}})
    assert created.status_code == 200
    workorder_id = created.json()["workorder_id"]
    deleted = client.delete(f"/api/workorders/{workorder_id}")
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True
    assert client.get(f"/api/workorders/{workorder_id}").json()["found"] is False

    report = client.post("/tools/call", json={"tool": "persist_report", "arguments": {"title": "可查看报告"}}).json()
    report_id = report["report_id"]
    detail = client.get(f"/api/reports/{report_id}")
    assert detail.status_code == 200
    assert detail.json()["report"]["report_id"] == report_id
    report_deleted = client.delete(f"/api/reports/{report_id}")
    assert report_deleted.status_code == 200
    assert report_deleted.json()["deleted"] is True
    assert client.get(f"/api/reports/{report_id}").status_code == 404


def test_backend_quality_failure_requires_rectification_reinspection_release_and_close(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "quality-loop.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    created = client.post("/tools/call", json={"tool": "create_quality_check", "arguments": {"part_id": "PART-FAIL", "result": "failed", "findings": ["尺寸超差"]}})
    assert created.status_code == 200
    check_id = created.json()["quality_check_id"]
    assert created.json()["quality_check"]["status"] == "failed"
    task = client.post("/tools/call", json={"tool": "create_closure_task", "arguments": {"quality_check_id": check_id, "title": "整改"}})
    assert task.status_code == 200
    assert client.post("/tools/call", json={"tool": "complete_closure_task", "arguments": {"task_id": task.json()["closure_task_id"], "note": "已调整"}}).status_code == 200
    reinspect = client.post("/tools/call", json={"tool": "reinspect_quality_check", "arguments": {"check_id": check_id, "passed": True, "evidence": ["复检记录"]}})
    assert reinspect.status_code == 200
    assert reinspect.json()["quality_check"]["status"] == "reinspection"
    assert client.post("/tools/call", json={"tool": "release_quality_check", "arguments": {"check_id": check_id}}).json()["quality_check"]["status"] == "released"
    closed = client.post("/tools/call", json={"tool": "close_quality_check", "arguments": {"check_id": check_id, "note": "闭环完成"}})
    assert closed.status_code == 200
    assert closed.json()["quality_check"]["status"] == "closed"
