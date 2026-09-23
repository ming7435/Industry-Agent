def test_experience_quality_gate_accepts_closed_human_confirmed_repair():
    from app.memory.validator import ExperienceValidator

    result = ExperienceValidator().validate_experience(
        {
            "experience_id": "EXP-1",
            "content": "bearing replaced",
            "source_workorder": "WO-1",
        },
        {"status": "closed", "device_id": "D-1"},
        {"feedback": "bearing replaced", "operator": "u-1", "verification": {"passed": True}},
    )

    assert result.validation_status == "accepted"
    assert result.experience_quality_score >= 0.8


def test_experience_quality_gate_rejects_failed_or_empty_repair():
    from app.memory.validator import ExperienceValidator

    result = ExperienceValidator().validate_experience(
        {"experience_id": "EXP-2", "content": ""},
        {"status": "closed", "device_id": "D-1"},
        {"result": "failed", "verification": {"passed": False}},
    )

    assert result.validation_status == "rejected"
    assert result.experience_quality_score < 0.8


def test_experience_quality_gate_does_not_turn_failed_duplicate_into_accepted_duplicate():
    from app.memory.validator import ExperienceValidator

    result = ExperienceValidator().validate_experience(
        {"experience_id": "EXP-3", "content": "failed repair", "source_workorder": "WO-3", "device_id": "D-1", "fault": "bearing"},
        {"status": "closed", "device_id": "D-1"},
        {"result": "failed", "verification": {"passed": False}},
        existing=[{"source_workorder": "WO-3", "device_id": "D-1", "fault": "bearing"}],
    )

    assert result.validation_status == "rejected"
