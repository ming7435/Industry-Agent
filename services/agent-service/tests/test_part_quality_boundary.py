from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app
from app.closure import ClosureService


@pytest.fixture
def quality_client():
    runtime = SimpleNamespace(container=SimpleNamespace(closure_service=ClosureService()))
    return TestClient(create_app(orchestrator=runtime))


def test_quality_record_defaults_to_production_part(quality_client):
    response = quality_client.post("/api/v1/quality/checks", json={"target_id": "PART-1"})

    assert response.status_code == 200
    assert response.json()["target_type"] == "production_part"
    assert response.json()["inspection_type"] == "part_quality"


@pytest.mark.parametrize("fields", [
    {"target_type": "workorder"},
    {"inspection_type": "repair_verification"},
])
def test_quality_record_rejects_repair_inspections(quality_client, fields):
    response = quality_client.post(
        "/api/v1/quality/checks", json={"target_id": "WO-1", **fields},
    )

    assert response.status_code == 422
    assert quality_client.get("/api/v1/quality/checks").json()["count"] == 0
    with pytest.raises(ValueError, match="only support"):
        ClosureService().create_quality_check({"target_id": "WO-1", **fields})


def test_workorder_quality_entry_is_removed(quality_client):
    assert quality_client.post("/api/workorders/WO-1/quality").status_code == 404
    assert "/api/workorders/{workorder_id}/quality" not in quality_client.get("/openapi.json").json()["paths"]


@pytest.mark.parametrize("capability", ["quality_inspection", "quality_review"])
def test_both_quality_capabilities_dispatch_part_context(capability):
    from app.agents.base import BaseAgent
    from app.runtime.capability import CapabilityRegistry
    from app.runtime.coordinator import RuntimeCoordinator
    from app.runtime.dispatcher import RuntimeDispatcher
    from app.runtime.execution import ExecutionManager
    from app.runtime.planner import Planner
    from app.harness import TraceRecorder

    class PartAgent(BaseAgent):
        name = "quality"
        capabilities = ("quality_inspection", "quality_review")

        def run(self, task):
            assert task["part_id"] == "PART-1"
            return {"part_id": task["part_id"], "inspection_type": "part_quality", "qualified": True}

    registry = CapabilityRegistry()
    registry.register_agent(PartAgent())
    container = SimpleNamespace(
        trace=TraceRecorder(), planner=Planner(registry),
        dispatcher=RuntimeDispatcher(registry, ExecutionManager()),
    )
    result = RuntimeCoordinator(container).run({
        "entry": "user", "user_text": "检查生产零件", "context": {
            "part_id": "PART-1", "required_capabilities": [capability],
        },
    })

    assert result["runtime_result"]["status"] == "completed"
    assert result["quality"]["part_id"] == "PART-1"
    assert result["quality"]["inspection_type"] == "part_quality"
