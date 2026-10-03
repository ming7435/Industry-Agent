"""正式故障入口、两种有界重规划与真实业务闭环。"""
import pytest
from formal_lifecycle_adapter import build_lifecycle


def test_full_evidence_driven_runtime_lifecycle(tmp_path, monkeypatch):
    runtime, event, rag, backend, factory = build_lifecycle(tmp_path, monkeypatch, review=True, missing_stock_once=True)
    state = runtime.run_abnormal_event(event)
    assert state["runtime_result"]["status"] == "completed", state["runtime_result"]
    order = state["workorder"]["workorder"]
    order_id = order["workorder_id"]
    operations = runtime.container.operations
    assert order["status"] == "in_progress" and order["assignee"] == backend.actor_id
    assert len(runtime.test_model.calls) == 5
    assert len([call for call in runtime.test_boundary.calls if call[1] == "query_inventory"]) == 2
    assert len([call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]) == 1
    assert rag.upserts == [] and runtime.container.long_memory.recent() == []
    assert not list(runtime.container.registry.report_store.values())
    assert not operations.execute_workorder("close", {"workorder_id": order_id})["success"]
    with pytest.raises(PermissionError):
        operations.execute_workorder("mark_repair_completed", {"workorder_id": order_id, "feedback": "已维修"}, actor_id="OTHER")
    assert not [call for call in factory.calls if call[1] == "start"]
    stale = {"device_id": "WRONG-DEVICE", "status": "running", "checked_at": "2000-01-01T00:00:00Z", "metrics": {"pressure": 1}}
    completed = operations.execute_workorder("mark_repair_completed", {
        "workorder_id": order_id, "repair_feedback": {"feedback": "检修完成，已排除故障"},
        "repair_verification": {"passed": True, "device_recovery": stale},
    }, actor_id=backend.actor_id)
    assert completed["machine_control"]["state"] == "running"
    assert completed["workorder"]["status"] == "completed"
    verification = completed["workorder"]["repair_verification"]
    assert verification["phase"] == "poststart"
    assert verification["device_recovery"]["checked_at"] != stale["checked_at"]
    assert verification["device_recovery"]["device_id"] == event["device_id"]
    assert all(verification["checks"].values())
    assert rag.upserts == [] and not list(runtime.container.registry.report_store.values())
    closed = operations.execute_workorder("close", {"workorder_id": order_id})
    assert closed["workorder"]["status"] == "closed"
    assert closed["learning_loop"]["status"] == "completed", closed
    assert closed["learning_loop"]["stages"] == ["memory", "rag", "report"]
    assert closed["memory_result"]["experience"]["rag_saved"] is True
    experience = closed["memory_result"]["experience"]
    retrieved = operations.execute_memory("search", {"device_id": event["device_id"], "query": "检修"})
    assert retrieved["success"] and retrieved["items"][0]["experience_id"] == experience["experience_id"]
    assert retrieved["items"][0]["source_workorder"] == order_id
    assert rag.store.get(experience["experience_id"])["metadata"]["source_workorder"] == order_id
    assert closed["report"]["report_type"] == "full_case_report" and closed["report"]["persisted"]
    assert len(rag.upserts) == len(list(runtime.container.registry.report_store.values())) == 1
    events = {item["event"] for item in state["trace"]}
    assert {"evaluation_result", "execution_start", "execution_end", "replan"} <= events
