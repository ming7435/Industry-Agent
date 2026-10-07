"""临时 HTTP 供应商验证实际路由、结果契约与免费健康观测。"""

import json
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import urllib.request
import urllib.error

import pytest
from fastapi.testclient import TestClient

from app.providers.gateway import ModelGateway
from app.providers.base import ProviderError


@contextmanager
def provider_api(monkeypatch, *, chat_provider="deepseek"):
    import app.main as main

    replies = {"/chat/completions": (200, {"model": "isolated-chat", "choices": [{"message": {"role": "assistant", "content": "实际测试回答"}}]})}
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_POST(self):
            payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            requests.append((self.path, payload))
            status, body = replies.get(self.path, (404, {"error": "未配置临时响应"}))
            content = json.dumps(body, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    address = f"http://127.0.0.1:{server.server_port}"
    monkeypatch.setenv("MODEL_PROVIDER", "remote")
    monkeypatch.setenv("MODEL_CHAT_PROVIDER", chat_provider)
    monkeypatch.setenv("DEEPSEEK_BASE_URL", address)
    monkeypatch.setenv("SILICONFLOW_BASE_URL", address)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "isolated-provider-secret")
    monkeypatch.setenv("SILICONFLOW_API_KEY", "isolated-aux-secret")
    monkeypatch.delenv("SILICONFLOW_VISION_MODEL", raising=False)
    monkeypatch.setenv("MODEL_PROVIDER_MAX_ATTEMPTS", "1")
    monkeypatch.setenv("MODEL_PROVIDER_TIMEOUT_SECONDS", "2")
    monkeypatch.setattr(main, "gateway", ModelGateway())
    try:
        with TestClient(main.app) as client:
            yield client, replies, requests
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)


def test_business_call_observes_chat_without_health_generation(monkeypatch):
    with provider_api(monkeypatch) as (client, _, requests):
        assert client.get("/health").json()["capabilities"]["chat"]["reachable"] == "not_probed"
        response = client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "测试"}]})
        assert response.status_code == 200
        for _ in range(3):
            status = client.get("/health").json()["capabilities"]
            assert status["chat"]["ready"] is True
            assert status["chat"]["reachable"] is True
            assert status["embedding"]["reachable"] == "not_probed"
        assert len(requests) == 1


def test_provider_error_does_not_expose_echoed_credentials(monkeypatch):
    with provider_api(monkeypatch) as (client, replies, requests):
        replies["/chat/completions"] = (402, {"error": "余额不足 Authorization: Bearer isolated-provider-secret; other_token=private-value"})
        response = client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "测试"}]})
        assert response.status_code == 503
        assert "isolated-provider-secret" not in response.text
        assert "private-value" not in response.text
        assert "402" in response.text
        capability = client.get("/health").json()["capabilities"]["chat"]
        assert capability["reachable"] is False
        assert capability["ready"] is False
        assert capability["last_error"] == "ProviderError"
        assert len(requests) == 1


def test_malformed_chat_response_is_not_success_or_ready(monkeypatch):
    with provider_api(monkeypatch) as (client, replies, _):
        replies["/chat/completions"] = (200, {"model": "isolated-chat", "choices": []})
        response = client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "测试"}]})
        assert response.status_code == 503
        assert client.get("/health").json()["capabilities"]["chat"]["reachable"] is False


@pytest.mark.parametrize("path,payload,reply", [
    ("embeddings", {"input": ["测试"]}, {"data": []}),
    ("embeddings", {"input": ["测试"]}, {"data": [{"index": 0, "embedding": [None]}]}),
    ("rerank", {"query": "测试", "documents": ["一个文档"]}, {"results": [{"index": 7, "relevance_score": 0.9}]}),
])
def test_malformed_aux_response_is_not_success_or_ready(monkeypatch, path, payload, reply):
    with provider_api(monkeypatch) as (client, replies, _):
        replies["/" + path] = (200, reply)
        response = client.post("/v1/" + path, json=payload)
        assert response.status_code == 503
        capability = "embedding" if path == "embeddings" else "rerank"
        assert client.get("/health").json()["capabilities"][capability]["ready"] is False


def test_null_content_with_valid_tool_call_remains_supported(monkeypatch):
    with provider_api(monkeypatch) as (client, replies, _):
        replies["/chat/completions"] = (200, {"choices": [{"message": {"role": "assistant", "content": None,
            "tool_calls": [{"id": "call-1", "type": "function", "function": {"name": "query", "arguments": "{}"}}]}}]})
        response = client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "测试"}]})
        assert response.status_code == 200
        assert response.json()["choices"][0]["message"]["tool_calls"][0]["id"] == "call-1"


def test_vision_uses_dedicated_model_when_chat_and_aux_share_provider(monkeypatch):
    with provider_api(monkeypatch, chat_provider="siliconflow") as (client, _, requests):
        response = client.post("/v1/vision", json={"messages": [{"role": "user", "content": [{"type": "text", "text": "查看图纸"}]}]})
        assert response.status_code == 200
        assert requests[-1][1]["model"] == "Qwen/Qwen2.5-VL-72B-Instruct"
        capability = client.get("/health").json()["capabilities"]["vision"]
        assert capability["model"] == requests[-1][1]["model"]
        assert capability["ready"] is True
        assert client.get("/health").json()["capabilities"]["chat"]["reachable"] == "not_probed"


def test_invalid_provider_selection_is_rejected_not_silently_deepseek(monkeypatch):
    monkeypatch.setenv("MODEL_PROVIDER", "remote")
    monkeypatch.setenv("MODEL_CHAT_PROVIDER", "misspelled-provider")
    with pytest.raises(ProviderError, match="MODEL_CHAT_PROVIDER"):
        ModelGateway()


def test_other_model_success_does_not_mark_default_model_ready(monkeypatch):
    with provider_api(monkeypatch) as (client, _, requests):
        assert client.post("/v1/chat/completions", json={"model": "alternative-chat", "messages": [{"role": "user", "content": "测试"}]}).status_code == 200
        assert requests[-1][1]["model"] == "alternative-chat"
        assert client.get("/health").json()["capabilities"]["chat"]["reachable"] == "not_probed"


def test_other_model_failure_does_not_replace_default_model_success(monkeypatch):
    with provider_api(monkeypatch) as (client, replies, _):
        assert client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "测试"}]}).status_code == 200
        replies["/chat/completions"] = (404, {"error": "未启用其他模型"})
        assert client.post("/v1/chat/completions", json={"model": "alternative-chat", "messages": [{"role": "user", "content": "测试"}]}).status_code == 503
        assert client.get("/health").json()["capabilities"]["chat"]["ready"] is True


def test_incomplete_rerank_set_is_not_ready(monkeypatch):
    with provider_api(monkeypatch) as (client, replies, _):
        replies["/rerank"] = (200, {"results": [{"index": 0, "relevance_score": 0.9}]})
        response = client.post("/v1/rerank", json={"query": "查询", "documents": ["文档一", "文档二"], "top_n": 2})
        assert response.status_code == 503
        assert client.get("/health").json()["capabilities"]["rerank"]["ready"] is False


def test_long_running_provider_refreshes_changed_proxy_settings(monkeypatch):
    """真实全局 HTTP opener 留有过期代理时，当前配置应仍能连接测试供应商。"""
    with provider_api(monkeypatch) as (client, _, requests):
        old_opener = urllib.request.build_opener(urllib.request.ProxyHandler({'http':'http://127.0.0.1:9'}))
        monkeypatch.setattr(urllib.request, '_opener', old_opener)
        monkeypatch.setattr(urllib.request, 'proxy_bypass', lambda host: False)
        monkeypatch.setattr(urllib.request, 'getproxies', lambda: {})
        response = client.post('/v1/chat/completions', json={'messages':[{'role':'user','content':'测试'}]})
        assert response.status_code == 200
        assert response.json()['choices'][0]['message']['content'] == '实际测试回答'
        assert len(requests) == 1


def test_network_error_explains_category_without_exposing_reason(monkeypatch):
    with provider_api(monkeypatch) as (client, _, _):
        import app.providers.gateway as provider
        def disconnected(*_args, **_kwargs):
            raise urllib.error.URLError(ConnectionRefusedError(10061, 'Authorization: isolated-provider-secret'))
        monkeypatch.setattr(provider, 'urlopen', disconnected)
        response = client.post('/v1/chat/completions', json={'messages':[{'role':'user','content':'测试'}]})
        assert response.status_code == 503
        assert 'connection_refused' in response.text
        assert 'isolated-provider-secret' not in response.text
