import json
import subprocess
import sys
import threading
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from scripts import start_all
from scripts.start_all import service_port


def test_start_all_can_identify_service_ports_for_reuse():
    assert service_port("agent-service", ["python", "-m", "uvicorn", "--port", "8010"]) == 8010
    assert service_port("monitor-web", ["python", "monitor_web_server.py"], monitor_port=8001) == 8001
    assert service_port("unknown", ["python", "worker.py"]) is None


@contextmanager
def startup_health_server(statuses):
    """仅使用随机回环端口模拟启动过程，不访问模型和业务服务。"""
    calls = []

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            calls.append(self.path)
            status = statuses[min(len(calls) - 1, len(statuses) - 1)]
            body = json.dumps({"ready": False}).encode()
            self.send_response(status)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_port, calls
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def startup_waiter():
    waiter = getattr(start_all, "_wait_for_service_startup", None)
    assert callable(waiter), "启动器必须按健康接口等待，不能固定等待 0.8 秒"
    return waiter


def test_startup_waits_for_http_health_instead_of_open_port():
    # 端口已开放但应用仍在初始化时，不能提前放行监控。
    with startup_health_server([503, 503, 200]) as (port, calls):
        startup_waiter()("agent-service", None, port, timeout_seconds=3, poll_seconds=0.01)
        assert calls == ["/health", "/health", "/health"]


def test_startup_health_failure_is_bounded():
    with startup_health_server([503]) as (port, calls):
        started = time.monotonic()
        with pytest.raises(TimeoutError, match="agent-service"):
            startup_waiter()("agent-service", None, port, timeout_seconds=0.1, poll_seconds=0.01)
        assert calls
        assert time.monotonic() - started < 1


def test_startup_does_not_wait_for_exited_child():
    # 真实子进程提前退出时立即停止等待，不掩盖启动失败。
    process = subprocess.Popen([sys.executable, "-c", "raise SystemExit(7)"])
    process.wait(timeout=5)
    with pytest.raises(RuntimeError, match="agent-service"):
        startup_waiter()("agent-service", process, 9, timeout_seconds=3, poll_seconds=0.01)
