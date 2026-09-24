from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]


def test_compose_wires_agent_to_rag_and_cad_services():
    compose = yaml.safe_load((ROOT / "infra" / "docker" / "docker-compose.yml").read_text(encoding="utf-8"))
    agent = compose["services"]["agent-service"]

    assert agent["environment"]["RAG_SERVICE_BASE_URL"] == "http://rag-service:8020"
    assert agent["environment"]["MCP_CAD_URL"] == "http://cad-service:8011"
    assert agent["depends_on"]["rag-service"]["condition"] == "service_healthy"
    assert agent["depends_on"]["cad-service"]["condition"] == "service_healthy"
    assert agent["depends_on"]["backend-service"]["condition"] == "service_healthy"
    assert agent["depends_on"]["model-service"]["condition"] == "service_healthy"


def test_cad_contract_exposes_structured_engineering_tools():
    source = (ROOT / "services" / "document-cad-service" / "app" / "main.py").read_text(encoding="utf-8")

    for tool in ("query_drawing", "query_bom", "query_part", "query_relation"):
        assert f'"{tool}"' in source
    assert '"/tools/call"' in source


def test_backend_contract_is_the_agent_business_boundary():
    source = (ROOT / "services" / "agent-service" / "app" / "tools" / "registry.py").read_text(encoding="utf-8")
    assert '"mes": self.backend_base_url' in source
    assert '"qms": os.getenv("MCP_QMS_URL"' in source
    assert "self.quality_mcp = None if self.backend_base_url" in source
