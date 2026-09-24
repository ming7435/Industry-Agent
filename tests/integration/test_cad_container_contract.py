from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_cad_image_installs_complete_dependency_set():
    dockerfile = (ROOT / "infra" / "docker" / "Dockerfile.cad").read_text(encoding="utf-8")
    requirements = (ROOT / "services" / "document-cad-service" / "requirements-rag.txt").read_text(encoding="utf-8")

    assert "requirements-rag.txt" in dockerfile
    assert "pymysql>=1.1,<2" in requirements.lower()
    assert "pydantic-settings" in requirements.lower()


def test_cad_readme_uses_compose_port():
    readme = (ROOT / "services" / "document-cad-service" / "README.md").read_text(encoding="utf-8")

    assert "--port 8011" in readme
