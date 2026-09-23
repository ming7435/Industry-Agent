import time


def test_loop_engine_stops_when_evidence_score_is_ready():
    from app.runtime.loop_engine import LoopEngine, LoopPolicy

    calls = []

    def step(state, _context):
        calls.append(state["iteration"])
        return {
            "state": {"iteration": state["iteration"] + 1},
            "action": "search_knowledge_%s" % state["iteration"],
            "evidence_score": 0.9,
            "done": True,
        }

    result = LoopEngine(LoopPolicy(max_iterations=3, min_evidence_score=0.8)).run(
        {"iteration": 0}, step
    )

    assert result.status == "completed"
    assert result.iterations == 1
    assert result.evidence_score == 0.9
    assert calls == [0]


def test_loop_engine_blocks_duplicate_actions_before_unbounded_repeat():
    from app.runtime.loop_engine import LoopEngine, LoopPolicy

    def step(state, _context):
        return {
            "state": state,
            "action": "search_same_query",
            "evidence_score": 0.1,
            "done": False,
        }

    result = LoopEngine(LoopPolicy(max_iterations=5, min_evidence_score=0.8)).run({}, step)

    assert result.status == "blocked"
    assert result.stop_reason == "duplicate_action"
    assert result.iterations == 2


def test_loop_engine_stops_at_max_iterations():
    from app.runtime.loop_engine import LoopEngine, LoopPolicy

    def step(state, context):
        return {
            "state": {"iteration": context.iteration + 1},
            "action": "search_%s" % context.iteration,
            "evidence_score": 0.2,
            "done": False,
        }

    result = LoopEngine(LoopPolicy(max_iterations=2, min_evidence_score=0.8)).run({}, step)

    assert result.status == "blocked"
    assert result.stop_reason == "max_iterations"
    assert result.iterations == 2


def test_loop_engine_stops_when_step_times_out():
    from app.runtime.loop_engine import LoopEngine, LoopPolicy

    def step(_state, _context):
        time.sleep(0.05)
        return {"state": {}, "action": "slow", "evidence_score": 0.0}

    result = LoopEngine(LoopPolicy(max_iterations=2, timeout_seconds=0.01)).run({}, step)

    assert result.status == "timeout"
    assert result.stop_reason == "timeout"


def test_action_model_produces_stable_fingerprint_and_duplicate_guard():
    from app.runtime.loop_engine import ActionModel, LoopEngine, LoopPolicy

    first = ActionModel(name="knowledge.search", params={"query": "轴承", "limit": 3})
    second = ActionModel(name="knowledge.search", params={"limit": 3, "query": "轴承"})
    assert first.fingerprint == second.fingerprint

    def step(state, context):
        return {"state": state, "action": first, "evidence_score": 0.0, "done": False}

    result = LoopEngine(LoopPolicy(max_iterations=3)).run({}, step)
    assert result.status == "blocked"
    assert result.stop_reason == "duplicate_action"


def test_loop_guard_reports_all_stop_conditions():
    from app.runtime.loop_engine import ActionModel, LoopGuard, LoopPolicy

    guard = LoopGuard(LoopPolicy(max_iterations=2, min_evidence_score=0.8, timeout_seconds=1))
    assert guard.check_iteration(2).reason == "max_iterations"
    assert guard.check_evidence(done=True, evidence_score=0.7).reason == "evidence_score"
    action = ActionModel(name="cad.lookup", params={"query": "主轴"})
    assert guard.check_action(action, {action.fingerprint}).reason == "duplicate_action"
    assert guard.check_evidence_progress({"DOC-1"}, {"DOC-1"}).reason == "no_new_evidence"
    assert guard.check_confidence(0.8, 0.8).reason == "confidence_not_improved"


def test_loop_engine_emits_lifecycle_trace_events():
    from app.runtime.loop_engine import ActionModel, LoopEngine, LoopPolicy

    events = []

    def trace(event, payload):
        events.append((event, payload))

    def step(state, context):
        return {
            "state": state,
            "action": ActionModel(kind="final", name="done"),
            "evidence_ids": ["DOC-1"],
            "evidence_score": 1.0,
            "done": True,
        }

    result = LoopEngine(LoopPolicy(max_iterations=2)).run({}, step, trace=trace, trace_context={"task_id": "T-1", "trace_id": "X-1"})
    assert result.status == "completed"
    assert [item[0] for item in events] == ["loop_start", "action_selected", "evidence_added", "review_result", "loop_stop"]


def test_loop_engine_stops_when_evidence_does_not_change():
    from app.runtime.loop_engine import ActionModel, LoopEngine, LoopPolicy

    def step(state, context):
        return {
            "state": state,
            "action": ActionModel(name="retrieve", params={"iteration": context.iteration}),
            "evidence_ids": ["DOC-1"],
            "evidence_score": 0.2,
            "done": False,
        }

    result = LoopEngine(LoopPolicy(max_iterations=4)).run({}, step)
    assert result.stop_reason == "no_new_evidence"


def test_loop_engine_stops_when_confidence_does_not_improve():
    from app.runtime.loop_engine import ActionModel, LoopEngine, LoopPolicy

    def step(state, context):
        return {
            "state": state,
            "action": ActionModel(name="review", params={"iteration": context.iteration}),
            "confidence": 0.5,
            "evidence_score": 0.2,
            "done": False,
        }

    result = LoopEngine(LoopPolicy(max_iterations=4)).run({}, step)
    assert result.stop_reason == "confidence_not_improved"
