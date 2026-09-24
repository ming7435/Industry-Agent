from types import SimpleNamespace

from app.agents.base import AgentResult
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.coordinator import RuntimeCoordinator
from app.runtime.planner import Plan


class _ReplanningPlanner:
    def __init__(self):
        self.calls = []

    def plan(self, goal, context):
        self.calls.append(dict(context))
        if len(self.calls) == 1:
            actions = [
                ActionModel.agent("maintenance", {"required_capability": "repair_planning"}),
                ActionModel.agent("workorder", {"required_capability": "workorder_create"}, side_effect=True, idempotency_key="monitor:EVT-REPLAN"),
            ]
        else:
            actions = [
                ActionModel.agent("maintenance", {"required_capability": "maintenance_replan"}),
                ActionModel.agent("workorder", {"required_capability": "workorder_create"}, side_effect=True, idempotency_key="monitor:EVT-REPLAN"),
            ]
        return Plan(goal=goal, actions=actions)


class _ReplanningDispatcher:
    def __init__(self, always_findings: bool = False):
        self.capabilities = []
        self.workorder_calls = 0
        self.always_findings = always_findings

    def dispatch(self, action, _state):
        capability = action.required_capability
        self.capabilities.append(capability)
        if capability == "repair_planning":
            return AgentResult(
                success=True,
                output={"validation_findings": ["missing torque evidence"]},
                evidence=[{"id": "maintenance-draft"}],
            )
        if capability == "maintenance_replan":
            return AgentResult(
                success=True,
                output=(
                    {"validation_findings": ["torque evidence still missing"]}
                    if self.always_findings
                    else {"workorder_ready": True}
                ),
                evidence=[{"id": "maintenance-replanned"}],
            )
        self.workorder_calls += 1
        return AgentResult(
            success=True,
            output={"workorder_id": "WO-REPLAN", "status": "open"},
            evidence=[{"id": "WO-REPLAN"}],
        )


def test_runtime_replan_calls_planner_again_and_replaces_remaining_actions():
    planner = _ReplanningPlanner()
    dispatcher = _ReplanningDispatcher()
    trace = TraceRecorder()
    container = SimpleNamespace(
        planner=planner,
        dispatcher=dispatcher,
        trace=trace,
        execution_manager=SimpleNamespace(timeout_seconds=2.0),
    )

    result = RuntimeCoordinator(container).run({
        "entry": "trigger",
        "task_id": "TASK-REPLAN",
        "trace_id": "TRACE-REPLAN",
        "event": {"event_id": "EVT-REPLAN", "event_type": "alarm"},
    })

    assert len(planner.calls) == 2
    assert planner.calls[1]["required_capabilities"] == ["maintenance_replan", "workorder_create"]
    assert dispatcher.capabilities == ["repair_planning", "maintenance_replan", "workorder_create"]
    assert dispatcher.workorder_calls == 1
    assert result["runtime_result"]["status"] == "completed"
    assert any(item["event"] == "replan" for item in trace.list(trace_id="TRACE-REPLAN"))


def test_runtime_replan_is_bounded_when_replanned_action_keeps_failing():
    planner = _ReplanningPlanner()
    dispatcher = _ReplanningDispatcher(always_findings=True)
    trace = TraceRecorder()
    container = SimpleNamespace(
        planner=planner,
        dispatcher=dispatcher,
        trace=trace,
        execution_manager=SimpleNamespace(timeout_seconds=2.0),
    )

    result = RuntimeCoordinator(container).run({
        "entry": "trigger",
        "task_id": "TASK-REPLAN-BOUND",
        "trace_id": "TRACE-REPLAN-BOUND",
        "event": {"event_id": "EVT-REPLAN-BOUND", "event_type": "alarm"},
    })

    assert len(planner.calls) == 3
    assert dispatcher.workorder_calls == 0
    assert result["runtime_result"]["status"] == "blocked"


class _DynamicOuterLoopPlanner:
    def __init__(self):
        self.calls = []

    def plan(self, goal, context):
        self.calls.append(dict(context))
        if len(self.calls) == 1:
            return Plan(
                goal=goal,
                actions=[
                    ActionModel.agent(
                        "diagnosis",
                        {"required_capability": "fault_analysis"},
                    )
                ],
            )
        requested = context["required_capabilities"]
        return Plan(
            goal=goal,
            actions=[
                ActionModel.agent(
                    "knowledge",
                    {"required_capability": capability},
                )
                for capability in requested
            ],
        )


class _DynamicOuterLoopDispatcher:
    def __init__(self):
        self.capabilities = []

    def dispatch(self, action, _state):
        capability = action.required_capability
        self.capabilities.append(capability)
        if capability == "fault_analysis":
            return AgentResult(
                success=True,
                output={"fault": "bearing wear"},
                evidence=[{"id": "diagnosis-1"}],
                next_actions=[{"required_capability": "document_search"}],
            )
        return AgentResult(
            success=True,
            output={"documents": ["case-42"]},
            evidence=[{"id": "knowledge-1"}],
        )


def test_runtime_outer_loop_routes_agent_next_actions_through_planner():
    planner = _DynamicOuterLoopPlanner()
    dispatcher = _DynamicOuterLoopDispatcher()
    trace = TraceRecorder()
    container = SimpleNamespace(
        planner=planner,
        dispatcher=dispatcher,
        trace=trace,
        execution_manager=SimpleNamespace(timeout_seconds=2.0),
    )

    result = RuntimeCoordinator(container).run({
        "entry": "trigger",
        "task_id": "TASK-DYNAMIC-OUTER",
        "trace_id": "TRACE-DYNAMIC-OUTER",
        "event": {"event_id": "EVT-DYNAMIC-OUTER", "event_type": "alarm"},
    })

    assert len(planner.calls) == 2
    assert planner.calls[1]["required_capabilities"] == ["document_search"]
    assert dispatcher.capabilities == ["fault_analysis", "document_search"]
    assert result["runtime_result"]["status"] == "completed"
    assert any(
        item["event"] == "replan"
        and item["state_change"].get("reason") == "agent_next_actions"
        for item in trace.list(trace_id="TRACE-DYNAMIC-OUTER")
    )
