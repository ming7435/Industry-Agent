"""Run the real Monitor proxy boundary before it attaches internal write credentials."""
import pytest
import monitor_web_server as monitor
from test_monitor_cad_production_proxy import proxy_boundary

PATH = '/api/production/virtual/plans'


def test_production_proxy_forwards_session_and_internal_auth(proxy_boundary):
    _, seen, send = proxy_boundary
    status, _ = send(path=PATH, extra_headers=[('Cookie', 'maintenance_session=owner-session')])
    assert status == 200
    assert seen[0]['path'] == PATH
    assert seen[0]['authorization'] == 'Bearer isolated-proxy-test-token'


@pytest.mark.parametrize('origin', ['http://evil.example', None, 'null'])
def test_invalid_origin_never_reaches_production_upstream(proxy_boundary, origin):
    _, seen, send = proxy_boundary
    assert send(path=PATH, origin=origin)[0] == 403
    assert seen == []


def test_oversized_body_never_reaches_production_upstream(proxy_boundary):
    _, seen, send = proxy_boundary
    assert send(path=PATH, content_length=str(2 * 1024 * 1024), finish_body=True)[0] == 413
    assert seen == []


@pytest.mark.parametrize('path', ['/api/production/virtual-evil/plans', '/api/production/arbitrary', '/internal/production/virtual/prepare'])
def test_only_fixed_production_prefix_is_proxied(path):
    assert not monitor.MonitorRequestHandler._should_proxy(path)
