"""BuildCAD 协议回归只使用本地传输，不访问真实授权或建模接口。"""

import base64
import hashlib
import json
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import parse_qs, urlparse

import httpx
import pytest

from app.clients.buildcad import BuildCADClient, BuildCADError, BuildCADStore


ORIGIN = "https://buildcad.ai"
REDIRECT = "http://127.0.0.1:8000/api/buildcad/callback"
TOOL = {
    "name": "render_preview",
    "description": "测试供应商公开的代码工具",
    "inputSchema": {"type": "object", "properties": {"source": {"type": "string"}}, "required": ["source"]},
    "annotations": {"readOnlyHint": True},
}


class MemoryStore:
    """模拟 Redis 的原子消费和期限，不替换被测协议行为。"""

    def __init__(self):
        self.values = {}
        self.expirations = {}

    def get(self, key):
        if self.expirations.get(key, float("inf")) <= time.time():
            self.values.pop(key, None)
        return self.values.get(key)

    def set(self, key, value, ttl=None):
        self.values[key] = value
        self.expirations[key] = time.time() + ttl if ttl else float("inf")

    def pop(self, key):
        value = self.get(key)
        self.values.pop(key, None)
        return value


class Provider:
    """在 HTTP 边界模拟公开 OAuth 元数据和 MCP 协议。"""

    def __init__(self):
        self.requests = []
        self.rpc_requests = []
        self.token_forms = []
        self.register_bodies = []
        self.mcp_status = 200
        self.mcp_redirect = False
        self.call_timeout = False
        self.sse = False
        self.protocol = "2025-03-26"
        self.pages = [{"tools": [TOOL]}]
        self.result = {"content": [{"type": "image", "mimeType": "image/png", "data": "cG5n"}], "isError": False}
        self.refresh_fails = False
        self.external_authorization = False
        self.call_status = 200
        self.instructions = ""

    def handle(self, request):
        self.requests.append(request)
        assert request.url.host == "buildcad.ai", "禁止凭据或请求流向其他主机"
        path = request.url.path
        if path == "/.well-known/oauth-protected-resource":
            return httpx.Response(200, json={"resource": ORIGIN, "authorization_servers": [ORIGIN], "scopes_supported": ["openid", "profile", "email", "offline_access"], "bearer_methods_supported": ["header"]})
        if path == "/.well-known/oauth-authorization-server":
            return httpx.Response(200, json={"issuer": ORIGIN, "authorization_endpoint": "https://other.example/authorize" if self.external_authorization else ORIGIN + "/api/auth/mcp/authorize", "token_endpoint": ORIGIN + "/api/auth/mcp/token", "registration_endpoint": ORIGIN + "/api/auth/mcp/register", "scopes_supported": ["openid", "profile", "email", "offline_access"], "response_types_supported": ["code"], "grant_types_supported": ["authorization_code", "refresh_token"], "token_endpoint_auth_methods_supported": ["none"], "code_challenge_methods_supported": ["S256"]})
        if path == "/api/auth/mcp/register":
            self.register_bodies.append(json.loads(request.content))
            return httpx.Response(201, json={"client_id": "registered-client", "token_endpoint_auth_method": "none"})
        if path == "/api/auth/mcp/token":
            form = parse_qs(request.content.decode())
            self.token_forms.append(form)
            if form["grant_type"] == ["refresh_token"]:
                if self.refresh_fails:
                    return httpx.Response(400, json={"error": "invalid_grant", "error_description": "secret-provider-debug"})
                return httpx.Response(200, json={"access_token": "refreshed-access", "token_type": "Bearer", "expires_in": 3600})
            return httpx.Response(200, json={"access_token": "secret-access", "refresh_token": "secret-refresh", "token_type": "Bearer", "expires_in": 3600})
        assert path == "/api/mcp"
        body = json.loads(request.content)
        self.rpc_requests.append(body)
        if self.mcp_redirect:
            return httpx.Response(307, headers={"Location": "https://other.example/steal"})
        if self.mcp_status != 200:
            return httpx.Response(self.mcp_status, text="secret-access secret-provider-debug")
        assert request.headers["authorization"] in ("Bearer secret-access", "Bearer refreshed-access")
        assert "text/event-stream" in request.headers["accept"]
        if body["method"] == "initialize":
            return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"], "result": {"protocolVersion": self.protocol, "capabilities": {"tools": {}}, "serverInfo": {"name": "local-fixture", "version": "1"}, "instructions": self.instructions}}, headers={"Mcp-Session-Id": "session-local"})
        assert request.headers["mcp-session-id"] == "session-local"
        assert request.headers["mcp-protocol-version"] == self.protocol
        if body["method"] == "notifications/initialized":
            assert "id" not in body
            return httpx.Response(202)
        if body["method"] == "tools/list":
            page = int(body.get("params", {}).get("cursor", "0"))
            result = self.pages[min(page, len(self.pages) - 1)]
        else:
            assert body["method"] == "tools/call"
            if self.call_status != 200:
                return httpx.Response(self.call_status, text="secret-provider-debug")
            if self.call_timeout:
                raise httpx.ReadTimeout("secret-provider-debug", request=request)
            result = self.result
        payload = {"jsonrpc": "2.0", "id": body["id"], "result": result}
        if self.sse:
            notification = 'data: {"jsonrpc":"2.0","method":"notifications/progress","params":{}}\n\n'
            return httpx.Response(200, text=": keepalive\n\n" + notification + "event: message\ndata: " + json.dumps(payload) + "\n\n", headers={"Content-Type": "text/event-stream"})
        return httpx.Response(200, json=payload)


@pytest.fixture
def setup_client():
    store, provider = MemoryStore(), Provider()
    client = BuildCADClient(store=store, transport=httpx.MockTransport(provider.handle))
    return client, store, provider


def connect(client):
    started = client.begin_auth(REDIRECT, "browser-cookie-nonce")
    client.complete_auth("authorization-code", started["state"], "browser-cookie-nonce", REDIRECT)
    return started


def test_unconnected_status_does_not_call_provider(setup_client):
    client, _, provider = setup_client
    status = client.status()
    assert status["connected"] is False
    assert status["endpoint"] == ORIGIN + "/api/mcp"
    assert status["error"]["code"] == "authorization_required"
    assert provider.requests == []


def test_oauth_uses_pkce_binds_callback_and_retains_refresh_token(setup_client):
    client, store, provider = setup_client
    started = connect(client)
    query = parse_qs(urlparse(started["authorization_url"]).query)
    form = provider.token_forms[0]
    challenge = base64.urlsafe_b64encode(hashlib.sha256(form["code_verifier"][0].encode()).digest()).rstrip(b"=").decode()
    assert query["code_challenge"] == [challenge]
    assert query["code_challenge_method"] == ["S256"]
    assert query["resource"] == [ORIGIN]
    assert query["state"] == [started["state"]]
    assert query["redirect_uri"] == [REDIRECT]
    assert form["redirect_uri"] == [REDIRECT]
    assert provider.register_bodies[0]["token_endpoint_auth_method"] == "none"
    assert store.get("token")["refresh_token"] == "secret-refresh"
    assert store.expirations["token"] == float("inf")
    assert store.get("oauth:" + started["state"]) is None
    assert "secret-access" not in json.dumps(started)


@pytest.mark.parametrize("bad_nonce,bad_redirect", [("different-browser", REDIRECT), ("browser-cookie-nonce", "http://127.0.0.1:9000/another")])
def test_callback_mismatch_consumes_state_without_token_exchange(setup_client, bad_nonce, bad_redirect):
    client, _, provider = setup_client
    started = client.begin_auth(REDIRECT, "browser-cookie-nonce")
    with pytest.raises(BuildCADError) as mismatch:
        client.complete_auth("code", started["state"], bad_nonce, bad_redirect)
    assert mismatch.value.code == "invalid_oauth_state"
    with pytest.raises(BuildCADError) as replay:
        client.complete_auth("code", started["state"], "browser-cookie-nonce", REDIRECT)
    assert replay.value.code == "invalid_oauth_state"
    assert provider.token_forms == []


def test_oauth_state_expires_after_ten_minutes(setup_client):
    client, store, provider = setup_client
    started = client.begin_auth(REDIRECT, "browser-cookie-nonce")
    key = "oauth:" + started["state"]
    assert 590 <= store.expirations[key] - time.time() <= 600
    store.expirations[key] = time.time() - 1
    with pytest.raises(BuildCADError) as error:
        client.complete_auth("code", started["state"], "browser-cookie-nonce", REDIRECT)
    assert error.value.code == "invalid_oauth_state"
    assert provider.token_forms == []


def test_registration_reused_for_same_redirect_uri(setup_client):
    client, _, provider = setup_client
    client.begin_auth(REDIRECT, "browser-cookie-nonce")
    client.begin_auth(REDIRECT, "another-cookie")
    assert len(provider.register_bodies) == 1


def test_metadata_cannot_move_authorization_to_another_origin(setup_client):
    client, _, provider = setup_client
    provider.external_authorization = True
    with pytest.raises(BuildCADError) as error:
        client.begin_auth(REDIRECT, "browser-cookie-nonce")
    assert error.value.code == "invalid_oauth_metadata"
    assert provider.register_bodies == []


@pytest.mark.parametrize("sse", [False, True])
def test_mcp_initializes_negotiates_protocol_and_preserves_dynamic_schemas(setup_client, sse):
    client, _, provider = setup_client
    connect(client)
    provider.sse = sse
    assert client.list_tools() == [TOOL]
    assert [body["method"] for body in provider.rpc_requests] == ["initialize", "notifications/initialized", "tools/list"]
    status = client.status()
    assert status["connected"] is True
    assert status["tools"] == [TOOL]
    assert sum(body["method"] == "initialize" for body in provider.rpc_requests) == 1
    assert "secret-access" not in json.dumps(status)


def test_initialize_keeps_actual_instructions_private_to_client(setup_client):
    client, _, provider = setup_client
    provider.instructions = "llmcad 用法：使用服务端定义的建模语法。private-instruction-sentinel"
    assert client.server_instructions == ""
    connect(client)
    status = client.status()
    assert client.server_instructions == provider.instructions
    public_json = json.dumps(status)
    assert "private-instruction-sentinel" not in public_json
    assert "session-local" not in public_json
    assert "secret-access" not in public_json
    client.disconnect()
    assert client.server_instructions == ""


def test_initialize_bounds_instruction_size_and_ignores_nontext(setup_client):
    client, _, provider = setup_client
    provider.instructions = "建模语法" * 20000
    connect(client)
    client.list_tools()
    assert 0 < len(client.server_instructions) <= 24000
    assert provider.instructions.startswith(client.server_instructions)
    client.disconnect()
    provider.instructions = {"not": "instructions"}
    connect(client)
    client.list_tools()
    assert client.server_instructions == ""


def test_tool_list_follows_pagination_and_rejects_cursor_loops(setup_client):
    client, _, provider = setup_client
    connect(client)
    second = {"name": "list_designs", "inputSchema": {"type": "object"}}
    provider.pages = [{"tools": [TOOL], "nextCursor": "1"}, {"tools": [second]}]
    assert client.list_tools() == [TOOL, second]
    provider.pages[1]["nextCursor"] = "1"
    with pytest.raises(BuildCADError) as error:
        client.list_tools()
    assert error.value.code == "invalid_response"


def test_call_passes_arguments_and_image_result_without_inventing_fields(setup_client):
    client, _, provider = setup_client
    connect(client)
    arguments = {"source": "from llmcad import *", "unusual_future_option": {"views": 4}}
    assert client.call_tool("render_preview", arguments) == provider.result
    assert provider.rpc_requests[-1]["params"] == {"name": "render_preview", "arguments": arguments}


def test_unknown_tool_is_rejected_before_network(setup_client):
    client, _, provider = setup_client
    with pytest.raises(BuildCADError) as error:
        client.call_tool("delete_all_designs", {})
    assert error.value.code == "unsupported_tool"
    assert provider.requests == []


def test_expired_access_token_refreshes_and_preserves_original_refresh_token(setup_client):
    client, store, provider = setup_client
    connect(client)
    store.values["token"]["expires_at"] = time.time() - 10
    assert client.list_tools() == [TOOL]
    assert provider.token_forms[-1]["grant_type"] == ["refresh_token"]
    assert provider.token_forms[-1]["refresh_token"] == ["secret-refresh"]
    assert store.get("token")["refresh_token"] == "secret-refresh"


@pytest.mark.parametrize("use_redis", [False, True])
def test_concurrent_clients_refresh_once_and_keep_rotated_refresh_token(monkeypatch, use_redis):
    ready = threading.Barrier(2)
    rotated_saved = threading.Event()

    class SharedStore(MemoryStore):
        race = False

        def __init__(self):
            super().__init__()
            self.observed = threading.local()

        def get(self, key):
            value = super().get(key)
            if self.race and key == "token" and not getattr(self.observed, "initial_read", False):
                self.observed.initial_read = True
                ready.wait(timeout=5)
            return value

        def set(self, key, value, ttl=None):
            super().set(key, value, ttl)
            if key == "token" and value.get("refresh_token") == "rotated-refresh":
                rotated_saved.set()

    store, provider = SharedStore(), Provider()
    refresh_calls = []
    refresh_lock = threading.Lock()

    def handler(request):
        if request.url.path == "/api/auth/mcp/token":
            form = parse_qs(request.content.decode())
            if form["grant_type"] == ["refresh_token"]:
                with refresh_lock:
                    refresh_calls.append(form)
                    sequence = len(refresh_calls)
                if sequence == 1:
                    return httpx.Response(200, json={"access_token": "refreshed-access", "refresh_token": "rotated-refresh", "token_type": "Bearer", "expires_in": 3600})
                # 模拟提供商宽限期：旧令牌第二次返回访问令牌，不再返回刷新令牌。
                assert rotated_saved.wait(timeout=5)
                return httpx.Response(200, json={"access_token": "refreshed-access", "token_type": "Bearer", "expires_in": 3600})
        return provider.handle(request)

    first_store = second_store = store
    if use_redis:
        shared_locks = {}

        class RedisDouble:
            def get(self, key):
                value = store.get(key.removeprefix("industry:buildcad:"))
                return json.dumps(value) if value is not None else None

            def set(self, key, value, ex=None):
                store.set(key.removeprefix("industry:buildcad:"), json.loads(value), ex)

            def getdel(self, key):
                value = store.pop(key.removeprefix("industry:buildcad:"))
                return json.dumps(value) if value is not None else None

            def lock(self, key, **kwargs):
                return shared_locks.setdefault(key, threading.RLock())

        import redis
        monkeypatch.setattr(redis.Redis, "from_url", lambda *args, **kwargs: RedisDouble())
        first_store, second_store = BuildCADStore(), BuildCADStore()
    first = BuildCADClient(store=first_store, transport=httpx.MockTransport(handler))
    second = BuildCADClient(store=second_store, transport=httpx.MockTransport(handler))
    connect(first)
    store.values["token"]["expires_at"] = 1
    store.race = True
    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(lambda client: client.status(), [first, second]))
    assert all(result["connected"] for result in results)
    assert store.values["token"]["refresh_token"] == "rotated-refresh"
    assert len(refresh_calls) == 1


def test_disconnect_waits_for_refresh_and_cannot_be_undone_by_stale_response():
    started, release = threading.Event(), threading.Event()
    store, provider = MemoryStore(), Provider()

    def handler(request):
        if request.url.path == "/api/auth/mcp/token" and parse_qs(request.content.decode())["grant_type"] == ["refresh_token"]:
            started.set()
            assert release.wait(timeout=5)
        return provider.handle(request)

    first = BuildCADClient(store=store, transport=httpx.MockTransport(handler))
    second = BuildCADClient(store=store, transport=httpx.MockTransport(handler))
    connect(first)
    store.values["token"]["expires_at"] = 1
    with ThreadPoolExecutor(max_workers=2) as executor:
        refreshing = executor.submit(first.status)
        assert started.wait(timeout=5)
        disconnecting = executor.submit(second.disconnect)
        try:
            # 旧实现立即清除令牌，随后又被刷新响应恢复；正确实现应等刷新结束。
            disconnecting.result(timeout=0.1)
        except TimeoutError:
            pass
        release.set()
        refreshing.result(timeout=5)
        disconnecting.result(timeout=5)
    assert store.get("token") is None


def test_failed_refresh_requests_reauthorization_without_exposing_provider_errors(setup_client):
    client, store, provider = setup_client
    connect(client)
    store.values["token"]["expires_at"] = 1
    provider.refresh_fails = True
    status = client.status()
    assert status["connected"] is False
    assert status["error"]["code"] == "authorization_required"
    assert "secret-provider-debug" not in json.dumps(status)
    assert provider.rpc_requests == []


def test_401_does_not_claim_connection_or_expose_provider_body(setup_client):
    client, _, provider = setup_client
    connect(client)
    provider.mcp_status = 401
    status = client.status()
    assert status["connected"] is False
    assert status["error"]["code"] == "authorization_required"
    with pytest.raises(BuildCADError) as error:
        client.list_tools()
    assert error.value.status == 401
    assert "secret" not in str(error.value)


def test_provider_redirect_is_not_followed_even_with_permissive_injected_client():
    provider, store = Provider(), MemoryStore()
    transport = httpx.Client(transport=httpx.MockTransport(provider.handle), follow_redirects=True)
    client = BuildCADClient(store=store, transport=transport)
    connect(client)
    provider.mcp_redirect = True
    with pytest.raises(BuildCADError) as error:
        client.list_tools()
    assert error.value.code == "provider_error"
    assert all(request.url.host == "buildcad.ai" for request in provider.requests)


def test_timed_out_mutating_tool_reports_unknown_outcome_without_retry(setup_client):
    client, _, provider = setup_client
    connect(client)
    provider.call_timeout = True
    with pytest.raises(BuildCADError) as error:
        client.call_tool("save_design", {"source": "opaque-test-code"})
    assert error.value.code == "outcome_unknown"
    assert len([body for body in provider.rpc_requests if body["method"] == "tools/call"]) == 1
    assert "secret" not in str(error.value)


@pytest.mark.parametrize("status", [500, 502, 503, 504])
def test_submitted_tool_with_server_failure_is_unknown_without_retry(setup_client, status):
    client, _, provider = setup_client
    connect(client)
    provider.call_status = status
    with pytest.raises(BuildCADError) as error:
        client.call_tool("save_design", {"source": "opaque-code"})
    assert error.value.code == "outcome_unknown"
    assert "secret-provider-debug" not in str(error.value)
    assert len([body for body in provider.rpc_requests if body["method"] == "tools/call"]) == 1


@pytest.mark.parametrize("receipt", ["html", "invalid_json", "wrong_id", "partial_sse", "no_sse_result", "missing_result", "malformed_error"])
def test_submitted_tool_without_trustworthy_receipt_is_unknown(setup_client, receipt):
    client, store, provider = setup_client
    connect(client)
    calls = []

    def handler(request):
        if request.url.path != "/api/mcp" or json.loads(request.content)["method"] != "tools/call":
            return provider.handle(request)
        body = json.loads(request.content)
        calls.append(body)
        if receipt == "html":
            return httpx.Response(200, text="secret-provider-debug", headers={"Content-Type": "text/html"})
        if receipt == "invalid_json":
            return httpx.Response(200, text="{secret-provider-debug", headers={"Content-Type": "application/json"})
        if receipt == "wrong_id":
            return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"] + 1, "result": {"content": []}})
        if receipt == "partial_sse":
            return httpx.Response(200, text='data: {"jsonrpc":"2.0","id":2,"result":', headers={"Content-Type": "text/event-stream"})
        if receipt == "no_sse_result":
            return httpx.Response(200, text='data: {"jsonrpc":"2.0","method":"notifications/progress"}\n\n', headers={"Content-Type": "text/event-stream"})
        if receipt == "malformed_error":
            return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"], "error": None})
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"]})

    submitted = BuildCADClient(store=store, transport=httpx.MockTransport(handler))
    with pytest.raises(BuildCADError) as error:
        submitted.call_tool("save_design", {"source": "opaque-code"})
    assert error.value.code == "outcome_unknown"
    assert "secret-provider-debug" not in str(error.value)
    assert len(calls) == 1


@pytest.mark.parametrize("status,code", [(401, "authorization_required"), (403, "provider_error")])
def test_submitted_tool_auth_rejection_is_definite(setup_client, status, code):
    client, _, provider = setup_client
    connect(client)
    provider.call_status = status
    with pytest.raises(BuildCADError) as error:
        client.call_tool("save_design", {"source": "opaque-code"})
    assert error.value.code == code
    assert error.value.status == status


def test_explicit_rpc_rejection_stays_definite_and_tool_error_result_is_preserved(setup_client):
    client, store, provider = setup_client
    connect(client)

    def handler(request):
        if request.url.path == "/api/mcp" and json.loads(request.content)["method"] == "tools/call":
            body = json.loads(request.content)
            return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"], "error": {"code": -32602, "message": "secret-provider-debug"}})
        return provider.handle(request)

    rejected = BuildCADClient(store=store, transport=httpx.MockTransport(handler))
    with pytest.raises(BuildCADError) as error:
        rejected.call_tool("save_design", {})
    assert error.value.code == "provider_error"
    assert "secret-provider-debug" not in str(error.value)
    provider.result = {"isError": True, "content": [{"type": "text", "text": "代码校验未通过"}]}
    assert client.call_tool("save_design", {}) == provider.result


def test_read_only_tool_discovery_failure_keeps_original_error(setup_client):
    client, _, provider = setup_client
    connect(client)
    client.list_tools()
    provider.mcp_status = 503
    assert client.status()["error"]["code"] == "provider_error"


def test_unsupported_protocol_fails_before_tools_are_called(setup_client):
    client, _, provider = setup_client
    connect(client)
    provider.protocol = "unsupported-future-protocol"
    with pytest.raises(BuildCADError) as error:
        client.list_tools()
    assert error.value.code == "unsupported_protocol"
    assert [body["method"] for body in provider.rpc_requests] == ["initialize"]


def test_disconnect_removes_credentials_and_cached_session(setup_client):
    client, store, provider = setup_client
    connect(client)
    assert client.status()["connected"] is True
    client.disconnect()
    request_count = len(provider.requests)
    assert store.get("token") is None
    assert client.status()["connected"] is False
    assert len(provider.requests) == request_count


def test_expired_session_requires_fresh_handshake_without_replaying_tool_call(setup_client):
    client, _, provider = setup_client
    connect(client)
    assert client.list_tools() == [TOOL]
    provider.call_status = 404
    with pytest.raises(BuildCADError):
        client.call_tool("save_design", {"source": "opaque-code"})
    assert len([body for body in provider.rpc_requests if body["method"] == "tools/call"]) == 1
    provider.call_status = 200
    assert client.list_tools() == [TOOL]
    assert len([body for body in provider.rpc_requests if body["method"] == "initialize"]) == 2


def test_redis_configuration_error_does_not_expose_connection_credentials(monkeypatch):
    import redis

    def invalid_connection(*args, **kwargs):
        raise ValueError("redis://secret-password@private-host")

    monkeypatch.setattr(redis.Redis, "from_url", invalid_connection)
    with pytest.raises(BuildCADError) as error:
        BuildCADStore()
    assert error.value.code == "storage_unavailable"
    assert "secret-password" not in str(error.value)


def test_separate_clients_do_not_share_mcp_session_state(setup_client):
    first, store, provider = setup_client
    connect(first)
    assert first.list_tools() == [TOOL]
    second = BuildCADClient(store=store, transport=httpx.MockTransport(provider.handle))
    assert second.list_tools() == [TOOL]
    assert len([body for body in provider.rpc_requests if body["method"] == "initialize"]) == 2


def test_tool_pagination_has_a_finite_bound(setup_client):
    client, _, provider = setup_client
    connect(client)
    provider.pages = [{"tools": [TOOL], "nextCursor": str(index + 1)} for index in range(100)]
    with pytest.raises(BuildCADError) as error:
        client.list_tools()
    assert error.value.code == "invalid_response"
    assert len([body for body in provider.rpc_requests if body["method"] == "tools/list"]) <= 20


def test_sse_returns_matching_response_without_waiting_for_stream_to_close(setup_client):
    client, store, provider = setup_client
    connect(client)

    class OpenEventStream(httpx.SyncByteStream):
        closed = False

        def __iter__(self):
            yield b'data: {"jsonrpc":"2.0","id":2,"result":{"tools":[]}}\n\n'
            raise AssertionError("收到完整结果后不应继续等待事件流")

        def close(self):
            self.closed = True

    stream = OpenEventStream()

    def handler(request):
        if request.url.path == "/api/mcp" and json.loads(request.content)["method"] == "tools/list":
            return httpx.Response(200, stream=stream, headers={"Content-Type": "text/event-stream"})
        return provider.handle(request)

    streaming_client = BuildCADClient(store=store, transport=httpx.MockTransport(handler))
    assert streaming_client.list_tools() == []
    assert stream.closed


@pytest.mark.parametrize("response", [
    {"jsonrpc": "2.0", "id": 99, "result": {"tools": []}},
    {"jsonrpc": "2.0", "id": 2, "error": {"code": -32603, "message": "secret-provider-debug"}},
])
def test_invalid_rpc_responses_are_sanitized(setup_client, response):
    client, store, provider = setup_client
    connect(client)

    def handler(request):
        if request.url.path == "/api/mcp" and json.loads(request.content)["method"] == "tools/list":
            return httpx.Response(200, json=response)
        return provider.handle(request)

    checked_client = BuildCADClient(store=store, transport=httpx.MockTransport(handler))
    with pytest.raises(BuildCADError) as error:
        checked_client.list_tools()
    assert error.value.code in {"invalid_response", "provider_error"}
    assert "secret" not in str(error.value)


def test_redis_state_consumption_uses_single_atomic_getdel(monkeypatch):
    class RedisDouble:
        def __init__(self):
            self.data = {}
            self.consumed = []

        def set(self, key, value, **kwargs):
            self.data[key] = value

        def getdel(self, key):
            self.consumed.append(key)
            return self.data.pop(key, None)

    connection = RedisDouble()
    import redis
    monkeypatch.setattr(redis.Redis, "from_url", lambda *args, **kwargs: connection)
    store = BuildCADStore()
    store.set("oauth:one", {"nonce": "browser"}, ttl=600)
    assert store.pop("oauth:one") == {"nonce": "browser"}
    assert store.pop("oauth:one") is None
    assert len(connection.consumed) == 2


def test_unavailable_redis_token_lock_never_enters_token_mutation(monkeypatch):
    class Lease:
        def acquire(self):
            return False

        def release(self):
            raise AssertionError("不得释放未持有的锁")

    class RedisDouble:
        def lock(self, *args, **kwargs):
            return Lease()

    import redis
    monkeypatch.setattr(redis.Redis, "from_url", lambda *args, **kwargs: RedisDouble())
    with pytest.raises(BuildCADError) as error:
        with BuildCADStore().token_lock():
            raise AssertionError("未获得锁时不能更新令牌")
    assert error.value.code == "authorization_busy"


def test_redis_release_failure_preserves_original_unknown_outcome(monkeypatch):
    class Lease:
        def acquire(self):
            return True

        def release(self):
            raise RuntimeError("secret-redis-details")

    class RedisDouble:
        def lock(self, *args, **kwargs):
            return Lease()

    import redis
    monkeypatch.setattr(redis.Redis, "from_url", lambda *args, **kwargs: RedisDouble())
    with pytest.raises(BuildCADError) as error:
        with BuildCADStore().token_lock():
            raise BuildCADError("outcome_unknown", "授权请求超时", 504)
    assert error.value.code == "outcome_unknown"
    assert "secret" not in str(error.value)
