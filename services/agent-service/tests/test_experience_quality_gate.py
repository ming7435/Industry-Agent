def test_experience_quality_gate_accepts_closed_human_confirmed_repair():
    from app.memory.validator import ExperienceValidator

    result = ExperienceValidator().validate_experience(
        {
            "experience_id": "EXP-1",
            "content": "bearing replaced",
            "source_workorder": "WO-1",
        },
        {"status": "closed", "device_id": "D-1", "repair_verification": {
            "passed": True, "status": "verified", "source": "device_recovery",
            "device_recovery": {"device_id": "D-1", "status": "running", "metrics": {"vibration": 0.2}, "checked_at": "2026-09-28T12:00:00Z"},
            "checks": {"device_identity": True, "operational": True, "alarms_clear": True, "metrics_available": True},
        }},
        {"feedback": "bearing replaced", "operator": "u-1", "verification": {
            "passed": True, "status": "verified", "source": "device_recovery",
                "device_recovery": {"device_id": "D-1", "status": "running", "metrics": {"vibration": 0.2}, "checked_at": "2026-09-28T12:00:00Z"},
            "checks": {"device_identity": True, "operational": True, "alarms_clear": True, "metrics_available": True},
        }},
    )

    assert result.validation_status == "accepted"


def test_historical_closed_repair_can_be_read_without_current_snapshot_freshness():
    from app.memory.validator import ExperienceValidator

    result = ExperienceValidator().validate_experience(
        {"experience_id": "EXP-HISTORY", "content": "bearing replaced", "source_workorder": "WO-HISTORY"},
        {"status": "closed", "device_id": "D-HISTORY", "repair_verification": {
            "passed": True, "status": "verified", "source": "device_recovery",
            "device_recovery": {"device_id": "D-HISTORY", "status": "running", "metrics": {"vibration": 0.2}, "checked_at": "2020-01-01T00:00:00Z", "expires_at": "2020-01-01T00:05:00Z"},
            "checks": {"device_identity": True, "operational": True, "alarms_clear": True, "metrics_available": True},
        }},
        {"feedback": "bearing replaced", "operator": "u-1"},
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
