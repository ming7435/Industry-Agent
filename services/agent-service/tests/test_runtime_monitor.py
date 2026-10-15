"""系统监控是只读汇总，不运行 Agent、模型生成或设备控制。"""
from types import SimpleNamespace
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import json
import pytest
from fastapi.testclient import TestClient
from app.api.server import create_app
from app.harness.trace import TraceRecorder


def client_for(trace=None):
    return TestClient(create_app(SimpleNamespace(container=SimpleNamespace(trace=trace or TraceRecorder()))))


def test_monitor_returns_unavailable_not_zero_when_model_service_unconfigured():
    response = client_for().get('/api/runtime/metrics?window_minutes=15')
    assert response.status_code == 200
    body = response.json()
    assert body['model']['available'] is False
    assert body['agent']['available'] is True
    assert body['agent']['agents']['completed'] == 0
    assert body['model'].get('usage', {}).get('total_tokens') is None


def test_monitor_counts_terminal_calls_not_started_events_and_deduplicates_receipts():
    trace = TraceRecorder()
    trace.record(type='agent', event='agent_started', agent_run_id='A', trace_id='T')
    trace.record(type='agent', event='agent_completed', agent_run_id='A', trace_id='T', elapsed_ms=100)
    trace.record(type='tool', event='tool_started', tool_call_id='C', trace_id='T')
    trace.record(type='tool', event='tool_completed', tool_call_id='C', trace_id='T', elapsed_ms=20)
    trace.record(type='tool', event='tool_completed', tool_call_id='C', trace_id='T', elapsed_ms=20)
    trace.record(type='tool', event='tool_error', tool_call_id='D', trace_id='T', error='private-error')
    response = client_for(trace).get('/api/runtime/metrics?window_minutes=15')
    assert response.status_code == 200
    report = response.json()['agent']
    assert report['agents']['completed'] == 1
    assert report['tools']['completed'] == 1 and report['tools']['failed'] == 1
    assert report['tools']['success_rate'] == 0.5
    assert 'private-error' not in str(report)


def test_runtime_monitor_keeps_api_authentication(monkeypatch):
    monkeypatch.setenv('AGENT_API_TOKEN', 'isolated-monitor-token')
    client = client_for()
    assert client.get('/api/runtime/metrics').status_code == 401
    assert client.get('/api/runtime/metrics', headers={'Authorization': 'Bearer isolated-monitor-token'}).status_code == 200
    assert client.post('/api/runtime/metrics').status_code == 405


def test_agent_timeout_is_a_failed_terminal_receipt():
    trace = TraceRecorder()
    trace.record(type='agent', event='agent_timeout', agent_run_id='A', trace_id='T', elapsed_ms=3000)
    body = client_for(trace).get('/api/runtime/metrics').json()['agent']['agents']
    assert body['failed'] == 1 and body['success_rate'] == 0
    assert body['average_ms'] == 3000


def test_tool_duration_uses_real_registry_seconds_field():
    trace = TraceRecorder()
    trace.record(type='tool', event='tool_completed', tool_call_id='C', trace_id='T', execution_time=0.125)
    body = client_for(trace).get('/api/runtime/metrics').json()['agent']['tools']
    assert body['average_ms'] == 125


@contextmanager
def model_http(body, status=200):
    calls = []
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass
        def do_GET(self):
            calls.append((self.command, self.path))
            encoded = json.dumps(body).encode()
            self.send_response(status)
            self.send_header('Content-Length', str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}', calls
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=2)


def test_monitor_fetches_model_read_contract_once_and_preserves_unknown_usage(monkeypatch):
    with model_http({'available': True, 'scope': 'model_service_process', 'calls': 2,
                     'usage': {'total_tokens': None}}) as (url, calls):
        monkeypatch.setenv('MODEL_SERVICE_BASE_URL', url)
        body = client_for().get('/api/runtime/metrics?window_minutes=60').json()
    assert calls == [('GET', '/internal/metrics?window_minutes=60')]
    assert body['model']['calls'] == 2
    assert body['model']['usage']['total_tokens'] is None


def test_monitor_http_failure_never_exposes_upstream_body_or_retries(monkeypatch):
    with model_http({'detail': 'private-upstream-content'}, 503) as (url, calls):
        monkeypatch.setenv('MODEL_SERVICE_BASE_URL', url)
        body = client_for().get('/api/runtime/metrics').json()
    assert len(calls) == 1
    assert body['model']['available'] is False
    assert 'private-upstream-content' not in str(body)


def test_monitor_rejects_unknown_time_window_before_contacting_model(monkeypatch):
    with model_http({}) as (url, calls):
        monkeypatch.setenv('MODEL_SERVICE_BASE_URL', url)
        response = client_for().get('/api/runtime/metrics?window_minutes=6')
    assert response.status_code == 422
    assert calls == []


@pytest.mark.parametrize('minutes', [1440, 10080, 43200])
def test_monitor_forwards_day_week_month_windows_and_preserves_bucket_contract(monkeypatch, minutes):
    payload = {'available': True, 'scope': 'model_service_process', 'window_minutes': minutes,
               'bucket_seconds': 3600 if minutes == 1440 else 86400, 'timezone': 'Asia/Shanghai',
               'usage': {'total_tokens': None}, 'timeline': []}
    with model_http(payload) as (url, calls):
        monkeypatch.setenv('MODEL_SERVICE_BASE_URL', url)
        response = client_for().get(f'/api/runtime/metrics?window_minutes={minutes}')
    assert response.status_code == 200
    assert calls == [('GET', f'/internal/metrics?window_minutes={minutes}')]
    assert response.json()['window_minutes'] == minutes
    assert response.json()['model'] == payload
