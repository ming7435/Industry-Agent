from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.agents.base import BaseAgent
from app.api.server import create_app
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.approval import ApprovalManager, PendingTaskStore
from app.runtime.capability import CapabilityRegistry
from app.runtime.coordinator import RuntimeCoordinator
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager
from app.runtime.planner import Plan


class _ApprovalWorkOrderAgent(BaseAgent):
    name = "workorder"
    capabilities = ("workorder_create",)

    def __init__(self):
        self.calls = 0

    def run(self, _task):
        self.calls += 1
        return {"workorder_id": "WO-RESUMED", "status": "open", "evidence": [{"id": "WO-E1"}]}


class _ApprovalPlanner:
    def __init__(self):
        self.calls = 0

    def plan(self, goal, _context):
        self.calls += 1
        return Plan(
            goal=goal,
            actions=[ActionModel.agent(
                "workorder",
                {"required_capability": "workorder_create", "risk_level": "high"},
                side_effect=True,
                idempotency_key="monitor:EVT-RESUME",
            )],
        )


def _container(tmp_path):
    agent = _ApprovalWorkOrderAgent()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    trace = TraceRecorder()
    dispatcher = RuntimeDispatcher(registry, ExecutionManager(), trace=trace)
    approvals = ApprovalManager(PendingTaskStore(str(tmp_path / "pending.sqlite3")), trace=trace)
    planner = _ApprovalPlanner()
    container = SimpleNamespace(
        planner=planner,
        dispatcher=dispatcher,
        trace=trace,
        approvals=approvals,
        execution_manager=SimpleNamespace(timeout_seconds=2.0),
    )
    coordinator = RuntimeCoordinator(container)
    approvals.resume_callback = coordinator.resume_pending
    return coordinator, approvals, agent, planner, container


def _state():
    return {
        "entry": "trigger",
        "task_id": "TASK-RESUME",
        "trace_id": "TRACE-RESUME",
        "event": {"event_id": "EVT-RESUME", "event_type": "alarm"},
        "diagnosis": {"fault": "bearing wear"},
        "knowledge": {"documents": [{"id": "DOC-1"}]},
        "cad": {"components": [{"id": "PART-1"}]},
        "maintenance_plan": {"workorder_ready": True},
    }


def test_wait_approve_resumes_saved_plan_at_original_action(tmp_path):
    coordinator, approvals, agent, planner, _container_instance = _container(tmp_path)

    waiting = coordinator.run(_state())
    pending_id = waiting["runtime_pending_task"]["pending_id"]
    pending = approvals.get(pending_id)

    resumed = approvals.approve(pending_id, approved_by="operator-1")

    assert pending["action"]["idempotency_key"] == "monitor:EVT-RESUME"
    assert pending["next_index"] == 0
    assert resumed["status"] == "completed"
    assert resumed["result"]["runtime_result"]["status"] == "completed"
    assert agent.calls == 1
    assert planner.calls == 1


def test_wait_reject_finalizes_without_executing_saved_action(tmp_path):
    coordinator, approvals, agent, _planner, _container_instance = _container(tmp_path)

    waiting = coordinator.run(_state())
    pending_id = waiting["runtime_pending_task"]["pending_id"]

    rejected = approvals.reject(pending_id, rejected_by="operator-1", reason="not authorized")

    assert rejected["status"] == "rejected"
    assert rejected["final_status"] == "blocked"
    assert agent.calls == 0


def test_approval_api_resumes_the_waiting_runtime_task(tmp_path):
    coordinator, approvals, agent, _planner, container = _container(tmp_path)
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=container)))

    waiting = coordinator.run(_state())
    pending_id = waiting["runtime_pending_task"]["pending_id"]
    response = client.post(
        "/api/v1/runtime/approvals/%s/approve" % pending_id,
        json={"approved_by": "operator-api", "note": "approved"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["result"]["runtime_result"]["actions"] == ["workorder", "final"]
    assert agent.calls == 1
    events = {item["event"] for item in container.trace.list(trace_id="TRACE-RESUME")}
    assert {"approval_requested", "approval_approved", "approval_resumed"} <= events
