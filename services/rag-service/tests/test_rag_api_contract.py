from fastapi.testclient import TestClient
import json
import asyncio


def test_rag_upsert_and_fetch_document_contract(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    response = client.post("/documents/upsert", json={
        "document_id": "EXP-1", "content": "repaired spindle",
        "metadata": {"source_event_id": "EVT-1"}, "collection": "maint_fault_events",
    })
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert client.get("/documents/EXP-1").json()["document"]["document_id"] == "EXP-1"
    assert client.get("/documents/EXP-1/chunks/EXP-1:0").status_code == 200


def test_rag_partial_backend_failure_is_visible(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    monkeypatch.setenv("RAG_TEST_FAIL_WHOOSH", "1")
    result = TestClient(app).post("/documents/upsert", json={
        "document_id": "EXP-2", "content": "x", "metadata": {}, "collection": "cases",
    }).json()
    assert result["success"] is False
    assert result["backends"]["whoosh"]["success"] is False


def test_rag_search_returns_real_stored_chunks(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    client.post("/documents/upsert", json={
        "document_id": "EXP-CHUNKS", "content": "spindle repair case",
        "metadata": {"source_event_id": "EVT-CHUNKS"}, "collection": "cases",
        "chunks": [
            {"chunk_id": "EXP-CHUNKS:1", "text": "repair replace spindle bearing", "metadata": {"page": 1}},
            {"chunk_id": "EXP-CHUNKS:2", "text": "verify vibration after repair", "metadata": {"page": 2}},
        ],
    })
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
    response = TestClient(app).post("/documents/upsert", json={
        "document_id": "EXP-WHOOSH", "content": "bearing replacement", "metadata": {}, "collection": "cases",
    }).json()
    assert response["success"] is True
    assert response["backends"]["whoosh"]["written"] == 1
    assert count_documents(index_dir_for_collection(tmp_path / "whoosh", "cases")) == 1


def test_legacy_document_routes_remain_compatible(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    assert client.post("/upsert", json={"record": {"id": "EXP-LEGACY", "content": "fixed"}, "collection": "cases"}).status_code == 200
    fetched = client.post("/fetch_document", json={"document_id": "EXP-LEGACY"})
    assert fetched.status_code == 200
    assert fetched.json()["document"]["document_id"] == "EXP-LEGACY"


def test_rag_search_honors_collection_and_metadata_filters(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    client.post("/documents/upsert", json={
        "document_id": "EXP-CASE", "content": "bearing repair", "collection": "cases",
        "metadata": {"device_id": "CNC-1", "knowledge_type": "case"},
    })
    client.post("/documents/upsert", json={
        "document_id": "EXP-SOP", "content": "bearing repair", "collection": "sop",
        "metadata": {"device_id": "CNC-1", "knowledge_type": "sop"},
    })

    response = client.post("/search", json={
        "query": "bearing", "top_n": 5, "filters": {"corpus": "cases", "device_id": "CNC-1"},
    })
    assert response.status_code == 200
    assert response.json()["hits"]
    assert {item["metadata"]["collection"] for item in response.json()["hits"]} == {"cases"}


def test_rag_filters_are_exact_and_corpus_uses_metadata(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    client = TestClient(app)
    for document_id, tenant_id in (("EXP-1", "tenant-1"), ("EXP-10", "tenant-10")):
        client.post("/documents/upsert", json={
            "document_id": document_id,
            "content": "bearing repair",
            "collection": "maint_fault_events",
            "metadata": {"tenant_id": tenant_id, "corpus": "cases"},
        })

    response = client.post("/search", json={
        "query": "bearing", "top_n": 5,
        "filters": {"tenant_id": "tenant-1", "corpus": "cases"},
    })
    assert response.status_code == 200
    assert {item["metadata"]["document_id"] for item in response.json()["hits"]} == {"EXP-1"}


def test_rag_documents_ingest_persists_jsonl_records(tmp_path, monkeypatch):
    from app.api import documents, routes
    from app.main import app

    store = documents.DocumentStore(str(tmp_path / "rag.sqlite3"))
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    source = tmp_path / "cases.jsonl"
    source.write_text(json.dumps({"id": "INGEST-1", "content": "repair case", "metadata": {"corpus": "cases"}}, ensure_ascii=False) + "\n", encoding="utf-8")

    response = TestClient(app).post("/documents/ingest", json={"path": str(source), "collection": "cases"})
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["loaded"] == 1
    assert TestClient(app).get("/documents/INGEST-1").status_code == 200


def test_experience_upsert_writes_bm25_and_dense_indexes(tmp_path):
    from app.api.indexing import UnifiedExperienceIndexer
    from app.api.models import DocumentUpsertRequest

    calls = {"whoosh": [], "milvus": []}

    class _Embedder:
        def embed_texts(self, texts):
            return [[0.1, 0.2, 0.3] for _ in texts]

    class _MilvusWriter:
        def recreate_collection(self, dimension):
            assert dimension == 3

        def insert_records(self, records):
            calls["milvus"].extend(records)
            return len(records)

    indexer = UnifiedExperienceIndexer(
        whoosh_writer=lambda records, collection: calls["whoosh"].extend(records) or len(records),
        embedder_factory=lambda: _Embedder(),
        milvus_writer_factory=lambda collection: _MilvusWriter(),
    )
    result = indexer.upsert(DocumentUpsertRequest(
        document_id="workorder:WO-1",
        content="主轴轴承更换后振动恢复正常",
        collection="maint_fault_events",
        metadata={"corpus": "cases", "workorder_id": "WO-1"},
    ))

    assert result["pipeline_ready"] is True
    assert result["backends"]["whoosh"]["success"] is True
    assert result["backends"]["milvus"]["success"] is True
    assert calls["whoosh"][0]["chunk_id"] == "workorder:WO-1:0"
    assert calls["milvus"][0].chunk_id == "workorder:WO-1:0"


def test_stored_experience_runs_through_rrf_rerank_evidence_and_llm():
    from app.api.models import SearchRequest
    from app.api.pipeline import SearchPipeline
    from app.retrieval import Hit

    stages = []

    class _Retriever:
        def __init__(self, source):
            self.source = source

        def search(self, query, filters, top_k):
            stages.append(self.source)
            return []

    class _Reranker:
        def rerank(self, query, hits, top_n):
            stages.append("rerank")
            return hits[:top_n]

    class _LLM:
        async def generate(self, query, evidence):
            stages.append("llm")
            assert "主轴轴承" in evidence
            return "根据已关闭工单经验更换主轴轴承。"

    experience = Hit(
        chunk_id="workorder:WO-1:0",
        text="主轴轴承更换后振动恢复正常",
        score=1.0,
        source="experience-store",
        metadata={"corpus": "cases", "document_id": "workorder:WO-1"},
    )
    response = asyncio.run(SearchPipeline(
        bm25=_Retriever("bm25"),
        dense=_Retriever("dense"),
        embedder=object(),
        reranker=_Reranker(),
        llm=_LLM(),
    ).search(
        SearchRequest(query="主轴轴承怎么维修", top_n=3),
        "REQ-EXPERIENCE",
        supplemental_hits=[experience],
    ))

    assert [item.chunk_id for item in response.hits] == ["workorder:WO-1:0"]
    assert response.evidence_text
    assert response.answer
    assert stages == ["bm25", "dense", "rerank", "llm"]
