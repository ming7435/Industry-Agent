from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.request import Request, urlopen
import json
import monitor_web_server as monitor


def test_team_cookie_proxy_has_explicit_methods_and_does_not_forward_actor(monkeypatch):
    seen = []
    class Backend(BaseHTTPRequestHandler):
        def do_POST(self):
            seen.append(dict(self.headers))
            self.send_response(200)
            self.send_header('Set-Cookie', 'maintenance_session=opaque; HttpOnly; SameSite=Strict; Path=/')
            self.end_headers()
            self.wfile.write(b'{}')
        def log_message(self, *args):
            pass
    backend = ThreadingHTTPServer(('127.0.0.1', 0), Backend)
    proxy = ThreadingHTTPServer(('127.0.0.1', 0), monitor.MonitorRequestHandler)
    for server in (backend, proxy):
        Thread(target=server.serve_forever, daemon=True).start()
    monkeypatch.setenv('BACKEND_SERVICE_BASE_URL', f'http://127.0.0.1:{backend.server_port}')
    try:
        req = Request(f'http://127.0.0.1:{proxy.server_port}/api/team/login', data=b'{}', headers={'Cookie': 'maintenance_session=old', 'X-Actor-Role': 'supervisor'}, method='POST')
        with urlopen(req) as response:
            assert 'HttpOnly' in response.headers['Set-Cookie']
        assert seen[0]['Cookie'] == 'maintenance_session=old'
        assert 'X-Actor-Role' not in seen[0]
    finally:
        backend.shutdown(); proxy.shutdown()
        backend.server_close(); proxy.server_close()
