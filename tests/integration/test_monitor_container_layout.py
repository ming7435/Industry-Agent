from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_agent_image_copies_monitor_frontend_into_runtime_path():
    dockerfile = (ROOT / "infra" / "docker" / "Dockerfile.agent").read_text(encoding="utf-8")
    frontend_entry = ROOT / "frontend" / "monitor" / "index.html"

    assert frontend_entry.is_file()
    assert "COPY frontend/monitor /app/frontend/monitor" in dockerfile
