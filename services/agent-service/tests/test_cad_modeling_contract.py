"""真实 HTTP 客户端与现有监控代理契约；外部端点均为本地隔离适配器。"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import pytest
from threading import Thread
from urllib.request import Request, urlopen

from app.agents.cad.modeling_analysis import analyze_design, UnconfirmedDesignParameters
from app.agents.cad.schemas import DesignRequest
from app.clients.model import ModelServiceClient


def test_model_http_chat_and_vision_contract():
    seen = []
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            value = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            seen.append((self.path, value))
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
            spec = {"units": "mm", "operations": [{"type": "box", "length": 12, "width": 15, "height": 3}]}
            self.wfile.write(json.dumps({"choices": [{"message": {"content": json.dumps({"spec": spec})}}], "model_metadata": {"synthetic": False, "capability": "vision" if self.path.endswith("vision") else "chat"}}).encode())
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        client = ModelServiceClient(f"http://127.0.0.1:{server.server_port}")
        request = DesignRequest(prompt="图纸标注长12、宽15、高3毫米的板件")
        with pytest.raises(UnconfirmedDesignParameters) as error:
            analyze_design(request, client)
        assert error.value.spec.operations[0].length == 12
        assert error.value.metadata["model_called"] is True
        with pytest.raises(UnconfirmedDesignParameters):
            analyze_design(request, client, image_data="data:image/png;base64,test")
        assert [item[0] for item in seen] == ["/v1/chat/completions", "/v1/vision"]
        assert seen[1][1]["messages"][-1]["content"][1]["image_url"]["url"] == "data:image/png;base64,test"
    finally:
        server.shutdown(); server.server_close()


def test_monitor_proxy_keeps_cad_payload_and_pdf_download_headers(monkeypatch):
    import monitor_web_server as monitor
    seen = []
    class AgentAdapter(BaseHTTPRequestHandler):
        def do_POST(self):
            seen.append(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
            self.send_response(202); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(b'{}')
        def do_GET(self):
            self.send_response(200); self.send_header("Content-Type", "application/pdf"); self.send_header("Content-Disposition", 'attachment; filename="drawing.pdf"'); self.end_headers(); self.wfile.write(b"%PDF-test-adapter")
        def log_message(self, *args):
            pass
    agent = ThreadingHTTPServer(("127.0.0.1", 0), AgentAdapter)
    proxy = ThreadingHTTPServer(("127.0.0.1", 0), monitor.MonitorRequestHandler)
    for server in (agent, proxy):
        Thread(target=server.serve_forever, daemon=True).start()
    monkeypatch.setattr(monitor, "AGENT_SERVICE_BASE_URL", f"http://127.0.0.1:{agent.server_port}")
    try:
        root = f"http://127.0.0.1:{proxy.server_port}"
        with urlopen(Request(root + "/api/cad/designs", data=json.dumps({"command_id": "one", "prompt": "需求"}).encode(), headers={"Content-Type": "application/json"})) as response:
            assert response.status == 202
        assert seen == [{"command_id": "one", "prompt": "需求"}]
        with urlopen(root + "/api/cad/designs/CAD-0123456789ABCDEF0123/artifacts/pdf?download=1") as response:
            assert response.headers["Content-Type"] == "application/pdf"
            assert "attachment" in response.headers["Content-Disposition"]
            assert response.read().startswith(b"%PDF")
        assert monitor.MonitorRequestHandler._should_proxy("/internal/tools") is False
    finally:
        for server in (agent, proxy):
            server.shutdown(); server.server_close()
