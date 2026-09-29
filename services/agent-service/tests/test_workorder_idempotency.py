import pytest


def test_workorder_create_is_idempotent_by_key(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    first = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-1", event_id="EVT-1")
    second = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-1", event_id="EVT-1")
    assert first["workorder_id"] == second["workorder_id"]
    assert len(adapter.orders) == 1


def test_workorder_idempotency_key_cannot_be_reused_for_different_parameters(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-CONFLICT", event_id="EVT-CONFLICT")

    with pytest.raises(ValueError, match="幂等键"):
        adapter.create_workorder("D-1", "different fault", idempotency_key="monitor:EVT-CONFLICT", event_id="EVT-CONFLICT")


def test_auto_workorder_keeps_diagnosis_and_plan_snapshots(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    order = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3")).create_workorder(
        "D-1", "fault", idempotency_key="monitor:EVT-2", event_id="EVT-2",
        diagnosis_snapshot={"fault": "f"}, maintenance_plan_snapshot={"repair_steps": ["replace"]},
    )
    assert order["event_id"] == "EVT-2"
    assert order["idempotency_key"] == "monitor:EVT-2"
    assert order["diagnosis_snapshot"]["fault"] == "f"
    assert order["maintenance_plan_snapshot"]["repair_steps"] == ["replace"]


def test_close_requires_completed_workorder(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    order = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-3")
    with pytest.raises(ValueError, match="completed"):
        adapter.close_workorder(order["workorder_id"])


def test_repeated_close_returns_the_same_closed_workorder(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    order = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-4")
    adapter.assign_workorder(order["workorder_id"], "TECH-001")
    adapter.mark_repair_completed(order["workorder_id"], {"feedback": "fixed"}, {"device_recovery": {"device_id": "D-1", "status": "running", "active_alarms": [], "metrics": {"ok": True}, "checked_at": "2026-09-28T12:00:00Z"}})
    first = adapter.close_workorder(order["workorder_id"])
    second = adapter.close_workorder(order["workorder_id"])

    assert second["workorder_id"] == first["workorder_id"]
    assert second["status"] == "closed"
    assert len([event for event in second["events"] if event["to_status"] == "closed"]) == 1


def test_close_requires_explicit_repair_verification(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    order = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-5")
    adapter.assign_workorder(order["workorder_id"], "TECH-001")
    with pytest.raises(ValueError, match="设备恢复数据"):
        adapter.mark_repair_completed(order["workorder_id"], {"feedback": "fixed"})

    completed = adapter.mark_repair_completed(
        order["workorder_id"], {"feedback": "fixed"}, {"device_recovery": {"device_id": "D-1", "status": "running", "active_alarms": [], "metrics": {"ok": True}, "checked_at": "2026-09-28T12:00:00Z"}}
    )
    assert completed["status"] == "completed"
    assert adapter.close_workorder(order["workorder_id"])["status"] == "closed"


def test_failed_repair_verification_cannot_close_or_learn(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter
    from app.workorder.validator import WorkOrderValidator

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    order = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-6")
    adapter.assign_workorder(order["workorder_id"], "TECH-001")
    with pytest.raises(ValueError, match="设备恢复数据"):
        adapter.mark_repair_completed(
            order["workorder_id"], {"feedback": "still abnormal"}, {"passed": False, "status": "failed"}
        )
    assert not WorkOrderValidator.can_learn(
        {"status": "closed", "repair_feedback": {"feedback": "still abnormal"}, "repair_verification": {"passed": False}},
        {"feedback": "still abnormal"},
    )
