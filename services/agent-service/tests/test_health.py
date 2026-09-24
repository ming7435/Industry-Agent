from types import SimpleNamespace


def test_agent_health_reports_runtime_service():
    from fastapi.testclient import TestClient

    from app.api.server import create_app

    client = TestClient(create_app(SimpleNamespace(container=SimpleNamespace())))
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "agent-service", "runtime": "ready"}
