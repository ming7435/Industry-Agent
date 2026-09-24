from types import SimpleNamespace

from app.agents.base import AgentResult
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.coordinator import RuntimeCoordinator
from app.runtime.planner import Plan


class _PolicyPlanner:
    def plan(self, goal, _context):
        return Plan(
            goal=goal,
            actions=[
                ActionModel.agent(
                    "workorder",
                    {"required_capability": "workorder_create"},
                    side_effect=True,
                    idempotency_key="monitor:EVT-POLICY-RUNTIME",
                )
            ],
        )


class _PolicyDispatcher:
    def __init__(self, status):
        self.status = status
        self.calls = 0

    def dispatch(self, _action, _state):
        self.calls += 1
        return AgentResult(
            success=False,
            output={
                "policy_status": self.status,
                "status": "waiting_approval" if self.status == "require_approval" else "blocked",
                "reason": "approval_required" if self.status == "require_approval" else "missing_required_evidence",
            },
        )


def _run(status):
    trace = TraceRecorder()
    dispatcher = _PolicyDispatcher(status)
    result = RuntimeCoordinator(SimpleNamespace(
        planner=_PolicyPlanner(), dispatcher=dispatcher, trace=trace,
        execution_manager=SimpleNamespace(timeout_seconds=2.0),
    )).run({
        "entry": "trigger",
        "task_id": "TASK-POLICY-RUNTIME",
        "trace_id": "TRACE-POLICY-RUNTIME",
        "event": {"event_id": "EVT-POLICY-RUNTIME", "event_type": "alarm"},
    })
    return result, dispatcher, trace


def test_runtime_denial_stops_before_following_actions():
    result, dispatcher, _trace = _run("deny")

    assert dispatcher.calls == 1
    assert result["runtime_result"]["status"] == "blocked"
    assert result["runtime_result"]["stop_reason"] == "missing_required_evidence"
    assert result["runtime_policy"]["status"] == "deny"


def test_runtime_approval_requirement_waits_without_marking_task_completed():
    result, dispatcher, _trace = _run("require_approval")

    assert dispatcher.calls == 1
    assert result["runtime_result"]["status"] == "waiting_approval"
    assert result["runtime_result"]["stop_reason"] == "approval_required"
    assert result["status"] == "waiting_approval"
