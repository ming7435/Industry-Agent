"""Backend 独立进程 + Agent 独立进程 + 本地虚拟 HTTP 工厂的完整业务契约。"""
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from pathlib import Path
import json
import os
import socket
import subprocess
import sys
import time
from urllib.parse import urlparse, parse_qs
from urllib.request import urlopen


def test_registered_team_stop_dispatch_confirm_restart(tmp_path):
    root = Path(__file__).resolve().parents[2]
    states = {'M1': 'running', 'M2': 'running', 'M3': 'running', 'M4': 'running'}
    calls = []
    class FactoryHandler(BaseHTTPRequestHandler):
        def reply(self, value):
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps(value).encode())
        def do_GET(self):
            if urlparse(self.path).path == '/api/devices':
                self.reply([{'device_id': d} for d in states]); return
            device_id = parse_qs(urlparse(self.path).query)['device_id'][0]
            self.reply({'device_id': device_id, 'status': states[device_id], 'alarm_code': '', 'metrics': {'pressure': 1}, 'checked_at': datetime.now(timezone.utc).isoformat()})
        def do_POST(self):
            device_id = self.path.split('/')[3]
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            assert device_id in states
            assert body['action'] in {'start', 'emergency_stop'}
            calls.append((device_id, body['action']))
            states[device_id] = 'running' if body['action'] == 'start' else 'stopped'
            self.reply({'ok': True})
        def log_message(self, *args):
            pass
    factory = ThreadingHTTPServer(('127.0.0.1', 0), FactoryHandler)
    Thread(target=factory.serve_forever, daemon=True).start()
    with socket.socket() as bound:
        bound.bind(('127.0.0.1', 0)); port = bound.getsockname()[1]
    env = {**os.environ, 'PYTHON_DOTENV_DISABLED': '1', 'APP_ENV': 'testing', 'BACKEND_STORAGE': 'sqlite', 'BACKEND_SQLITE_PATH': str(tmp_path / 'backend.db'), 'BACKEND_INTERNAL_TOKEN': 'isolated-integration-token', 'AGENT_API_TOKEN': '', 'BACKEND_SERVICE_BASE_URL': f'http://127.0.0.1:{port}', 'FACTORY_API_BASE_URL': f'http://127.0.0.1:{factory.server_port}', 'FACTORY_CONTROL_MODE': 'virtual', 'RAG_ALLOW_LOCAL_FALLBACK': 'true'}
    for key in ('RAG_SERVICE_BASE_URL', 'MODEL_SERVICE_BASE_URL', 'CAD_SERVICE_BASE_URL', 'MCP_CAD_URL', 'MCP_MES_URL', 'MCP_QMS_URL', 'MCP_INVENTORY_URL'):
        env[key] = ''
    for key in ('EVENT_STORE_PATH', 'WORKORDER_STORE_PATH', 'LEARNING_RESULT_STORE_PATH', 'REPORT_STORE_PATH', 'PENDING_TASK_STORE_PATH', 'LINE_SAFETY_STORE_PATH'):
        env[key] = str(tmp_path / (key.lower() + '.db'))
    env['PYTHONPATH'] = str(root / 'services/backend-service') + os.pathsep + str(root)
    with (tmp_path / 'backend.log').open('w', encoding='utf-8') as log:
        backend = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', str(port)], cwd=root, env=env, stdout=log, stderr=log)
        try:
            for _ in range(100):
                try:
                    with urlopen(env['BACKEND_SERVICE_BASE_URL'] + '/health', timeout=0.5) as response:
                        assert json.load(response)['ready']
                        break
                except OSError:
                    time.sleep(0.05)
            else:
                raise AssertionError((tmp_path / 'backend.log').read_text(encoding='utf-8'))
            env['PYTHONPATH'] = str(root / 'services/agent-service') + os.pathsep + str(root)
            worker = subprocess.run([sys.executable, str(root / 'tests/integration/virtual_line_agent_worker.py')], cwd=root, env=env, capture_output=True, text=True, encoding='utf-8', timeout=60)
            assert worker.returncode == 0, worker.stdout + worker.stderr
            assert states == {'M1': 'running', 'M2': 'running', 'M3': 'running', 'M4': 'running'}
            for d in states:
                assert calls.count((d, 'emergency_stop')) == 1
                assert calls.count((d, 'start')) == 1
        finally:
            backend.terminate(); backend.wait(timeout=10)
            factory.shutdown(); factory.server_close()
