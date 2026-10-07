"""设备参考图可查看，但不能替代故障部件的 CAD/BOM 工程依据。"""
from copy import deepcopy

import pytest

from app.agents.maintenance.agent import MaintenanceAgent
from app.agents.maintenance.validator import MaintenancePlanValidator
from runtime_slimming_adapter import build_test_orchestrator


def diagnosis():
    return {
        "device_id": "DEVICE-DRAWING", "fault": "润滑泵压力异常", "cause": "润滑供给不足",
        "severity": "high", "confidence": 0.95, "maintenance_required": True,
        "evidence_status": "ready", "evidence_validated": True, "evidence": ["当前润滑压力报警"],
    }


def repair_plan():
    return {
        "repair_target": "润滑系统", "repair_steps": ["检查润滑泵压力"], "safety": ["停机隔离"],
        "diagnosis": diagnosis(), "cad_required": True, "cad_components": ["LUB"],
    }


def engineering():
    return {"components": [{"component_id": "LUB", "part_no": "LUB-REAL", "name": "润滑泵"}]}


def local_drawing():
    return {
        "drawing_id": "DEVICE-REFERENCE", "device_id": "DEVICE-DRAWING", "name": "设备总图",
        "drawing_url": "/drawings/device-reference.png", "model_url": "/drawings/device-reference.glb",
        "evidence_scope": "device_reference", "engineering_status": "reference_only",
    }


def findings(cad, plan=None):
    value = plan or repair_plan()
    return MaintenancePlanValidator.validate(value, {"documents": [{"document_id": "SOP-LUB"}]}, cad)


@pytest.mark.parametrize("failure", [
    {"status": "insufficient_engineering_data"}, {"status": "error"}, {"status": "failed"},
    {"error": "engineering service unavailable"},
    {"validation_findings": ["部件缺少零件号：LUB"]},
    {"findings": ["BOM 零件号未匹配 CAD 部件：LUB-REAL"]},
    {"errors": ["未解析到工程部件"]},
])
def test_cad_failure_cannot_be_hidden_by_matching_component_ids(failure):
    plan = repair_plan()
    result = findings({**engineering(), **failure}, plan)
    assert result
    assert MaintenancePlanValidator.workorder_ready(result, plan) is False


@pytest.mark.parametrize("marker", [
    {"engineering_status": "reference_only"}, {"evidence_scope": "device_reference"},
])
def test_reference_only_component_cannot_satisfy_engineering_match(marker):
    cad = engineering()
    cad["components"][0].update(marker)
    result = findings(cad)
    assert result
    assert MaintenancePlanValidator.workorder_ready(result, repair_plan()) is False


@pytest.mark.parametrize("status", [None, "completed"])
def test_valid_engineering_provider_without_status_remains_compatible(status):
    cad = engineering()
    if status:
        cad["status"] = status
    assert findings(cad) == []
    assert MaintenancePlanValidator.workorder_ready([], repair_plan()) is True


def test_non_cad_inspection_does_not_require_reference_drawing_validation():
    plan = {**repair_plan(), "repair_steps": ["读取互锁状态并记录"], "cad_required": False, "cad_components": []}
    assert findings({"status": "insufficient_engineering_data", "error": "not an engineering part",
                     "validation_findings": ["未解析到工程部件"], "drawings": [local_drawing()]}, plan) == []


def test_reference_drawing_failure_explains_missing_component_evidence():
    plan = {**repair_plan(), "cad_components": []}
    result = findings({"status": "insufficient_engineering_data", "drawings": [local_drawing()]}, plan)
    assert any("已找到设备图纸" in item and "故障部件" in item and "CAD/BOM" in item for item in result)
    assert not any("缺少图纸" in item or "无图纸" in item for item in result)


def test_no_reference_drawings_preserves_missing_engineering_reason():
    result = findings({}, {**repair_plan(), "cad_components": []})
    assert "涉及拆装或部件操作但缺少 CAD/BOM 依据" in result


def make_plan(tmp_path, monkeypatch, cad, inventory=None):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    runtime.test_boundary.responses[("inventory", "query_inventory")] = inventory or {}
    runtime.test_boundary.responses[("inventory", "query_part_availability")] = inventory or {}
    return runtime.container.agents["maintenance"].run({
        "diagnosis": diagnosis(), "runtime_managed": True, "cad": deepcopy(cad),
        "knowledge": {"documents": [{"document_id": "SOP-LUB"}]},
    })


def test_agent_keeps_reference_urls_and_scope_without_inventing_components(tmp_path, monkeypatch):
    plan = make_plan(tmp_path, monkeypatch, {"status": "insufficient_engineering_data", "drawings": [local_drawing()]})
    assert plan.workorder_ready is False
    assert plan.cad_components == []
    assert plan.target_part["part_no"] == ""
    assert plan.target_part["component"] == ""
    available = plan.engineering_context.get("available_drawings", [])
    assert len(available) == 1
    assert available[0]["drawing_url"] == "/drawings/device-reference.png"
    assert available[0]["model_url"] == "/drawings/device-reference.glb"
    assert available[0]["device_id"] == "DEVICE-DRAWING"
    assert available[0]["evidence_scope"] == "device_reference"
    assert available[0]["engineering_status"] == "reference_only"
    assert any(item.get("drawing_url") == "/drawings/device-reference.png"
               and item.get("evidence_scope") == "device_reference" for item in plan.evidence)
    assert plan.workorder_draft["drawing_context"]["drawing_url"] == "/drawings/device-reference.png"
    assert plan.workorder_draft["drawing_context"]["model_url"] == "/drawings/device-reference.glb"


def test_insufficient_cad_missing_part_number_blocks_real_maintenance_graph(tmp_path, monkeypatch):
    cad = {"status": "insufficient_engineering_data", "components": [
        {"component_id": "LUB", "name": "润滑泵", "device_id": "DEVICE-DRAWING", "part_no": ""}],
        "drawings": [local_drawing()], "validation_findings": ["部件缺少零件号：LUB"]}
    stock = {"parts": [{"part_id": "LUB-REAL", "name": "润滑泵", "available": True, "stock": 2}]}
    plan = make_plan(tmp_path, monkeypatch, cad, stock)
    assert plan.workorder_ready is False
    assert any("部件缺少零件号" in item for item in plan.validation_findings)


def test_reference_only_component_never_becomes_plan_cad_or_target(tmp_path, monkeypatch):
    cad = {"components": [{"component_id": "DEVICE-REFERENCE", "part_no": "REFERENCE-NOT-A-PART",
                          "name": "润滑泵设备示意图", "evidence_scope": "device_reference",
                          "engineering_status": "reference_only"}], "drawings": [local_drawing()]}
    plan = make_plan(tmp_path, monkeypatch, cad)
    assert plan.cad_components == []
    assert plan.target_part["part_no"] == ""
    assert plan.required_parts == []
    assert plan.workorder_ready is False


def test_cad_request_merge_keeps_failure_even_after_successful_partial_response():
    merged = {}
    MaintenanceAgent._merge_cad_result(merged, {"status": "completed", **engineering()})
    MaintenanceAgent._merge_cad_result(merged, {"status": "error", "error": "BOM unavailable", "validation_findings": ["缺少 BOM 物料依据"]})
    result = findings(merged)
    assert result
    assert MaintenancePlanValidator.workorder_ready(result, repair_plan()) is False


def test_existing_cad_reference_context_gets_model_fallback_without_duplicate_refs(tmp_path, monkeypatch):
    cad = {"status": "insufficient_engineering_data", "drawings": [local_drawing()],
           "drawing_refs": [{"drawing_id": "DEVICE-REFERENCE", "drawing_url": "/drawings/device-reference.png"}],
           "drawing_ref_details": [{"drawing_id": "DEVICE-REFERENCE", "drawing_url": "/drawings/device-reference.png"}],
           "viewer_context": {"model_url": "", "mesh_id": "", "mesh_name": "", "location": "", "default_view": ""}}
    plan = make_plan(tmp_path, monkeypatch, cad)
    assert len(plan.engineering_context["drawing_refs"]) == 1
    assert len(plan.engineering_context["drawing_ref_details"]) == 1
    assert plan.engineering_context["drawing_ref_details"][0]["evidence_scope"] == "device_reference"
    assert plan.workorder_draft["drawing_context"]["model_url"] == "/drawings/device-reference.glb"


def test_partial_cad_merge_preserves_later_validation_failure():
    merged = {}
    MaintenanceAgent._merge_cad_result(merged, {"validation": {"pass": True}, **engineering()})
    MaintenanceAgent._merge_cad_result(merged, {"validation": {"pass": False, "errors": ["缺少 BOM 物料依据"]}})
    assert findings(merged)
