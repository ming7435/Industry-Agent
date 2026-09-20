import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.workorder import WorkOrderAgent
from app.tools.registry import ToolRegistry


def test_workorder_agent_creates_assigns_and_keeps_idempotency():
    agent = WorkOrderAgent(ToolRegistry())
    payload = {
        "action": "create", "idempotency_key": "TASK-WO-001",
        "maintenance_plan": {
            "device_id": "CNC-001",
            "diagnosis": {"device_id": "CNC-001", "fault": "主轴轴承异常", "severity": "high"},
            "repair_steps": ["检查轴承"], "risk_level": "high", "workorder_ready": True,
            "target_part": {"component": "主轴轴承"},
        },
    }
    first = agent.run(payload)
    second = agent.run(payload)
    assert first.success is True
    assert first.status == "open"
    assert first.workorder_id == second.workorder_id
    assert first.assignee
    assert first.priority == "high"
    assert first.dispatch_context["candidates"][0]["dispatch_score"] >= first.dispatch_context["candidates"][-1]["dispatch_score"]
    assert first.dispatch_context["candidates"][0]["dispatch_reasons"]


def test_workorder_agent_does_not_accept_missing_plan():
    result = WorkOrderAgent(ToolRegistry()).run({"action": "create"})
    assert result.success is False
    assert result.stop_reason == "validation_failed"
    assert result.validation_findings
