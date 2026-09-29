from datetime import datetime, timezone, timedelta

from app.workorder.validator import WorkOrderValidator, _recovery_is_fresh


NOW = datetime(2026, 9, 29, 12, 0, tzinfo=timezone.utc)


def _snapshot(at):
    return {"checked_at": at.isoformat(), "expires_at": (at + timedelta(minutes=20)).isoformat()}


def test_recovery_rejects_old_and_future_snapshots(monkeypatch):
    monkeypatch.setenv("RECOVERY_MAX_AGE_SECONDS", "300")
    monkeypatch.setenv("RECOVERY_CLOCK_SKEW_SECONDS", "30")

    assert _recovery_is_fresh(_snapshot(NOW - timedelta(seconds=299)), now=NOW)
    assert not _recovery_is_fresh(_snapshot(NOW - timedelta(seconds=301)), now=NOW)
    assert not _recovery_is_fresh(_snapshot(NOW + timedelta(seconds=31)), now=NOW)


def test_expired_or_invalid_recovery_is_rejected():
    assert not _recovery_is_fresh({"checked_at": NOW.isoformat(), "expires_at": (NOW - timedelta(seconds=1)).isoformat()}, now=NOW)
    assert not _recovery_is_fresh({"checked_at": "not-a-time"}, now=NOW)


def test_historical_closed_order_can_be_read_without_current_freshness_gate():
    order = {"status": "closed", "repair_verification": {
        "passed": True,
        "source": "device_recovery",
        "device_recovery": _snapshot(NOW - timedelta(days=10)),
        "checks": {"device_identity": True, "operational": True, "alarms_clear": True, "metrics_available": True},
    }}
    assert WorkOrderValidator.can_learn(order, {"feedback": "已完成"})
