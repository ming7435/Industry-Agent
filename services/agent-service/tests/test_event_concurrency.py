from threading import Event, Thread
import sqlite3

import pytest

from app.runtime.event_store import EventResultStore
from app.runtime.durable_store import DurableJsonStore, PendingResultError


@pytest.mark.parametrize("durable", [False, True])
def test_slow_event_does_not_block_unrelated_event(tmp_path, durable, monkeypatch):
    monkeypatch.delenv("EVENT_STORE_PATH", raising=False)
    path = str(tmp_path / "events.sqlite3") if durable else None
    first = EventResultStore(path=path)
    second = EventResultStore(path=path) if durable else first
    started = Event()
    release = Event()
    other_done = Event()
    results = {}

    def slow_producer():
        started.set()
        assert release.wait(5)
        return {"event": "slow"}

    slow = Thread(target=lambda: results.setdefault("slow", first.get_or_create("EVT-SLOW", slow_producer)))
    other = Thread(target=lambda: (results.setdefault("other", second.get_or_create("EVT-OTHER", lambda: {"event": "other"})), other_done.set()))
    slow.start()
    assert started.wait(2)
    other.start()
    try:
        assert other_done.wait(0.5), "另一个事件不应等待慢事件处理完成"
    finally:
        release.set()
        slow.join(timeout=5)
        other.join(timeout=5)
    assert results == {"slow": {"event": "slow"}, "other": {"event": "other"}}


def test_failed_durable_producer_is_not_blindly_retried(tmp_path):
    path = str(tmp_path / "events.sqlite3")
    first = EventResultStore(path=path)
    attempts = []

    def fail_after_uncertain_side_effect():
        attempts.append("sent")
        raise TimeoutError("外部写入结果未知")

    with pytest.raises(TimeoutError):
        first.get_or_create("EVT-UNCERTAIN", fail_after_uncertain_side_effect)

    second = EventResultStore(path=path)
    with pytest.raises(Exception, match="结果未知|uncertain"):
        second.get_or_create("EVT-UNCERTAIN", lambda: attempts.append("retried") or {"ok": True})
    assert attempts == ["sent"]


def test_orphaned_durable_claim_becomes_uncertain_without_repeating_write(tmp_path):
    path = str(tmp_path / "events.sqlite3")
    DurableJsonStore(path)
    with sqlite3.connect(path) as connection:
        connection.execute(
            "INSERT INTO runtime_claims(namespace, state_key, status, created_at) VALUES (?, ?, ?, ?)",
            ("agent_event", "EVT-CRASHED", "running", "2020-01-01 00:00:00"),
        )
    attempts = []

    with pytest.raises(PendingResultError) as caught:
        DurableJsonStore(path).get_or_create(
            "agent_event", "EVT-CRASHED", lambda: attempts.append("replayed") or {"ok": True}
        )

    assert caught.value.status == "uncertain"
    assert attempts == []
    with sqlite3.connect(path) as connection:
        assert connection.execute(
            "SELECT status FROM runtime_claims WHERE namespace = ? AND state_key = ?",
            ("agent_event", "EVT-CRASHED"),
        ).fetchone()[0] == "uncertain"
