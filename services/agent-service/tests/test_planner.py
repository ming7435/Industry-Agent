def test_planner_decomposes_abnormal_event_into_existing_agent_actions():
    from app.runtime.action import ActionType
    from app.runtime.planner import Planner

    plan = Planner().plan(
        "解决主轴温度异常",
        {"event_id": "EVT-PLAN-1", "device_id": "D-1"},
    )

    assert [action.target for action in plan.actions] == [
        "diagnosis", "knowledge", "cad", "maintenance", "workorder",
    ]
    assert all(action.action_type in {ActionType.AGENT, ActionType.TOOL} for action in plan.actions)
    assert plan.actions[-1].side_effect is True
    assert plan.actions[-1].idempotency_key == "monitor:EVT-PLAN-1"


def test_planner_emits_trace_lifecycle_without_executing_actions():
    from app.runtime.planner import Planner

    events = []
    planner = Planner(trace=lambda event, payload: events.append((event, payload)))
    plan = planner.plan("查询主轴维修经验", {"event_id": "EVT-PLAN-2"})

    assert plan.actions
    assert [event for event, _payload in events] == ["planner_start", "planner_end"]
    assert all("execution_id" not in payload for _event, payload in events)
