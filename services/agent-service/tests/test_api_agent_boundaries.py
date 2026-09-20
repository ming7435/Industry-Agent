import sys
from pathlib import Path

from fastapi.testclient import TestClient


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.api.server import create_app
from app.graph import build_orchestrator
from app.tools.registry import ToolRegistry


def test_workorder_api_routes_lifecycle_actions_through_agent() -> None:
    runtime = build_orchestrator(tools=ToolRegistry())
    client = TestClient(create_app(runtime))

    created = client.post(
        "/api/workorders",
        json={"device_id": "CNC-API-001", "title": "主轴维修", "steps": ["检查轴承"]},
    ).json()
    workorder_id = created["workorder_id"]

    assert created["success"] is True
    assert created["assignee"]
    assert created["dispatch_context"]["candidates"][0]["dispatch_score"] >= 0

    for action, extra in (
        ("assign", {"assignee": "TECH-001"}),
        ("submit_feedback", {"feedback": "已完成现场检查"}),
        ("mark_repair_completed", {"feedback": "已完成检查并复测"}),
        ("close", {}),
    ):
        response = client.post(f"/api/workorders/{workorder_id}/action", json={"action": action, **extra})
        assert response.status_code == 200
        assert response.json()["success"] is True

    queried = client.get(f"/api/workorders/{workorder_id}").json()
    assert queried["workorder"]["status"] == "closed"


def test_memory_api_rejects_empty_search_and_uses_memory_agent() -> None:
    runtime = build_orchestrator(tools=ToolRegistry())
    client = TestClient(create_app(runtime))

    response = client.get("/api/memory/search")
    payload = response.json()

    assert response.status_code == 200
    assert payload["success"] is False
    assert "检索条件" in payload["validation_findings"][0]

