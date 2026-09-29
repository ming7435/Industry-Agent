from types import SimpleNamespace

import pytest

from app.workorder.validator import WorkOrderValidator


class _Tracing:
    def start(self, *_args, **_kwargs):
        return None

    def finish(self, _name, _state, payload):
        return payload


class _WorkOrderRequests:
    def __init__(self):
        self.calls = 0

    def execute_workorder(self, *_args, **_kwargs):
        self.calls += 1
        return {"success": True, "workorder_id": "WO-UNEXPECTED", "status": "open"}


def test_low_confidence_diagnosis_cannot_auto_create_workorder():
    from app.graph.nodes import OrchestratorNodes

    requests = _WorkOrderRequests()
    nodes = OrchestratorNodes(SimpleNamespace(requests=requests, tracing=_Tracing()))
    result = nodes.workorder(
        {
            "entry": "trigger",
            "event": {"event_id": "EVT-LOW-CONF", "device_id": "D-LOW"},
            "diagnosis": {"device_id": "D-LOW", "fault": "轴承振动", "confidence": 0.42},
            "maintenance_plan": {"workorder_ready": True, "maintenance_required": True},
        }
    )

    assert requests.calls == 0
    assert result["status"] == "blocked_diagnosis_confidence"
    assert result["workorder"] == {}
    assert "置信度" in result["stop_reason"]


def test_maintenance_required_is_explicit_and_gates_workorder_readiness():
    from app.agents.maintenance.validator import MaintenancePlanValidator

    plan = {"repair_target": "主轴", "repair_steps": ["检查轴承"], "maintenance_required": False}
    assert MaintenancePlanValidator.maintenance_required(plan) is False
    assert MaintenancePlanValidator.workorder_ready([], plan) is False

    plan["maintenance_required"] = True
    assert MaintenancePlanValidator.maintenance_required(plan) is True
    assert MaintenancePlanValidator.workorder_ready([], plan) is True


def test_workorder_status_transition_table_rejects_illegal_jump(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    order = adapter.create_workorder(device_id="D-TRANSITION", title="状态迁移测试")

    with pytest.raises(ValueError, match="状态迁移"):
        adapter.update_workorder(order["workorder_id"], status="closed")

    started = adapter.assign_workorder(order["workorder_id"], assignee="TECH-001")
    assert started["status"] == "in_progress"


def test_repair_verification_requires_device_recovery_data(tmp_path):
    from app.mcp.workorder import WorkOrderMcpAdapter

    adapter = WorkOrderMcpAdapter(path=str(tmp_path / "workorders.sqlite3"))
    order = adapter.create_workorder(device_id="D-VERIFY", title="恢复验证测试")
    adapter.assign_workorder(order["workorder_id"], "TECH-001")
    feedback = {"feedback": "已完成维修", "operator": "TECH-001"}

    with pytest.raises(ValueError, match="设备恢复数据"):
        adapter.mark_repair_completed(
            order["workorder_id"], feedback, {"passed": True, "status": "verified"}
        )

    completed = adapter.mark_repair_completed(
        order["workorder_id"],
        feedback,
        {
            "passed": False,
            "device_recovery": {
                "device_id": "D-VERIFY",
                "status": "running",
                "alarm_code": "",
                "active_alarms": [],
                "metrics": {"spindle_temperature_c": 43.2, "spindle_vibration_rms": 0.18},
                "checked_at": "2026-09-28T12:00:00Z",
            },
        },
    )

    verification = completed["repair_verification"]
    assert verification["passed"] is True
    assert verification["source"] == "device_recovery"
    assert verification["checks"]["alarms_clear"] is True
    assert verification["checks"]["metrics_available"] is True


def test_repair_verification_rejects_expired_recovery_without_inventing_health_threshold():
    order = {"workorder_id": "WO-FRESH", "device_id": "D-FRESH"}
    expired = WorkOrderValidator.build_repair_verification(
        order,
        {
            "device_id": "D-FRESH",
            "status": "running",
            "active_alarms": [],
            "metrics": {"vibration": 0.2},
            "checked_at": "2026-09-28T12:00:00Z",
            "expires_at": "2026-09-28T12:01:00Z",
            "health_score": 1,
        },
    )
    assert expired["passed"] is False
    assert "recovery_fresh" in expired["validation_findings"]

    current = WorkOrderValidator.build_repair_verification(
        order,
        {
            "device_id": "D-FRESH",
            "status": "running",
            "active_alarms": [],
            "metrics": {"vibration": 0.2},
                "checked_at": "2026-09-28T12:00:00Z",
            "health_score": 1,
        },
    )
    assert current["passed"] is True


def test_quality_fail_rectification_reinspection_release_close():
    from app.closure import ClosureService

    service = ClosureService()
    check = service.create_quality_check(
        {"target_id": "PART-Q-1", "part_no": "P-Q-1", "result": "failed"}
    )
    check_id = check["quality_check_id"]
    assert check["status"] == "failed"

    task = service.create_closure_task(
        {"quality_check_id": check_id, "title": "整改尺寸偏差", "actions": ["重新加工"]}
    )
    assert service.get_quality_check(check_id)["status"] == "rectification"
    service.complete_closure_task(task["closure_task_id"], note="整改完成")
    assert service.get_quality_check(check_id)["status"] == "reinspection"

    with pytest.raises(ValueError, match="复检"):
        service.release_quality_check(check_id)

    failed_recheck = service.record_reinspection(
        check_id, {"passed": False, "findings": ["尺寸仍超差"], "evidence": [{"id": "E-1"}]}
    )
    assert failed_recheck["status"] == "failed"

    second_task = service.create_closure_task(
        {"quality_check_id": check_id, "title": "再次整改尺寸偏差"}
    )
    service.complete_closure_task(second_task["closure_task_id"], note="再次整改完成")
    service.record_reinspection(
        check_id, {"passed": True, "findings": [], "evidence": [{"id": "E-2"}]}
    )
    released = service.release_quality_check(check_id)
    assert released["status"] == "released"
    closed = service.close_quality_check(check_id, note="质量放行")
    assert closed["status"] == "closed"


def test_quality_reinspection_waits_for_all_rectification_tasks():
    from app.closure import ClosureService

    service = ClosureService()
    check = service.create_quality_check({"target_id": "PART-Q-2", "result": "failed"})
    first = service.create_closure_task({"quality_check_id": check["quality_check_id"], "title": "整改一"})
    second = service.create_closure_task({"quality_check_id": check["quality_check_id"], "title": "整改二"})

    service.complete_closure_task(first["closure_task_id"])
    assert service.get_quality_check(check["quality_check_id"])["status"] == "rectification"
    with pytest.raises(ValueError, match="完成整改"):
        service.record_reinspection(check["quality_check_id"], {"passed": True, "evidence": [{"id": "E-1"}]})

    service.complete_closure_task(second["closure_task_id"])
    assert service.get_quality_check(check["quality_check_id"])["status"] == "reinspection"
