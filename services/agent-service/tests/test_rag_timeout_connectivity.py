"""Agent 的 HTTP 等待必须覆盖 RAG 整体预算，使用真实临时服务验证。"""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import time

import pytest

from app.rag.client import RAGServiceClient


@pytest.mark.parametrize("configured,budget,expected", [("30", "35000", 40), ("90", "35000", 90), ("1", "50000", 55)])
def test_remote_wait_covers_budget_and_preserves_larger_user_timeout(monkeypatch, configured, budget, expected):
    monkeypatch.setenv("RAG_SERVICE_TIMEOUT_SECONDS", configured)
    monkeypatch.setenv("REQUEST_TIMEOUT_MS", budget)
    assert RAGServiceClient(base_url="http://127.0.0.1:1").timeout == expected


def test_rag_can_return_within_server_budget_without_agent_aborting(monkeypatch):
    monkeypatch.setenv("RAG_SERVICE_TIMEOUT_SECONDS", "0.01")
    monkeypatch.setenv("REQUEST_TIMEOUT_MS", "200")
    monkeypatch.setenv("RAG_ALLOW_LOCAL_FALLBACK", "false")

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_POST(self):
            self.rfile.read(int(self.headers["Content-Length"]))
            time.sleep(0.08)
            body = json.dumps({"hits": [{"chunk_id": "C-1", "text": "真实临时服务响应", "metadata": {}}], "answer": "检测数据仍在预算内返回"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            try:
                self.wfile.write(body)
            except OSError:
                pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        result = RAGServiceClient(base_url=f"http://127.0.0.1:{server.server_port}").search("检查主轴温度")
        assert result["documents"][0]["document_id"] == "C-1"
        assert result["answer"] == "检测数据仍在预算内返回"
        assert result["degraded"] is False
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
