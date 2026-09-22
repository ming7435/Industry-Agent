from monitor_web_server import build_auto_workorder_payload
from app.graph import build_orchestrator


def test_build_auto_workorder_payload_contains_dynamic_plan_and_idempotency_key():
    payload = build_auto_workorder_payload(
        {
            "event_id": "EVT-700015-001",
            "device_id": "TRAK-TC820LTYSI-001",
            "alarm_code": "700015",
        },
        {
            "device_id": "TRAK-TC820LTYSI-001",
            "fault": "送料机未就绪",
            "diagnosis": "送料机就绪信号丢失",
            "recommendation": "检查送料机就绪信号和线路",
        },
        {
            "plan_id": "PLAN-001",
            "repair_steps": ["停机并断电", "检查送料机信号"],
            "target_part": {"component": "BARFEEDER", "part_name": "棒料送料机"},
            "engineering_context": {"drawing_url": "TC820si.html", "mesh_name": "BARFEEDER"},
        },
    )

    assert payload["source"] == "monitor"
    assert payload["idempotency_key"] == "monitor:EVT-700015-001"
    assert payload["device_id"] == "TRAK-TC820LTYSI-001"
    assert payload["alarm_code"] == "700015"
    assert payload["steps"] == ["停机并断电", "检查送料机信号"]
    assert payload["repair_target"]["component"] == "BARFEEDER"
    assert payload["drawing_context"]["mesh_name"] == "BARFEEDER"


def test_trigger_flow_generates_report_after_workorder():
    graph = build_orchestrator().graph.get_graph()
    edges = {(edge.source, edge.target) for edge in graph.edges}

    assert ("workorder", "report") in edges
