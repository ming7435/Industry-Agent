"""完整周必须有持续观测证明，正常关闭、重启缺口和日级失败标记都参与门禁。"""
from datetime import datetime


def coverage(rows):
    from app.harness.trace_coverage import coverage_complete
    return coverage_complete(rows, datetime(2026, 10, 5), datetime(2026, 10, 12))


def scope(**changes):
    return {'started_at': datetime(2026, 10, 1), 'last_covered_at': datetime(2026, 10, 13),
            'closed_at': None, 'gap_days': '[]', **changes}


def test_complete_continuous_recording_is_eligible():
    assert coverage([scope()]) is True


def test_restart_without_historical_recording_proof_is_incomplete():
    assert coverage([scope(started_at=datetime(2026, 10, 12))]) is False
    assert coverage([]) is False


def test_abandoned_instance_gap_is_not_hidden_by_another_healthy_instance():
    abandoned = scope(last_covered_at=datetime(2026, 10, 7), closed_at=datetime(2026, 10, 13))
    assert coverage([scope(), abandoned]) is False


def test_normal_closed_scope_does_not_poison_later_weeks():
    normal = scope(last_covered_at=datetime(2026, 10, 4), closed_at=datetime(2026, 10, 4))
    assert coverage([scope(), normal]) is True


def test_persisted_failed_day_cannot_disappear_after_recorder_restart():
    assert coverage([scope(gap_days='["2026-10-07"]')]) is False
