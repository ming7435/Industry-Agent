from app.agents.memory.validator import MemoryAgentValidator
from app.closure import ClosureService
from app.mcp.workorder import WorkOrderMcpAdapter
from app.workorder.validator import WorkOrderValidator


def test_workorder_completion_keeps_feedback_and_verification():
    adapter = WorkOrderMcpAdapter()
    created = adapter.create_workorder(device_id="D-001", title="主轴异常")

    completed = adapter.mark_repair_completed(
        created["workorder_id"],
        {"feedback": "更换主轴轴承", "operator": "TECH-001"},
        {"passed": True, "status": "verified"},
    )
    closed = adapter.close_workorder(created["workorder_id"], "维修完成")

    assert completed["status"] == "completed"
    assert completed["repair_feedback"]["feedback"] == "更换主轴轴承"
    assert completed["repair_verification"]["passed"] is True
    assert closed["status"] == "closed"
    assert WorkOrderValidator.can_learn(closed, closed["repair_feedback"])


def test_memory_admission_does_not_use_production_quality_result():
    order = {"status": "closed", "repair_feedback": {}, "repair_verification": {}}

    assert not WorkOrderValidator.can_learn(order, {})
    assert not MemoryAgentValidator.validate_admission({"workorder": order, "quality": {"passed": True}}) == []

    order["repair_feedback"] = {"feedback": "现场复测正常"}
    assert not WorkOrderValidator.can_learn(order, order["repair_feedback"])
    order["repair_verification"] = {"passed": True, "status": "verified"}
    assert WorkOrderValidator.can_learn(order, order["repair_feedback"])


def test_quality_appeal_closure_and_audit_are_traceable():
    service = ClosureService()
    check = service.create_quality_check(
        {
            "target_type": "production_part",
            "target_id": "PART-001",
            "part_no": "P-001",
            "result": "passed",
        }
    )
    appeal = service.submit_appeal(check["quality_check_id"], {"reason": "补充复测记录"})
    task = service.create_closure_task(
        {"quality_check_id": check["quality_check_id"], "title": "补充复测记录"}
    )
    completed = service.complete_closure_task(task["closure_task_id"], note="已完成")
    logs = service.audit_logs(object_id=check["quality_check_id"])

    assert check["part_no"] == "P-001"
    assert appeal["quality_check_id"] == check["quality_check_id"]
    assert completed["status"] == "completed"
    assert any(item["action"] == "quality_check_created" for item in logs)


def test_part_quality_record_keeps_production_identity():
    service = ClosureService()
    check = service.record_part_quality(
        {
            "part_id": "PART-002",
            "part_no": "P-002",
            "batch_id": "B-001",
            "production_order_id": "PO-001",
            "result": "passed",
        },
        operator="quality-agent",
    )

    assert check["target_type"] == "production_part"
    assert check["target_id"] == "PART-002"
    assert check["part_no"] == "P-002"
    assert check["inspection_type"] == "part_quality"


def test_memory_search_requires_at_least_one_condition():
    findings = MemoryAgentValidator.validate_search({})

    assert findings
    assert "检索条件" in findings[0]


def test_workorder_to_memory_route_is_allowed_for_closed_feedback():
    from app.a2a.registry import is_allowed_a2a_route

    assert is_allowed_a2a_route("workorder", "memory")


def test_api_workorder_and_part_quality_flows_are_connected():
    from fastapi.testclient import TestClient

    from app.api.server import create_app

    client = TestClient(create_app())
    created = client.post(
        "/api/workorders",
        json={
            "device_id": "D-API-001",
            "title": "spindle bearing fault",
            "steps": ["replace bearing"],
        },
    )
    assert created.status_code == 200
    workorder_id = created.json()["workorder_id"]

    completed = client.post(
        f"/api/v1/workorders/{workorder_id}/complete",
        json={
            "feedback": "replaced and retested",
            "operator": "TECH-001",
            "verification": {"passed": True, "status": "verified"},
        },
    )
    assert completed.status_code == 200
    assert completed.json()["workorder"]["repair_verification"]["passed"] is True

    closed = client.post(
        f"/api/workorders/{workorder_id}/action",
        json={
            "action": "close",
            "repair_feedback": {"feedback": "replaced and retested"},
            "repair_verification": {"passed": True},
        },
    )
    assert closed.status_code == 200
    assert closed.json()["status"] == "closed"
    assert closed.json()["memory_result"]["success"] is True

    quality = client.post(
        "/api/quality/parts/PART-API-001",
        json={
            "part_no": "P-API-001",
            "part_name": "bearing housing",
            "batch_id": "B-001",
            "production_order_id": "PO-001",
            "part": {
                "part_id": "PART-API-001",
                "part_no": "P-API-001",
                "part_name": "bearing housing",
            },
        },
    )
    assert quality.status_code == 200
    assert quality.json()["quality_check_id"]
    checks = client.get("/api/v1/quality/checks").json()
    assert checks["count"] == 1
    assert checks["items"][0]["target_type"] == "production_part"
