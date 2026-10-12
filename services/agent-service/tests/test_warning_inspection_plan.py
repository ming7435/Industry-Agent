"""Nonrepair warnings generate no plan; old inspection content remains readable."""
from copy import deepcopy

import pytest

from app.agents.maintenance.schemas import MaintenanceQuery
from app.agents.maintenance.validator import MaintenancePlanValidator
from app.contracts import MaintenancePlan
from app.workorder.inspection import inspection_plan_template
from runtime_slimming_adapter import build_test_orchestrator


def warning(**changes):
    return {
        "device_id": "M-WARNING", "alarm_code": "700003", "fault": "润滑压力偏低预警",
        "cause": "需要现场核查反馈", "severity": "warning", "confidence": 0.95,
        "maintenance_required": False, "evidence_status": "ready", "evidence_validated": True,
        "evidence": ["当前有效预警及压力反馈"], "validation_errors": [],
        "alarm_definition": {"alarm_code": "700003", "found": True, "severity": "warning", "name": "润滑压力偏低预警"},
        **changes,
    }


def reference():
    return {"drawing_id": "DEVICE-REF", "device_id": "M-WARNING", "drawing_url": "/drawings/TC820si.html",
            "model_url": "/drawings/TC820si.html", "evidence_scope": "device_reference", "engineering_status": "reference_only"}


def run_plan(tmp_path, monkeypatch, value=None, knowledge=None, cad=None, **request_changes):
    monkeypatch.setenv("AUTO_WORKORDER_MIN_CONFIDENCE", "0.80")
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    stock = {"parts": [{"part_id": "LUB-REAL", "name": "润滑泵", "stock": 3, "available": True}]}
    runtime.test_boundary.responses[("inventory", "query_inventory")] = stock
    runtime.test_boundary.responses[("inventory", "query_part_availability")] = stock
    names = []
    original = runtime.container.tools.execute
    def execute(name, arguments):
        names.append(name)
        return original(name, arguments)
    monkeypatch.setattr(runtime.container.tools, "execute", execute)
    request = {
        "diagnosis": value or warning(), "runtime_managed": True,
        "event": {"device_id": "M-WARNING", "alarm_code": "700003", "alarm_active": True},
        "context": {"alarm_active": True},
        "knowledge": knowledge if knowledge is not None else {"documents": [{"document_id": "SOP-WARNING"}]},
        "cad": cad or {}, **request_changes,
    }
    if (value or warning()).get('maintenance_required') is False:
        with pytest.raises(ValueError, match='无需维修'):
            runtime.container.agents['maintenance'].run(request)
        plan = None
    else:
        plan = runtime.container.agents['maintenance'].run(request)
    return runtime, plan, names


def test_reliable_nonrepair_warning_generates_no_plan_or_tools(tmp_path, monkeypatch):
    _, plan, names = run_plan(tmp_path, monkeypatch)
    assert plan is None and names == []


def test_reference_and_engineering_stock_do_not_turn_inspection_into_repair(tmp_path, monkeypatch):
    cad = {"status": "insufficient_engineering_data", "validation_findings": ["缺少工程零件号"],
           "drawings": [reference()], "components": [{"component_id": "LUB", "part_no": "LUB-REAL", "name": "润滑泵"}]}
    _, plan, names = run_plan(tmp_path, monkeypatch, cad=cad)
    assert plan is None and names == []


def test_inspection_does_not_reuse_sop_repair_or_trial_run_steps(tmp_path, monkeypatch):
    knowledge = {"documents": [{"document_id": "SOP-WARNING"}],
                 "recommended_checks": ["更换冷却泵", "拆卸主轴检查轴承", "启动机器试运行"]}
    _, plan, names = run_plan(tmp_path, monkeypatch, knowledge=knowledge)
    assert plan is None and names == []


@pytest.mark.parametrize("changes", [
    {"confidence": 0.79}, {"requires_human_review": True}, {"synthetic": True},
    {"evidence_status": "insufficient"}, {"evidence_validated": False},
    {"validation_errors": ["设备证据未通过校验"]}, {"alarm_code": "", "alarm_definition": {}},
    {"evidence": []}, {"severity": "normal", "alarm_definition": {}},
    {"severity": "unknown", "alarm_definition": {}},
])
def test_unreliable_warning_cannot_be_selected_by_external_inspection_fields(tmp_path, monkeypatch, changes):
    _, plan, _ = run_plan(tmp_path, monkeypatch, warning(**changes), plan_kind="inspection", inspection_required=True)
    assert plan is None


def test_missing_knowledge_still_blocks_inspection(tmp_path, monkeypatch):
    _, plan, _ = run_plan(tmp_path, monkeypatch, knowledge={})
    assert plan is None


@pytest.mark.parametrize("changes", [
    {"repair_steps": ["启动机器并记录"]}, {"pre_checks": ["读取反馈后启动机器"]},
    {"post_checks": ["解除互锁后启动机器"]}, {"parts": ["LUB-REAL 润滑泵"]},
    {"required_parts": ["LUB-REAL"]}, {"cad_components": ["LUB"]}, {"cad_required": True},
])
def test_tampered_inspection_scope_never_passes_validator(tmp_path, monkeypatch, changes):
    data = {**inspection_plan_template(), "plan_id": 'PLAN-LEGACY', "plan_kind": "inspection", "inspection_required": True,
            "diagnosis": warning(), **deepcopy(changes)}
    cad = {"components": [{"component_id": "LUB", "part_no": "LUB-REAL", "name": "润滑泵"}]}
    stock = {"parts": [{"part_id": "LUB-REAL", "available": True, "stock": 3}]}
    result = MaintenancePlanValidator.validate(data, {"documents": [{"document_id": "SOP-WARNING"}]}, cad, stock)
    assert result
    assert MaintenancePlanValidator.workorder_ready(result, data) is False


def test_explicit_mechanical_repair_keeps_original_engineering_gate(tmp_path, monkeypatch):
    _, plan, names = run_plan(tmp_path, monkeypatch, warning(maintenance_required=True, fault="润滑泵失效，需要更换"))
    assert plan.model_dump().get("plan_kind", "repair") == "repair"
    assert plan.cad_required is True
    assert plan.workorder_ready is False
    assert any("CAD/BOM" in item for item in plan.validation_findings)
    assert "generate_repair_plan" in names


def test_schema_preserves_runtime_context_and_plan_mode_round_trip():
    request = MaintenanceQuery.from_payload({"diagnosis": warning(), "runtime_managed": True,
                                            "event": {"alarm_active": True}, "context": {"alarm_active": True}}).model_dump()
    assert request.get("runtime_managed") is True
    assert request.get("event") == {"alarm_active": True}
    assert request.get("context") == {"alarm_active": True}
    data = {"plan_id": "PLAN-CHECK", "diagnosis": warning(), "plan_kind": "inspection", "inspection_required": True}
    restored = MaintenancePlan.model_validate_json(MaintenancePlan(**data).model_dump_json()).model_dump()
    assert restored.get("plan_kind") == "inspection"
    assert restored.get("inspection_required") is True
    assert MaintenancePlan(plan_id="PLAN-OLD", diagnosis=warning()).model_dump().get("plan_kind") == "repair"


def test_inspection_reason_is_persisted_for_api_and_frontend(tmp_path, monkeypatch):
    plan = MaintenancePlan(plan_id='PLAN-LEGACY', diagnosis=warning(), inspection_reason='历史现场检查记录',
                           **inspection_plan_template())
    restored = MaintenancePlan.model_validate_json(plan.model_dump_json()).model_dump()
    reason = restored.get("inspection_reason")
    assert isinstance(reason, str) and "现场检查" in reason
    assert MaintenancePlan(plan_id="PLAN-OLD", diagnosis=warning()).model_dump().get("inspection_reason") == ""
