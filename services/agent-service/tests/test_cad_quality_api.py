from __future__ import annotations

from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import cad_quality
from app.api.cad_quality import build_cad_quality_router
from app.api.cad_quality_rules import design_digest


SPEC = {'units': 'mm', 'operations': [
    {'type': 'cylinder', 'mode': 'add', 'axis': 'z', 'position': [0, 0, 0],
     'diameter': 30, 'length': 50},
]}
RUN_ID = 'FC-' + 'a' * 64


class Store:
    def __init__(self, records):
        self.records = records

    def get(self, key):
        return self.records.get(key)


class Registry:
    def __init__(self):
        self.calls = []

    def execute(self, name, values, context=None):
        self.calls.append((name, values, context))
        return {'success': True, 'part': {'recorded_at': '2026-10-08T00:00:00+00:00'}}


def client(monkeypatch, status='completed', spec=SPEC):
    monkeypatch.setattr(cad_quality, 'team_actor', lambda request: {
        'user_id': 'qc-operator', 'role': 'supervisor',
    })
    app = FastAPI()
    app.state.freecad_run_store = Store({RUN_ID: {
        'run_id': RUN_ID, 'status': status, 'spec': spec,
        'validation': {'valid': True, 'step_roundtrip': True},
        'artifacts': [{'name': 'model.step'}, {'name': 'model.stl'}],
    }})
    registry = Registry()
    runtime = SimpleNamespace(container=SimpleNamespace(registry=registry))
    app.include_router(build_cad_quality_router(runtime, lambda: None))
    return TestClient(app), registry


def test_lookup_uses_server_owned_completed_cad_run(monkeypatch):
    api, registry = client(monkeypatch)
    result = api.get('/api/quality/cad/designs/' + RUN_ID)
    assert result.status_code == 200
    assert result.json()['design_digest'] == design_digest(SPEC)
    assert result.json()['parameters']
    assert registry.calls == []


def test_pending_model_cannot_be_compared(monkeypatch):
    api, registry = client(monkeypatch, status='running')
    result = api.get('/api/quality/cad/designs/' + RUN_ID)
    assert result.status_code == 409
    assert registry.calls == []


def test_all_matching_values_are_persisted_as_manual_observations(monkeypatch):
    api, registry = client(monkeypatch)
    design = api.get('/api/quality/cad/designs/' + RUN_ID).json()
    measurements = {row['key']: {'actual': row['nominal'], 'tolerance': 0.02} for row in design['parameters']}
    result = api.post('/api/quality/cad/compare', json={
        'run_id': RUN_ID, 'design_digest': design['design_digest'],
        'part_id': 'PART-A', 'measurements': measurements,
    })
    assert result.status_code == 200, result.text
    assert result.json()['status'] == 'consistent'
    assert result.json()['persisted'] is True
    assert result.json()['operator'] == 'qc-operator'
    assert registry.calls[0][0] == 'register_production_part'
    assert registry.calls[0][1]['part']['design_run_id'] == RUN_ID
    assert registry.calls[0][1]['part']['comparison_status'] == 'consistent'


def test_rejects_stale_digest_without_recording_measurements(monkeypatch):
    api, registry = client(monkeypatch)
    result = api.post('/api/quality/cad/compare', json={
        'run_id': RUN_ID, 'design_digest': '0' * 64,
        'part_id': 'PART-A', 'measurements': {},
    })
    assert result.status_code == 409
    assert registry.calls == []


def test_missing_measurements_never_claim_pass_or_write(monkeypatch):
    api, registry = client(monkeypatch)
    result = api.post('/api/quality/cad/compare', json={
        'run_id': RUN_ID, 'design_digest': design_digest(SPEC),
        'part_id': 'PART-A', 'measurements': {},
    })
    assert result.status_code == 200
    assert result.json()['status'] == 'insufficient_data'
    assert result.json()['persisted'] is False
    assert registry.calls == []
