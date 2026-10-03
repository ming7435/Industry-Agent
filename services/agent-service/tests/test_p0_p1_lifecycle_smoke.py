"""故障闭环烟测：真实 Backend 进程、Memory/RAG 存储和 Report Agent。"""
from formal_lifecycle_adapter import build_lifecycle


def test_event_to_closed_case_smoke(tmp_path, monkeypatch):
    runtime, event, rag, backend, factory = build_lifecycle(tmp_path, monkeypatch,
        device_id="D-SMOKE-1", event_id="EVT-SMOKE-1")
    state = runtime.run_abnormal_event(event)
    assert state["runtime_result"]["status"] == "completed", state["runtime_result"]
    agents = [item["agent"] for item in state["completed_steps"]]
    assert agents == ["diagnosis", "knowledge", "cad", "maintenance", "workorder"]
    order_id = state["workorder"]["workorder_id"]
    operations = runtime.container.operations
    assert state["workorder"]["status"] == "in_progress"
    assert not rag.upserts and not list(runtime.container.registry.report_store.values())
    completed = operations.execute_workorder("mark_repair_completed", {
        "workorder_id": order_id, "repair_feedback": {"feedback": "检修完成，故障已排除"},
    }, actor_id=backend.actor_id)
    assert completed["workorder"]["status"] == "completed"
    assert completed["machine_control"]["state"] == "running"
    assert completed["workorder"]["repair_verification"]["phase"] == "poststart"
    assert sorted(factory.calls) == sorted([
        ("D-SMOKE-1", "emergency_stop"), ("D-LINE-PEER", "emergency_stop"),
        ("D-SMOKE-1", "start"), ("D-LINE-PEER", "start"),
    ])
    closed = operations.execute_workorder("close", {"workorder_id": order_id})
    assert closed["workorder"]["status"] == "closed"
    assert closed["learning_loop"]["stages"] == ["memory", "rag", "report"]
    assert closed["learning_loop"]["status"] == "completed", closed
    assert closed["memory_result"]["experience"]["rag_saved"] is True
    report = closed["report"]
    assert report["report_type"] == "full_case_report" and report["status"] == "completed" and report["persisted"]
    experience_id = closed["memory_result"]["experience"]["experience_id"]
    document = rag.store.get(experience_id)
    assert document["metadata"]["source_workorder"] == order_id
    assert document["metadata"]["source_event_id"] == "EVT-SMOKE-1"
    assert rag.store.search("检修", filters={"device_id": "D-SMOKE-1"})[0]["metadata"]["document_id"] == experience_id
    retrieved = operations.execute_memory("search", {"device_id": "D-SMOKE-1", "query": "检修"})
    assert retrieved["success"] and retrieved["items"][0]["experience_id"] == experience_id
    repeat = operations.execute_workorder("close", {"workorder_id": order_id})
    assert repeat["report"]["report_id"] == report["report_id"]
    assert len(rag.upserts) == len(list(runtime.container.registry.report_store.values())) == 1
