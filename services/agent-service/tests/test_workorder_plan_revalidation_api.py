"""Regenerate the saved fault's plan, without creating an order or controlling a machine."""
from copy import deepcopy
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.business_returns import build_business_return_router
from app.clients.backend import BackendServiceError
from app.runtime.event_store import EventResultStore
from test_saved_plan_execution_review import saved_order


@pytest.fixture
def recovery(tmp_path, monkeypatch):
    order = saved_order()
    order.update(updated_at='2026-10-07T08:14:22Z', feedback='真实处理记录')
    actor = {'user_id': 'U1', 'role': 'technician'}
    source = {'event': {'device_id': 'TC', 'event_id': 'E1', 'alarm_code': '700006'},
              'maintenance_plan': deepcopy(order['maintenance_plan_snapshot']),
              'diagnosis': deepcopy(order['diagnosis_snapshot'])}
    candidate = deepcopy(order['maintenance_plan_snapshot'])
    candidate.update(plan_id='P2', repair_target='刀塔旋转超时', repair_steps=['核对刀塔故障证据'])
    calls, receipts, faults = [], {}, {}

    def generate(state, diagnosis, knowledge, cad):
        calls.append(('generate', deepcopy(state), deepcopy(diagnosis)))
        assert state['entry'] == 'user'
        assert state['context']['device_id'] == 'TC'
        if faults.get('generate'):
            raise TimeoutError('provider unavailable')
        return deepcopy(candidate)

    def call(tool, payload):
        assert tool == 'get_workorder', 'No creation, restart, current fault lookup, or repair completion'
        return {'workorder': deepcopy(order)}

    def replace(path, payload):
        assert path == '/internal/team/workorder/replace-plan'
        calls.append(('replace', deepcopy(payload)))
        key = payload['request_id']
        if key in receipts:
            return {**deepcopy(receipts[key]), 'workorder': deepcopy(order), 'replayed': True}
        if faults.get('reject'):
            raise BackendServiceError('conflict', status_code=409)
        order.update(plan_id=payload['maintenance_plan']['plan_id'],
                     maintenance_plan_snapshot=deepcopy(payload['maintenance_plan']),
                     updated_at='2026-10-07T10:00:00Z')
        receipts[key] = {'workorder': deepcopy(order), 'plan_replaced': True, 'request_id': key}
        if faults.pop('lost_response', False):
            raise BackendServiceError('timeout after durable apply')
        return deepcopy(receipts[key])

    backend = SimpleNamespace(call=call, request=replace, resolve_session=lambda _: deepcopy(actor))
    monkeypatch.setattr('app.api.workorder_plan_revalidation.BackendServiceClient', lambda: backend)
    runtime = SimpleNamespace(container=SimpleNamespace(requests=SimpleNamespace(create_maintenance_plan=generate)))
    store = EventResultStore(path=str(tmp_path / 'revalidation.sqlite3'))
    store.list_plan_results = lambda: ([source], {'status': 'ready'})
    app = FastAPI()
    app.include_router(build_business_return_router(runtime, store, lambda: None))
    with TestClient(app) as client:
        client.cookies.set('maintenance_session', 'fixture-only')
        yield SimpleNamespace(client=client, order=order, candidate=candidate, source=source,
                              actor=actor, calls=calls, store=store, faults=faults, runtime=runtime)


def post(r, request_id=None, **extra):
    return r.client.post('/api/workorders/W1/revalidate-plan', json={'request_id': request_id or str(uuid4()), **extra})


def test_applies_validated_plan_to_same_order_using_original_diagnosis_and_replays(recovery):
    r = recovery
    before = deepcopy(r.order)
    rid = str(uuid4())
    response = post(r, rid)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['status'] == 'applied'
    assert result['workorder']['workorder_id'] == 'W1'
    assert result['workorder']['execution_review']['required'] is False
    assert r.order['diagnosis_snapshot'] == before['diagnosis_snapshot']
    assert r.order['assignee'] == 'U1' and r.order['status'] == 'in_progress'
    assert r.order['feedback'] == before['feedback']
    assert r.calls[0][2]['raw'] == before['diagnosis_snapshot']['raw']
    assert r.calls[0][2]['alarm_code'] == '700006'
    assert r.calls[0][2]['fault'] == before['diagnosis_snapshot']['fault']
    applied = next(c[1] for c in r.calls if c[0] == 'replace')
    assert applied['expected_plan_id'] == 'P1'
    assert applied['expected_updated_at'] == before['updated_at']
    assert applied['actor_id'] == 'U1'
    assert post(r, rid).json()['status'] == 'applied'
    assert sum(c[0] == 'generate' for c in r.calls) == 1


@pytest.mark.parametrize('mutation', [
    {'workorder_ready': False}, {'validation_findings': ['缺少工程证据']},
    {'validation_errors': ['无效证据']}, {'requires_approval': True}, {'synthetic': True},
    {'repair_target': '安全门与接料器互锁系统', 'repair_steps': saved_order()['maintenance_plan_snapshot']['repair_steps']},
    {'device_id': 'OTHER'}, {'event_id': 'OTHER'}, {'plan_id': 'P1'}, {'repair_steps': []},
])
def test_invalid_candidate_never_replaces_or_unlocks_old_order(recovery, mutation):
    r = recovery
    r.candidate.update(mutation)
    before = deepcopy(r.order)
    response = post(r)
    assert response.status_code == 200, response.text
    assert response.json()['status'] == 'blocked'
    assert response.json()['validation_findings']
    assert response.json()['workorder']['execution_review']['required'] is True
    assert r.order == before
    assert not any(c[0] == 'replace' for c in r.calls)


@pytest.mark.parametrize('field,value', [('device_id', 'OTHER'), ('alarm_code', '700004'), ('event_id', 'OTHER')])
def test_candidate_diagnosis_cannot_change_fault_identity(recovery, field, value):
    recovery.candidate['diagnosis'][field] = value
    assert post(recovery).json()['status'] == 'blocked'
    assert not any(c[0] == 'replace' for c in recovery.calls)


@pytest.mark.parametrize('change', ['supervisor', 'other_owner', 'closed', 'old_approval', 'source_approval', 'missing_diagnosis', 'wrong_source'])
def test_preflight_rejections_never_generate_and_are_definitive(recovery, change):
    r = recovery
    if change == 'supervisor': r.actor['role'] = 'supervisor'
    if change == 'other_owner': r.actor['user_id'] = 'U2'
    if change == 'closed': r.order['status'] = 'closed'
    if change == 'old_approval': r.order['maintenance_plan_snapshot']['requires_approval'] = True
    if change == 'source_approval': r.source['event']['target_input'] = {'requires_approval': True}
    if change == 'missing_diagnosis': r.order['diagnosis_snapshot'] = {}
    if change == 'wrong_source': r.source['event']['event_id'] = 'OTHER'
    response = post(r)
    assert response.status_code in {403, 409}, response.text
    assert response.json()['detail']['execution_started'] is False
    assert r.calls == []


def test_missing_session_and_client_plan_injection_are_rejected(recovery):
    r = recovery
    assert post(r, maintenance_plan=r.candidate).status_code == 422
    assert post(r, request_id='invalid-id').status_code == 422
    r.client.cookies.clear()
    assert post(r).status_code == 401
    assert r.calls == []


def test_lost_apply_response_reconciles_with_same_candidate_even_after_order_changes(recovery):
    r = recovery
    rid = str(uuid4())
    r.faults['lost_response'] = True
    unknown = post(r, rid)
    assert unknown.status_code == 503
    assert 'execution_started' not in unknown.json().get('detail', {})
    assert r.order['plan_id'] == 'P2'
    r.order['status'] = 'closed'
    response = post(r, rid)
    assert response.status_code == 200, response.text
    assert response.json()['status'] == 'applied'
    assert response.json()['workorder']['status'] == 'closed'
    assert sum(c[0] == 'generate' for c in r.calls) == 1
    payloads = [c[1] for c in r.calls if c[0] == 'replace']
    assert payloads[0] == payloads[1]


def test_backend_concurrency_rejection_preserves_old_order_and_is_known_blocked(recovery):
    recovery.faults['reject'] = True
    response = post(recovery)
    assert response.status_code == 200, response.text
    assert response.json()['status'] == 'blocked'
    assert recovery.order['plan_id'] == 'P1'
    assert not any(item.get('maintenance_plan') for item in recovery.store.list_results())


def test_generation_failure_is_known_blocked_and_can_start_new_explicit_request(recovery):
    recovery.faults['generate'] = True
    first = post(recovery)
    assert first.status_code == 200
    assert first.json()['status'] == 'blocked'
    recovery.faults.clear()
    assert post(recovery).json()['status'] == 'applied'


def test_formal_maintenance_diagnosis_nesting_keeps_original_alarm(recovery):
    from app.agents.maintenance.agent import MaintenanceAgent
    recovery.candidate['diagnosis'] = MaintenanceAgent._normalize_diagnosis(recovery.order['diagnosis_snapshot']).model_dump(mode='json')
    response = post(recovery)
    assert response.json()['status'] == 'applied', response.text


@pytest.mark.parametrize('hidden', [{'alarm_code': '700004'}, {'device_id': 'OTHER'}, {'requires_approval': True}, {'synthetic': True}])
def test_nested_raw_cannot_hide_conflicts_or_approval(recovery, hidden):
    diagnosis = recovery.candidate['diagnosis']
    diagnosis['raw']['raw'] = hidden
    response = post(recovery)
    assert response.json()['status'] == 'blocked', response.text
    assert not any(c[0] == 'replace' for c in recovery.calls)


def test_formal_maintenance_a2a_runs_validation_without_creating_or_dispatching(recovery, tmp_path, monkeypatch):
    from runtime_slimming_adapter import build_test_orchestrator
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    agent = runtime.container.agents['maintenance']
    agent.knowledge_provider = lambda *_: {'documents': [{'document_id': 'SOP-TURRET', 'content': '刀塔报警核验记录'}]}
    agent.cad_provider = lambda *_: {}
    recovery.runtime.container.requests = runtime.container.requests
    # Simulate the real saved DiagnosisView rather than a flat test-only dictionary.
    from app.agents.maintenance.agent import MaintenanceAgent
    recovery.order['diagnosis_snapshot'] = MaintenanceAgent._normalize_diagnosis(recovery.order['diagnosis_snapshot']).model_dump(mode='json')
    original = deepcopy(recovery.order['diagnosis_snapshot'])
    response = post(recovery)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['maintenance_plan']['repair_target'] == '刀塔旋转超时'
    assert not any('诊断证据不足' in item for item in result['validation_findings'])
    assert recovery.order['diagnosis_snapshot'] == original
    assert runtime.container.workorder_service.list() == []
    assert not runtime.test_model.calls
    assert not any(operation in {'create_workorder', 'submit_workorder_draft', 'assign_workorder'}
                   for _, operation, _ in runtime.test_boundary.calls)
