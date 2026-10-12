import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import routes


def client():
    app = FastAPI()
    app.include_router(routes.router)
    return TestClient(app)


@pytest.mark.parametrize('method,path,body', [
    ('POST', '/search', {'query': 'repair'}),
    ('POST', '/documents/upsert', {'document_id': 'DOC', 'collection': 'cases'}),
    ('POST', '/upsert', {}),
    ('POST', '/documents/ingest', {'path': 'missing.jsonl'}),
    ('GET', '/documents/DOC', None),
    ('GET', '/documents/DOC/chunks/C1', None),
    ('POST', '/fetch_document', {'document_id': 'DOC'}),
    ('POST', '/fetch_chunk', {'document_id': 'DOC', 'chunk_id': 'C1'}),
])
def test_every_document_route_requires_service_identity(monkeypatch, method, path, body):
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', 'isolated-rag-token')
    response = client().request(method, path, **({'json': body} if body is not None else {}))
    assert response.status_code == 401


@pytest.mark.parametrize('authorization', ['Bearer wrong', 'Basic isolated-rag-token', 'Bearer'])
def test_wrong_or_malformed_identity_cannot_reach_document_store(monkeypatch, authorization):
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', 'isolated-rag-token')
    response = client().get('/documents/DOC', headers={'Authorization': authorization})
    assert response.status_code == 401


def test_missing_service_secret_fails_closed(monkeypatch):
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', '')
    response = client().get('/documents/DOC')
    assert response.status_code == 503


def test_authenticated_document_read_keeps_existing_contract(tmp_path, monkeypatch):
    from app.api.documents import DocumentStore
    store = DocumentStore(str(tmp_path / 'auth.sqlite3'))
    store.upsert('AUTH-DOC', 'verified maintenance', {}, 'cases')
    monkeypatch.setattr(routes, 'get_document_store', lambda: store)
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', 'isolated-rag-token')
    response = client().get('/documents/AUTH-DOC', headers={'Authorization': 'Bearer isolated-rag-token'})
    assert response.status_code == 200
    assert response.json()['document']['content'] == 'verified maintenance'


def test_health_remains_public_without_a_secret(monkeypatch):
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', '')
    async def unavailable(_):
        return None
    monkeypatch.setattr(routes, '_resolve', unavailable)
    assert client().get('/health').status_code == 200


@pytest.mark.parametrize('path,body', [
    ('/documents/upsert', {'document_id': 'UNSAFE', 'collection': '../outside'}),
    ('/upsert', {'document_id': 'UNSAFE', 'collection': '../outside'}),
    ('/documents/ingest', {'path': 'missing.jsonl', 'collection': '../outside'}),
])
def test_invalid_collection_is_rejected_before_document_persistence(tmp_path, monkeypatch, path, body):
    from app.api.documents import DocumentStore
    store = DocumentStore(str(tmp_path / 'auth.sqlite3'))
    monkeypatch.setattr(routes, 'get_document_store', lambda: store)
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', 'isolated-rag-token')
    response = client().post(path, json=body, headers={'Authorization': 'Bearer isolated-rag-token'})
    assert response.status_code == 422
    assert store.get('UNSAFE') is None
