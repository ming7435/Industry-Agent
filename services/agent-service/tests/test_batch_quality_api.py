"""Inspect, persist and read batch analytics through the actual Agent/Backend boundary."""
from test_business_returns_api import business_runtime
from test_design_quality_integration import design, seed
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from datetime import datetime, timedelta, timezone
import json
import pytest


@pytest.fixture
def factory_server():
    payload = {'devices': [{'device_id': 'M-1', 'name': '实时加工机', 'status': 'fault',
        'alarm_code': 'ALM-123', 'metrics': {'spindle_temperature_c': 82},
        'checked_at': datetime.now(timezone.utc).isoformat()}]}
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            encoded = json.dumps(payload).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(encoded)
        def log_message(self, *_):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield 'http://127.0.0.1:' + str(server.server_port), payload
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)


def save_part(client, part_id, diameter, device_id='M-1', line_id='LINE-1'):
    response = client.post('/api/quality/parts/' + part_id + '/input', json={
        'design_run_id': design()['run_id'], 'part': {'part_name': '圆柱', 'batch_id': 'B-1',
            'device_id': device_id, 'device_name': '加工机', 'line_id': line_id, 'line_name': '生产线',
            'measurements': {'operations.0.diameter': diameter, 'operations.0.length': 50, 'operations.0.axis': 'z'}}})
    assert response.status_code == 200, response.text
    return response.json()['part']


def test_inspection_api_returns_batch_values_machine_line_and_solution(business_runtime):
    client, _, backend = business_runtime
    seed(client)
    save_part(client, 'P-GOOD', 30, 'M-2', 'LINE-2')
    assert client.post('/api/quality/parts/P-GOOD', json={}).status_code == 200
    part = save_part(client, 'P-BAD', 31)
    response = client.post('/api/quality/parts/P-BAD', json={})
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['batch_quality']['rate_percent'] == 50.0
    assert result['batch_quality']['qualified_count'] == 1
    assert result['batch_quality']['unqualified_count'] == 1
    assert result['device_id'] == 'M-1' and result['line_id'] == 'LINE-1'
    machine = result['problem_analysis']['machines'][0]
    assert machine['device_id'] == 'M-1' and machine['line_ids'] == ['LINE-1']
    assert machine['solutions'][0]['target_device_id'] == 'M-1'
    check = backend.get_quality_check(result['quality_check_id'])['quality_check']
    assert check['line_id'] == 'LINE-1' and check['part_recorded_at'] == part['recorded_at']


def test_batch_read_is_authenticated_and_sees_latest_saved_measurements(business_runtime):
    client, _, _ = business_runtime
    seed(client)
    save_part(client, 'P-1', 30)
    client.post('/api/quality/parts/P-1', json={})
    response = client.get('/api/quality/batches/B-1')
    assert response.status_code == 200, response.text
    assert response.json()['batch_quality']['rate_percent'] == 100.0
    save_part(client, 'P-1', 31)
    response = client.get('/api/quality/batches/B-1')
    assert response.json()['batch_quality']['pending_count'] == 1
    assert response.json()['batch_quality']['rate_percent'] is None
    client.cookies.clear()
    assert client.get('/api/quality/batches/B-1').status_code == 401


def test_statistics_failure_does_not_turn_saved_inspection_into_retryable_failure(business_runtime, monkeypatch):
    client, _, backend = business_runtime
    seed(client)
    save_part(client, 'P-1', 30)
    original = backend.qms
    def unavailable(operation, **arguments):
        if operation == 'get_batch_quality':
            raise ValueError('统计暂不可用')
        return original(operation, **arguments)
    monkeypatch.setattr(backend, 'qms', unavailable)
    response = client.post('/api/quality/parts/P-1', json={})
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['passed'] is True and result['quality_check_id']
    assert result['batch_quality']['status'] == 'unavailable'
    assert result['batch_quality']['rate_percent'] is None
    assert backend.get_quality_check(result['quality_check_id'])['quality_check']['result'] == 'passed'


def test_related_machine_status_is_read_but_current_alarm_is_not_a_proven_quality_cause(business_runtime, factory_server):
    client, container, _ = business_runtime
    seed(client)
    save_part(client, 'P-1', 31)
    client.post('/api/quality/parts/P-1', json={})
    container.registry.base_url = factory_server[0]
    response = client.get('/api/quality/batches/B-1')
    assert response.status_code == 200, response.text
    machine = response.json()['problem_analysis']['machines'][0]
    assert machine['device_evidence']['availability'] == 'available'
    assert machine['device_evidence']['status'] == 'fault'
    assert machine['device_evidence']['alarm_code'] == '123'  # Existing PLC parser canonicalizes ALM-123.
    assert machine['device_evidence']['metrics']['spindle_temperature_c'] == 82
    assert machine['root_cause_status'] == 'unconfirmed'


def test_wrong_machine_or_failed_status_read_cannot_replace_quality_evidence(business_runtime, factory_server):
    client, container, _ = business_runtime
    seed(client)
    save_part(client, 'P-1', 31)
    client.post('/api/quality/parts/P-1', json={})
    container.registry.base_url = factory_server[0]
    factory_server[1]['devices'][0]['device_id'] = 'OTHER-MACHINE'
    result = client.get('/api/quality/batches/B-1').json()
    assert result['batch_quality']['unqualified_count'] == 1
    machine = result['problem_analysis']['machines'][0]
    assert machine['device_id'] == 'M-1'
    assert machine['device_evidence']['availability'] == 'unavailable'
    assert 'alarm_code' not in machine['device_evidence']


@pytest.mark.parametrize('location,flag', [('root', 'synthetic'), ('device', 'degraded'), ('device', 'evidence_status')])
def test_untrusted_factory_snapshot_is_not_presented_as_real_machine_evidence(business_runtime, factory_server, location, flag):
    client, container, _ = business_runtime
    seed(client)
    save_part(client, 'P-1', 31)
    client.post('/api/quality/parts/P-1', json={})
    container.registry.base_url = factory_server[0]
    target = factory_server[1] if location == 'root' else factory_server[1]['devices'][0]
    target[flag] = 'untrusted' if flag == 'evidence_status' else True
    result = client.get('/api/quality/batches/B-1').json()
    assert result['batch_quality']['unqualified_count'] == 1
    assert result['problem_analysis']['machines'][0]['device_evidence']['availability'] == 'unavailable'


def test_machine_snapshot_without_source_time_is_not_claimed_as_current_evidence(business_runtime, factory_server):
    client, container, _ = business_runtime
    seed(client)
    save_part(client, 'P-1', 31)
    client.post('/api/quality/parts/P-1', json={})
    container.registry.base_url = factory_server[0]
    del factory_server[1]['devices'][0]['checked_at']
    result = client.get('/api/quality/batches/B-1').json()
    assert result['problem_analysis']['machines'][0]['device_evidence']['availability'] == 'unavailable'


def test_old_machine_snapshot_is_explicitly_stale_not_current_fault_evidence(business_runtime, factory_server):
    client, container, _ = business_runtime
    seed(client)
    save_part(client, 'P-1', 31)
    client.post('/api/quality/parts/P-1', json={})
    container.registry.base_url = factory_server[0]
    factory_server[1]['devices'][0]['checked_at'] = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    result = client.get('/api/quality/batches/B-1').json()
    assert result['problem_analysis']['machines'][0]['device_evidence']['availability'] == 'stale'
    assert result['batch_quality']['unqualified_count'] == 1


def test_monitor_merge_cannot_erase_original_device_untrusted_flag(business_runtime, factory_server):
    client, container, _ = business_runtime
    seed(client)
    save_part(client, 'P-1', 31)
    client.post('/api/quality/parts/P-1', json={})
    container.registry.base_url = factory_server[0]
    factory_server[1]['devices'][0]['synthetic'] = True
    factory_server[1]['monitor'] = {'device_id': 'M-1', 'synthetic': False}
    result = client.get('/api/quality/batches/B-1').json()
    assert result['problem_analysis']['machines'][0]['device_evidence']['availability'] == 'unavailable'
