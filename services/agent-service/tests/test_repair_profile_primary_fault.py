"""Primary fault and negative background must not select unrelated repair steps or CAD exemptions."""
from copy import deepcopy

import pytest

from app.agents.maintenance.agent import MaintenanceAgent
from app.runtime.action import ActionModel
from app.runtime.policy import PolicyStatus, RuntimePolicy
from app.tools.maintenance.generate_repair_plan import generate_repair_plan
from app.workorder.repair_profile import repair_profile
from app.workorder import repair_profile as profile_module
from runtime_slimming_adapter import build_test_orchestrator


def turret_diagnosis(**changes):
    return {
        "device_id": "TRAK-TC820LTYSI-001", "alarm_code": "700006", "severity": "critical",
        "alarm_definition": {"found": True, "success": True, "name": "刀塔旋转超时",
                             "description": "模拟 12 工位 BMT45 动力刀塔无旋转响应。"},
        "summary": "报警700006刀塔旋转超时。液压与润滑压力正常，主轴转速正常，设备日志未发现通信中断或安全互锁动作。",
        "diagnosis": "刀塔可能机械卡滞或到位检测信号异常，需要部件工程资料后现场确认。",
        "confidence": 0.865, "evidence_status": "ready", "evidence": ["本机700006刀塔旋转超时报警定义"],
        "requires_human_review": False, "maintenance_required": True, **changes,
    }


@pytest.mark.parametrize("background", [
    "未发现通信中断或安全互锁动作", "未发现互锁动作", "未见安全门故障", "没有门锁异常",
    "未发现润滑故障", "未检测到温度异常", "未观察到轴承振动异常",
])
def test_authoritative_turret_alarm_cannot_be_replaced_by_negative_background(background):
    diagnosis = turret_diagnosis(summary="刀塔旋转超时。" + background)
    profile = repair_profile(diagnosis)
    assert profile["kind"] == "general"
    assert profile["target"] == "刀塔旋转超时"


@pytest.mark.parametrize("background", ["检查安全门互锁", "需排查润滑泵", "核对主轴温度"])
def test_specific_alarm_definition_takes_priority_over_other_system_recommendations(background):
    profile = repair_profile(turret_diagnosis(summary="刀塔旋转超时。" + background))
    assert profile["kind"] == "general"
    assert profile["target"] == "刀塔旋转超时"


@pytest.mark.parametrize("background", [
    "未发现互锁动作", "未见安全门故障", "未发现润滑故障", "没有温度异常", "未检测到振动异常",
])
def test_negative_background_without_alarm_definition_cannot_classify_a_different_fault(background):
    assert repair_profile({"fault": "控制器通信故障", "cause": background})["kind"] == "general"


@pytest.mark.parametrize("text", ["未发现互锁动作", "无安全互锁动作", "没有门锁异常", "未检测到润滑故障"])
def test_negative_only_description_does_not_invent_a_fault_profile(text):
    assert repair_profile({"summary": text})["kind"] == "general"


@pytest.mark.parametrize("text", [
    "主轴温度正常 未发现互锁动作", "润滑系统正常 未检测到安全门故障",
])
def test_negative_observation_after_another_systems_normal_status_stays_background(text):
    assert repair_profile({"summary": text})["kind"] == "general"


@pytest.mark.parametrize("text,kind", [
    ("未发现互锁动作 润滑压力未达到", "lubrication"),
    ("无互锁动作 主轴温度过高", "thermal"),
    ("润滑系统未见异常 主轴温度过高", "thermal"),
    ("门锁无法打开", "safety_interlock"),
])
def test_negative_background_does_not_erase_adjacent_positive_faults(text, kind):
    assert repair_profile({"summary": text})["kind"] == kind


@pytest.mark.parametrize("name,kind", [
    ("开门被禁止：程序、轴、主轴未停止或接料器未下降", "safety_interlock"),
    ("润滑压力未达到", "lubrication"), ("主轴温度过高", "thermal"), ("主轴振动异常", "vibration"),
])
def test_positive_authoritative_faults_preserve_their_profiles(name, kind):
    diagnosis = {"alarm_definition": {"name": name}, "summary": "设备报警，其他系统未发现互锁异常"}
    assert repair_profile(diagnosis)["kind"] == kind


def test_generic_alarm_name_still_uses_actual_described_fault_without_guessing_alarm_code():
    diagnosis = {"alarm_code": "700004", "alarm_definition": {"name": "未知报警", "description": "润滑压力未达到"},
                 "summary": "需现场检查"}
    assert repair_profile(diagnosis)["kind"] == "lubrication"


def test_primary_fault_without_definition_is_not_overridden_by_a_cause_for_other_equipment():
    profile = repair_profile({"fault": "机器人控制器通信故障", "cause": "检查温度传感器和安全门互锁"})
    assert profile["kind"] == "general"
    assert profile["target"] == "机器人控制器通信故障"


def test_turret_tool_does_not_return_the_interlock_inspection_template():
    steps = generate_repair_plan(turret_diagnosis())["repair_steps"]
    assert not any("接料器" in step or "PLC 门锁" in step for step in steps)


def test_maintenance_turret_plan_keeps_engineering_gate_and_does_not_create_an_order(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    runtime.test_boundary.responses[("inventory", "query_inventory")] = {}
    runtime.test_boundary.responses[("inventory", "query_part_availability")] = {}
    plan = runtime.container.agents["maintenance"].run({
        "diagnosis": turret_diagnosis(), "runtime_managed": True,
        "knowledge": {"documents": [{"document_id": "SOP-TURRET"}]},
        "cad": {"status": "insufficient_engineering_data", "components": [], "validation_findings": ["缺少 part_no"],
                "drawings": [{"drawing_id": "DEVICE-REFERENCE-TC820SI", "device_id": "TRAK-TC820LTYSI-001",
                              "drawing_url": "/drawings/TC820si.html", "engineering_status": "reference_only",
                              "evidence_scope": "device_reference"}]},
    })
    assert "安全门" not in plan.repair_target and "接料器" not in plan.repair_target
    assert plan.cad_required is True
    assert plan.workorder_ready is False
    assert any("CAD/BOM" in finding for finding in plan.validation_findings)
    assert not any("PLC 门锁" in step for step in plan.repair_steps)
    assert runtime.container.workorder_service.list() == []


def wrong_legacy_plan():
    return {"repair_target": "安全门与接料器互锁系统", "plan_kind": "repair", "cad_required": False,
            "workorder_ready": True, "repair_steps": ["读取互锁输入输出并记录"], "required_parts": [],
            "parts": [], "validation_findings": [], "risk_level": "high"}


def test_runtime_old_turret_plan_cannot_claim_the_interlock_cad_exception():
    state = {"diagnosis": turret_diagnosis(), "knowledge": {"documents": [{"id": "SOP-TURRET"}]},
             "cad": {}, "maintenance_plan": wrong_legacy_plan()}
    action = ActionModel.agent("workorder", {"required_capability": "workorder_create"},
                               side_effect=True, idempotency_key="turret-original-event")
    decision = RuntimePolicy().evaluate(action, state)
    assert decision.status == PolicyStatus.DENY
    assert decision.reason.startswith("invalid_plan_profile:")
    assert "刀塔旋转超时" in decision.reason


def test_real_interlock_alarm_still_qualifies_for_read_only_cad_exception():
    state = {"diagnosis": {**turret_diagnosis(), "alarm_definition": {"name": "开门被禁止：接料器未下降"}},
             "knowledge": {"documents": [{"id": "SOP-INTERLOCK"}]}, "cad": {},
             "maintenance_plan": deepcopy(wrong_legacy_plan())}
    action = ActionModel.agent("workorder", {"required_capability": "workorder_create"},
                               side_effect=True, idempotency_key="real-interlock-event")
    assert RuntimePolicy().evaluate(action, state).status == PolicyStatus.ALLOW


@pytest.mark.parametrize("shape", ["target", "target_part", "fixed_steps"])
def test_saved_interlock_template_reports_mismatch_with_real_turret_alarm(shape):
    plan = {"diagnosis": turret_diagnosis()}
    if shape == "target":
        plan["repair_target"] = "安全门与接料器互锁系统"
    elif shape == "target_part":
        plan["target_part"] = {"part_name": "安全门与接料器互锁系统"}
    else:
        plan["repair_steps"] = [
            "保持安全互锁有效，不得短接或旁路互锁，不强制开门",
            "由维修人员读取程序、轴、主轴停止状态及接料器位置反馈，与本机配置的互锁条件比较",
            "核对 PLC 门锁、接料器到位及下降指令状态，记录不一致的输入输出，不执行运动指令",
            "在确认安全停机后观察接料器外观及可见障碍，不改动安全回路",
            "记录报警和互锁核查结果；涉及部件维修时，先补齐 CAD/BOM 及相应审批再另行处理",
            "处理后复核原报警及互锁状态，验收使用设备恢复数据，不自动启动机器",
        ]
    findings = profile_module.plan_profile_findings(plan)
    assert findings and any("主故障" in item and "刀塔旋转超时" in item for item in findings)


def test_explicit_authoritative_diagnosis_overrides_old_plan_diagnosis_for_mismatch_check():
    plan = {**wrong_legacy_plan(), "diagnosis": {"fault": "开门被禁止"}}
    assert profile_module.plan_profile_findings(plan, turret_diagnosis())


@pytest.mark.parametrize("plan", [
    {"repair_target": "刀塔旋转与定位系统", "repair_steps": ["维修后核对安全互锁有效，检查刀塔轴承"]},
    {"repair_target": "安全门传感器机械维修", "repair_steps": ["根据工程图纸更换门锁传感器"]},
    {"repair_target": "润滑系统", "target_part": {"part_name": "润滑泵"}},
])
def test_arbitrary_interlock_words_do_not_block_other_legitimate_repair_plans(plan):
    assert profile_module.plan_profile_findings(plan, turret_diagnosis()) == []


@pytest.mark.parametrize("diagnosis", [{}, {"fault": "未知报警"}])
def test_missing_or_unknown_diagnosis_does_not_claim_a_definite_template_mismatch(diagnosis):
    assert profile_module.plan_profile_findings(wrong_legacy_plan(), diagnosis) == []


def test_positive_interlock_plan_has_no_template_mismatch():
    assert profile_module.plan_profile_findings(wrong_legacy_plan(), {"alarm_definition": {"name": "开门被禁止：接料器未下降"}}) == []
