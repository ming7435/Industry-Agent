import pytest


def test_rag_client_rejects_local_fallback_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("RAG_ALLOW_LOCAL_FALLBACK", raising=False)
    from app.rag.client import RAGServiceClient

    client = RAGServiceClient(base_url="")
    with pytest.raises(RuntimeError, match="禁止本地回退"):
        client.upsert({"experience_id": "EXP-PROD", "content": "fixed"})


def test_memory_backends_require_external_services_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("ALLOW_DEGRADED_STORAGE", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)
    monkeypatch.delenv("MYSQL_HOST", raising=False)
    from app.memory.store import MemoryBackendError, build_memory_stores

    with pytest.raises(MemoryBackendError):
        build_memory_stores()
