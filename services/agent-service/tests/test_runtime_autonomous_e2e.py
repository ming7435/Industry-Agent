from types import SimpleNamespace

from app.agents.base import BaseAgent
from app.harness import TraceRecorder
from app.runtime.capability import CapabilityRegistry
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager
from app.runtime.planner import Planner


class _LifecycleAgent(BaseAgent):
    def __init__(self, name, capability):
        self.name = name
        self.capabilities = (capability,)

    def run(self, _task):
        output = {
            "status": "completed",
            "evidence": [{"id": "%s-evidence" % self.capabilities[0]}],
            "confidence": 0.95,
        }
        if self.capabilities[0] == "workorder_create":
            output.update({"status": "open", "workorder_id": "WO-RUNTIME-1"})
        if self.capabilities[0] == "experience_learning":
            output.update({"rag_saved": True, "experience_id": "EXP-RUNTIME-1"})
        return output


def test_runtime_autonomous_lifecycle_closes_with_learning_and_trace():
    from app.runtime.coordinator import RuntimeCoordinator

    trace = TraceRecorder()
    registry = CapabilityRegistry()
    names = {
        "fault_analysis": "diagnosis",
        "document_search": "knowledge",
        "drawing_search": "cad",
        "repair_planning": "maintenance",
        "workorder_create": "workorder",
        "quality_inspection": "quality",
        "experience_learning": "memory",
    }
    registry.register_agents(_LifecycleAgent(name, capability) for capability, name in names.items())
    dispatcher = RuntimeDispatcher(
        registry,
        ExecutionManager(trace=lambda event, payload: trace.record(event=event, **payload)),
        trace=trace,
    )
    planner = Planner(
        capabilities=registry,
        trace=lambda event, payload: trace.record(event=event, **payload),
    )
    container = SimpleNamespace(planner=Planner(), dispatcher=dispatcher, trace=trace)
    container.planner = planner
    result = RuntimeCoordinator(container).run({
        "entry": "trigger",
        "task_id": "TASK-AUTO-E2E",
        "trace_id": "TRACE-AUTO-E2E",
        "event": {
            "event_id": "EVT-AUTO-E2E",
            "device_id": "D-AUTO-1",
            "event_type": "alarm",
            "required_capabilities": [
                "fault_analysis", "document_search", "drawing_search", "repair_planning",
                "workorder_create", "quality_inspection", "experience_learning",
            ],
        },
    })

    assert result["runtime_result"]["status"] == "completed"
    assert [item["payload"]["required_capability"] for item in result["runtime_plan"]["actions"]] == [
        "fault_analysis", "document_search", "drawing_search", "repair_planning",
        "workorder_create", "quality_inspection", "experience_learning",
    ]
    assert result["workorder"]["workorder_id"] == "WO-RUNTIME-1"
    assert result["memory"]["experience_id"] == "EXP-RUNTIME-1"
    events = {item["event"] for item in trace.list(trace_id="TRACE-AUTO-E2E")}
    assert {
        "planner_start", "planner_end", "action_selected", "capability_selected",
        "execution_start", "execution_end", "evidence_added", "evaluation_result",
        "loop_continue", "loop_stop",
    } <= events
