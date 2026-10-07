"""故障方案与派发回归：真实 Agent/工具/门禁，只有外部资料使用隔离适配器。"""
import pytest

from app.agents.maintenance.agent import MaintenanceAgent
from app.agents.maintenance.validator import MaintenancePlanValidator
from app.tools.maintenance.generate_repair_plan import generate_repair_plan
from app.workorder.policy import auto_workorder_decision
from runtime_slimming_adapter import build_test_orchestrator


def diagnosis(**changes):
    return {
        "device_id": "M-LUB", "alarm_code": "700001", "fault": "润滑压力未达到",
        "cause": "润滑泵或油路供给异常；主轴温度正常，振动正常", "severity": "high",
        "confidence": 0.95, "evidence_status": "ready", "evidence": ["当前润滑压力报警"],
        "maintenance_required": True, **changes,
    }


@pytest.mark.parametrize("values,target", [
    (diagnosis(), "润滑系统"),
    (diagnosis(fault="润滑压力未达到且主轴温度正常", cause="检查温度传感器"), "润滑系统"),
    (diagnosis(fault="润滑压力未达到（主轴温度正常）", cause="检查温度传感器"), "润滑系统"),
    (diagnosis(fault="润滑压力未达到 主轴温度正常", cause="检查温度传感器"), "润滑系统"),
    (diagnosis(fault="报警700001：润滑压力未达到，同时主轴温度正常", cause="油路压力异常"), "润滑系统"),
    (diagnosis(fault="主轴振动异常", cause="温度正常，检查轴承"), "主轴传动与轴承系统"),
    (diagnosis(fault="主轴温度过高", cause="振动正常，需排查散热"), "主轴冷却系统"),
    (diagnosis(fault="主轴温度不正常", cause="需现场复核"), "主轴冷却系统"),
    (diagnosis(fault="未定义报警", cause="温度正常；振动未见异常"), "未定义报警"),
    (diagnosis(fault="机器人控制器通信故障", cause="控制总线中断", alarm_code="700001"), "机器人控制器通信故障"),
    (diagnosis(fault="整机故障，含温度监测信息", alarm_definition={"name": "润滑压力未达到", "description": "导轨润滑压力不足"}), "润滑系统"),
])
def test_primary_alarm_controls_profile_not_normal_metrics_or_shared_code(values, target):
    view = MaintenanceAgent._normalize_diagnosis(values)
    profile = MaintenanceAgent._profile(view, [{"name": "主轴温度传感器"}])
    assert profile["target"] == target


def test_repair_tool_does_not_return_temperature_steps_for_lubrication_alarm():
    result = generate_repair_plan(diagnosis(fault="润滑压力未达到，主轴温度正常"))
    assert any("润滑" in item for item in result["repair_steps"])
    assert not any("冷却" in item or "温度" in item for item in result["repair_steps"])


@pytest.mark.parametrize("fault,kind,step_keyword", [
    ("冷却液温度正常，润滑压力未达到", "lubrication", "润滑"),
    ("主轴轴承振动正常，润滑压力未达到", "lubrication", "润滑"),
    ("润滑系统油路正常，主轴温度过高", "thermal", "冷却"),
    ("主轴温度过高 冷却液温度正常", "thermal", "冷却"),
    ("润滑压力未达到 油路正常", "lubrication", "润滑"),
    ("主轴过热 冷却液温度正常", "thermal", "冷却"),
    ("主轴温度过热 冷却液温度正常", "thermal", "冷却"),
    ("主轴过温 冷却液温度正常", "thermal", "冷却"),
])
def test_normal_status_applies_to_all_adjacent_keywords_for_the_same_system(fault, kind, step_keyword):
    value = diagnosis(fault=fault, cause="需现场复核")
    view = MaintenanceAgent._normalize_diagnosis(value)
    assert MaintenanceAgent._profile(view, [])["kind"] == kind
    assert any(step_keyword in step for step in generate_repair_plan(value)["repair_steps"])


@pytest.mark.parametrize("key", ["diagnosis", "summary"])
def test_repair_tool_keeps_existing_diagnosis_aliases(key):
    result = generate_repair_plan({key: "主轴温度过高"})
    assert result["fault"] == "主轴温度过高"
    assert any("冷却" in item for item in result["repair_steps"])


def test_missing_engineering_and_inventory_never_invents_thermal_spares():
    assert MaintenanceAgent._parts({"kind": "thermal"}, {}, [], []) == []


def test_stock_part_number_and_display_name_keep_separate_identities():
    parts = MaintenanceAgent._parts({"kind": "lubrication"}, {"parts": [{"part_no": "LUB-REAL", "name": "润滑泵", "stock": 2, "available": True}]}, [], [])
    assert parts == ["LUB-REAL 润滑泵"]


def test_stock_display_name_is_not_used_as_a_part_number():
    assert MaintenanceAgent._parts({"kind": "lubrication"}, {"parts": [{"name": "润滑泵", "stock": 2, "available": True}]}, [], []) == []


def test_spares_and_target_are_selected_from_matching_engineering_records():
    components = [
        {"component_id": "TEMP", "name": "温度传感器", "part_no": "TEMP-REAL"},
        {"component_id": "LUB", "name": "润滑泵", "part_no": "LUB-REAL"},
    ]
    profile = {"kind": "lubrication", "target": "润滑系统"}
    assert MaintenanceAgent._parts(profile, {}, components, []) == ["LUB-REAL 润滑泵"]
    target = MaintenanceAgent._target_part(MaintenanceAgent._normalize_diagnosis(diagnosis()), profile, components, [])
    assert target["component"] == "LUB"
    assert target["part_no"] == "LUB-REAL"


def test_required_spares_without_inventory_evidence_remain_blocked():
    plan = {"repair_target": "润滑泵", "repair_steps": ["检查润滑泵"], "safety": ["断电挂牌"],
            "diagnosis": diagnosis(), "cad_required": True, "cad_components": ["LUB"],
            "parts": ["LUB-REAL 润滑泵"], "required_parts": ["LUB-REAL 润滑泵"]}
    cad = {"components": [{"component_id": "LUB", "part_no": "LUB-REAL", "name": "润滑泵"}]}
    findings = MaintenancePlanValidator.validate(plan, {"documents": [{"document_id": "SOP-LUB"}]}, cad, {})
    assert any("库存" in item for item in findings)
    assert MaintenancePlanValidator.workorder_ready(findings, plan) is False


@pytest.mark.parametrize("stock", [
    [{"part_id": "TEMP-REAL", "name": "温度传感器", "available": True}],
    [{"part_id": "LUB-REAL", "available": False}, {"part_id": "TEMP-REAL", "available": True}],
    [{"part_id": "LUB-REAL", "stock": 0}],
    [{"part_id": "LUB-REAL", "available": True, "stock": 0}],
    [{"part_id": "LUB-REAL"}],
])
def test_unrelated_unknown_or_empty_stock_does_not_satisfy_required_part(stock):
    plan = {"repair_target": "润滑泵", "repair_steps": ["检查润滑泵"], "safety": ["断电挂牌"],
            "diagnosis": diagnosis(), "cad_required": True, "cad_components": ["LUB"],
            "parts": ["LUB-REAL 润滑泵"], "required_parts": ["LUB-REAL 润滑泵"]}
    cad = {"components": [{"component_id": "LUB", "part_no": "LUB-REAL", "name": "润滑泵"}]}
    findings = MaintenancePlanValidator.validate(plan, {"documents": [{"document_id": "SOP-LUB"}]}, cad, {"parts": stock})
    assert any("库存" in item for item in findings)
    assert MaintenancePlanValidator.workorder_ready(findings, plan) is False


def test_raw_target_cannot_replace_matching_engineering_with_unrelated_part():
    value = diagnosis(component="TEMP", part_no="TEMP-REAL", part_name="温度传感器")
    components = [{"component_id": "LUB", "part_no": "LUB-REAL", "name": "润滑泵"}]
    target = MaintenanceAgent._target_part(MaintenanceAgent._normalize_diagnosis(value), {"kind": "lubrication", "target": "润滑系统"}, components, [])
    assert target["component"] == "LUB"
    assert target["part_no"] == "LUB-REAL"


def prepared_runtime(tmp_path, monkeypatch, *, with_engineering=True, synthetic_stock=False):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    component = {"component_id": "LUB", "part_no": "LUB-REAL", "name": "润滑泵", "device_id": "M-LUB", "drawing_ref": "DWG-LUB"}
    cad = {"components": [component], "source": "isolated-test-cad", "synthetic": False} if with_engineering else {}
    inventory = {"parts": [{"part_id": "LUB-REAL", "name": "润滑泵", "available": True, "stock": 2, "synthetic": synthetic_stock}]}
    runtime.test_boundary.responses[("inventory", "query_inventory")] = inventory if with_engineering else {}
    runtime.test_boundary.responses[("inventory", "query_part_availability")] = {"available": with_engineering, **inventory}
    request = {"diagnosis": diagnosis(), "runtime_managed": True,
               "knowledge": {"documents": [{"document_id": "SOP-LUB", "metadata": {"device_id": "M-LUB"}}]}, "cad": cad}
    return runtime, request


def test_missing_cad_keeps_correct_plan_visible_but_never_creates_order(tmp_path, monkeypatch):
    runtime, request = prepared_runtime(tmp_path, monkeypatch, with_engineering=False)
    plan = runtime.container.agents["maintenance"].run(request)
    assert plan.repair_target == "润滑系统"
    assert any("润滑" in item for item in plan.repair_steps)
    assert not any("冷却" in item for item in plan.repair_steps)
    assert plan.parts == []
    assert plan.workorder_ready is False
    assert any("CAD/BOM" in item for item in plan.validation_findings)
    result = runtime.container.agents["workorder"].run({"source": "monitor", "maintenance_plan": plan.model_dump(mode="json")})
    assert result.success is False
    assert result.workorder_id == ""
    assert runtime.container.workorder_service.list() == []


def test_unrelated_cad_never_satisfies_lubrication_engineering_gate(tmp_path, monkeypatch):
    runtime, request = prepared_runtime(tmp_path, monkeypatch, with_engineering=False)
    request["cad"] = {"components": [{"component_id": "TEMP", "part_no": "TEMP-REAL", "name": "温度传感器"}]}
    plan = runtime.container.agents["maintenance"].run(request)
    assert plan.repair_target == "润滑系统"
    assert plan.workorder_ready is False
    assert any("CAD/BOM" in item for item in plan.validation_findings)


def test_synthetic_stock_is_not_allowed_to_make_corrected_plan_dispatchable(tmp_path, monkeypatch):
    runtime, request = prepared_runtime(tmp_path, monkeypatch, synthetic_stock=True)
    plan = runtime.container.agents["maintenance"].run(request)
    assert plan.repair_target == "润滑系统"
    assert plan.workorder_ready is False
    assert any("演示" in item for item in plan.validation_findings)


def test_unnumbered_inventory_cannot_satisfy_a_numbered_engineering_part(tmp_path, monkeypatch):
    runtime, request = prepared_runtime(tmp_path, monkeypatch)
    stock = runtime.test_boundary.responses[("inventory", "query_inventory")]["parts"][0]
    stock.pop("part_id")
    plan = runtime.container.agents["maintenance"].run(request)
    assert plan.required_parts == ["LUB-REAL"]
    assert plan.workorder_ready is False
    assert any("库存" in item for item in plan.validation_findings)


@pytest.mark.parametrize("identity_key", ["part_id", "part_no"])
def test_verified_lubrication_plan_automatically_assigns_and_persists_order(tmp_path, monkeypatch, identity_key):
    runtime, request = prepared_runtime(tmp_path, monkeypatch)
    stock = runtime.test_boundary.responses[("inventory", "query_inventory")]["parts"][0]
    stock[identity_key] = stock.pop("part_id")
    plan = runtime.container.agents["maintenance"].run(request)
    assert plan.repair_target == "润滑系统"
    assert plan.workorder_ready is True
    assert plan.validation_findings == []
    assert plan.required_parts == ["LUB-REAL"]
    assert auto_workorder_decision(plan.diagnosis.model_dump(mode="json"), plan.model_dump(mode="json"))[0] is True
    # 人员目录和库存预留是外部业务边界；排序、创建、派发及持久化执行实际代码。
    adapter = runtime.container.registry.workorder_mcp
    monkeypatch.setattr(adapter, "query_technicians", lambda **kw: {"items": [{"technician_id": "TECH-LUB", "primary_device_id": "M-LUB", "available": True, "online": True, "registered": True, "workload": 0}]})
    def reserve_inventory(**kw):
        assert kw["part_no"] == "LUB-REAL", "外部库存接口必须收到编号，不是显示名称或库存注释"
        return {"reserved": True, **kw}
    monkeypatch.setattr(adapter, "reserve_inventory", reserve_inventory)
    result = runtime.container.agents["workorder"].run({"source": "monitor", "maintenance_plan": plan.model_dump(mode="json")})
    assert result.success is True
    saved = runtime.container.workorder_service.get(result.workorder_id)
    assert saved["device_id"] == "M-LUB"
    assert saved["plan_id"] == plan.plan_id
    assert saved["status"] == "in_progress"
    assert saved["assignee"] == "TECH-LUB"
    assert saved["repair_target"]["component"] == "LUB"
    assert not any("冷却" in item for item in saved["steps"])
