from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]


def _compose() -> dict:
    return yaml.safe_load((ROOT / "infra" / "docker" / "docker-compose.yml").read_text(encoding="utf-8"))


def test_compose_keeps_model_keys_inside_model_service_and_declares_boundaries():
    services = _compose()["services"]
    agent = services["agent-service"]["environment"]
    rag = services["rag-service"]["environment"]
    cad = services["cad-service"]["environment"]
    backend = services["backend-service"]["environment"]
    model = services["model-service"]["environment"]

    assert "DEEPSEEK_API_KEY" not in agent
    assert "SILICONFLOW_API_KEY" not in agent
    assert agent["REDIS_URL"] == "redis://redis:6379/0"
    assert agent["WORKORDER_BACKEND"] == "mysql"
    assert agent["PENDING_TASK_STORE_PATH"] == "/app/.runtime/pending.sqlite3"
    assert rag["MODEL_SERVICE_BASE_URL"] == "http://model-service:8040"
    assert "DEEPSEEK_API_KEY" not in rag
    assert "SILICONFLOW_API_KEY" not in rag
    assert cad["MODEL_SERVICE_BASE_URL"] == "http://model-service:8040"
    assert cad["CAD_ALLOW_DEMO_FALLBACK"] == "${CAD_ALLOW_DEMO_FALLBACK:-false}"
    assert backend["BACKEND_STORAGE"] == "${BACKEND_STORAGE:-mysql}"
    assert model["DEEPSEEK_API_KEY"] == "${DEEPSEEK_API_KEY:-}"
    assert model["SILICONFLOW_API_KEY"] == "${SILICONFLOW_API_KEY:-}"
    assert agent["MCP_MES_URL"] == "http://backend-service:8030"
    assert agent["MCP_INVENTORY_URL"] == "http://backend-service:8030"
    assert agent["MCP_QMS_URL"] == "http://backend-service:8030"


def test_agent_runtime_volume_and_health_dependencies_are_declared():
    compose = _compose()
    agent = compose["services"]["agent-service"]

    assert "agent-runtime-data:/app/.runtime" in agent["volumes"]
    assert agent["depends_on"]["redis"]["condition"] == "service_healthy"
    assert "agent-runtime-data" in compose["volumes"]
