"""真实 Backend + Agent 的多设备派工合同，数据和外部连接完全隔离。"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.error import URLError
from urllib.request import urlopen
import json
import os
import socket
import subprocess
import sys
import time


def test_multiple_responsibilities_dispatch_and_session_isolation(tmp_path):
    root = Path(__file__).resolve().parents[1]
    factory_calls = []

    class CatalogHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            factory_calls.append(("GET", self.path))
            if self.path != "/api/devices":
                self.send_error(404)
                return
            body = json.dumps([
                {"device_id": device_id, "name": f"Isolated {device_id}"}
                for device_id in ("M1", "M2", "M3")
            ]).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            # 派工只读取设备目录；此合同不允许控制任何设备。
            factory_calls.append(("POST", self.path))
            self.send_error(405)

        def log_message(self, *_args):
            pass

    factory = ThreadingHTTPServer(("127.0.0.1", 0), CatalogHandler)
    factory_thread = Thread(target=factory.serve_forever, daemon=True)
    factory_thread.start()
    with socket.socket() as bound:
        bound.bind(("127.0.0.1", 0))
        backend_port = bound.getsockname()[1]
    env = {
        **os.environ,
        "PYTHON_DOTENV_DISABLED": "1",
        "APP_ENV": "testing",
        "BACKEND_STORAGE": "sqlite",
        "BACKEND_SQLITE_PATH": str(tmp_path / "backend.db"),
        "BACKEND_INTERNAL_TOKEN": "isolated-multi-device-contract-token",
        "BACKEND_SERVICE_BASE_URL": f"http://127.0.0.1:{backend_port}",
        "FACTORY_API_BASE_URL": f"http://127.0.0.1:{factory.server_port}",
        "FACTORY_CONTROL_MODE": "disabled",
        "AGENT_API_TOKEN": "",
        "RAG_ALLOW_LOCAL_FALLBACK": "true",
        "REPORT_FILE_DIR": str(tmp_path / "reports"),
        "NO_PROXY": "127.0.0.1,localhost",
    }
    for key in (
        "RAG_SERVICE_BASE_URL", "MODEL_SERVICE_BASE_URL", "CAD_SERVICE_BASE_URL",
        "MCP_CAD_URL", "MCP_MES_URL", "MCP_QMS_URL", "MCP_INVENTORY_URL",
    ):
        env[key] = ""
    for key in (
        "EVENT_STORE_PATH", "WORKORDER_STORE_PATH", "LEARNING_RESULT_STORE_PATH",
        "REPORT_STORE_PATH", "PENDING_TASK_STORE_PATH", "LINE_SAFETY_STORE_PATH",
    ):
        env[key] = str(tmp_path / f"{key.lower()}.db")
    env["PYTHONPATH"] = os.pathsep.join([str(root / "services/backend-service"), str(root)])
    backend_log = tmp_path / "backend.log"
    backend = None
    try:
        with backend_log.open("w", encoding="utf-8") as log:
            backend = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(backend_port)],
                cwd=tmp_path, env=env, stdout=log, stderr=log,
            )
            deadline = time.monotonic() + 20
            while time.monotonic() < deadline:
                try:
                    with urlopen(env["BACKEND_SERVICE_BASE_URL"] + "/health", timeout=0.5) as response:
                        if json.load(response)["ready"]:
                            break
                except (OSError, URLError):
                    pass
                if backend.poll() is not None:
                    break
                time.sleep(0.05)
            else:
                raise AssertionError(backend_log.read_text(encoding="utf-8"))
            assert backend.poll() is None, backend_log.read_text(encoding="utf-8")
            env["PYTHONPATH"] = os.pathsep.join([str(root / "services/agent-service"), str(root)])
            worker = subprocess.run(
                [sys.executable, str(root / "tests/integration/multi_device_dispatch_agent_worker.py")],
                cwd=tmp_path, env=env, capture_output=True, text=True, encoding="utf-8", timeout=90,
            )
            assert worker.returncode == 0, worker.stdout + worker.stderr
            summary = json.loads(worker.stdout.strip().splitlines()[-1])
            assert summary == {
                "assigned_orders": 3,
                "pending_orders": 1,
                "non_primary_assignment": True,
                "responsibilities_updated": True,
                "account_isolation": True,
            }
            assert factory_calls, "Registration must validate the isolated device catalog"
            assert set(factory_calls) == {("GET", "/api/devices")}
    finally:
        if backend is not None and backend.poll() is None:
            backend.terminate()
            try:
                backend.wait(timeout=10)
            except subprocess.TimeoutExpired:
                backend.kill()
                backend.wait(timeout=5)
        factory.shutdown()
        factory.server_close()
        factory_thread.join(timeout=5)
