"""专家中心使用真实 Monitor HTTP 代理，同源、正文和身份边界不放宽。"""
import pytest
import monitor_web_server as monitor
from test_monitor_cad_production_proxy import proxy_boundary

PATH = "/api/expert/skills/diagnosis/alarm_diagnosis_skill"


def test_expert_proxy_forwards_origin_session_and_service_identity(proxy_boundary, monkeypatch):
    proxy, seen, send = proxy_boundary
    original = monitor.urlopen
    requests = []
    def observe(request, **kwargs):
        requests.append(dict(request.header_items()))
        return original(request, **kwargs)
    monkeypatch.setattr(monitor, "urlopen", observe)
    status, _ = send(path=PATH, extra_headers=[("Cookie", "maintenance_session=expert-test-session")])
    assert status == 200
    assert seen[0]["authorization"] == "Bearer isolated-proxy-test-token"
    assert requests[0]["Origin"] == f"http://127.0.0.1:{proxy.server_port}"
    assert requests[0]["Cookie"] == "maintenance_session=expert-test-session"


@pytest.mark.parametrize("origin", [None, "null", "http://evil.example"])
def test_expert_missing_or_bad_origin_never_forwards(proxy_boundary, origin):
    _, seen, send = proxy_boundary
    assert send(path=PATH, origin=origin)[0] == 403
    assert seen == []


def test_expert_rebinding_and_oversize_never_forward(proxy_boundary):
    proxy, seen, send = proxy_boundary
    assert send(path=PATH, host=f"evil.example:{proxy.server_port}")[0] == 403
    assert send(path=PATH, content_length=str(128 * 1024 + 1), finish_body=True)[0] == 413
    assert seen == []


def test_expert_is_bounded_proxy_prefix_not_internal_tool_endpoint():
    assert monitor.MonitorRequestHandler._should_proxy(PATH)
    for path in ("/api/expert-evil/skills", "/internal/expert", "/tools/call"):
        assert not monitor.MonitorRequestHandler._should_proxy(path)
