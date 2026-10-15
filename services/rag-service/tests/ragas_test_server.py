"""测试专用 Model/RAG HTTP 适配器；只模拟网络边界，不替换 RAGAS 指标。"""
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from threading import Thread


@contextmanager
def http_adapter(handler):
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            payload = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            requests.append((self.path, payload, dict(self.headers)))
            body, status = handler(self.path, payload)
            encoded = json.dumps(body, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(encoded)))
            self.end_headers()
            try:
                self.wfile.write(encoded)
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}', requests
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def model_reply(path, payload):
    if path == '/v1/embeddings':
        return {'data': [{'index': i, 'embedding': [1.0, 0.0]} for i, text in enumerate(payload['input'])]}, 200
    assert path == '/v1/chat/completions'
    schema = json.loads(payload['messages'][0]['content'].split('\n', 1)[1])
    replies = {
        'StatementGeneratorOutput': {'statements': ['检查冷却', '需要复测']},
        'NLIStatementOutput': {'statements': [
            {'statement': '检查冷却', 'reason': '有证据', 'verdict': 1},
            {'statement': '需要复测', 'reason': '无证据', 'verdict': 0}]},
        'AnswerRelevanceOutput': {'question': '主轴怎么检查？', 'noncommittal': 0},
        'ContextPrecisionOutput': {'reason': '与问题有关', 'verdict': 1},
        'ContextRecallOutput': {'classifications': [
            {'statement': '检查冷却', 'reason': '有证据', 'attributed': 1},
            {'statement': '需要复测', 'reason': '无证据', 'attributed': 0}]},
        'ClaimDecompositionOutput': {'claims': ['检查冷却', '需要复测']},
    }
    content = json.dumps(replies[schema['title']], ensure_ascii=False)
    return {'choices': [{'index': 0, 'message': {'role': 'assistant', 'content': content}, 'finish_reason': 'stop'}]}, 200
