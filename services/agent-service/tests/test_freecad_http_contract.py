"""实际服务装配只公开 FreeCAD 建模，旧远程生成入口不得重新启用。"""
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from app.api.server import create_app
from app.harness.trace import TraceRecorder


@pytest.mark.parametrize('method,path', [
    ('GET', '/api/cad/buildcad/status'),
    ('POST', '/api/cad/buildcad/auth/start'),
    ('POST', '/api/cad/buildcad/runs'),
])
def test_actual_application_does_not_mount_previous_buildcad_generation(monkeypatch, method, path):
    monkeypatch.setenv('AGENT_API_TOKEN', 'isolated-cad-token')
    app = create_app(SimpleNamespace(container=SimpleNamespace(trace=TraceRecorder())))
    with TestClient(app) as browser:
        response = browser.request(method, path, headers={'Authorization': 'Bearer isolated-cad-token'},
            **({'json': {}} if method == 'POST' else {}))
    assert response.status_code == 404


def test_actual_application_freecad_connection_keeps_authentication(monkeypatch):
    monkeypatch.setenv('AGENT_API_TOKEN', 'isolated-cad-token')
    app = create_app(SimpleNamespace(container=SimpleNamespace(trace=TraceRecorder())))
    calls = []

    class BoundaryClient:
        def status(self):
            calls.append('get_rpc_status')
            return {'connected': True, 'tools': [{'name': 'execute_code'}]}

        def close(self):
            pass

    app.state.freecad_client_factory = BoundaryClient
    with TestClient(app) as browser:
        assert browser.get('/api/cad/freecad/status').status_code == 401
        assert not calls
        response = browser.get('/api/cad/freecad/status', headers={'Authorization': 'Bearer isolated-cad-token'})
    assert response.status_code == 200
    assert response.json()['connected'] is True
    assert calls == ['get_rpc_status']
