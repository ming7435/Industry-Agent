import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

from app.rag.client import RAGServiceClient


def test_rag_client_authenticates_both_read_and_write_requests(monkeypatch):
    class Handler(BaseHTTPRequestHandler):
        def reply(self):
            authorized = self.headers.get('Authorization') == 'Bearer isolated-rag-token'
            self.send_response(200 if authorized else 401)
            self.end_headers()
            self.wfile.write(json.dumps({'authorized': authorized}).encode())
        def do_GET(self):
            self.reply()
        def do_POST(self):
            self.rfile.read(int(self.headers.get('Content-Length', '0')))
            self.reply()
        def log_message(self, *_):
            pass
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', 'isolated-rag-token')
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        client = RAGServiceClient(base_url=f'http://127.0.0.1:{server.server_port}')
        assert client._get('/documents/DOC')['authorized'] is True
        assert client._post('/documents/upsert', {'document_id': 'DOC'})['authorized'] is True
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)
