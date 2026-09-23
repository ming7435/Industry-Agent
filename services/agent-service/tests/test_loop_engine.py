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
