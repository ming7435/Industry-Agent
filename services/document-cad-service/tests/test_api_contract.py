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


def test_cad_does_not_misidentify_lubrication_pump_as_cooling_pump(monkeypatch):
    from fastapi.testclient import TestClient

    from app import repository
    from app.main import app

    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("CAD_ALLOW_DEMO_FALLBACK", "true")
    repository.reset_repository()
    try:
        response = TestClient(app).post(
            "/tools/call",
            json={"tool": "query_part", "arguments": {"query": "LUBRICATION-PUMP"}},
        )
        assert response.status_code == 200
        assert response.json()["parts"] == []
    finally:
        repository.reset_repository()
