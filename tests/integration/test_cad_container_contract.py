from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_cad_image_uses_dedicated_runtime_dependency_set():
    dockerfile = (ROOT / "infra" / "docker" / "Dockerfile.cad").read_text(encoding="utf-8")
    requirements = (ROOT / "services" / "document-cad-service" / "requirements-runtime.txt").read_text(encoding="utf-8")

    assert "requirements-runtime.txt" in dockerfile
    assert "pymysql>=1.1,<2" in requirements.lower()
    assert "pymilvus" not in requirements.lower()
    assert "openai" not in requirements.lower()


def test_cad_readme_uses_compose_port():
    readme = (ROOT / "services" / "document-cad-service" / "README.md").read_text(encoding="utf-8")

    assert "--port 8011" in readme
