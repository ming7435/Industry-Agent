def test_workorder_create_is_idempotent_by_key():
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter()
    first = adapter.create_workorder(
        "D-1",
        "fault",
        idempotency_key="monitor:EVT-1",
        event_id="EVT-1",
    )
    second = adapter.create_workorder(
        "D-1",
        "fault",
        idempotency_key="monitor:EVT-1",
        event_id="EVT-1",
    )

    assert first["workorder_id"] == second["workorder_id"]
    assert len(adapter.orders) == 1


def test_auto_workorder_keeps_diagnosis_and_plan_snapshots():
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter()
    order = adapter.create_workorder(
        "D-1",
        "fault",
        idempotency_key="monitor:EVT-2",
        event_id="EVT-2",
        diagnosis_snapshot={"fault": "f"},
        maintenance_plan_snapshot={"repair_steps": ["replace"]},
    )

    assert order["event_id"] == "EVT-2"
    assert order["idempotency_key"] == "monitor:EVT-2"
    assert order["diagnosis_snapshot"]["fault"] == "f"
    assert order["maintenance_plan_snapshot"]["repair_steps"] == ["replace"]
