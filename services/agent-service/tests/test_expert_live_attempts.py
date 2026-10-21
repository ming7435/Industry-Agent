"""Live expert metrics must not mistake an orphaned trace for active work."""
from concurrent.futures import ThreadPoolExecutor
from threading import Event, Lock
from types import SimpleNamespace

import pytest

from app.api.expert_agents import expert_agent_metrics
from app.cad_documents.proposal import observed_cad_call
from app.harness.runtime import AgentHarness
from app.harness.trace import TraceRecorder


class TraceStore:
    def __init__(self):
        self.rows = []
        self.lock = Lock()
        self.fail_next = False

    def append(self, record):
        with self.lock:
            if self.fail_next:
                self.fail_next = False
                raise OSError('storage unavailable')
            self.rows.append(dict(record))

    def list_agent_index(self, limit):
        with self.lock:
            return [dict(row) for row in self.rows if row.get('event', '').startswith('agent_')][-limit:]


def metric(trace):
    return next(item for item in expert_agent_metrics(trace)['items'] if item['agent'] == 'cad')


def record(trace, event, trace_id='T', run_id='R'):
    return trace.record(event=event, agent='cad', trace_id=trace_id, agent_run_id=run_id,
                        output={'status': 'completed'})


def test_restart_marks_orphan_unconfirmed_until_real_terminal_event():
    store = TraceStore()
    original = TraceRecorder(store=store)
    record(original, 'agent_started')
    assert metric(original)['running'] == 1

    restarted = TraceRecorder(store=store)
    value = metric(restarted)
    assert value['total'] == 1 and value['unconfirmed'] == 1
    assert value['running'] == value['completed'] == value['failed'] == 0
    assert value['completion_rate'] is None

    record(restarted, 'agent_completed')
    value = metric(restarted)
    assert value['total'] == value['completed'] == 1
    assert value['running'] == value['unconfirmed'] == 0


def test_same_run_id_in_different_traces_only_finishes_its_own_attempt():
    trace = TraceRecorder()
    record(trace, 'agent_started', 'T-1')
    record(trace, 'agent_started', 'T-2')
    assert metric(trace)['running'] == 2
    record(trace, 'agent_completed', 'T-1')
    value = metric(trace)
    assert value['total'] == 2 and value['completed'] == value['running'] == 1
    record(trace, 'agent_error', 'T-2')
    value = metric(trace)
    assert value['total'] == 2 and value['completed'] == value['failed'] == 1
    assert value['running'] == value['unconfirmed'] == 0


def test_trace_without_live_registry_does_not_claim_orphan_is_running():
    trace = TraceRecorder()
    started = record(trace, 'agent_started')
    legacy = SimpleNamespace(list_agent_index=lambda limit: [started])
    value = metric(legacy)
    assert value['total'] == value['unconfirmed'] == 1
    assert value['running'] == value['completed'] == value['failed'] == 0


def test_active_attempt_survives_ring_eviction_and_clear():
    trace = TraceRecorder(maxlen=1)
    record(trace, 'agent_started')
    trace.record(event='tool_completed')
    assert metric(trace)['running'] == 1
    trace.clear()
    assert metric(trace)['running'] == 1
    record(trace, 'agent_completed')
    value = metric(trace)
    assert value['total'] == value['completed'] == 1 and value['running'] == 0


def test_failed_terminal_persistence_stays_partial_after_memory_eviction():
    store = TraceStore()
    trace = TraceRecorder(maxlen=1, store=store)
    record(trace, 'agent_started')
    store.fail_next = True
    record(trace, 'agent_completed')
    assert metric(trace)['completed'] == 1
    assert expert_agent_metrics(trace)['partial'] is True
    trace.record(event='tool_completed')
    value = metric(trace)
    assert value['unconfirmed'] == 1 and value['running'] == 0
    assert expert_agent_metrics(trace)['partial'] is True


def test_query_failure_stays_partial_when_a_concurrent_write_recovers():
    class FailingQueryStore(TraceStore):
        def list_agent_index(self, limit):
            raise OSError('query unavailable')

    class RecoveringRecorder(TraceRecorder):
        def agent_index_snapshot(self, limit=5000):
            result = super().agent_index_snapshot(limit)
            self.record(event='tool_completed')
            return result

    trace = RecoveringRecorder(store=FailingQueryStore())
    record(trace, 'agent_started')
    result = expert_agent_metrics(trace)
    assert result['partial'] is True
    assert next(item for item in result['items'] if item['agent'] == 'cad')['running'] == 1


def test_poll_during_terminal_write_does_not_temporarily_report_unconfirmed():
    entered, release = Event(), Event()

    class PausingStore(TraceStore):
        def append(self, item):
            if item.get('event') == 'agent_completed':
                entered.set()
                if not release.wait(10):
                    raise TimeoutError('terminal write was not released')
            return super().append(item)

    trace = TraceRecorder(store=PausingStore())
    record(trace, 'agent_started')
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(record, trace, 'agent_completed')
        try:
            assert entered.wait(5)
            value = metric(trace)
            assert value['running'] == 1 and value['unconfirmed'] == 0
        finally:
            release.set()
        future.result(timeout=5)
    value = metric(trace)
    assert value['completed'] == 1 and value['unconfirmed'] == 0


def test_slow_index_query_does_not_block_completion_or_lose_its_terminal():
    entered, release = Event(), Event()

    class SlowQueryStore(TraceStore):
        def list_agent_index(self, limit):
            snapshot = super().list_agent_index(limit)
            entered.set()
            if not release.wait(10):
                raise TimeoutError('query was not released')
            return snapshot

    trace = TraceRecorder(store=SlowQueryStore())
    record(trace, 'agent_started')
    with ThreadPoolExecutor(max_workers=2) as executor:
        query = executor.submit(metric, trace)
        try:
            assert entered.wait(5)
            finish = executor.submit(record, trace, 'agent_completed')
            finish.result(timeout=2)
        finally:
            release.set()
        value = query.result(timeout=5)
    assert value['total'] == value['completed'] == 1
    assert value['running'] == value['unconfirmed'] == 0


@pytest.mark.parametrize('entry', ['harness', 'cad_proposal'])
def test_abnormal_scope_exit_does_not_leave_a_live_attempt(entry):
    class Abort(BaseException):
        pass

    def abort(*args):
        raise Abort()

    trace = TraceRecorder()
    with ThreadPoolExecutor(max_workers=1) as executor:
        if entry == 'harness':
            harness = AgentHarness(SimpleNamespace(name='cad', run=abort), trace=trace)
            future = executor.submit(harness.execute_once, {'trace_id': 'T'})
        else:
            future = executor.submit(observed_cad_call, abort, trace=trace)
        with pytest.raises(Abort):
            future.result(timeout=5)
        # The pool thread still exists; liveness must follow the call scope.
        assert executor.submit(lambda: 1).result(timeout=5) == 1
        value = metric(trace)
        assert value['total'] == value['unconfirmed'] == 1
        assert value['running'] == value['completed'] == value['failed'] == 0
