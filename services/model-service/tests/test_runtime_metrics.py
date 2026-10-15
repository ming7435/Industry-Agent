"""模型监控读取真实网关回执；测试仅用提供方边界夹具。"""
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from app.providers.gateway import ModelGateway
from app.providers.base import ProviderError


def test_read_metrics_does_not_generate_or_probe_models(monkeypatch):
    import app.main as main
    monkeypatch.setenv('MODEL_PROVIDER', 'fake')
    gateway = ModelGateway()
    monkeypatch.setattr(main, 'gateway', gateway)
    client = TestClient(main.app)
    response = client.get('/internal/metrics?window_minutes=15')
    assert response.status_code == 200
    body = response.json()
    assert body['calls'] == 0 and body['inflight'] == 0
    assert body['usage']['total_tokens'] is None
    assert body['duration_ms']['p95'] is None
    assert main.health()['capabilities']['chat']['reachable'] == 'synthetic'


def test_gateway_counts_one_call_per_invocation_and_keeps_usage_out_of_payload_logs(monkeypatch):
    monkeypatch.setenv('MODEL_PROVIDER', 'fake')
    gateway = ModelGateway()
    provider = SimpleNamespace(name='fixture', chat=lambda payload: {
        'choices': [{'message': {'content': 'private-answer'}, 'finish_reason': 'stop'}],
        'usage': {'prompt_tokens': 120, 'completion_tokens': 30, 'total_tokens': 150},
    })
    gateway.chat_provider = provider
    result = gateway.chat({'messages': [{'role': 'user', 'content': 'private-prompt'}], 'model': 'fixture-model'})
    assert result['usage']['total_tokens'] == 150
    snapshot = gateway.metrics.snapshot(15)
    assert snapshot['calls'] == snapshot['successful'] == 1
    assert snapshot['failed'] == snapshot['inflight'] == 0
    assert snapshot['usage'] == {'input_tokens': 120, 'output_tokens': 30, 'total_tokens': 150,
                                 'reported_calls': 1, 'missing_calls': 0}
    assert 'private-' not in str(snapshot)


def test_gateway_failure_clears_inflight_and_missing_usage_is_not_zero(monkeypatch):
    monkeypatch.setenv('MODEL_PROVIDER', 'fake')
    gateway = ModelGateway()
    def fail(payload):
        raise ProviderError('private-provider-detail')
    gateway.chat_provider = SimpleNamespace(name='fixture', chat=fail)
    with pytest.raises(ProviderError):
        gateway.chat({'messages': []})
    report = gateway.metrics.snapshot(5)
    assert report['calls'] == report['failed'] == 1
    assert report['inflight'] == 0 and report['success_rate'] == 0
    assert report['usage']['total_tokens'] is None
    assert 'private-provider-detail' not in str(report)


def test_fake_traffic_is_not_reported_as_real_tokens(monkeypatch):
    monkeypatch.setenv('MODEL_PROVIDER', 'fake')
    gateway = ModelGateway()
    gateway.chat({'messages': [{'role': 'user', 'content': 'fake'}]})
    report = gateway.metrics.snapshot(5)
    assert report['calls'] == 0
    assert report['synthetic_calls'] == 1
    assert report['usage']['total_tokens'] is None


def test_window_rates_percentiles_and_usage_are_computed_from_finished_calls():
    from app.metrics import ModelMetrics
    clock = [1000.0]
    metrics = ModelMetrics(clock=lambda: clock[0], timer=lambda: clock[0])
    first = metrics.begin(); clock[0] += 1
    metrics.finish(first, 'chat', False, True, {'prompt_tokens': 80, 'completion_tokens': 20, 'total_tokens': 100})
    second = metrics.begin(); clock[0] += 3
    metrics.finish(second, 'chat', False, False)
    clock[0] = 1060.0
    report = metrics.snapshot(5)
    assert report['calls'] == 2 and report['success_rate'] == 0.5
    assert report['requests_per_minute'] == 2.0
    assert report['duration_ms'] == {'average': 2000.0, 'p95': 3000.0, 'maximum': 3000.0}
    assert report['usage']['total_tokens'] == 100
    assert report['usage']['missing_calls'] == 1
    assert sum(item['calls'] for item in report['timeline']) == 2
    clock[0] = 1400.0
    assert metrics.snapshot(5)['calls'] == 0
    assert metrics.snapshot(15)['calls'] == 2


def test_invalid_token_fields_are_unknown_not_estimated_and_memory_is_bounded():
    from app.metrics import ModelMetrics
    clock = [1000.0]
    metrics = ModelMetrics(clock=lambda: clock[0], timer=lambda: clock[0], maxlen=2)
    for usage in ({'total_tokens': 99}, {'total_tokens': True}, {'total_tokens': -1}):
        started = metrics.begin(); clock[0] += 1
        metrics.finish(started, 'embedding', False, True, usage)
    report = metrics.snapshot(5)
    assert report['partial'] is True and report['calls'] == 2
    assert report['usage']['total_tokens'] is None
    assert report['usage']['missing_calls'] == 2


def test_metrics_endpoint_rejects_unsupported_window(monkeypatch):
    import app.main as main
    monkeypatch.setenv('MODEL_PROVIDER', 'fake')
    monkeypatch.setattr(main, 'gateway', ModelGateway())
    assert TestClient(main.app).get('/internal/metrics?window_minutes=999').status_code == 422


@pytest.mark.parametrize('minutes,expected_calls,expected_tokens,step', [
    (60, 1, 100000, 60), (1440, 2, 110000, 3600),
    (10080, 4, 111100, 86400), (43200, 5, 111110, 86400),
])
def test_hour_day_week_month_windows_filter_real_receipts_and_bound_buckets(minutes, expected_calls, expected_tokens, step):
    from app.metrics import ModelMetrics
    clock = [0.0]
    metrics = ModelMetrics(clock=lambda: clock[0], timer=lambda: clock[0])
    now = 40 * 86400
    for age, tokens in [(31*86400, 1), (10*86400, 10), (6*86400, 100), (36*3600, 1000), (2*3600, 10000), (1800, 100000)]:
        clock[0] = now-age
        metrics.finish(metrics.begin(), 'chat', False, True, {'total_tokens': tokens})
    clock[0] = now
    report = metrics.snapshot(minutes)
    assert report['calls'] == expected_calls
    assert report['usage']['total_tokens'] == expected_tokens
    assert report['bucket_seconds'] == step
    assert report['timezone'] == 'Asia/Shanghai'
    assert len(report['timeline']) <= 61
    assert sum(row['calls'] for row in report['timeline']) == expected_calls
    assert sum(row['total_tokens'] or 0 for row in report['timeline']) == expected_tokens
    assert report['requests_per_minute'] == pytest.approx(expected_calls/minutes)
    assert report['tokens_per_minute'] == pytest.approx(expected_tokens/minutes)


@pytest.mark.parametrize('minutes', [1440, 10080, 43200])
def test_long_windows_are_available_through_real_model_api_without_paid_calls(monkeypatch, minutes):
    import app.main as main
    monkeypatch.setenv('MODEL_PROVIDER', 'fake')
    monkeypatch.setattr(main, 'gateway', ModelGateway())
    response = TestClient(main.app).get(f'/internal/metrics?window_minutes={minutes}')
    assert response.status_code == 200
    assert response.json()['window_minutes'] == minutes
    assert response.json()['calls'] == 0
    assert response.json()['usage']['total_tokens'] is None


def test_daily_buckets_use_beijing_midnight_and_do_not_invent_prestart_history():
    from datetime import datetime
    from app.metrics import ModelMetrics
    clock = [datetime.fromisoformat('2026-10-14T23:59:00+08:00').timestamp()]
    metrics = ModelMetrics(clock=lambda: clock[0], timer=lambda: clock[0])
    metrics.finish(metrics.begin(), 'chat', False, True, {'total_tokens': 0})
    clock[0] += 120
    metrics.finish(metrics.begin(), 'chat', False, False)
    report = metrics.snapshot(43200)
    assert [row['at'] for row in report['timeline']] == ['2026-10-13T16:00:00+00:00', '2026-10-14T16:00:00+00:00']
    assert [row['total_tokens'] for row in report['timeline']] == [0, None]
    assert report['observed_seconds'] == 120
    assert report['window_start'] == report['started_at']
