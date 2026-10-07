"""本机设备图纸贯穿只读方案与 CAD 输出，但不替代部件工程证据。"""
from copy import deepcopy

from app.api.maintenance_plans import list_saved_maintenance_plans
from app.agents.cad.agent import CADAgent
from app.tools.registry import ToolRegistry


def saved_plan(device_id="TRAK-TC820LTYSI-001"):
    return {
        "event": {"device_id": device_id, "event_id": "EVENT-DRAWING", "alarm_code": "TEST"},
        "diagnosis": {"device_id": device_id, "fault": "主轴温度异常", "confidence": .95,
                      "evidence_status": "ready", "maintenance_required": True},
        "maintenance_plan": {"plan_id": "PLAN-DRAWING", "workorder_ready": False,
                             "validation_findings": ["涉及拆装或部件操作但缺少 CAD/BOM 依据"]},
    }


def test_saved_unready_plan_can_open_existing_device_drawing_without_rewriting_its_facts(tmp_path, monkeypatch):
    monkeypatch.setenv("LOCAL_DRAWINGS_ROOT", str(tmp_path))
    (tmp_path / "TC820si.html").write_text("<html>isolated drawing fixture</html>", encoding="utf-8")
    source = saved_plan()
    before = deepcopy(source)
    projected = list_saved_maintenance_plans([source])["items"][0]

    assert projected["available_drawings"][0]["drawing_url"] == "/drawings/TC820si.html"
    assert projected["available_drawings"][0]["evidence_scope"] == "device_reference"
    assert projected["dispatch"]["allowed"] is False
    assert projected["workorder_ready"] is False
    assert source == before


def test_missing_or_unmapped_drawing_is_not_advertised_and_deleted_plan_remains_deleted(tmp_path, monkeypatch):
    monkeypatch.setenv("LOCAL_DRAWINGS_ROOT", str(tmp_path))
    assert list_saved_maintenance_plans([saved_plan()])["items"][0].get("available_drawings", []) == []
    (tmp_path / "TC820si.html").write_text("<html>isolated drawing fixture</html>", encoding="utf-8")
    assert list_saved_maintenance_plans([saved_plan("ELITE-CS612-ROBOT-001")])["items"][0].get("available_drawings", []) == []
    assert list_saved_maintenance_plans([saved_plan("")])["items"][0].get("available_drawings", []) == []
    assert list_saved_maintenance_plans([saved_plan()], deleted_plan_ids={"PLAN-DRAWING"})["items"] == []


def test_cad_agent_preserves_reference_provenance_and_does_not_claim_component_evidence():
    tools = ToolRegistry()
    drawing = {
        "drawing_id": "DEVICE-REFERENCE-TC820SI", "drawing_name": "TC820 原始设备图纸",
        "device_id": "TRAK-TC820LTYSI-001", "drawing_url": "/drawings/TC820si.html",
        "model_url": "/drawings/TC820si.html", "drawing_type": "html",
        "evidence_scope": "device_reference", "engineering_status": "reference_only",
        "source_kind": "original_edrawings", "source_path": "frontend/monitor-react/public/drawings/TC820si.html",
    }

    def execute(name, arguments):
        return {"drawings": [drawing] if name in {"query_drawing", "fetch_engineering_record"} else [],
                "parts": [], "bom_items": [], "source": "document-cad-service",
                "synthetic": False, "degraded": False}

    tools.execute = execute
    result = CADAgent(tools).run({"device_id": "TRAK-TC820LTYSI-001", "query": "主轴"})
    assert result.status == "insufficient_engineering_data"
    assert not result.components and not result.bom_items
    assert result.viewer_context["model_url"] == "/drawings/TC820si.html"
    assert "已找到" in result.summary and "部件" in result.summary
    assert result.drawing_ref_details[0]["evidence_scope"] == "device_reference"
    assert result.drawing_ref_details[0]["device_id"] == "TRAK-TC820LTYSI-001"
    assert result.drawing_ref_details[0]["engineering_status"] == "reference_only"
