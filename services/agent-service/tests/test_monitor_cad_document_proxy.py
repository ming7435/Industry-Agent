from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import urllib.request
import monitor_web_server as monitor


def test_proxy_keeps_cookie_origin_and_artifact_security(monkeypatch):
    seen=[]
    class Upstream(BaseHTTPRequestHandler):
        def do_POST(self):
            self.rfile.read(int(self.headers['Content-Length']))
            seen.append(dict(cookie=self.headers.get('Cookie'),origin=self.headers.get('Origin')))
            self.send_response(202); self.send_header('Content-Type','application/json')
            self.send_header('X-Content-Type-Options','nosniff'); self.send_header('Content-Security-Policy',"sandbox")
            self.end_headers(); self.wfile.write(b'{}')
        def log_message(self,*_): pass
    upstream=ThreadingHTTPServer(('127.0.0.1',0),Upstream)
    proxy=ThreadingHTTPServer(('127.0.0.1',0),monitor.MonitorRequestHandler)
    monkeypatch.setattr(monitor,'AGENT_SERVICE_BASE_URL',f'http://127.0.0.1:{upstream.server_port}')
    for server in (upstream,proxy): Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{proxy.server_port}'
    try:
        request=urllib.request.Request(origin+'/api/cad/freecad/documents',data=b'{}',headers={'Origin':origin,'Cookie':'maintenance_session=test-cookie','Content-Type':'application/json'})
        with urllib.request.urlopen(request) as response:
            assert response.status==202
            assert response.headers['X-Content-Type-Options']=='nosniff'
            assert response.headers['Content-Security-Policy']=='sandbox'
        assert seen==[dict(cookie='maintenance_session=test-cookie',origin=origin)]
    finally:
        for server in (proxy,upstream): server.shutdown();server.server_close()
