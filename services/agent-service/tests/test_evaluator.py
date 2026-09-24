def test_evaluator_returns_final_when_evidence_and_confidence_are_sufficient():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator(min_evidence_score=0.8, min_confidence=0.8).evaluate({
        "done": True,
        "confidence": 0.9,
        "evidence_score": 0.95,
        "evidence_ids": ["DOC-1"],
    })

    assert result.status == "final"
    assert result.missing_evidence == []


def test_evaluator_reports_missing_evidence():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator().evaluate({
        "done": False,
        "confidence": 0.7,
        "evidence_score": 0.2,
        "missing_evidence": ["repair_manual"],
    })

    assert result.status == "continue"
    assert result.missing_evidence == ["repair_manual"]
    assert result.reason == "insufficient_evidence"


def test_evaluator_requests_replan_for_invalid_maintenance_plan():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator().evaluate({
        "domain": "maintenance",
        "result": {"workorder_ready": False, "validation_findings": ["missing torque"]},
    })

    assert result.status == "replan"
    assert "missing torque" in result.missing_evidence


def test_evaluator_blocks_explicit_terminal_failure():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator().evaluate({"blocked": True, "reason": "unsafe_action"})

    assert result.status == "blocked"
    assert result.reason == "unsafe_action"


def test_evaluator_requests_diagnosis_review_without_node_threshold_logic():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator().evaluate({
        "domain": "diagnosis",
        "result": {"fault": "bearing", "confidence": 0.4, "evidence": []},
    })

    assert result.status == "replan"
    assert result.missing_evidence == ["diagnosis_evidence"]


def test_evaluator_blocks_low_quality_learning_experience():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator().evaluate({
        "domain": "learning",
        "workorder_status": "closed",
        "repair_feedback": {"feedback": "fixed"},
        "experience_quality_score": 0.2,
        "validation_status": "rejected",
    })

    assert result.status == "blocked"
    assert result.reason == "experience_quality_gate"


def test_evaluator_accepts_valid_learning_experience():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator().evaluate({
        "domain": "learning",
        "workorder_status": "closed",
        "repair_feedback": {"feedback": "fixed", "operator": "u-1"},
        "repair_verification": {"passed": True, "status": "verified"},
        "experience_quality_score": 0.9,
        "validation_status": "accepted",
        "done": True,
    })

    assert result.status == "final"
    assert result.evidence_score >= 0.8


def test_evaluator_reads_quality_gate_from_nested_experience_payload():
    from app.runtime.evaluator import RuntimeEvaluator

    result = RuntimeEvaluator().evaluate({
        "domain": "learning",
        "workorder": {
            "status": "closed",
            "repair_feedback": {"feedback": "fixed"},
            "repair_verification": {"passed": True, "status": "verified"},
        },
        "experience": {
            "experience_quality_score": 0.9,
            "validation_status": "accepted",
        },
        "done": True,
    })

    assert result.status == "final"
