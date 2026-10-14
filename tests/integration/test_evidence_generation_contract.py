"""独立进程导入同名 app 包，验证 Agent → RAG 的真实 HTTP 取证/回答契约。"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
from threading import Thread
from time import monotonic, sleep
from urllib.request import urlopen

from app.rag.client import RAGServiceClient


def test_agent_rag_evidence_only_contract_without_paid_generation(tmp_path, monkeypatch):
    calls = []
    class ModelHandler(BaseHTTPRequestHandler):
        def do_POST(self):
            payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            calls.append((self.path, payload))
            encoded = json.dumps({'choices': [{'message': {'content': '检查轴承 [1]'}}]}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Length', str(len(encoded)))
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(encoded)
        def log_message(self, *_args):
            pass
    model = ThreadingHTTPServer(('127.0.0.1', 0), ModelHandler)
    thread = Thread(target=model.serve_forever, kwargs={'poll_interval': .01}, daemon=True)
    thread.start()
    with socket.socket() as available:
        available.bind(('127.0.0.1', 0))
        port = available.getsockname()[1]
    root = Path(__file__).resolve().parents[2]
    env = {**os.environ, 'PYTHON_DOTENV_DISABLED': '1', 'APP_ENV': 'testing',
           'PYTHONPATH': os.pathsep.join([str(root / 'services/rag-service'), str(root)]),
           'MODEL_SERVICE_BASE_URL': f'http://127.0.0.1:{model.server_port}',
           'RAG_INTERNAL_TOKEN': 'isolated-contract-token', 'RAG_DOCUMENT_STORE_PATH': str(tmp_path / 'documents.sqlite3')}
    for key in ('MYSQL_PASSWORD', 'MYSQL_HOST', 'DEEPSEEK_API_KEY', 'SILICONFLOW_API_KEY', 'MODEL_API_TOKEN'):
        env[key] = ''
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', 'isolated-contract-token')
    monkeypatch.setenv('RAG_ALLOW_LOCAL_FALLBACK', 'false')
    base_url = f'http://127.0.0.1:{port}'
    with (tmp_path / 'rag-worker.log').open('w', encoding='utf-8') as output:
        process = subprocess.Popen([sys.executable, str(root / 'tests/integration/evidence_rag_worker.py'),
                                    str(tmp_path), str(port)], cwd=root, env=env, stdout=output, stderr=output)
        try:
            deadline = monotonic() + 15
            while True:
                assert process.poll() is None, '隔离 RAG 进程启动失败'
                try:
                    with urlopen(base_url + '/openapi.json', timeout=.2) as response:
                        if response.status == 200:
                            break
                except OSError:
                    assert monotonic() < deadline, '隔离 RAG 启动超过 15 秒预算'
                    sleep(.05)
            client = RAGServiceClient(base_url=base_url)
            evidence = client.search('bearing repair', filters={'device_id': 'D-1'}, generate_answer=False)
            assert evidence['documents'][0]['document_id'] == 'MANUAL-1:0'
            assert evidence['evidence_status'] == 'ready'
            assert evidence['generation_requested'] is False
            assert evidence['answer'] == ''
            assert calls == [], '内部取证不得触发回答生成'
            answer = client.search('bearing repair', filters={'device_id': 'D-1'})
            assert answer['answer'] == '检查轴承 [1]'
            assert answer['generation_requested'] is True
            assert answer['grounded'] is True
            assert len(calls) == 1
            assert calls[0][0] == '/v1/chat/completions'
        finally:
            process.terminate()
            process.wait(timeout=5)
            model.shutdown()
            model.server_close()
            thread.join(timeout=1)
