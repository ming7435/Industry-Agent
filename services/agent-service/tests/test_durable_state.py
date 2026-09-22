def test_event_results_survive_store_reconstruction(tmp_path):
    from app.runtime.event_store import EventResultStore

    path = str(tmp_path / "events.sqlite3")
    first = EventResultStore(path=path)
    value = first.get_or_create("EVT-DURABLE", lambda: {"task_id": "TASK-1", "status": "waiting_repair"})
    second = EventResultStore(path=path)

    assert second.get_or_create("EVT-DURABLE", lambda: {"task_id": "TASK-2"}) == value


def test_workorders_survive_adapter_reconstruction_and_keep_idempotency(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    path = str(tmp_path / "workorders.sqlite3")
    first = WorkOrderMcpAdapter(path=path)
    created = first.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-DURABLE")
    second = WorkOrderMcpAdapter(path=path)
    duplicate = second.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-DURABLE")

    assert duplicate["workorder_id"] == created["workorder_id"]
    assert second.get_workorder(created["workorder_id"])["status"] == "open"
    assert len(second.orders) == 1
