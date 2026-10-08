"""液压停机核查的 CAD 例外仅用于已校验固定步骤，不能授权拆修或复机。"""

from datetime import datetime, timezone

import pytest

from app.monitor.line_control import LineController
from app.runtime.action import ActionModel
from app.runtime.policy import PolicyStatus, RuntimePolicy
from app.workorder import repair_profile as profile_module


def ready_hydraulic_state():
    diagnosis = {
        "device_id": "M-HYDRAULIC", "alarm_code": "700010", "severity": "fault",
        "fault": "液压压力异常", "alarm_definition": {"name": "液压压力异常", "severity": "fault"},
        "maintenance_required": True, "evidence_status": "validated", "evidence_validated": True,
    }
    return {
        "diagnosis": diagnosis,
        "knowledge": {"documents": [{"id": "ISOLATED-HYDRAULIC-SOP"}]},
        "cad": {},
        "maintenance_plan": {
            **profile_module.hydraulic_inspection_template(),
            "plan_kind": "repair", "maintenance_required": True, "cad_required": False,
            "workorder_ready": True, "validation_findings": [], "validation_errors": [],
            "risk_level": "high", "diagnosis": diagnosis,
        },
    }


def create_action():
    return ActionModel.agent("workorder", {"required_capability": "workorder_create"},
                             side_effect=True, idempotency_key="hydraulic-700010-once")


def test_validated_hydraulic_stop_inspection_keeps_repair_semantics_without_cad():
    state = ready_hydraulic_state()
    decision = RuntimePolicy().evaluate(create_action(), state)
    assert decision.status == PolicyStatus.ALLOW, decision
    assert state["maintenance_plan"]["plan_kind"] == "repair"
    assert state["maintenance_plan"]["maintenance_required"] is True
    assert decision.risk_level == "high"


@pytest.mark.parametrize("changes", [
    {"cad_required": True}, {"cad_required": None}, {"workorder_ready": False},
    {"validation_findings": ["缺少液压核查依据"]}, {"validation_errors": ["未通过校验"]},
    {"required_parts": ["PUMP-1"]}, {"parts": ["HYDRAULIC-SEAL"]},
    {"maintenance_required": False}, {"plan_kind": "inspection"},
    {"repair_steps": ["更换液压泵"]}, {"repair_steps": ["检查液压压力"]},
    {"pre_checks": ["拆卸液压管路"]}, {"post_checks": ["更换液压密封件"]},
    {"pre_checks": ["启动液压泵后观察"]}, {"post_checks": ["调高液压压力"]},
    {"tools": ["液压压力调整器"]}, {"required_tools": ["液压维修工具"]},
    {"safety": []}, {"safety_requirements": []},
    {"repair_target": "液压泵更换"},
])
def test_incomplete_or_invasive_hydraulic_plans_do_not_get_cad_exception(changes):
    state = ready_hydraulic_state()
    state["maintenance_plan"].update(changes)
    assert RuntimePolicy().evaluate(create_action(), state).status == PolicyStatus.DENY


@pytest.mark.parametrize("extra", ["启动液压泵后观察", "调高液压压力", "拆卸管路检查", "更换密封件"])
def test_appending_repair_or_motion_to_fixed_steps_requires_normal_evidence(extra):
    state = ready_hydraulic_state()
    state["maintenance_plan"]["repair_steps"].append(extra)
    decision = RuntimePolicy().evaluate(create_action(), state)
    assert decision.status == PolicyStatus.DENY
    assert "cad" in decision.missing_evidence or decision.reason.startswith("invalid_plan_profile")


def test_different_primary_alarm_cannot_reuse_hydraulic_cad_exception():
    state = ready_hydraulic_state()
    state["diagnosis"] = {"fault": "刀塔旋转超时", "alarm_definition": {"name": "刀塔旋转超时"}}
    assert RuntimePolicy().evaluate(create_action(), state).status == PolicyStatus.DENY


def test_hydraulic_cad_exception_does_not_remove_knowledge_or_approval_gates():
    state = ready_hydraulic_state()
    state["knowledge"] = {}
    decision = RuntimePolicy().evaluate(create_action(), state)
    assert decision.status == PolicyStatus.DENY
    assert decision.missing_evidence == ("knowledge",)
    state["knowledge"] = {"documents": [{"id": "ISOLATED-HYDRAULIC-SOP"}]}
    state["maintenance_plan"]["requires_approval"] = True
    state["context"] = {"approval_granted": True}
    assert RuntimePolicy().evaluate(create_action(), state).status == PolicyStatus.REQUIRE_APPROVAL


@pytest.mark.parametrize("alarm,pressure", [("700010", 700), ("", 450), ("", 550)])
def test_completion_text_never_overrides_current_hydraulic_recovery_evidence(alarm, pressure, monkeypatch):
    monkeypatch.setenv("FACTORY_CONTROL_MODE", "virtual")
    class Factory:
        def snapshot(self, device_id):
            return {
                "device_id": device_id, "status": "stopped", "alarm_code": alarm,
                "metrics": {"hydraulic_pressure": pressure},
                "metric_details": {"hydraulic_pressure": {
                    "normal_range": [600, 800], "warn_range": [500, 599], "alarm_range": [0, 499],
                }},
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }

        def control_device(self, *_args, **_kwargs):
            raise AssertionError("Uncleared hydraulic evidence must never start a machine")

    class Ledger:
        def status(self):
            return {"state": "stopped", "faults": []}

        def call(self, tool, arguments):
            assert tool == "get_workorder" and arguments == {"workorder_id": "WO-HYDRAULIC"}
            return {"workorder": {
                "workorder_id": "WO-HYDRAULIC", "device_id": "M-HYDRAULIC",
                "assignee": "TECH-HYDRAULIC", "status": "in_progress",
                "maintenance_plan_snapshot": {"plan_kind": "repair"},
            }}

        def request(self, *_args, **_kwargs):
            raise AssertionError("Uncleared hydraulic evidence must not record successful repair")

    result = LineController(Factory(), Ledger()).confirm_and_restart(
        "WO-HYDRAULIC", "TECH-HYDRAULIC", "完成")
    assert result["machine_control"]["state"] == "blocked"
    assert result["machine_control"]["checks"]["alarms_clear"] is False
    assert result["workorder"]["status"] == "in_progress"


def test_entire_hydraulic_runtime_dispatches_non_primary_device_without_stock_or_controls(tmp_path, monkeypatch):
    from runtime_slimming_adapter import build_fault_scenario, documents

    device_id = "M-HYDRAULIC"
    fault = "液压压力未达到"
    runtime, event = build_fault_scenario(
        tmp_path, monkeypatch, device_id=device_id, event_id="EVT-HYDRAULIC-700010", fault=fault)
    event.update(alarm_code="700010", severity="critical")
    event["realtime_snapshot"].update(alarm_code="700010", metrics={"hydraulic_pressure": 450})
    runtime.test_boundary.responses[("knowledge", "get_alarm_definition")].update(
        alarm_code="700010", severity="critical")
    knowledge = documents(device_id, fault)
    for document in knowledge:
        document["content"] = (
            "液压压力未达到：保持停机，检查液压油位、外部可见泄漏和压力反馈，"
            "核对原报警与停机前压力趋势并记录异常。")
        document["source"] = "isolated-hydraulic-checking-manual"
    runtime.test_rag.results = [{"documents": knowledge, "source": "isolated-test-rag"} for _ in range(6)]
    for operation in ("query_part", "query_drawing", "query_bom", "query_relation", "fetch_engineering_record"):
        runtime.test_boundary.responses[("cad", operation)] = {
            "components": [], "drawings": [], "bom_items": [],
            "source": "isolated-empty-engineering", "synthetic": False,
        }
    runtime.test_boundary.responses[("inventory", "query_inventory")] = {
        "parts": [{"part_id": "设备维修", "stock": 99, "synthetic": True}],
        "source": "isolated-unrelated-inventory",
    }
    runtime.test_boundary.responses[("inventory", "query_part_availability")] = {"available": False}
    runtime.test_boundary.responses[("mes", "query_technicians")] = {"items": [
        {"technician_id": "TECH-OUTSIDE", "primary_device_id": "M-OTHER",
         "responsible_device_ids": ["M-OTHER"], "registered": True, "available": True,
         "online": True, "workload": 0},
        {"technician_id": "TECH-MULTI", "primary_device_id": "M-OTHER",
         "responsible_device_ids": ["M-OTHER", device_id], "registered": True, "available": True,
         "online": True, "workload": 3},
    ]}

    result = runtime.run_abnormal_event(event)

    plan = result["maintenance_plan"]
    assert plan["workorder_ready"] is True, plan
    assert plan["plan_kind"] == "repair" and plan["maintenance_required"] is True
    assert plan["risk_level"] == "high" and plan["cad_required"] is False
    assert plan["parts"] == plan["required_parts"] == []
    assert profile_module.hydraulic_inspection_plan_matches(plan), plan
    assert set(plan["source_documents"]) & {document["document_id"] for document in knowledge}
    assert result["runtime_result"]["status"] == "completed", result["runtime_result"]
    orders = runtime.container.workorder_service.list()
    assert len(orders) == 1
    order = orders[0]
    assert order["assignee"] == "TECH-MULTI" and order["device_id"] == device_id
    assert order["status"] == "in_progress" and order["event_id"] == event["event_id"]
    repeated = runtime.container.agents["workorder"].run({
        "source": "monitor", "event_id": order["event_id"], "idempotency_key": order["idempotency_key"],
        "maintenance_plan": plan,
    })
    assert repeated.success and repeated.workorder_id == order["workorder_id"]
    assert len(runtime.container.workorder_service.list()) == 1
    assert runtime.test_reservations == []
    assert not any(server == "plc" and operation != "get_device_logs"
                   for server, operation, _ in runtime.test_boundary.calls)
    assert not any(operation in {"start", "stop", "start_device", "stop_device", "start_line", "stop_line", "emergency_stop"}
                   for _, operation, _ in runtime.test_boundary.calls)
