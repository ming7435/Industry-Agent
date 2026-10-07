"""报警定义使用设备所属虚拟工厂数据，不调用真实设备。"""
import json
import pytest
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.parse import parse_qs, urlsplit

from app.tools.diagnosis.get_alarm_definition import get_alarm_definition
from app.tools.registry import ToolRegistry


@contextmanager
def factory_definitions(*, catalog=None):
    requests = []
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urlsplit(self.path)
            device = parse_qs(parsed.query).get('device_id', [''])[0]
            requests.append((parsed.path, device))
            payload = {'monitor': {'device_id': device}, 'scenarios': {'device_id': device, 'scenarios': [
                {'alarm_code':'700004','name':'开门被禁止','severity':'critical','summary':'轴或主轴尚未停止', 'default_device_id':'D-1'},
                {'alarm_code':'700004','name':'另一台设备的同号报警','severity':'warning','default_device_id':'D-2'},
            ]}}
            if catalog is not None:
                payload['scenarios'] = catalog
            data = json.dumps(payload).encode()
            self.send_response(200)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        def log_message(self, *_):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}', requests
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=2)


def test_factory_definition_exactly_matches_device_and_alarm():
    with factory_definitions() as (address, requests):
        result = get_alarm_definition('700004', device_id='D-1', base_url=address)
        assert result['found'] is True
        assert result['name'] == '开门被禁止'
        assert result['severity'] == 'critical'
        assert result['device_id'] == 'D-1'
        assert result['source'] == 'factory_scenario_catalog'
        assert requests == [('/api/snapshot', 'D-1')]


def test_factory_unknown_alarm_never_uses_another_device_or_mock():
    with factory_definitions() as (address, _):
        unknown = get_alarm_definition('700001', device_id='D-1', base_url=address)
        wrong_device = get_alarm_definition('700004', device_id='D-3', base_url=address)
        assert unknown['found'] is False and wrong_device['found'] is False
        assert unknown['source'] == 'factory_scenario_catalog'


def test_factory_definition_unavailable_does_not_claim_mock_evidence():
    result = get_alarm_definition('700001', device_id='D-1', base_url='http://127.0.0.1:9')
    assert result['success'] is False
    assert result['found'] is False
    assert result['evidence_status'] == 'unavailable'


def test_registry_passes_trusted_device_context_without_changing_model_schema():
    with factory_definitions() as (address, _):
        registry = ToolRegistry(base_url=address)
        result = registry.execute('get_alarm_definition', {'alarm_code':'700004', 'device_id':'D-2'},
            context={'agent':'diagnosis','device_id':'D-1','allowed_tools':['get_alarm_definition']})
        assert result['device_id'] == 'D-1'
        assert result['name'] == '开门被禁止'


def test_invalid_factory_catalog_returns_unavailable_not_exception_or_mock():
    for catalog in (['无效目录'], {'scenarios':'无效目录'}):
        with factory_definitions(catalog=catalog) as (address, _):
            result = get_alarm_definition('700001', device_id='D-1', base_url=address)
            assert result['found'] is False and result['success'] is False
            assert result['evidence_status'] == 'unavailable'
            assert result['source'] == 'factory_scenario_catalog'


@pytest.mark.parametrize('catalog', [None, [], {}, {'device_id':'D-1'}, {'scenarios':None}])
def test_missing_catalog_fields_are_unavailable_not_unknown(monkeypatch, catalog):
    from app.monitor.factory_api import FactoryApiClient
    monkeypatch.setattr(FactoryApiClient, 'snapshot', lambda self, device: {'scenarios':catalog})
    result = get_alarm_definition('700001', device_id='D-1', base_url='http://127.0.0.1:9')
    assert result['success'] is False and result['found'] is False
    assert result['evidence_status'] == 'unavailable'


def test_explicit_empty_catalog_is_a_valid_no_match(monkeypatch):
    from app.monitor.factory_api import FactoryApiClient
    monkeypatch.setattr(FactoryApiClient, 'snapshot', lambda self, device: {'scenarios':{'scenarios':[]}})
    result = get_alarm_definition('700001', device_id='D-1', base_url='http://127.0.0.1:9')
    assert result['success'] is True and result['found'] is False
