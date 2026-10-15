"""观测缺口不能隐藏后续页的已有运行，也不能放开完整周门禁。"""
from types import SimpleNamespace

import pytest

from app.harness.trace import TraceRecorder
from test_skill_evolution import manager
from test_skill_loop import system, loop, WindowStore, add_run, NOW


class IncompleteCoverageStore(WindowStore):
    def skill_window_page(self, *args, **kwargs):
        return {**super().skill_window_page(*args, **kwargs),
                'complete': False, 'recording_complete': False}


@pytest.mark.parametrize(('window', 'timestamp'), [
    ('previous', '2026-10-07T03:00:00+00:00'),
    ('current', '2026-10-12T00:00:00+00:00'),
])
def test_coverage_gap_keeps_later_page_runs_visible_without_optimization(system, window, timestamp):
    system.manager.trace = TraceRecorder(store=IncompleteCoverageStore())
    for _ in range(200):
        system.manager.trace.record(timestamp=timestamp, event='monitor_tick')
    add_run(system.manager, timestamp=timestamp)

    actual = loop(system)
    actual.refresh(NOW)
    status = actual.status('diagnosis', 'alarm_diagnosis_skill')
    observed = status['health'][window]

    assert observed['record_count'] == 202
    assert observed['read_complete'] is True
    assert observed['complete'] is False
    assert len(observed['items']) == 1
    assert observed['items'][0]['calls'] == 1
    assert observed['items'][0]['verdicts']['fail'] == 1
    assert status['plan'] is None
    assert actual.scan_once(NOW, refresh=False) is None
    assert system.list() == []
    assert status['north_star']['weekly_gain']['value'] is None
    assert status['north_star']['drift_recall']['value'] is None
    assert system.store.values('skill_north_star_alerts') == []


def test_failed_later_page_keeps_read_samples_but_marks_read_incomplete(system):
    class FailingPageStore(IncompleteCoverageStore):
        def skill_window_page(self, *args, **kwargs):
            if kwargs.get('after'):
                raise ConnectionError('isolated read failure')
            return super().skill_window_page(*args, **kwargs)

    system.manager.trace = TraceRecorder(store=FailingPageStore())
    add_run(system.manager, timestamp='2026-10-12T00:00:00+00:00')
    for _ in range(201):
        system.manager.trace.record(timestamp='2026-10-12T00:00:00+00:00', event='monitor_tick')
    status = loop(system).refresh(NOW)
    observed = status['health']['current']

    assert observed['record_count'] == 200
    assert observed['read_complete'] is False
    assert observed['complete'] is False
    assert observed['items'][0]['calls'] == 1
    assert '存储查询不可用' in observed['message']
    assert status['plan'] is None


def test_stalled_cursor_stops_and_does_not_claim_all_records_read(system):
    system.manager.trace = SimpleNamespace(skill_window_page=lambda *a, **k: {
        'items': [], 'after': 0, 'upper': 10, 'done': False, 'complete': False, 'storage': 'mysql'})
    observed = loop(system).refresh(NOW)['health']['current']
    assert observed['read_complete'] is False
    assert observed['complete'] is False
    assert '游标未推进' in observed['message']
