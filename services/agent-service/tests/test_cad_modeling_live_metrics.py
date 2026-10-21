"""The actual CAD graph entry shares expert lifecycle metrics without replaying modeling."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from threading import Event, Lock

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.agents.cad.modeling_api import build_text_to_cad_router
from app.api.expert_agents import expert_agent_metrics
from app.harness.trace import TraceRecorder


PREFIX = '/api/cad/text-to-cad'
BODY = {'prompt': '生成长40mm、宽20mm、高10mm的长方体', 'command_id': 'live-model'}


class MemoryStore:
    def __init__(self, *, fail_save=False):
        self.rows, self.lock, self.fail_save = {}, Lock(), fail_save

    def get(self, key):
        with self.lock:
            return deepcopy(self.rows.get(key))

    def create(self, key, value):
        with self.lock:
            if key in self.rows:
                return False
            self.rows[key] = deepcopy(value)
            return True

    def set(self, key, value):
        if self.fail_save:
            raise RuntimeError('isolated result-store outage')
        with self.lock:
            self.rows[key] = deepcopy(value)


class NoExternalClient:
    def close(self):
        pass

    def call_tool(self, *args, **kwargs):
        pytest.fail('these lifecycle tests must not execute a CAD kernel')


def api(trace, store=None):
    app = FastAPI()
    app.state.freecad_run_store = store or MemoryStore()
    app.state.text_to_cad_client_factory = NoExternalClient
    app.state.text_to_cad_model_factory = lambda: None
    app.include_router(build_text_to_cad_router(lambda: None, trace=trace))
    return TestClient(app, raise_server_exceptions=False)


def cad_metrics(trace):
    return next(item for item in expert_agent_metrics(trace)['items'] if item['agent'] == 'cad')


@pytest.mark.parametrize(('tool_result', 'expected_status', 'expected_metric'), [
    ({'status': 'completed', 'validation': {'valid': True}, 'artifacts': []}, 'completed', 'completed'),
    ({'status': 'completed', 'validation': {'valid': False}, 'artifacts': []}, 'completed', 'blocked'),
    ({'status': 'outcome_unknown', 'error': 'kernel response lost'}, 'outcome_unknown', 'failed'),
    (None, 'failed', 'failed'),
])
def test_real_cad_graph_is_visible_inflight_and_finishes_once_without_replay(
    monkeypatch, tool_result, expected_status, expected_metric,
):
    entered, release = Event(), Event()

    def isolated_modeling_tool(spec):
        assert spec['operations'][0]['type'] == 'box'
        entered.set()
        if not release.wait(10):
            raise TimeoutError('test did not release the modeling boundary')
        if tool_result is None:
            raise RuntimeError('isolated CAD kernel failure')
        return deepcopy(tool_result)

    # Keep CADAgent, its graph, skill dispatch and trace real; replace only the kernel boundary.
    monkeypatch.setattr('app.tools.registry.text_to_cad', isolated_modeling_tool)
    trace = TraceRecorder()
    client = api(trace)
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(client.post, PREFIX + '/runs', json=BODY)
        try:
            assert entered.wait(5), 'CAD graph did not reach the modeling tool'
            active = cad_metrics(trace)
            assert active['total'] == active['running'] == 1
            assert active['completed'] == active['failed'] == active['blocked'] == 0
        finally:
            release.set()
        accepted = future.result(timeout=5)
    assert accepted.status_code == 202
    run_id = accepted.json()['run_id']
    result = client.get(PREFIX + '/runs/' + run_id).json()
    assert result['status'] == expected_status
    assert client.post(PREFIX + '/runs', json=BODY).json() == result
    final = cad_metrics(trace)
    assert final['total'] == final[expected_metric] == 1
    assert final['running'] == 0
    lifecycle = [row for row in trace.list() if row.get('event') in
                 {'agent_started', 'agent_completed', 'agent_error'}]
    assert len(lifecycle) == 2
    assert lifecycle[0]['event'] == 'agent_started'
    assert all(row['agent_run_id'] == row['task_id'] == row['trace_id'] == run_id for row in lifecycle)
    assert all(row['run_type'] == 'cad_modeling' for row in lifecycle)
    assert any(row.get('event') == 'step_completed' and row.get('trace_id') == run_id
               for row in trace.list())


def test_result_storage_failure_is_not_reported_as_success_and_releases_slots(monkeypatch):
    monkeypatch.setattr('app.tools.registry.text_to_cad', lambda spec:
                        {'status': 'completed', 'validation': {'valid': True}, 'artifacts': []})
    trace = TraceRecorder()
    client = api(trace, MemoryStore(fail_save=True))
    for index in range(3):
        response = client.post(PREFIX + '/runs', json={**BODY, 'command_id': f'store-failure-{index}'})
        assert response.status_code == 202
    final = cad_metrics(trace)
    assert final['total'] == final['failed'] == 3
    assert final['running'] == final['completed'] == 0


def test_terminal_record_failure_releases_live_attempt_and_slots(monkeypatch):
    class InterruptedTrace(TraceRecorder):
        def record(self, **payload):
            if payload.get('event') == 'agent_completed':
                raise RuntimeError('terminal recording interrupted')
            return super().record(**payload)

    monkeypatch.setattr('app.tools.registry.text_to_cad', lambda spec:
                        {'status': 'completed', 'validation': {'valid': True}, 'artifacts': []})
    trace = InterruptedTrace()
    client = api(trace)
    for index in range(3):
        response = client.post(PREFIX + '/runs', json={**BODY, 'command_id': f'terminal-failure-{index}'})
        assert response.status_code == 202
    final = cad_metrics(trace)
    assert final['total'] == final['unconfirmed'] == 3
    assert final['running'] == final['completed'] == 0
