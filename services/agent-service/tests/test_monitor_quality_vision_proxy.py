"""Image uploads must be bounded before the monitor forwards service credentials."""
import pytest

from test_monitor_cad_production_proxy import proxy_boundary


@pytest.mark.parametrize('path', [
    '/api/quality/vision/detect', '/api/quality/vision/patchcore/train', '/api/quality/vision/patchcore/calibrate',
    '/api/quality/vision%2Fpatchcore/train',
    '/api/quality/vision/production/verify',
    '/api/quality/vision/sequential/fuse',
])
def test_large_vision_upload_is_rejected_before_forwarding(proxy_boundary, path):
    _, seen, send = proxy_boundary
    status, _ = send(path=path, content_length=str(40 * 1024 * 1024 + 1), finish_body=True)
    assert status == 413
    assert seen == []


@pytest.mark.parametrize('headers', [
    (('Content-Length', '2'),), (('Transfer-Encoding', 'chunked'),),
])
def test_ambiguous_vision_body_never_reaches_agent(proxy_boundary, headers):
    _, seen, send = proxy_boundary
    status, _ = send(path='/api/quality/vision/detect', extra_headers=headers)
    assert status == 400
    assert seen == []


def test_vision_body_requires_complete_declared_bytes(proxy_boundary):
    _, seen, send = proxy_boundary
    status, _ = send(path='/api/quality/vision/detect', content_length='20', finish_body=True)
    assert status == 400
    assert seen == []


def test_small_vision_body_forwards_and_cross_origin_is_blocked(proxy_boundary):
    _, seen, send = proxy_boundary
    path = '/api/quality/vision/detect'
    status, body = send(path=path)
    assert status == 200 and body == b'{"accepted":true}'
    assert seen[0]['body'] == b'{}'
    assert seen[0]['authorization'] == 'Bearer isolated-proxy-test-token'
    status, _ = send(path=path, origin='http://evil.example')
    assert status == 403
    assert len(seen) == 1
