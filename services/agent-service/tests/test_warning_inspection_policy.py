"""Reliable warnings may create read-only inspection orders, never repair orders."""

from copy import deepcopy

import pytest

from app.workorder import policy
from app.workorder.inspection import inspection_plan_findings, inspection_plan_template


def warning(**values):
    return {
        "device_id": "D-WARNING", "alarm_code": "W101", "severity": "warning",
        "maintenance_required": False, "confidence": 0.91,
        "evidence_status": "ready", "evidence_validated": True,
        "evidence": ["设备当前预警 W101 与监控记录一致"],
        "requires_human_review": False, "validation_errors": [], **values,
    }


def inspection_plan(**values):
    return {
        "plan_kind": "inspection", "inspection_required": True,
        "maintenance_required": False, "cad_required": False,
        "workorder_ready": True, "validation_findings": [],
        "repair_target": "设备预警现场检查",
        "repair_steps": [
            "只读核对设备当前报警码、报警时间和运行状态。",
            "在安全观察位置检查设备外观和可见状态，不打开防护或接触运动部件。",
            "记录观察结果与现场照片，核对预警是否仍然存在。",
            "上报检查结果；发现需拆修的问题时另行生成经工程证据校验的维修方案。",
        ],
        "pre_checks": ["确认设备身份与预警事件一致，按现场安全规程确认可以安全观察。"],
        "post_checks": ["提交报警与观察记录，不执行报警复位或设备控制。"],
        "safety": ["仅作只读核查和外观观察，禁止拆装、更换、接线及设备启停或运动操作。"],
        "safety_requirements": ["仅作只读核查和外观观察，禁止拆装、更换、接线及设备启停或运动操作。"],
        "tools": [], "required_tools": [], "parts": [], "required_parts": [],
        "cad_components": [], "inventory_status": {}, "part_availability": {},
        "target_part": {"part_no": "", "part_name": "", "component": ""}, **values,
    }


def test_reliable_warning_has_operator_check_disposition_before_evidence_is_attached():
    diagnosis = {"severity": "warning", "alarm_code": "W101", "confidence": 0.91}
    assert policy.disposition_decision(diagnosis)[0] == "operator_check"


def test_reliable_warning_can_dispatch_fixed_inspection_without_repair_bom():
    allowed, reason = policy.auto_workorder_decision(warning(), inspection_plan())
    assert allowed, reason


@pytest.mark.parametrize("disposition", ["no_action", "monitor_only", "maintenance_required", "emergency_stop"])
def test_explicit_disposition_has_priority_over_warning_inspection(disposition):
    diagnosis = warning(disposition=disposition)
    assert policy.disposition_decision(diagnosis)[0] == disposition
    assert policy.auto_workorder_decision(diagnosis, inspection_plan())[0] is False


@pytest.mark.parametrize("values", [
    {"confidence": 0.79}, {"confidence": None}, {"confidence": float("nan")},
    {"confidence": float("inf")}, {"confidence": True},
    {"evidence_status": "insufficient"}, {"evidence_status": "unknown"},
    {"evidence_validated": False}, {"validated": False},
    {"requires_human_review": True}, {"synthetic": True},
    {"validation_errors": ["报警未核实"]}, {"validation_findings": ["证据不匹配"]},
    {"severity": "normal"}, {"severity": "unknown"}, {"severity": "high"},
    {"severity": "critical"}, {"severity": "intermediate"},
    {"maintenance_required": True}, {"alarm_code": ""}, {"alarm_code": "0"},
    {"alarm_code": "unknown"},
])
def test_inspection_never_weakens_diagnosis_or_alarm_gates(values):
    assert policy.auto_workorder_decision(warning(**values), inspection_plan())[0] is False


@pytest.mark.parametrize("values", [
    {"workorder_ready": False}, {"validation_findings": ["安全条件缺失"]},
    {"errors": ["步骤未验证"]}, {"synthetic": True},
    {"parts": ["P-1"]}, {"required_parts": ["P-1"]},
    {"cad_components": ["COMP-1"]}, {"cad_required": True},
    {"maintenance_required": True}, {"inspection_required": False},
    {"target_part": {"part_no": "P-1"}},
    {"repair_steps": ["检查后更换轴承"]}, {"pre_checks": ["拆开防护罩"]},
    {"post_checks": ["启动设备确认"]}, {"required_tools": ["拆装扳手"]},
])
def test_inspection_cannot_hide_repair_control_or_unready_plan(values):
    assert policy.auto_workorder_decision(warning(), inspection_plan(**values))[0] is False


def test_warning_does_not_automatically_allow_an_ordinary_repair_plan():
    assert policy.auto_workorder_decision(warning(), inspection_plan(plan_kind="repair"))[0] is False


def test_formal_high_severity_repair_keeps_existing_automatic_dispatch_gate():
    diagnosis = warning(severity="high", maintenance_required=True)
    plan = {"maintenance_required": True, "workorder_ready": True}
    assert policy.auto_workorder_decision(diagnosis, plan)[0] is True


def test_diagnosis_view_raw_keeps_warning_evidence_and_human_review_gate():
    diagnosis = {"confidence": 0.91, "maintenance_required": False, "raw": warning()}
    assert policy.auto_workorder_decision(diagnosis, inspection_plan())[0] is True
    diagnosis["raw"]["requires_human_review"] = True
    assert policy.auto_workorder_decision(diagnosis, inspection_plan())[0] is False


def test_event_current_normal_or_another_alarm_cannot_be_hidden_by_diagnosis():
    for event in ({"severity": "normal", "alarm_code": ""}, {"severity": "warning", "alarm_code": "W102"}):
        assert policy.auto_workorder_decision(warning(), inspection_plan(), event)[0] is False


def test_explicit_no_action_in_event_cannot_be_overridden_by_plan_operator_check():
    assert policy.auto_workorder_decision(
        warning(), inspection_plan(disposition="operator_check"), {"disposition": "no_action"}
    )[0] is False


def test_qualification_does_not_require_a_plan_or_claim_repair_is_required():
    assert policy.inspection_decision(warning())[0] is True
    assert policy.maintenance_decision(warning())[0] is False


@pytest.mark.parametrize("severity", ["warning", "initial", "预警", "初级预警"])
def test_real_warning_severity_aliases_can_qualify(severity):
    assert policy.inspection_decision(warning(severity=severity))[0] is True


@pytest.mark.parametrize("event", [
    {"severity": "warning", "alarm_code": ""},
    {"severity": "warning", "alarm_code": "0"},
    {"severity": "warning", "alarm_code": "000000"},
    {"severity": "critical", "maintenance_required": True, "alarm_code": "W101"},
])
def test_cleared_alarm_and_explicit_event_repair_cannot_be_downgraded(event):
    assert policy.inspection_decision(warning(), event)[0] is False


def test_raw_qualification_failure_cannot_be_hidden_by_outer_false():
    diagnosis = warning(synthetic=False, raw={"synthetic": True})
    assert policy.inspection_decision(diagnosis)[0] is False


def test_fixed_template_is_fresh_and_contains_no_readiness_claim():
    plan = inspection_plan_template()
    assert "workorder_ready" not in plan
    assert "confidence" not in plan
    assert not inspection_plan_findings(plan)
    plan["repair_steps"].append("更换零件")
    assert inspection_plan_findings(plan)
    assert not inspection_plan_findings(inspection_plan_template())


@pytest.mark.parametrize("key", ["repair_steps", "pre_checks", "post_checks", "safety", "safety_requirements"])
def test_missing_fixed_scope_procedure_is_not_an_inspection(key):
    plan = inspection_plan_template()
    del plan[key]
    assert inspection_plan_findings(plan)


def test_workorder_draft_cannot_hide_repair_or_equipment_control_steps():
    plan = inspection_plan_template()
    plan["workorder_draft"] = {"steps": ["拆卸轴承并启动测试"]}
    assert inspection_plan_findings(plan)
    plan["workorder_draft"]["steps"] = deepcopy(plan["repair_steps"])
    assert not inspection_plan_findings(plan)


def test_invalid_numeric_confidence_does_not_qualify_as_reliable_warning():
    assert policy.inspection_decision(warning(confidence=1.1))[0] is False


def test_explicit_event_repair_required_is_not_overridden_by_diagnosis_no_repair():
    assert policy.inspection_decision(warning(), {"maintenance_required": True})[0] is False


@pytest.mark.parametrize("evidence", [[], [None], [""], [{}]])
def test_ready_label_without_actual_diagnosis_evidence_does_not_qualify(evidence):
    assert policy.inspection_decision(warning(evidence=evidence))[0] is False


def test_evidence_records_can_support_reliable_warning_without_text_evidence():
    diagnosis = warning(evidence=[], evidence_records=[{"source": "monitor", "summary": "当前预警 W101"}])
    assert policy.inspection_decision(diagnosis)[0] is True


def test_low_environment_threshold_does_not_allow_unreliable_inspection(monkeypatch):
    monkeypatch.setenv("AUTO_WORKORDER_MIN_CONFIDENCE", "0.5")
    assert policy.inspection_decision(warning(confidence=0.79))[0] is False


def test_higher_environment_threshold_remains_enforced(monkeypatch):
    monkeypatch.setenv("AUTO_WORKORDER_MIN_CONFIDENCE", "0.95")
    assert policy.inspection_decision(warning(confidence=0.91))[0] is False


@pytest.mark.parametrize("event,plan", [
    ({"device_id": "D-OTHER"}, None),
    (None, {"device_id": "D-OTHER"}),
    (None, {"diagnosis": {"device_id": "D-OTHER"}}),
    ({"device_id": "D-WARNING", "realtime_snapshot": {"device_id": "D-OTHER"}}, None),
])
def test_inspection_never_crosses_diagnosis_event_plan_or_current_device(event, plan):
    assert policy.inspection_decision(warning(), event, plan)[0] is False


@pytest.mark.parametrize("snapshot", [
    {"status": "normal", "alarm_code": "W101"},
    {"status": "warning", "alarm_code": ""},
    {"status": "warning", "alarm_code": "0"},
    {"status": "warning", "alarm_active": False},
    {"status": "warning", "alarm_code": "W102"},
    {"found": False, "status": "warning", "alarm_code": "W101"},
])
def test_old_warning_cannot_override_current_normal_or_cleared_alarm(snapshot):
    assert policy.inspection_decision(warning(), {"realtime_snapshot": snapshot})[0] is False


def test_matching_current_warning_and_device_are_eligible():
    event = {"device_id": "D-WARNING", "alarm_code": "W101", "severity": "warning",
             "realtime_snapshot": {"device_id": "D-WARNING", "alarm_code": "W101", "status": "warning"}}
    assert policy.inspection_decision(warning(), event, inspection_plan(device_id="D-WARNING"))[0] is True
