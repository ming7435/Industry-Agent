def test_agent_rag_client_uses_documents_contract(monkeypatch):
    from app.rag.client import RAGServiceClient

    client = RAGServiceClient(base_url="http://rag", fallback=None)
    calls = []
    monkeypatch.setattr(client, "_post", lambda path, payload: calls.append(("POST", path, payload)) or {"success": True, "loaded": 1})
    monkeypatch.setattr(client, "_get", lambda path: calls.append(("GET", path, {})) or {"success": True, "document": {}})
    client.upsert({"experience_id": "EXP-1", "content": "fixed"}, collection="cases")
    client.fetch_document("EXP-1")
    client.fetch_chunk("EXP-1", "EXP-1:0")
    assert calls[0][0:2] == ("POST", "/documents/upsert")
    assert calls[1][0:2] == ("GET", "/documents/EXP-1")
    assert calls[2][0:2] == ("GET", "/documents/EXP-1/chunks/EXP-1:0")


def test_agent_rag_client_bounds_long_remote_queries(monkeypatch):
    from app.rag.client import RAGServiceClient

    client = RAGServiceClient(base_url="http://rag", fallback=None)
    calls = []
    monkeypatch.setattr(
        client,
        "_post",
        lambda path, payload: calls.append((path, payload)) or {"request_id": "r1", "hits": []},
    )

    client.search("x" * 5000, limit=5)

    assert calls[0][0] == "/search"
    assert len(calls[0][1]["query"]) <= 2000


def test_agent_rag_client_falls_back_to_all_documents_when_scoped_alarm_has_no_hits(monkeypatch):
    from app.rag.client import RAGServiceClient

    client = RAGServiceClient(base_url="http://rag", fallback=None)
    calls = []

    def post(path, payload):
        calls.append((path, payload))
        if len(calls) == 1:
            return {"request_id": "scoped", "hits": [], "answer": ""}
        return {
            "request_id": "all",
            "hits": [{
                "chunk_id": "DOC-ALL:0",
                "text": "通用检查步骤",
                "score": 0.9,
                "metadata": {"corpus": "manuals"},
            }],
            "answer": "通用检查步骤",
        }

    monkeypatch.setattr(client, "_post", post)

    result = client.search(
        "如何处理报警",
        filters={
            "alarm_active": True,
            "device_id": "MACHINE-001",
            "alarm_code": "ALM-001",
        },
    )

    assert len(calls) == 2
    assert calls[0][1]["filters"]["device_id"] == "MACHINE-001"
    assert "device_id" not in calls[1][1]["filters"]
    assert "ALM-001" in calls[1][1]["query"]
    assert result["retrieval_scope"] == "all"
    assert result["retrieval_fallback"] is True


def test_agent_rag_client_marks_local_fallback_as_all_scope_without_device_metadata(monkeypatch):
    from app.rag.client import RAGServiceClient

    monkeypatch.setenv("RAG_ALLOW_LOCAL_FALLBACK", "true")
    client = RAGServiceClient(base_url="", fallback=None)
    monkeypatch.setattr(
        client.fallback,
        "search",
        lambda query, limit, filters: {"documents": [{"document_id": "D-1", "content": "通用步骤"}]},
    )

    result = client.search(
        "报警怎么处理",
        filters={"alarm_active": True, "device_id": "MACHINE-001", "alarm_code": "ALM-001"},
    )

    assert result["retrieval_scope"] == "all"
    assert result["retrieval_fallback"] is True


def test_agent_rag_client_falls_back_when_remote_is_degraded_without_hits(monkeypatch):
    from app.rag.client import RAGServiceClient

    monkeypatch.setenv("RAG_ALLOW_LOCAL_FALLBACK", "true")
    client = RAGServiceClient(base_url="http://rag", fallback=None)
    monkeypatch.setattr(client, "_post", lambda path, payload: {"hits": [], "answer": "", "degraded": True, "degrade_reason": "all_retrievers_failed"})
    monkeypatch.setattr(
        client.fallback,
        "search",
        lambda query, limit, filters: {
            "documents": [{"document_id": "SOP-1", "title": "主轴温升检查", "content": "检查冷却泵并复测温度。"}],
            "source": "local-rag-index",
        },
    )

    result = client.search("主轴温度过高怎么检查")

    assert result["documents"][0]["document_id"] == "SOP-1"
    assert result["connection_status"] == "remote_degraded_local_fallback"
    assert result["degraded"] is True
