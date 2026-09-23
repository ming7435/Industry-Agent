def test_loop_guard_enforces_iteration_and_budget_limits():
    from app.runtime.guard import LoopGuard
    from app.runtime.loop_engine import LoopPolicy

    guard = LoopGuard(LoopPolicy(max_iterations=2, max_budget=3))

    assert guard.check_iteration(2).reason == "max_iterations"
    assert guard.check_budget(2.5, 1).reason == "budget"


def test_loop_guard_detects_duplicate_action():
    from app.runtime.action import ActionModel
    from app.runtime.guard import LoopGuard

    action = ActionModel.tool("knowledge.search", {"query": "轴承"})
    assert LoopGuard().check_action(action, {action.fingerprint}).reason == "duplicate_action"


def test_loop_guard_detects_no_new_evidence():
    from app.runtime.guard import LoopGuard

    assert LoopGuard().check_evidence_progress({"DOC-1"}, {"DOC-1"}).reason == "no_new_evidence"
