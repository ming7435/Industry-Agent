"""液压报警必须按故障依据派发停机核查，而非要求通用演示备件。"""
import pytest

from app.agents.maintenance.agent import MaintenanceAgent
from app.agents.maintenance.validator import MaintenancePlanValidator
from app.workorder.repair_profile import repair_profile
from runtime_slimming_adapter import build_test_orchestrator


def hydraulic_diagnosis(**changes):
    return {
        "device_id": "M-HYDRAULIC", "alarm_code": "700010", "severity": "critical",
        "fault": "液压压力未达到，影响卡盘、刀塔、尾座和主轴制动",
        "cause": "液压反馈异常，主轴温度和润滑压力正常",
        "alarm_definition": {"name": "液压压力未达到", "severity": "critical"},
        "confidence": 0.94, "evidence_status": "ready", "evidence_validated": True,
        "maintenance_required": True, "evidence": ["700010报警与液压压力趋势异常"],
        **changes,
    }


def hydraulic_knowledge():
    return {"documents": [{"document_id": "HYDRAULIC-TEST-SOURCE", "content":
        "液压压力未达到：检查液压油位、可见泄漏和压力反馈。", "metadata": {"source_name": "test manual"}}],
        "recommended_checks": ["启动液压泵", "更换过滤器", "拆卸主轴"]}


def build_plan(tmp_path, monkeypatch, knowledge=None, **diagnosis_changes):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    runtime.test_boundary.responses[("inventory", "query_inventory")] = {
        "parts": [{"part_id": "设备维修", "name": "维修备件", "stock": 99, "synthetic": True}]}
    plan = runtime.container.agents["maintenance"].run({
        "diagnosis_result": hydraulic_diagnosis(**diagnosis_changes), "runtime_managed": True,
        "knowledge": hydraulic_knowledge() if knowledge is None else knowledge,
        "cad": {"status": "insufficient_engineering_data", "components": [], "drawings": [
            {"drawing_id": "DEVICE-REFERENCE", "engineering_status": "reference_only"}]},
    })
    return runtime, plan


def test_hydraulic_primary_fault_does_not_select_lubrication_or_general():
    assert repair_profile(hydraulic_diagnosis())["kind"] == "hydraulic"
    assert repair_profile(hydraulic_diagnosis(alarm_definition={"name": "刀塔旋转超时"}))["kind"] == "general"


def test_critical_hydraulic_plan_is_non_invasive_and_needs_no_stock(tmp_path, monkeypatch):
    runtime, plan = build_plan(tmp_path, monkeypatch)
    assert plan.workorder_ready, plan.validation_findings
    assert plan.plan_kind == "repair" and plan.maintenance_required
    assert plan.risk_level == "high"
    assert plan.cad_required is False
    assert plan.parts == plan.required_parts == []
    assert plan.source_documents == ["HYDRAULIC-TEST-SOURCE"]
    assert not any(server == "inventory" for server, _, _ in runtime.test_boundary.calls)
    assert all(step not in plan.repair_steps + plan.pre_checks + plan.post_checks
               for step in hydraulic_knowledge()["recommended_checks"])


@pytest.mark.parametrize("knowledge", [{}, {"documents": [{"id": "UNRELATED", "content": "冷却泵维修"}]},
    {"documents": [{"id": "CATALOG", "content": "700010液压压力未达到；700128提醒检查液压油箱油位"}]},
    {"documents": [{"id": "SYNTHETIC", "content": "液压油位检查", "synthetic": True}]}])
def test_hydraulic_plan_requires_real_relevant_checking_evidence(tmp_path, monkeypatch, knowledge):
    _, plan = build_plan(tmp_path, monkeypatch, knowledge=knowledge)
    assert not plan.workorder_ready
    assert any("液压" in finding and "依据" in finding for finding in plan.validation_findings)


@pytest.mark.parametrize("field", ["repair_steps", "pre_checks", "post_checks"])
def test_hydraulic_scope_cannot_be_extended_with_physical_actions(tmp_path, monkeypatch, field):
    _, plan = build_plan(tmp_path, monkeypatch)
    value = plan.model_dump(mode="json")
    value["diagnosis"] = hydraulic_diagnosis()
    value[field].append("更换液压泵")
    findings = MaintenancePlanValidator.validate(value, hydraulic_knowledge(), {})
    assert any("CAD/BOM" in finding for finding in findings)
    assert MaintenancePlanValidator.workorder_ready(findings, value) is False


@pytest.mark.parametrize("changes", [{"evidence_status": "insufficient"}, {"evidence_validated": False}])
def test_hydraulic_scope_preserves_diagnosis_evidence_gates(tmp_path, monkeypatch, changes):
    _, plan = build_plan(tmp_path, monkeypatch, **changes)
    assert plan.workorder_ready is False
