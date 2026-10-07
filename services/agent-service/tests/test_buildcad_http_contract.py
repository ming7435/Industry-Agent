"""真实本地 HTTP 契约：API → CAD 节点 → Skill → MCP → 模型工具结果。"""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.clients.buildcad import BuildCADClient
from app.clients.model import ModelServiceClient
from app.harness.trace import TraceRecorder


PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="


def test_cad_api_to_real_http_model_and_mcp_without_external_side_effects():
    mcp_calls, model_calls = [], []
    class Boundary(BaseHTTPRequestHandler):
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            if self.path == "/v1/chat/completions":
                model_calls.append(body)
                message = {"role": "assistant", "content": "已返回服务的预览结果"}
                if len(model_calls) == 1:
                    message = {"role": "assistant", "tool_calls": [{"id": "rpc-preview", "type": "function",
                        "function": {"name": "render_preview", "arguments": json.dumps({"code": "from llmcad import *\n# isolated-test-design", "views": ["iso", "front"]})}}]}
                result = {"choices": [{"message": message}]}
            else:
                mcp_calls.append(body)
                assert self.headers["Authorization"] == "Bearer isolated-contract-token"
                method = body["method"]
                if method == "notifications/initialized":
                    self.send_response(202); self.end_headers(); return
                if method == "initialize":
                    value = {"protocolVersion": "2025-06-18", "capabilities": {"tools": {}},
                        "serverInfo": {"name": "isolated-mcp", "version": "1"}, "instructions": "测试边界的真实初始化说明"}
                elif method == "tools/list":
                    value = {"tools": [{"name": "render_preview", "description": "返回隔离测试预览",
                        "inputSchema": {"type": "object", "properties": {"code": {"type": "string"}, "views": {
                            "type": "array", "items": {"type": "string", "enum": ["front", "back", "right", "left", "top", "bottom", "iso"]}}},
                            "required": ["code"], "additionalProperties": False}}]}
                else:
                    assert method == "tools/call"
                    assert body["params"] == {"name": "render_preview", "arguments": {"code": "from llmcad import *\n# isolated-test-design", "views": ["iso", "front"]}}
                    value = {"content": [
                        {"type": "text", "text": "HTTP-MCP-真实回执"},
                        {"type": "image", "mimeType": "image/png", "data": PNG},
                    ], "isError": False}
                result = {"jsonrpc": "2.0", "id": body["id"], "result": value}
            payload = json.dumps(result).encode()
            self.send_response(200); self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload))); self.end_headers(); self.wfile.write(payload)
        def log_message(self, *_):
            pass

    class Memory:
        def __init__(self):
            self.rows = {"token": {"access_token": "isolated-contract-token"}}
        def get(self, key):
            return self.rows.get(key)
        def create(self, key, value):
            if key in self.rows:
                return False
            self.rows[key] = dict(value)
            return True
        def set(self, key, value, **_):
            self.rows[key] = dict(value)

    server = ThreadingHTTPServer(("127.0.0.1", 0), Boundary)
    Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    storage, trace = Memory(), TraceRecorder()
    def connection():
        client = BuildCADClient(store=storage)
        client.endpoint = base + "/mcp"
        return client
    try:
        app = create_app(SimpleNamespace(container=SimpleNamespace(trace=trace)))
        app.state.buildcad_client_factory = connection
        app.state.buildcad_model_factory = lambda: ModelServiceClient(base)
        app.state.buildcad_run_store = Memory()
        with TestClient(app) as browser:
            request = {"prompt": "只预览零件，不保存", "command_id": "http-contract-1"}
            first = browser.post("/api/cad/buildcad/runs", json=request)
            assert first.status_code == 202
            result = browser.get("/api/cad/buildcad/runs/" + first.json()["run_id"]).json()
            assert result["status"] == "completed"
            assert result["calls"][0]["result"]["content"][0]["text"] == "HTTP-MCP-真实回执"
            assert result["calls"][0]["result"]["content"][1] == {"type": "image", "mimeType": "image/png", "data": PNG}
            assert browser.post("/api/cad/buildcad/runs", json=request).json()["status"] == "completed"
        assert len(model_calls) == 1
        assert [r["method"] for r in mcp_calls] == ["initialize", "notifications/initialized", "tools/list", "tools/call"]
        assert "测试边界的真实初始化说明" in str(model_calls[0]["messages"])
        completed = [r for r in trace.list() if r.get("event") == "tool_completed"]
        assert len(completed) == 1
        assert completed[0]["tool_name"] == "buildcad_mcp"
        assert completed[0]["skill"] == "production_modeling_skill"
        assert "isolated-contract-token" not in json.dumps(trace.list())
    finally:
        server.shutdown(); server.server_close()
