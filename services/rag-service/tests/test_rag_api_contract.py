from fastapi.testclient import TestClient


def test_rag_upsert_and_fetch_document_contract(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    payload = {
        "document_id": "EXP-1",
        "content": "repaired spindle",
        "metadata": {"source_event_id": "EVT-1"},
        "collection": "maint_fault_events",
    }
    response = client.post("/documents/upsert", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True
    fetched = client.get("/documents/EXP-1")
    assert fetched.status_code == 200
    assert fetched.json()["document"]["document_id"] == "EXP-1"
    chunk = client.get("/documents/EXP-1/chunks/EXP-1:0")
    assert chunk.status_code == 200


def test_rag_partial_backend_failure_is_visible(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    monkeypatch.setenv("RAG_TEST_FAIL_WHOOSH", "1")
    result = TestClient(app).post(
        "/documents/upsert",
        json={"document_id": "EXP-2", "content": "x", "metadata": {}, "collection": "cases"},
    ).json()
    assert result["success"] is False
    assert result["backends"]["whoosh"]["success"] is False


def test_legacy_document_routes_remain_compatible(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    upsert = client.post("/upsert", json={"record": {"id": "EXP-LEGACY", "content": "fixed"}, "collection": "cases"})
    assert upsert.status_code == 200
    fetched = client.post("/fetch_document", json={"document_id": "EXP-LEGACY"})
    assert fetched.status_code == 200
    assert fetched.json()["document"]["document_id"] == "EXP-LEGACY"
