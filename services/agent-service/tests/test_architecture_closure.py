from app.agents.router import RouterAgent
from app.graph import build_orchestrator
from app.tools.registry import ToolRegistry


def test_router_uses_context_route_hint():
    result = RouterAgent().run(
        {
            "user_text": "当前任务",
            "context": {"route_hint": "cad", "component": "COOLING-PUMP"},
        }
    )

    assert result.intent == "cad"
    assert result.entities["route_hint"] == "cad"


def test_orchestrator_executes_workorder_business_node():
    orchestrator = build_orchestrator(tools=ToolRegistry())
    result = orchestrator.run_user(
        "请创建工单",
        {
            "device_id": "CNC-001",
            "title": "主轴维修",
            "repair_target": {
                "part_no": "SP-001",
                "part_name": "主轴轴承",
                "component": "主轴",
            },
            "drawing_context": {
                "drawing_url": "/cad/drawings/SP-001.pdf",
                "model_url": "/cad/models/SP-001.glb",
                "mesh_name": "spindle-bearing",
                "location": "主轴箱",
            },
        },
    )

    assert result["route"] == "workorder_action"
    assert result["workorder"]["repair_target"]["part_no"] == "SP-001"
    assert result["workorder"]["drawing_context"]["drawing_url"] == "/cad/drawings/SP-001.pdf"
    assert any(item.get("node") == "workorder_action" for item in result["trace"])


def test_cad_a2a_preserves_structured_mapping():
    orchestrator = build_orchestrator(tools=ToolRegistry())
    result = orchestrator.nodes._cad_a2a(
        "TASK-CAD-CONTRACT",
        "maintenance",
        "冷却泵",
        {
            "component": "COOLING-PUMP",
            "part_no": "CP-TC820-015",
            "device_id": "CNC-001",
        },
    )

    assert result["drawing_ref_details"]
    detail = result["drawing_ref_details"][0]
    assert {"drawing_id", "part_no", "model_url", "location"} <= detail.keys()
