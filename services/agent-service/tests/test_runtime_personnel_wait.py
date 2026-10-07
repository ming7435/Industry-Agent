"""人员暂不可用是可恢复的业务等待，必须保留已建工单。"""
from types import SimpleNamespace
import pytest

from app.agents.base import AgentResult
from app.harness import TraceRecorder
from app.runtime.action import ActionModel
from app.runtime.coordinator import RuntimeCoordinator
from app.runtime.planner import Plan


@pytest.mark.parametrize("capability", ["workorder_create", "workorder_update"])
@pytest.mark.parametrize("status,reason", [
    ("waiting_for_personnel", "waiting_for_personnel"),
    ("blocked", "personnel_query_failed"),
])
def test_personnel_wait_preserves_order_and_stops_following_actions(capability, status, reason):
    calls = []
    workorder = {
        "success": False,
        "status": status,
        "stop_reason": reason,
        "error": "设备 D-1 暂无已登录的维修负责人" if status == "waiting_for_personnel" else "维修人员查询失败",
        "workorder_id": "WO-WAIT-1",
        "workorder": {"workorder_id": "WO-WAIT-1", "status": "open", "assignee": "", "device_id": "D-1"},
    }

    def dispatch(action, state):
        calls.append(action.required_capability)
        return AgentResult(success=False, output=workorder)

    container = SimpleNamespace(
        planner=SimpleNamespace(plan=lambda goal, context: Plan(goal=goal, actions=[
            ActionModel.agent("workorder", {"required_capability": capability, "target_input": {"action": "create"}},
                              side_effect=True, idempotency_key="EVT-WAIT-1"),
            ActionModel.agent("quality", {"required_capability": "quality_inspection"}),
        ])),
        dispatcher=SimpleNamespace(dispatch=dispatch),
        trace=TraceRecorder(),
        execution_manager=SimpleNamespace(timeout_seconds=2.0),
    )
    result = RuntimeCoordinator(container).run({
        "entry": "trigger", "task_id": "TASK-WAIT", "trace_id": "TRACE-WAIT",
        "event": {"event_id": "EVT-WAIT-1", "event_type": "alarm", "device_id": "D-1"},
    })
    assert calls == [capability]
    assert result["status"] == status
    assert result["runtime_result"]["status"] == status
    assert result["runtime_result"]["stop_reason"] == reason
    assert result["workorder"] == workorder
    assert result["runtime_outputs"]["workorder"] == workorder
    assert bool(result["failed_steps"]) == (status == "blocked")
    assert result["step_history"][-1]["status"] == status


def test_personnel_wait_lifecycle_is_not_a_workorder_error():
    assert RuntimeCoordinator._workorder_lifecycle_status(
        "waiting_for_personnel", {"success": False, "workorder_id": "WO-WAIT-1"}
    ) == "waiting_for_personnel"
