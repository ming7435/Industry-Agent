import sys
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.cad import CADAgent
from app.agents.diagnosis import DiagnosisAgent
from app.agents.diagnosis.graph import execute_tool_calls, loop_guard, record_tool_observations
from app.agents.diagnosis.schemas import DiagnosisState
from app.agents.maintenance import MaintenanceAgent
from app.tools.registry import ToolRegistry
from app.validator import DiagnosisView, MaintenancePlan
from app.workorder import WorkOrderService


def _event():
    return {
        "event_id": "EVT-CONTRACT-001",
        "device_id": "CNC-001",
        "alarm_code": "E102",
        "event_type": "temperature",
        "severity": "high",
        "abnormal_metrics": [{"label": "spindle_temperature", "value": 85}],
    }


def test_diagnosis_tool_result_is_written_to_observations():
    agent = DiagnosisAgent()
    runtime = DiagnosisState(abnormal_event=_event(), step_count=1)
    state = {
        "agent": agent,
        "agent_state": runtime,
        "guarded_calls": [{
            "id": "call-1",
            "function": {
                "name": "get_alarm_definition",
                "arguments": '{"alarm_code": "E102"}',
            },
        }],
    }

    acted = execute_tool_calls(state)
    observed = record_tool_observations({**state, **acted})

    assert runtime.tool_results
    assert runtime.observations
    assert runtime.observations[0]["tool"] == "get_alarm_definition"
    assert observed["route"] == "loop_guard"


def test_loop_guard_falls_back_at_max_steps():
    runtime = DiagnosisState(abnormal_event=_event(), step_count=6, max_steps=6)

    result = loop_guard({"agent_state": runtime})

    assert result["route"] == "fallback"
    assert runtime.stop_reason == "max_steps"


def test_cad_result_contains_engineering_context_contract():
    result = CADAgent(ToolRegistry()).run({
        "device_id": "CNC-001",
        "component": "COOLING-PUMP",
        "query": "冷却泵位置",
    })

    assert isinstance(result.drawing_refs, list)
    assert isinstance(result.viewer_context, dict)
    assert {"model_url", "mesh_id", "mesh_name", "location", "default_view"} <= set(result.viewer_context)


def test_maintenance_plan_contains_target_part():
    result = MaintenanceAgent(ToolRegistry()).run({
        "device_id": "CNC-001",
        "diagnosis_result": {
            "fault": "主轴温度异常",
            "cause": "冷却系统异常",
            "severity": "high",
        },
        "knowledge": {"documents": [{"document_id": "SOP-001"}], "recommended_checks": []},
        "cad": {
            "components": [{
                "component_id": "COOLING-PUMP",
                "part_no": "CP-TC820-015",
                "name": "冷却泵",
                "position": "机床后侧冷却单元",
                "drawing_ref": "DWG-TC820-COOLING-002",
            }],
            "bom_items": [{"part_no": "CP-TC820-015", "name": "冷却泵"}],
            "drawings": [{"drawing_id": "DWG-TC820-COOLING-002"}],
            "assembly_relations": [{"component_id": "COOLING-PUMP"}],
            "locations": [{"component_id": "COOLING-PUMP", "location": "机床后侧冷却单元"}],
            "evidence": [],
        },
    })

    assert {"part_no", "part_name", "component"} <= set(result.target_part)
    assert result.target_part["part_no"] == "CP-TC820-015"


def test_workorder_saves_drawing_context_from_plan():
    tools = ToolRegistry()
    plan = MaintenancePlan(
        plan_id="PLAN-CONTRACT-001",
        diagnosis=DiagnosisView(
            device_id="CNC-001",
            fault="主轴轴承异常",
            cause="振动升高",
            severity="high",
        ),
        repair_target="主轴轴承",
        repair_steps=["检查轴承"],
        target_part={"part_no": "BRG-001", "part_name": "主轴轴承", "component": "SPINDLE-ASSY"},
        engineering_context={
            "drawing_refs": [{
                "drawing_id": "DWG-001",
                "drawing_url": "/drawings/DWG-001",
                "drawing_type": "pdf",
            }],
            "viewer_context": {
                "model_url": "/models/SPINDLE.glb",
                "mesh_name": "主轴组件",
                "location": "主轴箱",
            },
        },
    )

    order = WorkOrderService(tools).create_from_plan(plan)

    assert order.repair_target["part_no"] == "BRG-001"
    assert order.drawing_context == {
        "drawing_url": "/drawings/DWG-001",
        "model_url": "/models/SPINDLE.glb",
        "mesh_name": "主轴组件",
        "location": "主轴箱",
    }
