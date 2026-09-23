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


def test_closure_store_does_not_fallback_to_memory_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEGRADED_STORAGE", "false")
    monkeypatch.delenv("MYSQL_HOST", raising=False)
    from app.closure.store import ClosureBackendError, build_closure_store

    with pytest.raises(ClosureBackendError, match="MYSQL_HOST"):
        build_closure_store()


def test_cad_tool_does_not_fallback_to_demo_in_production(monkeypatch, tmp_path):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEGRADED_STORAGE", "false")
    monkeypatch.setenv("CAD_ALLOW_DEMO_FALLBACK", "false")
    monkeypatch.setenv("WORKORDER_STORE_PATH", str(tmp_path / "workorders.sqlite3"))
    monkeypatch.setenv("REPORT_STORE_PATH", str(tmp_path / "reports.sqlite3"))
    from app.tools.registry import ToolRegistry

    class _Rag:
        pass

    registry = ToolRegistry(rag_client=_Rag(), cad_base_url="http://cad.invalid")

    def fail(*_args, **_kwargs):
        raise RuntimeError("cad unavailable")

    monkeypatch.setattr(registry.mcp, "call", fail)
    with pytest.raises(RuntimeError, match="cad unavailable"):
        registry.execute("query_cad", {"query": "spindle"})
