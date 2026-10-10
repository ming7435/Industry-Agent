"""真实 Agent API 调用只读工具边界；不调用设备、模型或正式数据库。"""
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from app.api.server import create_app


DEVICE = 'TRAK-TC820LTYSI-001'


def client_for(body):
    calls = []
    def execute(name, arguments):
        calls.append((name, arguments))
        if isinstance(body, Exception):
            raise body
        return body
    client = TestClient(create_app(SimpleNamespace(container=SimpleNamespace(registry=SimpleNamespace(execute=execute)))))
    return client, calls


def drawing(**changes):
    return {'drawing_id':'D-1', 'drawing_name':'整机图', 'device_id':DEVICE,
        'drawing_url':'/drawings/TC820si.html', 'evidence_scope':'device_reference',
        'engineering_status':'reference_only', **changes}


def test_drawing_read_calls_only_scoped_drawing_tool():
    client, calls = client_for({'drawings':[drawing(version_label='B')], 'synthetic':False})
    response = client.get('/api/cad/drawings', params={'device_id':DEVICE, 'version':'B'})
    assert response.status_code == 200
    assert response.json()['status'] == 'available'
    assert response.json()['drawings'][0]['device_id'] == DEVICE
    assert len(calls) == 1
    assert calls[0][0] == 'query_drawing'
    assert calls[0][1] == {'device_id':DEVICE, 'device_model':'', 'version':'B', 'reference_only':True}


def test_unscoped_query_does_not_call_tool():
    client, calls = client_for({})
    assert client.get('/api/cad/drawings').status_code == 400
    assert calls == []


@pytest.mark.parametrize('record', [drawing(device_id='OTHER'), drawing(device_id=''),
    drawing(drawing_url='https://evil.test/model.html'), drawing(drawing_url='/drawings/../secret.html'),
    drawing(evidence_scope='component_engineering'), drawing(drawing_url='/drawings/QLS80S2.html'),
    drawing(drawing_url='/drawings/qls80s2.html')])
def test_invalid_returned_device_or_reference_is_not_displayed(record):
    client, _ = client_for({'drawings':[record], 'synthetic':False})
    assert client.get('/api/cad/drawings', params={'device_id':DEVICE}).status_code == 502


def test_empty_result_is_not_service_outage():
    client, _ = client_for({'drawings':[], 'synthetic':False})
    response = client.get('/api/cad/drawings', params={'device_id':'ELITE-CS612-ROBOT-001'})
    assert response.status_code == 200
    assert response.json()['status'] == 'not_found'


@pytest.mark.parametrize('body', [{'drawings':[drawing()], 'synthetic':True}, {'error':'unavailable'}, RuntimeError('private config')])
def test_unavailable_or_synthetic_response_not_disguised_as_missing(body):
    client, _ = client_for(body)
    response = client.get('/api/cad/drawings', params={'device_id':DEVICE})
    assert response.status_code == 503
    assert 'private config' not in response.text


def test_existing_read_auth_is_preserved(monkeypatch):
    monkeypatch.setenv('AGENT_API_TOKEN','isolated-test-token')
    client, calls = client_for({'drawings':[]})
    assert client.get('/api/cad/drawings', params={'device_id':DEVICE}).status_code == 401
    assert calls == []
