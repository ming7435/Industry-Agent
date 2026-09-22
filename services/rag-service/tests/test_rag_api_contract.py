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


def test_rag_search_returns_real_stored_chunks(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    client.post(
        "/documents/upsert",
        json={
            "document_id": "EXP-CHUNKS",
            "content": "spindle repair case",
            "metadata": {"source_event_id": "EVT-CHUNKS"},
            "collection": "cases",
            "chunks": [
                {"chunk_id": "EXP-CHUNKS:1", "text": "repair replace spindle bearing", "metadata": {"page": 1}},
                {"chunk_id": "EXP-CHUNKS:2", "text": "verify vibration after repair", "metadata": {"page": 2}},
            ],
        },
    )

    response = client.post("/search", json={"query": "repair", "top_n": 5})
    assert response.status_code == 200
    assert {item["chunk_id"] for item in response.json()["hits"]} >= {"EXP-CHUNKS:1", "EXP-CHUNKS:2"}


def test_rag_upsert_can_update_whoosh_backend(tmp_path, monkeypatch):
    import pytest

    pytest.importorskip("whoosh")
    from app.api import documents, routes
    from app.main import app
    from app.whoosh.indexer import count_documents, index_dir_for_collection

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    monkeypatch.setenv("RAG_UPSERT_WHOOSH_ENABLED", "true")
    monkeypatch.setenv("RAG_DOCUMENT_WHOOSH_INDEX_DIR", str(tmp_path / "whoosh"))
    response = TestClient(app).post(
        "/documents/upsert",
        json={"document_id": "EXP-WHOOSH", "content": "bearing replacement", "metadata": {}, "collection": "cases"},
    ).json()

    assert response["success"] is True
    assert response["backends"]["whoosh"]["written"] == 1
    assert count_documents(index_dir_for_collection(tmp_path / "whoosh", "cases")) == 1


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
