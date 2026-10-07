"""互锁报警不应被正常温度背景误判成冷却维修，派工仍走真实门禁。"""
import pytest

from app.agents.maintenance.agent import MaintenanceAgent
from app.agents.maintenance.validator import MaintenancePlanValidator
from app.tools.maintenance.generate_repair_plan import generate_repair_plan
from app.runtime.action import ActionModel
from app.runtime.policy import PolicyStatus, RuntimePolicy
from app.workorder.policy import auto_workorder_decision
from app.workorder.repair_profile import repair_profile
from runtime_slimming_adapter import build_fault_scenario, build_test_orchestrator


def interlock_diagnosis(**changes):
    return {
        "device_id": "M-INTERLOCK", "alarm_code": "700004", "severity": "critical",
        "fault": "开门被禁止：程序、轴、主轴未停止或接料器未下降，接料器位置持续偏离",
        "cause": "接料器未下降到安全位，其余指标（主轴温度46.6°C、振动1.24mm/s）处于正常范围",
        "alarm_definition": {"found": True, "name": "开门被禁止：程序、轴、主轴未停止或接料器未下降"},
        "confidence": 0.916, "evidence_status": "ready", "evidence_validated": True,
        "maintenance_required": True, "evidence": ["当前互锁报警及接料器位置异常"],
        **changes,
    }


def test_interlock_definition_takes_priority_over_temperature_background():
    profile = repair_profile(interlock_diagnosis())
    assert profile["kind"] == "safety_interlock"
    assert profile["target"] == "安全门与接料器互锁系统"
    steps = generate_repair_plan(interlock_diagnosis())["repair_steps"]
    assert any("互锁" in step for step in steps)
    assert not any("冷却" in step or "温度" in step for step in steps)


def test_unknown_alarm_code_does_not_invent_an_interlock_definition():
    value = interlock_diagnosis(alarm_definition={}, fault="未知报警700004", cause="等待现场核查")
    assert repair_profile(value)["kind"] == "general"


def make_runtime(tmp_path, monkeypatch, **changes):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    # 模拟外部库存中存在无关/演示备件，不让它们变成本次核查的强制预留。
    runtime.test_boundary.responses[("inventory", "query_inventory")] = {
        "parts": [{"part_id": "TEMP-DEMO", "name": "温度传感器", "stock": 2, "synthetic": True}]
    }
    runtime.test_boundary.responses[("inventory", "query_part_availability")] = {"available": False}
    plan = runtime.container.agents["maintenance"].run({
        "diagnosis": interlock_diagnosis(**changes), "runtime_managed": True, "cad": {},
        "knowledge": {"documents": [{"document_id": "SOP-INTERLOCK", "metadata": {"device_id": "M-INTERLOCK"}}]},
    })
    return runtime, plan


def test_non_invasive_interlock_plan_dispatches_without_unrelated_cad_or_stock(tmp_path, monkeypatch):
    runtime, plan = make_runtime(tmp_path, monkeypatch)
    assert plan.repair_target == "安全门与接料器互锁系统"
    assert plan.cad_required is False
    assert plan.required_parts == []
    assert plan.workorder_ready is True
    assert plan.validation_findings == []
    assert not any("冷却" in step for step in plan.repair_steps)
    assert any("不得" in step and "互锁" in step for step in plan.repair_steps)
    adapter = runtime.container.registry.workorder_mcp
    monkeypatch.setattr(adapter, "query_technicians", lambda **kw: {"items": [
        {"technician_id": "TECH-INTERLOCK", "primary_device_id": "M-INTERLOCK", "available": True, "workload": 0}
    ]})
    def forbid_inventory_reservation(**kw):
        raise AssertionError("非拆修互锁核查不能预留无关备件")
    monkeypatch.setattr(adapter, "reserve_inventory", forbid_inventory_reservation)
    result = runtime.container.agents["workorder"].run({
        "source": "monitor", "event_id": "EVT-INTERLOCK", "idempotency_key": "interlock-dispatch-once",
        "maintenance_plan": plan.model_dump(mode="json"),
    })
    assert result.success is True
    saved = runtime.container.workorder_service.get(result.workorder_id)
    assert saved["status"] == "in_progress"
    assert saved["assignee"] == "TECH-INTERLOCK"
    assert saved["device_id"] == "M-INTERLOCK"
    assert saved["plan_id"] == plan.plan_id
    repeated = runtime.container.agents["workorder"].run({
        "source": "monitor", "event_id": "EVT-INTERLOCK", "idempotency_key": "interlock-dispatch-once",
        "maintenance_plan": plan.model_dump(mode="json"),
    })
    assert repeated.workorder_id == result.workorder_id
    assert len(runtime.container.workorder_service.list()) == 1
    assert not any(server == "plc" for server, _, _ in runtime.test_boundary.calls)


@pytest.mark.parametrize("changes", [
    {"confidence": 0.45}, {"evidence_status": "insufficient"},
    {"requires_human_review": True}, {"maintenance_required": False},
])
def test_interlock_inspection_never_bypasses_business_gates(tmp_path, monkeypatch, changes):
    runtime, plan = make_runtime(tmp_path, monkeypatch, **changes)
    assert auto_workorder_decision(plan.diagnosis.model_dump(mode="json"), plan.model_dump(mode="json"))[0] is False
    result = runtime.container.agents["workorder"].run({"source": "monitor", "maintenance_plan": plan.model_dump(mode="json")})
    assert result.success is False
    assert runtime.container.workorder_service.list() == []


@pytest.mark.parametrize("step", ["更换门锁传感器", "拆卸接料器并检查驱动器"])
def test_physical_repair_steps_cannot_claim_cad_is_optional(step):
    plan = {"repair_target": "安全门与接料器互锁系统", "repair_steps": [step],
            "safety": ["停机隔离"], "cad_required": False, "cad_components": [],
            "diagnosis": interlock_diagnosis()}
    findings = MaintenancePlanValidator.validate(plan, {"documents": [{"document_id": "SOP-INTERLOCK"}]}, {})
    assert any("CAD/BOM" in item for item in findings)
    assert MaintenancePlanValidator.workorder_ready(findings, plan) is False


def test_entire_runtime_dispatches_current_interlock_fault_without_engineering_records(tmp_path, monkeypatch):
    fault = "开门被禁止：程序、轴、主轴未停止或接料器未下降"
    runtime, event = build_fault_scenario(tmp_path, monkeypatch, device_id="M-INTERLOCK", event_id="EVT-INTERLOCK-CHAIN", fault=fault)
    for operation in ("query_part", "query_drawing", "query_bom", "query_relation", "fetch_engineering_record"):
        runtime.test_boundary.responses[("cad", operation)] = {"components": [], "source": "isolated-empty-engineering", "synthetic": False}
    result = runtime.run_abnormal_event(event)
    assert result["maintenance_plan"]["repair_target"] == "安全门与接料器互锁系统"
    assert result["maintenance_plan"]["workorder_ready"] is True
    assert result["runtime_result"]["status"] == "completed", result["runtime_result"]
    assert result["workorder"]["workorder_id"]
    order = runtime.container.workorder_service.get(result["workorder"]["workorder_id"])
    assert order["status"] == "in_progress"
    assert order["assignee"] == "TEST-REGISTERED-U1"
    assert order["event_id"] == "EVT-INTERLOCK-CHAIN"
    assert runtime.test_reservations == []
    assert not any(operation in {"stop_line", "start_line", "stop_device", "start_device"}
                   for _, operation, _ in runtime.test_boundary.calls)
    assert any(item.get("context", {}).get("agent") == "maintenance" or item.get("agent") == "maintenance"
               for item in result["trace"])


@pytest.mark.parametrize("changes", [
    {"repair_steps": ["更换门锁传感器"]}, {"workorder_ready": False},
    {"validation_findings": ["缺少知识证据"]}, {"required_parts": ["DOOR-REAL"]},
    {"parts": ["DOOR-REAL 门锁"]}, {"cad_required": True},
])
def test_runtime_cad_exception_is_limited_to_validated_non_invasive_inspection(changes):
    state = {"diagnosis": interlock_diagnosis(), "knowledge": {"documents": [{"id": "SOP-INTERLOCK"}]},
             "cad": {}, "maintenance_plan": {"cad_required": False, "workorder_ready": True,
             "repair_steps": ["读取互锁输入输出并记录"], "required_parts": [], "parts": [], **changes}}
    action = ActionModel.agent("workorder", {"required_capability": "workorder_create"},
                               side_effect=True, idempotency_key="inspection-once")
    decision = RuntimePolicy().evaluate(action, state)
    assert decision.status == PolicyStatus.DENY
    assert "cad" in decision.missing_evidence


def test_non_invasive_inspection_keeps_high_risk_approval_and_knowledge_gates():
    state = {"diagnosis": interlock_diagnosis(), "knowledge": {"documents": [{"id": "SOP-INTERLOCK"}]},
             "cad": {}, "maintenance_plan": {"cad_required": False, "workorder_ready": True,
             "repair_steps": ["读取互锁输入输出并记录"], "required_parts": [], "parts": [], "risk_level": "high"},
             "context": {"approval_granted": True}}
    action = ActionModel.agent("workorder", {"required_capability": "workorder_create"},
                               side_effect=True, idempotency_key="inspection-once")
    assert RuntimePolicy().evaluate(action, state).status == PolicyStatus.REQUIRE_APPROVAL
    state["knowledge"] = {}
    assert RuntimePolicy().evaluate(action, state).missing_evidence == ("knowledge",)
