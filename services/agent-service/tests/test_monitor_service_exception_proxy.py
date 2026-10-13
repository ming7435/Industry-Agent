"""异常反馈仍走原 Monitor 真实本机代理边界，不公开内部工具。"""
import pytest
import monitor_web_server as monitor
from test_monitor_cad_production_proxy import proxy_boundary

PATH='/api/runtime/service-exceptions/EXC-1234567890ABCDEF12345678/feedback'

def test_exception_feedback_uses_existing_service_auth_and_cookie_forwarding(proxy_boundary,monkeypatch):
    proxy,seen,send=proxy_boundary
    original=monitor.urlopen;headers=[]
    def observe(request,**kwargs):
        headers.append(dict(request.header_items()));return original(request,**kwargs)
    monkeypatch.setattr(monitor,'urlopen',observe)
    assert send(path=PATH,extra_headers=[('Cookie','maintenance_session=isolated-session')])[0]==200
    assert len(seen)==1 and seen[0]['authorization']=='Bearer isolated-proxy-test-token'
    assert headers[0]['Cookie']=='maintenance_session=isolated-session'
    assert headers[0]['Origin']==f'http://127.0.0.1:{proxy.server_port}'

@pytest.mark.parametrize('origin',[None,'null','http://untrusted.example'])
def test_invalid_origin_never_forwards_exception_write(proxy_boundary,origin):
    _,seen,send=proxy_boundary
    assert send(path=PATH,origin=origin)[0]==403
    assert seen==[]

def test_only_business_prefix_is_proxyable_not_similar_or_internal_tool_paths():
    assert monitor.MonitorRequestHandler._should_proxy(PATH)
    for path in ('/api/runtime/service-exceptions-evil','/internal/tools','/tools/call'):
        assert not monitor.MonitorRequestHandler._should_proxy(path)
