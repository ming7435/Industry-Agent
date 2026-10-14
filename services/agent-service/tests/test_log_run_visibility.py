"""日志删除仅影响运行列表，不删除原始轨迹或业务数据。"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app
from app.harness.runs import build_run_records
from app.harness.trace import TraceRecorder


@pytest.mark.parametrize('indexed', [False, True])
def test_skill_evolution_is_not_a_user_rag_or_fault_run(indexed):
    from app.harness.runs import run_index_record
    records = [{'type': 'skill_evolution', 'event': 'skill_evolution_verification_failed',
                'agent': 'knowledge', 'trace_id': 'SKILL-EVOLUTION-1234', 'event_id': 'EV-1',
                'timestamp': '2026-10-14T00:00:00Z'}]
    if indexed:
        records = [run_index_record(row) for row in records]
    assert build_run_records(records) == []


def test_runs_api_hides_only_explicitly_archived_runs_and_preserves_trace():
    trace = TraceRecorder()
    for identity in ['OLD', 'NEW']:
        trace.record(type='runtime', event='goal_parsed', trace_id='TRACE-' + identity,
                     task_id='TASK-' + identity,
                     state_change={'source': 'event', 'raw': {'event_id': identity, 'device_id': 'D-1'}})

    class ArchiveStorage:
        def values(self, namespace, limit=1000):
            assert namespace == 'log_run_archived'
            return [{'run_id': 'fault:OLD', 'archived': True},
                    {'run_id': 'fault:NEW', 'archived': False}]

    runtime = SimpleNamespace(container=SimpleNamespace(trace=trace,
                              pending_tasks=SimpleNamespace(_store=ArchiveStorage())))
    client = TestClient(create_app(orchestrator=runtime))
    response = client.get('/api/v1/runs')
    assert response.status_code == 200
    assert [row['run_id'] for row in response.json()['runs']] == ['fault:NEW']
    assert response.json()['count'] == 1
    assert len(client.get('/api/v1/trace?trace_id=TRACE-OLD').json()['trace']) == 1


def test_archive_read_failure_is_explicit_and_does_not_hide_all_runs():
    trace = TraceRecorder()
    trace.record(type='agent', event='agent_completed', agent='knowledge', trace_id='TRACE-RAG')

    class UnavailableStorage:
        def values(self, *args, **kwargs):
            raise RuntimeError('storage unavailable')

    runtime = SimpleNamespace(container=SimpleNamespace(trace=trace,
                              pending_tasks=SimpleNamespace(_store=UnavailableStorage())))
    result = TestClient(create_app(orchestrator=runtime)).get('/api/v1/runs').json()
    assert len(result['runs']) == 1
    assert result['storage_warning']
