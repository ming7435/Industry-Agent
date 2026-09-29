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
    assigned = client.post("/tools/call", json={"tool": "assign_workorder", "arguments": {"workorder_id": workorder_id, "assignee": "TECH-001"}})
    assert assigned.status_code == 200
    complete = client.post("/tools/call", json={"tool": "mark_repair_completed", "arguments": {"workorder_id": workorder_id, "feedback": {"feedback": "已更换"}, "repair_verification": {"device_recovery": {"device_id": "CNC-001", "status": "running", "alarm_code": "", "active_alarms": [], "metrics": {"spindle_vibration_rms": 0.2}, "checked_at": "2026-09-28T12:00:00Z"}}}})
    assert complete.status_code == 200
    assert complete.json()["workorder"]["repair_verification"]["source"] == "device_recovery"
    closed = client.post("/tools/call", json={"tool": "close_workorder", "arguments": {"workorder_id": workorder_id}})
    assert closed.status_code == 200
    assert closed.json()["workorder"]["status"] == "closed"


def test_backend_idempotency_key_rejects_changed_parameters(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "idempotency-conflict.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)
    first = client.post("/tools/call", json={"tool": "create_workorder", "arguments": {"device_id": "CNC-1", "title": "主轴", "idempotency_key": "event:conflict"}})
    changed = client.post("/tools/call", json={"tool": "create_workorder", "arguments": {"device_id": "CNC-1", "title": "冷却", "idempotency_key": "event:conflict"}})

    assert first.status_code == 200
    assert changed.status_code == 409
    assert "幂等键" in changed.json()["detail"]


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


def test_backend_qms_rejects_partial_and_unknown_part_payloads(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "qms-identity.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    known = client.post(
        "/tools/call",
        json={"tool": "get_production_part", "arguments": {"part": {"part_id": "PART-001"}}},
    ).json()
    assert known["found"] is True
    assert known["part"]["part_no"] == "SPINDLE-HOUSING-001"
    assert known["part"]["measurements"]

    unknown = client.post(
        "/tools/call",
        json={"tool": "get_production_part", "arguments": {"part": {"part_id": "PART-UNKNOWN"}}},
    ).json()
    assert unknown["found"] is False
    assert unknown["part"] == {}


def test_backend_qms_partial_checks_are_not_qualified(tmp_path, monkeypatch):
    from app.quality.inspection import PartInspectionService

    service = PartInspectionService()
    material = service.call("inspect_part_material", part={"material": {"grade": "45钢"}}, specifications={})
    function = service.call("inspect_part_function", part={"function": {"rotation_test": True}}, specifications={})
    appearance = service.call("inspect_part_appearance", part={"appearance": {"scratch": False}})

    assert material["status"] == "not_tested"
    assert function["status"] == "not_tested"
    assert appearance["status"] == "not_tested"


def test_backend_unstructured_quality_evidence_is_not_qualified(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "quality-evidence.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    response = client.post("/tools/call", json={"tool": "create_quality_check", "arguments": {"part_id": "PART-EVIDENCE", "result": "passed", "evidence": [{"note": "看起来正常"}]}})

    assert response.status_code == 200
    assert response.json()["quality_check"]["result"] == "pending"
    assert response.json()["quality_check"]["status"] == "open"


def test_backend_demo_operational_records_are_explicitly_marked(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "demo-markers.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    technician = client.post("/tools/call", json={"tool": "query_technicians", "arguments": {}}).json()
    production = client.post("/tools/call", json={"tool": "get_production_status", "arguments": {"device_id": "CNC-001"}}).json()
    part = client.post("/tools/call", json={"tool": "get_production_part", "arguments": {"part_id": "PART-001"}}).json()

    assert technician["synthetic"] is True
    assert technician["items"][0]["synthetic"] is True
    assert production["synthetic"] is True
    assert part["synthetic"] is True


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


def test_backend_reinspection_waits_for_all_rectification_tasks(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "quality-multi-loop.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    created = client.post("/tools/call", json={"tool": "create_quality_check", "arguments": {"part_id": "PART-MULTI", "result": "failed"}}).json()
    check_id = created["quality_check_id"]
    first = client.post("/tools/call", json={"tool": "create_closure_task", "arguments": {"quality_check_id": check_id, "title": "整改一"}}).json()
    second = client.post("/tools/call", json={"tool": "create_closure_task", "arguments": {"quality_check_id": check_id, "title": "整改二"}}).json()
    client.post("/tools/call", json={"tool": "complete_closure_task", "arguments": {"task_id": first["closure_task_id"]}})

    assert client.post("/tools/call", json={"tool": "reinspect_quality_check", "arguments": {"check_id": check_id, "passed": True, "evidence": [{"id": "E-1"}]}}).status_code == 409
    client.post("/tools/call", json={"tool": "complete_closure_task", "arguments": {"task_id": second["closure_task_id"]}})
    assert client.post("/tools/call", json={"tool": "reinspect_quality_check", "arguments": {"check_id": check_id, "passed": True, "evidence": [{"id": "E-1"}]}}).status_code == 200


def test_backend_approved_quality_appeal_enters_rectification_workflow(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "quality-appeal-loop.sqlite3"))
    import app.main as main
    main._service = None
    client = TestClient(app)

    created = client.post("/tools/call", json={"tool": "create_quality_check", "arguments": {"part_id": "PART-APPEAL", "result": "failed"}}).json()
    check_id = created["quality_check_id"]
    appeal = client.post("/tools/call", json={"tool": "submit_quality_appeal", "arguments": {"check_id": check_id, "reason": "补充证据"}}).json()
    resolved = client.post("/tools/call", json={"tool": "resolve_quality_appeal", "arguments": {"check_id": check_id, "appeal_id": appeal["appeal"]["appeal_id"], "decision": "approved"}})

    assert resolved.status_code == 200
    assert resolved.json()["quality_check"]["status"] == "rectification"


def test_backend_repair_verification_rejects_expired_snapshot_and_has_no_health_score_threshold(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "verification-freshness.sqlite3"))
    from app.workorder.service import BackendBusinessService

    order = {"workorder_id": "WO-FRESH", "device_id": "D-FRESH"}
    expired = BackendBusinessService._build_repair_verification(order, {
        "device_id": "D-FRESH", "status": "running", "active_alarms": [],
        "metrics": {"vibration": 0.2}, "checked_at": "2026-09-28T12:00:00Z",
        "expires_at": "2026-09-28T12:01:00Z", "health_score": 1,
    }, {})
    assert expired["passed"] is False
    assert "recovery_fresh" in expired["validation_findings"]

    current = BackendBusinessService._build_repair_verification(order, {
        "device_id": "D-FRESH", "status": "running", "active_alarms": [],
        "metrics": {"vibration": 0.2}, "checked_at": "2099-09-28T12:00:00Z", "health_score": 1,
    }, {})
    assert current["passed"] is True
