"""The real monitor proxy preserves authenticated multi-device scope updates."""
import importlib.util
import json
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def test_team_scope_proxy_preserves_body_session_and_upstream_failure(monkeypatch):
    path = Path(__file__).resolve().parents[1] / 'monitor_web_server.py'
    spec = importlib.util.spec_from_file_location('scope_monitor', path)
    monitor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(monitor)
    received = []
    status = [200]
    payload = {'responsible_device_ids': ['M1', 'M2']}

    class Upstream(BaseHTTPRequestHandler):
        def do_POST(self):
            received.append((self.path, self.headers.get('Cookie'), json.loads(self.rfile.read(int(self.headers['Content-Length'])))))
            body = json.dumps({'user': {'responsible_device_ids': ['M1', 'M2']}} if status[0] == 200 else {'detail': '请先登录维修小组账号'}).encode()
            self.send_response(status[0])
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_):
            pass

    upstream = ThreadingHTTPServer(('127.0.0.1', 0), Upstream)
    proxy = ThreadingHTTPServer(('127.0.0.1', 0), monitor.MonitorRequestHandler)
    monkeypatch.setenv('BACKEND_SERVICE_BASE_URL', f'http://127.0.0.1:{upstream.server_port}')
    threads = [Thread(target=server.serve_forever, daemon=True) for server in (upstream, proxy)]
    for thread in threads:
        thread.start()
    try:
        url = f'http://127.0.0.1:{proxy.server_port}/api/team/responsibilities'
        request = Request(url, data=json.dumps(payload).encode(), method='POST', headers={'Cookie': 'maintenance_session=isolated-fixture', 'Content-Type': 'application/json'})
        with urlopen(request, timeout=3) as response:
            assert json.load(response)['user']['responsible_device_ids'] == ['M1', 'M2']
        assert received == [('/api/team/responsibilities', 'maintenance_session=isolated-fixture', payload)]
        status[0] = 401
        try:
            urlopen(request, timeout=3)
            assert False, 'Authentication failure must be preserved'
        except HTTPError as error:
            assert error.code == 401
        request = Request(url, data=b'', method='POST', headers={'Origin': 'https://different-origin.invalid'})
        try:
            urlopen(request, timeout=3)
            assert False, 'Cross-origin writes must be rejected before forwarding'
        except HTTPError as error:
            assert error.code == 403
        assert len(received) == 2
    finally:
        for server in (proxy, upstream):
            server.shutdown()
            server.server_close()
        for thread in threads:
            thread.join(timeout=3)
