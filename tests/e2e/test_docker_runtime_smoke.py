import os
from urllib.request import urlopen

import pytest


def _get(url: str) -> str:
    with urlopen(url, timeout=5) as response:
        return response.read().decode("utf-8")


@pytest.mark.skipif(os.getenv("RUN_DOCKER_E2E") != "1", reason="requires a running RC compose stack")
def test_rc_stack_health_and_monitor_frontend():
    assert '"status":"ok"' in _get(os.getenv("AGENT_HEALTH_URL", "http://127.0.0.1:8010/health")).replace(" ", "")
    assert '"status":"ok"' in _get(os.getenv("RAG_HEALTH_URL", "http://127.0.0.1:8020/health")).replace(" ", "")
    assert "document-cad-service" in _get(os.getenv("CAD_HEALTH_URL", "http://127.0.0.1:8011/health"))
    assert "<!doctype html" in _get(os.getenv("MONITOR_URL", "http://127.0.0.1:8001/")).lower()
