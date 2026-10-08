"""Full hydraulic workflow uses only disposable Backend/Agent stores and an isolated catalog."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
import json
import os
import socket
import subprocess
import sys
import time


def test_hydraulic_diagnosis_plan_dispatch_persisted_contract(tmp_path):
    root = Path(__file__).resolve().parents[1]
    factory_calls = []

    class Catalog(BaseHTTPRequestHandler):
        def do_GET(self):
            factory_calls.append(('GET', self.path))
            if self.path != '/api/devices':
                self.send_error(404)
                return
            body = json.dumps([{'device_id': device, 'name': device}
                               for device in ('M-OTHER', 'TRAK-TC820LTYSI-001')]).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            factory_calls.append(('POST', self.path))
            self.send_error(405)

        def log_message(self, *_args):
            pass

    factory = ThreadingHTTPServer(('127.0.0.1', 0), Catalog)
    thread = Thread(target=factory.serve_forever, daemon=True)
    thread.start()
    with socket.socket() as bound:
        bound.bind(('127.0.0.1', 0))
        port = bound.getsockname()[1]
    assert port not in {4529, 8001, 8010, 8020, 8030, 8040, 8050}
    env = {**os.environ, 'PYTHON_DOTENV_DISABLED': '1', 'APP_ENV': 'testing',
           'BACKEND_STORAGE': 'sqlite', 'BACKEND_SQLITE_PATH': str(tmp_path / 'backend.db'),
           'BACKEND_SERVICE_BASE_URL': f'http://127.0.0.1:{port}',
           'BACKEND_INTERNAL_TOKEN': 'isolated-hydraulic-token', 'AGENT_API_TOKEN': '',
           'FACTORY_API_BASE_URL': f'http://127.0.0.1:{factory.server_port}',
           'FACTORY_CONTROL_MODE': 'disabled', 'RAG_ALLOW_LOCAL_FALLBACK': 'true',
           'REPORT_FILE_DIR': str(tmp_path / 'reports'), 'NO_PROXY': '127.0.0.1,localhost'}
    for key in ('RAG_SERVICE_BASE_URL', 'MODEL_SERVICE_BASE_URL', 'CAD_SERVICE_BASE_URL',
                'MCP_PLC_URL', 'MCP_CAD_URL', 'MCP_MES_URL', 'MCP_QMS_URL', 'MCP_INVENTORY_URL',
                'MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'DEEPSEEK_API_KEY',
                'SILICONFLOW_API_KEY', 'OPENAI_API_KEY', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY'):
        env[key] = ''
    for key in ('EVENT_STORE_PATH', 'WORKORDER_STORE_PATH', 'LEARNING_RESULT_STORE_PATH',
                'REPORT_STORE_PATH', 'PENDING_TASK_STORE_PATH', 'LINE_SAFETY_STORE_PATH'):
        env[key] = str(tmp_path / (key.lower() + '.db'))
    env['PYTHONPATH'] = os.pathsep.join([str(root / 'services/backend-service'), str(root)])
    backend = None
    log_path = tmp_path / 'backend.log'
    try:
        with log_path.open('w', encoding='utf-8') as log:
            backend = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'app.main:app',
                                        '--host', '127.0.0.1', '--port', str(port)],
                                       cwd=tmp_path, env=env, stdout=log, stderr=log,
                                       creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            deadline = time.monotonic() + 20
            while time.monotonic() < deadline:
                try:
                    with urlopen(env['BACKEND_SERVICE_BASE_URL'] + '/health', timeout=0.5) as response:
                        if json.load(response)['ready']:
                            break
                except OSError:
                    pass
                assert backend.poll() is None, log_path.read_text(encoding='utf-8')
                time.sleep(0.05)
            else:
                raise AssertionError(log_path.read_text(encoding='utf-8'))
            env['PYTHONPATH'] = os.pathsep.join([str(root / 'services/agent-service'),
                                                str(root / 'services/agent-service/tests'), str(root)])
            worker = subprocess.run([sys.executable, str(root / 'tests/integration/hydraulic_workflow_agent_worker.py')],
                                    cwd=tmp_path, env=env, capture_output=True, text=True,
                                    encoding='utf-8', timeout=90,
                                    creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            assert worker.returncode == 0, worker.stdout + worker.stderr
            summary = json.loads(worker.stdout.strip().splitlines()[-1])
            assert summary['diagnosis_completed'] and summary['plan_persisted']
            assert summary['backend_orders'] == 1 and summary['non_primary_assignee']
            assert summary['event_plan_order_linked'] and summary['idempotent_replay']
            assert summary['no_control_or_inventory_writes']
            assert set(factory_calls) == {('GET', '/api/devices')}
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
        thread.join(timeout=5)
