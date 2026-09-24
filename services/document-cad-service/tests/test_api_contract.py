def test_cad_health_and_tool_contract(monkeypatch):
    from fastapi.testclient import TestClient

    from app import repository
    from app.main import app

    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("CAD_ALLOW_DEMO_FALLBACK", "true")
    repository.reset_repository()
    try:
        client = TestClient(app)
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["service"] == "document-cad-service"

        response = client.post("/tools/call", json={"tool": "query_bom", "arguments": {"query": "主轴"}})
        assert response.status_code == 200
        assert response.json()["source"] == "document-cad-service"
        assert response.json()["bom_items"]
    finally:
        repository.reset_repository()
