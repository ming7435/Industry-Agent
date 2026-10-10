"""Agent HTTP -> actual Backend router/repository -> saved inspection results."""
import importlib
import importlib.util
from pathlib import Path
import sys
import time
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.clients.backend import BackendServiceError
from app.api.quality_simulation import build_simulation_router


RUN_ID = 'FC-' + 'a' * 56 + '00016973'


def run():
    return {'run_id': RUN_ID, 'part_name': '安装底板', 'status': 'completed',
            'validation': {'valid': True, 'step_roundtrip': True, 'solid_count': 1},
            'spec': {'units': 'mm', 'operations': [{'type': 'box', 'mode': 'add', 'length': 100, 'width': 70, 'height': 12, 'position': [0, 0, 0]}]}}


def snapshot():
    return {'summary': {'updated_at': time.time()*1000}, 'devices': [
        {'device_id': 'RENISHAW-EQUATOR300-001', 'device_type': 'equator_gauge', 'name': 'Equator 300', 'status': 'running'}],
        'monitor': {'device_id': 'RENISHAW-EQUATOR300-001', 'status': 'running', 'metrics': {
            'equator_power_on': 1, 'axis_comm_ok': 1, 'probe_present': 1, 'estop_released': 1,
            'probe_fault_flag': 0, 'hold_mode_enabled': 0, 'recalibration_due_hours': 24}},
        'detail': {'device_id': 'RENISHAW-EQUATOR300-001', 'control_state': 'running'}}


@pytest.fixture
def connected(tmp_path, monkeypatch):
    monkeypatch.setenv('QUALITY_SIMULATION_ENABLED', 'true')
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    monkeypatch.setenv('APP_ENV', 'development')
    monkeypatch.setenv('BACKEND_STORAGE', 'sqlite')
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', '')
    package_name = 'isolated_simulation_backend'
    root = Path(__file__).resolve().parents[2] / 'backend-service/app'
    spec = importlib.util.spec_from_file_location(package_name, root/'__init__.py', submodule_search_locations=[str(root)])
    package = importlib.util.module_from_spec(spec); sys.modules[package_name] = package; spec.loader.exec_module(package)
    repo = importlib.import_module(package_name+'.workorder.repository').SQLiteRepository(str(tmp_path/'business.db'))
    backend_routes = importlib.import_module(package_name+'.quality_simulation.routes')
    backend_app = FastAPI(); backend_app.include_router(backend_routes.create_router(lambda: SimpleNamespace(repository=repo)))
    backend = TestClient(backend_app)
    calls = {'cad': 0, 'factory': 0}
    class Bridge:
        def resolve_session(self, token): return {'user_id': token, 'role': 'technician'} if token.startswith('U-') else None
        def request(self, path, body):
            response = backend.post(path, json=body)
            if response.status_code != 200: raise BackendServiceError(response.json().get('detail'), response.status_code)
            return response.json()
    def cad(request, run_id):
        calls['cad'] += 1
        if getattr(request.app.state, 'cad_error', None): raise HTTPException(request.app.state.cad_error, 'CAD source error')
        value = run(); value['run_id'] = run_id
        if getattr(request.app.state, 'cad_spec', None): value['spec'] = request.app.state.cad_spec
        if getattr(request.app.state, 'cad_proof', None): value['validation'] = request.app.state.cad_proof
        return value
    def factory():
        calls['factory'] += 1
        if getattr(app.state, 'factory_error', False): raise RuntimeError('factory offline')
        return snapshot()
    app = FastAPI(); app.include_router(build_simulation_router(lambda: None, backend_factory=Bridge, cad_reader=cad, factory_reader=factory))
    client = TestClient(app); client.cookies.set('maintenance_session', 'U-1')
    return client, app, repo, calls


def test_click_detect_saves_and_refresh_reads_same_batch(connected):
    client, app, repo, calls = connected
    assert client.get('/api/quality/simulation/capabilities').json()['enabled'] is True
    standard = client.get('/api/quality/simulation/designs/' + RUN_ID).json()
    assert standard['basis']['part_number'] == '92531'
    assert standard['latest'] is None
    payload = {'design_run_id': RUN_ID, 'request_id': 'click-1'}
    detected = client.post('/api/quality/simulation/detect', json=payload)
    assert detected.status_code == 200, detected.text
    result = detected.json(); assert result['samples'] and result['issues']
    assert result['traceability']['production_device_id'] is None  # no machining trace in directory
    app.state.factory_error = True; app.state.cad_error = 404
    assert client.post('/api/quality/simulation/detect', json=payload).json() == result
    assert calls == {'cad': 2, 'factory': 1}
    assert client.get('/api/quality/simulation/designs/' + RUN_ID).json()['latest'] == result
    assert client.get('/api/quality/simulation/designs').json()['items'][0]['run_id'] == RUN_ID
    client.cookies.set('maintenance_session', 'U-2')
    assert client.get('/api/quality/simulation/requests/click-1').status_code == 404
    assert client.get('/api/quality/simulation/designs').json()['items'] == []


def test_missing_session_and_browser_declared_measurement_are_rejected(connected):
    client, _, repo, calls = connected
    payload = {'design_run_id': RUN_ID, 'request_id': 'click-1', 'measurements': {'length': 100}, 'passed': True}
    assert client.post('/api/quality/simulation/detect', json=payload).status_code == 422
    client.cookies.clear()
    assert client.get('/api/quality/simulation/capabilities').status_code == 401
    assert client.post('/api/quality/simulation/detect', json={'design_run_id': RUN_ID, 'request_id': 'click-1'}).status_code == 401
    assert repo.list_records('simulated_quality_batch') == [] and calls['factory'] == 0


def test_only_explicit_404_may_use_saved_cad_basis(connected):
    client, app, repo, calls = connected
    assert client.post('/api/quality/simulation/detect', json={'design_run_id': RUN_ID, 'request_id': 'click-1'}).status_code == 200
    app.state.cad_error = 503
    reading = client.get('/api/quality/simulation/designs/' + RUN_ID)
    assert reading.status_code == 200
    assert reading.json()['latest']['request_id'] == 'click-1'
    assert reading.json()['basis'] is None
    assert reading.json()['standard_error']
    response = client.post('/api/quality/simulation/detect', json={'design_run_id': RUN_ID, 'request_id': 'click-2'})
    assert response.status_code == 503
    assert len(repo.list_records('simulated_quality_batch')) == 1


def test_same_request_other_design_conflicts_and_offline_factory_is_not_a_bad_batch(connected):
    client, app, repo, calls = connected
    assert client.post('/api/quality/simulation/detect', json={'design_run_id': RUN_ID, 'request_id': 'click-1'}).status_code == 200
    assert client.post('/api/quality/simulation/detect', json={'design_run_id': 'FC-'+'b'*64, 'request_id': 'click-1'}).status_code == 409
    app.state.factory_error = True
    response = client.post('/api/quality/simulation/detect', json={'design_run_id': RUN_ID, 'request_id': 'click-2'})
    assert response.status_code == 503
    assert response.json()['detail']['execution_started'] is False
    assert len(repo.list_records('simulated_quality_batch')) == 1


def test_complex_model_standard_and_partial_result_flow_through_both_http_layers(connected):
    client, app, repo, calls = connected
    app.state.cad_spec = {'units': 'mm', 'operations': [
        {'type': 'cylinder', 'mode': 'add', 'diameter': 70, 'length': 12, 'axis': 'z'},
        {'type': 'cylinder', 'mode': 'add', 'diameter': 32, 'length': 30, 'axis': 'z'},
        {'type': 'fillet', 'radius': 1, 'edges': 'all'}]}
    app.state.cad_proof = {'valid': True, 'step_roundtrip': True, 'solid_count': 1, 'bounds_mm': [70, 70, 42]}
    standard = client.get('/api/quality/simulation/designs/' + RUN_ID)
    assert standard.status_code == 200, standard.text
    rows = {p['key']: p for p in standard.json()['basis']['parameters']}
    assert rows['operations.0.diameter']['expected'] == '70'
    assert rows['operations.2.radius']['comparable'] is False
    result = client.post('/api/quality/simulation/detect', json={'design_run_id': RUN_ID, 'request_id': 'complex'})
    assert result.status_code == 200, result.text
    assert result.json()['status'] == 'partial'
    assert result.json()['counts']['pending'] == 10
    assert result.json()['rates'] == {'qualified': None, 'defect': None, 'coverage': 0.0}
    assert client.get('/api/quality/simulation/requests/complex').json() == result.json()
    assert repo.list_records('quality') == []
