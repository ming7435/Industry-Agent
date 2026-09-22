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
