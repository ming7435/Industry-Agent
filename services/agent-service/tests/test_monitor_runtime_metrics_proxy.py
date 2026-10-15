"""监控只增加明确的 GET 路由，不开放模型端点或任意运行时路径。"""
import monitor_web_server as monitor
from test_monitor_cad_production_proxy import proxy_boundary


def test_runtime_metrics_proxy_is_read_only_and_does_not_forward_writes(proxy_boundary):
    proxy, seen, send = proxy_boundary
    assert send(path='/api/runtime/metrics?window_minutes=15', method='GET')[0] == 200
    assert send(path='/api/runtime/metrics', method='POST')[0] == 405
    assert seen == []
    for path in ('/api/runtime/metrics', '/api/v1/runtime/metrics'):
        assert monitor.MonitorRequestHandler._should_proxy(path)
    for path in ('/api/runtime/metrics-evil', '/internal/metrics', '/v1/chat/completions'):
        assert not monitor.MonitorRequestHandler._should_proxy(path)
