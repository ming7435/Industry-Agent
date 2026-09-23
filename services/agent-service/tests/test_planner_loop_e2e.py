def test_planner_loop_evaluator_and_execution_form_runtime_chain():
    from app.runtime.loop_engine import LoopEngine, LoopPolicy
    from app.runtime.planner import Planner

    plan = Planner().plan("解决主轴温度异常", {"event_id": "EVT-RUNTIME-1"})
    index = {action.target: action for action in plan.actions}
    state = {"step": 0, "evidence_ids": []}

    def observe(current, _context):
        done = current["step"] >= len(plan.actions)
        return {
            "done": done,
            "evidence_ids": current["evidence_ids"],
            "evidence_score": 1.0 if done else 0.0,
        }

    def select(_state, _evaluation, context):
        return plan.actions[context.iteration]

    def execute(action, _state, _context):
        return {
            "step": _context.iteration + 1,
            "evidence_ids": [f"{action.target}-evidence"],
        }

    result = LoopEngine(LoopPolicy(max_iterations=len(plan.actions) + 1)).run_runtime(
        state, observe=observe, select_action=select, execute_action=execute,
    )

    assert result.status == "completed"
    assert result.loop_state["action_history"] == [action.target for action in plan.actions]
    assert len(result.loop_state["execution_history"]) == len(plan.actions)
