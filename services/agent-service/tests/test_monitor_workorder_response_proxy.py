"""Read-only HTTP boundary: Monitor must preserve Agent workorder response bytes."""
import hashlib
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import monitor_web_server as monitor


def test_monitor_workorder_proxy_preserves_authoritative_items_and_error_response(monkeypatch):
    root = Path(__file__).resolve().parents[3]
    evidence_dir = root / '.runtime/verification/workorder-empty-20261007'
    # Replay the documented public field shape with synthetic identities, so the
    # regression remains isolated and does not depend on saved live account data.
    original = {'workorder_id': 'WO-PROXY-ISOLATED', 'device_id': 'DEVICE-PROXY-ISOLATED',
                'event_id': 'EVT-PROXY-ISOLATED', 'plan_id': 'PLAN-PROXY-ISOLATED',
                'alarm_code': '', 'status': 'in_progress', 'assignee': 'USER-PROXY-ISOLATED',
                'assignee_name': '隔离维修人员', 'diagnosis_snapshot': {'raw': {'alarm_code': '700006'}}}
    # A large UTF-8 snapshot detects accidental small-pipeline compaction.
    order = dict(original, title='隔离代理完整正文验证', steps=[{'step': f'检查步骤{i}'} for i in range(6)],
                 maintenance_plan_snapshot={'steps': [{'step': f'检查步骤{i}'} for i in range(6)],
                                            'evidence': '隔离工程证据' * 5000},
                 execution_review={'required': True, 'findings': ['历史维修方案待复核']})
    payload = json.dumps({'items': [order], 'count': 1, 'backend': 'backend-service'}, ensure_ascii=False).encode('utf-8')
    error_payload = json.dumps({'detail': '隔离会话无效'}, ensure_ascii=False).encode('utf-8')
    seen = []

    class Upstream(BaseHTTPRequestHandler):
        def do_GET(self):
            authenticated = self.headers.get('Cookie') == 'maintenance_session=isolated-fake-session'
            seen.append({'path': self.path, 'method': 'GET', 'synthetic_cookie_forwarded': authenticated,
                         'synthetic_service_auth_forwarded': self.headers.get('Authorization') == 'Bearer isolated-fake-service'})
            body = payload if authenticated else error_payload
            self.send_response(200 if authenticated else 401)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args):
            pass

    upstream = ThreadingHTTPServer(('127.0.0.1', 0), Upstream)
    proxy = ThreadingHTTPServer(('127.0.0.1', 0), monitor.MonitorRequestHandler)
    monkeypatch.setattr(monitor, 'AGENT_SERVICE_BASE_URL', f'http://127.0.0.1:{upstream.server_port}')
    monkeypatch.setenv('AGENT_API_TOKEN', 'isolated-fake-service')
    threads = [Thread(target=lambda server=server: server.serve_forever(poll_interval=0.01), daemon=True)
               for server in (upstream, proxy)]
    for thread in threads:
        thread.start()
    try:
        request = Request(f'http://127.0.0.1:{proxy.server_port}/api/workorders?source=isolated',
                          headers={'Cookie': 'maintenance_session=isolated-fake-session'})
        with urlopen(request, timeout=3) as response:
            received = response.read()
            status, content_length = response.status, int(response.headers['Content-Length'])
            cache_control = response.headers['Cache-Control']
        assert status == 200
        assert received == payload
        assert content_length == len(payload)
        assert json.loads(received)['items'][0] == order
        assert cache_control == 'no-store'
        try:
            urlopen(f'http://127.0.0.1:{proxy.server_port}/api/workorders', timeout=3)
        except HTTPError as error:
            error_status, received_error = error.code, error.read()
        else:
            raise AssertionError('Invalid session response must stay an HTTP error, not become an empty 200 list')
        assert error_status == 401
        assert received_error == error_payload
        assert seen == [
            {'path': '/api/workorders?source=isolated', 'method': 'GET',
             'synthetic_cookie_forwarded': True, 'synthetic_service_auth_forwarded': True},
            {'path': '/api/workorders', 'method': 'GET',
             'synthetic_cookie_forwarded': False, 'synthetic_service_auth_forwarded': True},
        ]
        evidence_dir.mkdir(parents=True, exist_ok=True)
        (evidence_dir / 'monitor-proxy-read-only.json').write_text(json.dumps({
            'isolated_loopback_only': True, 'live_sessions_read': False, 'business_writes': 0,
            'handler': 'MonitorRequestHandler.do_GET -> _proxy_to_agent_service',
            'upstream_status': status, 'proxy_status': status, 'items_count': len(json.loads(received)['items']),
            'upstream_bytes': len(payload), 'proxy_bytes': len(received), 'content_length': content_length,
            'bytes_identical': received == payload, 'sha256': hashlib.sha256(received).hexdigest(),
            'steps_count': len(json.loads(received)['items'][0]['steps']),
            'snapshot_steps_count': len(json.loads(received)['items'][0]['maintenance_plan_snapshot']['steps']),
            'execution_review_preserved': json.loads(received)['items'][0]['execution_review'] == order['execution_review'],
            'failed_auth_status': error_status, 'failed_auth_body_preserved': received_error == error_payload,
            'upstream_requests': seen,
        }, ensure_ascii=False, indent=2), encoding='utf-8')
    finally:
        for server in (proxy, upstream):
            server.shutdown()
            server.server_close()
        for thread in threads:
            thread.join(timeout=3)
