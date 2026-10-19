"""Text-to-CAD routes preserve durable identities while using the new backend."""
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.agents.cad import modeling_api
from app.api.server import create_app
from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry


def test_registry_selects_text_to_cad_as_the_only_modeling_backend():
    registry = ToolRegistry()
    assert registry.definitions['text_to_cad'].local_only is True
    assert 'freecad_mcp' not in registry.definitions
    assert registry.definitions['text_to_cad_document_proposal'].local_only is True


def test_service_lifecycle_starts_and_closes_registered_workers():
    events = []
    recovery = SimpleNamespace(start=lambda: events.append('start'), close=lambda: events.append('close'))
    app = create_app(SimpleNamespace(container=SimpleNamespace(trace=TraceRecorder(), recovery=recovery)))
    with TestClient(app):
        assert events == ['start']
    assert events == ['start', 'close']


def test_both_route_names_share_authentication_and_the_text_to_cad_client(monkeypatch):
    monkeypatch.setenv('AGENT_API_TOKEN', 'text-to-cad-surface-test')
    app = create_app(SimpleNamespace(container=SimpleNamespace(trace=TraceRecorder())))
    calls = []

    class LocalClient:
        def status(self):
            calls.append('status')
            return {'connected': True, 'provider': 'text-to-cad', 'tools': []}

        def close(self):
            pass

    app.state.text_to_cad_client_factory = LocalClient
    with TestClient(app) as client:
        for prefix in ('/api/cad/text-to-cad', '/api/cad/freecad'):
            assert client.get(prefix + '/status').status_code == 401
            result = client.get(prefix + '/status', headers={'Authorization': 'Bearer text-to-cad-surface-test'})
            assert result.status_code == 200
            assert result.json()['provider'] == 'text-to-cad'
            assert result.json()['part_identity_supported'] is True
    assert calls == ['status', 'status']


def test_legacy_request_and_router_names_are_compatibility_aliases():
    assert modeling_api.FreeCADRunRequest is modeling_api.TextToCadRunRequest
    assert modeling_api.get_freecad_run_record is modeling_api.get_text_to_cad_run_record
    assert modeling_api.build_freecad_router is modeling_api.build_text_to_cad_router


def test_canonical_and_legacy_routes_reuse_the_same_command_claim():
    from test_freecad_api import api
    client, store = api()
    body = {'prompt': '销轴，尺寸待定', 'command_id': 'same-backend-command'}
    created = client.post('/api/cad/text-to-cad/runs', json=body)
    assert created.status_code == 202
    run_id = created.json()['run_id']
    old = client.get('/api/cad/freecad/runs/' + run_id)
    assert old.status_code == 200
    assert old.json()['provider'] == 'text-to-cad'
    assert client.post('/api/cad/freecad/runs', json=body).json() == old.json()
    assert len(store.rows) == 1
