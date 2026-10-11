import importlib

from fastapi import FastAPI
from fastapi.testclient import TestClient


def test_internal_cad_routes_require_service_auth(tmp_path, monkeypatch):
    assert importlib.util.find_spec('app.cad_documents'), 'CAD internal routes missing'
    from app.cad_documents.repository import CadDocumentRepository
    from app.cad_documents.routes import create_router
    from app.cad_documents.service import CadDocumentService
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'test-cad-internal')
    service = CadDocumentService(CadDocumentRepository(sqlite_path=tmp_path/'cad.sqlite'))
    app = FastAPI()
    app.include_router(create_router(lambda: service))
    client = TestClient(app)
    body = dict(actor_id='USER-a', request_id='r', part_name='底板', part_number='00123')
    url = '/internal/cad/documents/create_document'
    assert client.post(url, json=body).status_code == 401
    result = client.post(url, json=body, headers={'Authorization':'Bearer test-cad-internal'})
    assert result.status_code == 200
    assert result.json()['result']['part_number'] == '00123'
    assert client.post('/internal/cad/documents/execute_code', json={}, headers={'Authorization':'Bearer test-cad-internal'}).status_code == 404
