"""真实临时 HTTP 代理必须在附加服务凭据、送出生产写入前检查本地来源。"""
from http.client import HTTPResponse, RemoteDisconnected
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Event, Thread
from urllib.parse import unquote
import socket

import pytest
from starlette.routing import compile_path
import monitor_web_server as monitor


DISPATCH_PATH = "/api/cad/designs/CAD-TEST/manufacturing/NC-TEST/dispatch"


@pytest.fixture
def proxy_boundary(monkeypatch):
    seen = []
    class Upstream(BaseHTTPRequestHandler):
        def do_POST(self):
            seen.append({"method": "POST", "path": self.path, "authorization": self.headers.get("Authorization"),
                         "body": self.rfile.read(int(self.headers.get("Content-Length", "0")))})
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"accepted":true}')
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status":"ready"}')
        def log_message(self, *args):
            pass
    class Proxy(monitor.MonitorRequestHandler):
        # 非本机测试仅替换传输层 peer，仍执行真实 HTTP 解析、防护、代理及上游。
        def _proxy_to_agent_service(self, method):
            if getattr(self.server, "test_peer", None):
                self.client_address = (self.server.test_peer, self.client_address[1])
            return super()._proxy_to_agent_service(method)
        def _read_local_cad_production_body(self):
            original_timeout = self.connection.gettimeout()
            try:
                return super()._read_local_cad_production_body()
            finally:
                self.server.body_timeout_pairs.append((original_timeout, self.connection.gettimeout()))
                self.server.body_read_completed.set()
    class QuietServer(ThreadingHTTPServer):
        def handle_error(self, request, address):
            pass
    upstream = ThreadingHTTPServer(("127.0.0.1", 0), Upstream)
    proxy = QuietServer(("127.0.0.1", 0), Proxy)
    proxy.body_timeout_pairs = []
    proxy.body_read_completed = Event()
    monkeypatch.setattr(monitor, "AGENT_SERVICE_BASE_URL", f"http://127.0.0.1:{upstream.server_port}")
    monkeypatch.setenv("AGENT_API_TOKEN", "isolated-proxy-test-token")
    for server in (upstream, proxy):
        Thread(target=lambda target=server: target.serve_forever(poll_interval=0.02), daemon=True).start()
    def send(*, path=DISPATCH_PATH, host=None, origin="same", content_length="2", extra_headers=(), method="POST", finish_body=False):
        authority = host or f"127.0.0.1:{proxy.server_port}"
        if origin == "same":
            origin = f"http://{authority}"
        elif origin is not None:
            origin = origin.format(port=proxy.server_port)
        headers = [f"{method} {path} HTTP/1.1", f"Host: {authority}"]
        if origin is not None:
            headers.append(f"Origin: {origin}")
        if content_length is not None:
            headers.append(f"Content-Length: {content_length}")
        for name, value in extra_headers:
            headers.append(f"{name}: {value.format(port=proxy.server_port)}")
        connection = socket.create_connection(("127.0.0.1", proxy.server_port), timeout=3)
        # 一次发送完整小请求，避免 Windows 分开发送 headers/body 与提前拒绝竞态。
        packet = ("\r\n".join(headers) + "\r\n\r\n").encode("latin-1")
        connection.sendall(packet + (b"{}" if method == "POST" else b""))
        if finish_body:
            connection.shutdown(socket.SHUT_WR)
        try:
            response = HTTPResponse(connection)
            response.begin()
            status, body = response.status, response.read()
            return status, body
        except (RemoteDisconnected, ConnectionAbortedError, ConnectionResetError):
            return 0, b""
        finally:
            connection.close()
    try:
        yield proxy, seen, send
    finally:
        for server in (proxy, upstream):
            server.shutdown()
            server.server_close()


def test_rebinding_same_origin_evil_host_never_reaches_upstream_write(proxy_boundary):
    proxy, seen, send = proxy_boundary
    status, _ = send(host=f"evil.example:{proxy.server_port}")
    assert (status, len(seen)) == (403, 0)


@pytest.mark.parametrize("hostname", ["localhost", "127.0.0.1", "[::1]"])
def test_local_same_origin_production_write_still_forwards_service_identity(proxy_boundary, hostname):
    proxy, seen, send = proxy_boundary
    status, body = send(host=f"{hostname}:{proxy.server_port}")
    assert status == 200
    assert body == b'{"accepted":true}'
    assert seen == [{"method": "POST", "path": DISPATCH_PATH, "authorization": "Bearer isolated-proxy-test-token", "body": b"{}"}]
    assert proxy.body_timeout_pairs == [(None, None)]


@pytest.mark.parametrize("origin", [
    "https://127.0.0.1:{port}", "http://127.0.0.1:1", "http://127.0.0.1:{port}/",
    "http://127.0.0.1:{port}?query", "http://127.0.0.1:{port}#fragment", "null", None,
    "http://user@127.0.0.1:{port}", "http://127.0.0.1:invalid",
])
def test_production_origin_must_be_a_complete_matching_http_origin(proxy_boundary, origin):
    _, seen, send = proxy_boundary
    status, _ = send(origin=origin)
    assert status == 403
    assert seen == []


@pytest.mark.parametrize("hostname", ["127.0.0.1.evil.example", "2130706433", "127.1", "127.0.0.1.", "localhost@evil.example"])
def test_host_aliases_and_lookalikes_are_not_whitelisted(proxy_boundary, hostname):
    proxy, seen, send = proxy_boundary
    status, _ = send(host=f"{hostname}:{proxy.server_port}")
    assert status == 403
    assert seen == []


def test_host_must_use_current_proxy_port(proxy_boundary):
    _, seen, send = proxy_boundary
    status, _ = send(host="127.0.0.1:1")
    assert status == 403
    assert seen == []


@pytest.mark.parametrize("path", [
    "/api/cad/designs/CAD-TEST/manufacturing",
    "/api/cad/designs/CAD-TEST/manufacturing/NC-TEST/dispatch/",
    "/api/cad/designs/CAD-TEST/%6danufacturing/NC-TEST/dispatch",
    "/api/cad/%64esigns/CAD-TEST/manufacturing%2FNC-TEST%2Fdispatch",
])
def test_production_prepare_dispatch_and_encoded_paths_share_the_guard(proxy_boundary, path):
    proxy, seen, send = proxy_boundary
    status, _ = send(path=path, host=f"evil.example:{proxy.server_port}")
    assert status == 403
    assert seen == []


@pytest.mark.parametrize("suffix", ["%0A", "%0A/"])
def test_prepare_route_terminal_newline_match_is_also_guarded(proxy_boundary, suffix):
    path = "/api/cad/designs/CAD-TEST/manufacturing" + suffix
    # 真实 FastAPI/Starlette 匹配器接受最终解码换行，尾斜杠变体可被重定向归一化。
    route_regex, _, _ = compile_path("/api/cad/designs/{design_id}/manufacturing")
    assert route_regex.match(unquote(path).rstrip("/")) is not None
    proxy, seen, send = proxy_boundary
    status, _ = send(path=path, host=f"evil.example:{proxy.server_port}")
    assert (status, len(seen)) == (403, 0)


def test_nonloopback_transport_peer_cannot_use_allowed_host_and_origin(proxy_boundary):
    proxy, seen, send = proxy_boundary
    proxy.test_peer = "203.0.113.7"
    status, _ = send()
    assert status == 403
    assert seen == []


@pytest.mark.parametrize("content_length", ["bad", "-1", "2,2", "²", None])
def test_malformed_content_length_never_forwards_a_production_write(proxy_boundary, content_length):
    _, seen, send = proxy_boundary
    status, _ = send(content_length=content_length, finish_body=True)
    assert status == 400
    assert seen == []


@pytest.mark.parametrize("headers", [
    (("Host", "evil.example:{port}"),),
    (("Origin", "http://evil.example:{port}"),),
])
def test_duplicate_authority_headers_are_rejected(proxy_boundary, headers):
    _, seen, send = proxy_boundary
    status, _ = send(extra_headers=headers)
    assert status == 403
    assert seen == []


@pytest.mark.parametrize("headers", [(("Content-Length", "2"),), (("Transfer-Encoding", "chunked"),)])
def test_ambiguous_body_framing_is_rejected(proxy_boundary, headers):
    _, seen, send = proxy_boundary
    status, _ = send(extra_headers=headers)
    assert status == 400
    assert seen == []


def test_truncated_production_body_never_reaches_upstream(proxy_boundary):
    _, seen, send = proxy_boundary
    status, _ = send(content_length="20", finish_body=True)
    assert status == 400
    assert seen == []


def test_incomplete_body_on_open_connection_has_a_bounded_read_and_restores_timeout(proxy_boundary, monkeypatch):
    proxy, seen, send = proxy_boundary
    monkeypatch.setattr(monitor, "CAD_PRODUCTION_BODY_TIMEOUT_SECONDS", 0.1, raising=False)
    # 保持连接打开，只发送 2 字节却声明 20 字节，不能靠 EOF 结束读取。
    status, _ = send(content_length="20")
    assert status == 400
    assert seen == []
    assert proxy.body_read_completed.wait(timeout=1)
    assert proxy.body_timeout_pairs == [(None, None)]


@pytest.mark.parametrize("content_length", ["1048577", "999999999999999999999999999999"])
def test_oversized_production_body_is_rejected_without_reading_or_forwarding(proxy_boundary, content_length):
    _, seen, send = proxy_boundary
    status, _ = send(content_length=content_length)
    assert status == 413
    assert seen == []


@pytest.mark.parametrize("path", ["/api/quality/check", "/api/cad/designs", "/api/cad/designs/CAD-TEST/assembly"])
def test_other_existing_write_routes_keep_their_original_origin_behavior(proxy_boundary, path):
    proxy, seen, send = proxy_boundary
    status, _ = send(path=path, host=f"evil.example:{proxy.server_port}")
    assert status == 200
    assert len(seen) == 1


@pytest.mark.parametrize("method", ["PUT", "PATCH"])
def test_unsupported_production_methods_remain_unsupported(proxy_boundary, method):
    _, seen, send = proxy_boundary
    status, _ = send(method=method, content_length="0")
    assert status == 501
    assert seen == []


def test_production_reads_keep_the_existing_proxy_behavior(proxy_boundary):
    proxy, seen, send = proxy_boundary
    status, _ = send(path=DISPATCH_PATH.replace("/dispatch", ""), host=f"evil.example:{proxy.server_port}", method="GET")
    assert status == 200
    assert seen == []
