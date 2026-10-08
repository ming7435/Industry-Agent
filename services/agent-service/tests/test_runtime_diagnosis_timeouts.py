"""只读诊断有独立多轮预算；写操作超时仍保留原有的不重放语义。"""
from threading import Event
from time import sleep
from types import SimpleNamespace

from app.agents.base import AgentResult, BaseAgent
from app.harness import AgentHarness, TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.coordinator import RuntimeCoordinator
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager, ExecutionStatus
from app.runtime.planner import Plan


class SlowDiagnosis(BaseAgent):
    name = "diagnosis"
    capabilities = ("fault_analysis", "diagnosis_review")

    def run(self, _task):
        sleep(0.06)
        return {"status": "completed", "diagnosis": "证据已核对", "confidence": 0.95,
                "evidence_status": "validated", "evidence_validated": True}


def diagnosis_dispatcher(timeout=0.2, retries=0):
    agent = SlowDiagnosis()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    manager = ExecutionManager(timeout_seconds=0.025, max_retries=retries)
    return RuntimeDispatcher(registry, manager,
        harnesses={"diagnosis": AgentHarness(agent, timeout_seconds=timeout)}), manager


def test_diagnosis_finishes_after_default_action_limit_with_its_own_bounded_timeout():
    dispatcher, manager = diagnosis_dispatcher()
    result = dispatcher.dispatch(ActionModel.agent("diagnosis", {"required_capability": "fault_analysis"}))
    assert result.success is True, result.output
    assert result.output["status"] == "completed"
    assert manager.timeout_seconds == 0.025


def test_payload_cannot_raise_the_trusted_diagnosis_deadline():
    dispatcher, _ = diagnosis_dispatcher(timeout=0.2)
    action = ActionModel.agent("diagnosis", {"required_capability": "diagnosis_review", "timeout_seconds": 3600})
    assert dispatcher.action_timeout_seconds(action) == 0.2


def test_outer_step_budget_covers_bounded_read_attempts_without_extending_writes():
    dispatcher, _ = diagnosis_dispatcher(timeout=0.2, retries=2)
    diagnosis = ActionModel.agent("diagnosis", {"required_capability": "fault_analysis"})
    write = ActionModel.agent("workorder", {"required_capability": "workorder_create"},
                              side_effect=True, idempotency_key="once")
    assert abs(dispatcher.step_timeout_seconds(diagnosis) - 0.6) < 1e-9
    assert dispatcher.action_timeout_seconds(write) == 0.025
    assert dispatcher.step_timeout_seconds(write) == 0.025


def test_timed_out_write_keeps_unknown_receipt_and_never_replays_handler():
    release, done = Event(), Event()

    class WorkOrder(BaseAgent):
        name = "workorder"
        capabilities = ("workorder_create",)
        calls = 0

        def run(self, _task):
            self.calls += 1
            try:
                release.wait(2)
                return {"workorder_id": "WO-LATE"}
            finally:
                done.set()

    agent = WorkOrder()
    registry = CapabilityRegistry()
    registry.register_agent(agent)
    manager = ExecutionManager(timeout_seconds=0.025, max_retries=3)
    dispatcher = RuntimeDispatcher(registry, manager,
        harnesses={"workorder": AgentHarness(agent, timeout_seconds=1)})
    action = ActionModel.agent("workorder", {"required_capability": "workorder_create", "timeout_seconds": 3600},
                               side_effect=True, idempotency_key="WRITE-UNKNOWN")
    state = {"diagnosis": {"fault": "轴承故障"}, "knowledge": {"documents": [{"id": "SOP"}]},
             "cad": {"components": [{"id": "PART"}]}, "maintenance_plan": {"workorder_ready": True}}
    coordinator = RuntimeCoordinator(SimpleNamespace(
        planner=SimpleNamespace(plan=lambda goal, _context: Plan(goal=goal, actions=[action])),
        dispatcher=dispatcher, capabilities=registry, trace=TraceRecorder(), execution_manager=manager,
        runtime_step_timeout_grace_seconds=1,
    ))
    state.update(entry="trigger", event={"event_id": "EVT-WRITE-UNKNOWN", "device_id": "M1"},
                 task_id="TASK-WRITE-UNKNOWN", trace_id="TRACE-WRITE-UNKNOWN")
    try:
        first = coordinator.run(state)
        assert first["runtime_result"]["status"] == "timeout"
        assert first["runtime_result"]["stop_reason"] == "execution_timeout"
        record = manager.get(first["runtime_execution"]["execution_id"])
        assert record.status == ExecutionStatus.TIMEOUT
        assert record.side_effect_status == "unknown"
        second = coordinator.run(state)
        assert second["runtime_execution"]["execution_id"] == first["runtime_execution"]["execution_id"]
        assert agent.calls == 1
        assert first["runtime_execution"]["execution_status"] == "TIMEOUT"
        assert first["runtime_execution"]["side_effect_status"] == "unknown"
    finally:
        release.set()
        assert done.wait(3)


def test_outer_runtime_waits_for_timeout_receipt_and_keeps_execution_identity():
    action = ActionModel.agent("diagnosis", {"required_capability": "fault_analysis"})

    class Planner:
        def plan(self, goal, _context):
            return Plan(goal=goal, actions=[action])

    class Dispatcher:
        def step_timeout_seconds(self, _action):
            return 1.1

        def dispatch(self, _action, _state):
            # 单动作已结束，服务端轨迹落库/返回结果比旧外层+1秒稍慢。
            sleep(1.08)
            return AgentResult(success=False, output={
                "error": "execution timeout; underlying operation may still be running",
                "status": "blocked", "execution_id": "EXEC-TIMEOUT", "execution_status": "TIMEOUT",
                "side_effect_status": "not_applied", "cancel_requested": True,
            })

    result = RuntimeCoordinator(SimpleNamespace(
        planner=Planner(), dispatcher=Dispatcher(), trace=TraceRecorder(),
        execution_manager=SimpleNamespace(timeout_seconds=0.025), runtime_step_timeout_grace_seconds=0.3,
    )).run({"entry": "trigger", "event": {"event_id": "EVT-TIMEOUT", "device_id": "M1", "alarm_code": "700010"}})
    assert result["runtime_result"]["status"] == "timeout"
    assert result["runtime_result"]["stop_reason"] == "execution_timeout"
    assert result["runtime_execution"]["execution_id"] == "EXEC-TIMEOUT"
    assert result["runtime_execution"]["cancel_requested"] is True
    assert result["failed_steps"]


def test_container_sets_diagnosis_budget_without_changing_workorder_deadline(tmp_path, monkeypatch):
    from app.config import Settings
    from runtime_slimming_adapter import build_test_orchestrator

    monkeypatch.setenv("AGENT_TIMEOUT_SECONDS", "90")
    monkeypatch.setenv("DIAGNOSIS_TIMEOUT_SECONDS", "180")
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    assert Settings().diagnosis_timeout_seconds == 180
    assert runtime.container.harnesses["diagnosis"].config.timeout_seconds == 180
    assert runtime.container.harnesses["workorder"].config.timeout_seconds == 90
    assert runtime.container.execution_manager.timeout_seconds == 90
    assert runtime.container.runtime_step_timeout_grace_seconds == 30
