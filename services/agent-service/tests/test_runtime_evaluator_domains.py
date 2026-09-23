from app.runtime.evaluator import EvaluationStatus, RuntimeEvaluator
from app.runtime.loop_engine import LoopEngine, LoopPolicy


def test_evaluator_replans_low_confidence_diagnosis():
    result = RuntimeEvaluator().evaluate({
        "domain": "diagnosis",
        "result": {"confidence": 0.4, "evidence": []},
    })

    assert result.status == EvaluationStatus.REPLAN
    assert "diagnosis_evidence" in result.missing_evidence


def test_evaluator_blocks_low_quality_learning():
    result = RuntimeEvaluator().evaluate({
        "domain": "learning",
        "workorder_status": "closed",
        "repair_feedback": {"result": "fixed"},
        "experience_quality_score": 0.5,
    })

    assert result.status == EvaluationStatus.BLOCKED
    assert result.reason == "experience_quality_gate"


def test_loop_engine_emits_continue_event_before_final_stop():
    events = []
    state = {"step": 0}

    def step(current, _context):
        value = dict(current)
        value["step"] += 1
        return {
            "state": value,
            "action": {"target": "step-%s" % value["step"]},
            "evidence_ids": ["E-%s" % value["step"]],
            "evidence_score": 1.0,
            "done": value["step"] >= 2,
        }

    result = LoopEngine(LoopPolicy(max_iterations=3, min_evidence_score=0.8)).run(
        state, step, trace=lambda event, payload: events.append(event)
    )

    assert result.status == "completed"
    assert "loop_continue" in events
    assert "loop_stop" in events

