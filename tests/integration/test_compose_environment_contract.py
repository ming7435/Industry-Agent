from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]


def _compose() -> dict:
    return yaml.safe_load((ROOT / "infra" / "docker" / "docker-compose.yml").read_text(encoding="utf-8"))


def test_compose_injects_model_keys_and_external_backends():
    services = _compose()["services"]
    agent = services["agent-service"]["environment"]
    rag = services["rag-service"]["environment"]
    cad = services["cad-service"]["environment"]

    assert agent["DEEPSEEK_API_KEY"] == "${DEEPSEEK_API_KEY:-}"
    assert agent["REDIS_URL"] == "redis://redis:6379/0"
    assert agent["WORKORDER_BACKEND"] == "mysql"
    assert agent["PENDING_TASK_STORE_PATH"] == "/app/.runtime/pending.sqlite3"
    assert rag["DEEPSEEK_API_KEY"] == "${DEEPSEEK_API_KEY:-}"
    assert rag["SILICONFLOW_API_KEY"] == "${SILICONFLOW_API_KEY:-}"
    assert cad["CAD_ALLOW_DEMO_FALLBACK"] == "${CAD_ALLOW_DEMO_FALLBACK:-false}"


def test_agent_runtime_volume_and_health_dependencies_are_declared():
    compose = _compose()
    agent = compose["services"]["agent-service"]

    assert "agent-runtime-data:/app/.runtime" in agent["volumes"]
    assert agent["depends_on"]["redis"]["condition"] == "service_healthy"
    assert "agent-runtime-data" in compose["volumes"]
