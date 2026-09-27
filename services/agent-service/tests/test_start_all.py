from scripts.start_all import service_port


def test_start_all_can_identify_service_ports_for_reuse():
    assert service_port("agent-service", ["python", "-m", "uvicorn", "--port", "8010"]) == 8010
    assert service_port("monitor-web", ["python", "monitor_web_server.py"], monitor_port=8001) == 8001
    assert service_port("unknown", ["python", "worker.py"]) is None
