"""Real Runtime/API/guards and a disposable HTTP Backend; all engineering reads are fixtures."""
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import json
import os
import socket
import sys

from fastapi.testclient import TestClient

from app.agents.diagnosis import DiagnosisAgent
from app.api.server import create_app
from app.clients.backend import BackendServiceClient
from app.config import get_settings
from app.graph.workflow import AgentOrchestrator
from app.runtime.container import AgentContainer
from app.runtime.event_store import EventResultStore, scoped_event_key
from app.tools.registry import ToolRegistry
from app.workorder.repair_profile import hydraulic_inspection_plan_matches
from runtime_slimming_adapter import ExternalBoundary, ScriptedModel, ScriptedRAG, candidate, documents


DEVICE = 'TRAK-TC820LTYSI-001'
BACKEND_URL = os.environ['BACKEND_SERVICE_BASE_URL']
backend_address = urlparse(BACKEND_URL)
assert os.environ['APP_ENV'] == 'testing' and os.environ['BACKEND_STORAGE'] == 'sqlite'
assert backend_address.hostname == '127.0.0.1'
assert backend_address.port not in {4529, 8001, 8010, 8020, 8030, 8040, 8050}
for key in ('BACKEND_SQLITE_PATH', 'EVENT_STORE_PATH', 'WORKORDER_STORE_PATH'):
    assert Path(os.environ[key]).resolve().is_relative_to(Path.cwd().resolve())

# A missed external mock must fail before it can reach a live service.
original_connect = socket.socket.connect
def isolated_connect(connection, address):
    # Windows implements asyncio's local wakeup pipe using a temporary TCP socketpair.
    socketpair = getattr(socket, '_fallback_socketpair', None)
    local_wakeup = socketpair is not None and sys._getframe(1).f_code is socketpair.__code__
    assert local_wakeup or (isinstance(address, tuple)
                            and address[:2] == ('127.0.0.1', backend_address.port)), address
    return original_connect(connection, address)
socket.socket.connect = isolated_connect


def public_call(path, body=None, cookie=''):
    headers = {'Content-Type': 'application/json'}
    if cookie:
        headers['Cookie'] = cookie
    request = Request(BACKEND_URL + path, headers=headers,
                      data=json.dumps(body).encode() if body is not None else None)
    with urlopen(request, timeout=5) as response:
        return json.load(response), response.headers.get('Set-Cookie', '').split(';')[0]


def main():
    for username, devices in [('outside', ['M-OTHER']), ('hydraulic-owner', ['M-OTHER', DEVICE])]:
        account, _ = public_call('/api/team/register', {'username': username,
            'password': 'isolated-password-123', 'role': 'technician', 'responsible_device_ids': devices})
        _, cookie = public_call('/api/team/login', {'username': username, 'password': 'isolated-password-123'})
        if username == 'hydraulic-owner':
            owner, owner_cookie = account['user'], cookie
    assert owner['primary_device_id'] == 'M-OTHER' and DEVICE in owner['responsible_device_ids']

    fault = '液压压力未达到'
    log_response = {'choices': [{'message': {'role': 'assistant', 'content': '', 'tool_calls': [{
        'id': 'READ-HYDRAULIC', 'type': 'function', 'function': {'name': 'get_device_logs',
        'arguments': json.dumps({'device_id': DEVICE})}}]}}]}
    model = ScriptedModel([candidate(0.95, fault), log_response, candidate(0.95, fault)])
    knowledge = documents(DEVICE, fault)
    for document in knowledge:
        document.update(source='isolated-hydraulic-checking-manual', content=
            '液压压力未达到：保持停机，检查液压油位、外部可见泄漏和压力反馈，核对原报警与停机前压力趋势并记录异常。')
    rag = ScriptedRAG([{'documents': knowledge, 'source': 'isolated-test-rag'} for _ in range(8)])
    get_settings.cache_clear()
    tools = ToolRegistry(rag_client=rag, cad_base_url='http://127.0.0.1:9')
    boundary = ExternalBoundary(tools.mcp.call)
    tools.mcp.call = boundary
    boundary.responses[('knowledge', 'get_alarm_definition')] = {
        'success': True, 'found': True, 'alarm_code': '700010', 'name': fault,
        'description': fault, 'severity': 'critical', 'source': 'isolated-test-alarm'}
    boundary.responses[('plc', 'get_device_logs')] = {
        'success': True, 'found': True, 'device_id': DEVICE,
        'logs': [{'message': '液压压力持续未达到，保持停机'}], 'source': 'isolated-test-device'}
    for operation in ('query_part', 'query_drawing', 'query_bom', 'query_relation', 'fetch_engineering_record'):
        boundary.responses[('cad', operation)] = {'components': [], 'drawings': [], 'bom_items': [],
            'source': 'isolated-empty-engineering', 'synthetic': False}
    boundary.responses[('inventory', 'query_inventory')] = {'parts': [], 'source': 'isolated-empty-stock'}
    boundary.responses[('inventory', 'query_part_availability')] = {'available': False}
    runtime = AgentOrchestrator(container=AgentContainer(
        diagnosis_agent=DiagnosisAgent(client=model, tools=tools), tools=tools))
    event = {'event_id': 'EVT-ISOLATED-HYDRAULIC-CONTRACT', 'event_revision': 1,
        'device_id': DEVICE, 'device_model': 'TC820LTYsi', 'alarm_code': '700010', 'severity': 'critical',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'realtime_snapshot': {'device_id': DEVICE, 'status': 'fault', 'alarm_code': '700010',
                              'metrics': {'hydraulic_pressure': 450}}}
    backend = BackendServiceClient()
    with TestClient(create_app(runtime)) as client:
        response = client.post('/api/v1/agent/event', json={'event': event})
        assert response.status_code == 200, response.text
        result = response.json()
        assert result['runtime_result']['status'] == 'completed', result
        assert result['diagnosis']['confidence'] >= 0.9
        assert result['diagnosis']['evidence_status'] == 'ready', result['diagnosis']
        assert result['diagnosis']['stop_reason'] == 'validator_pass'
        assert result['diagnosis']['requires_human_review'] is False
        plan = result['maintenance_plan']
        assert plan['workorder_ready'] is True and not plan['validation_findings'], plan
        assert hydraulic_inspection_plan_matches(plan), plan
        assert plan['required_parts'] == [] and plan['cad_required'] is False
        order = backend.call('list_workorders', {})['items']
        assert len(order) == 1, order
        order = order[0]
        assert order['assignee'] == owner['user_id'] and order['status'] == 'in_progress', order
        assert order['assignee_name'] == owner['username']
        assert order['device_id'] == DEVICE and order['event_id'] == event['event_id']
        assert order['plan_id'] == plan['plan_id'] == order['maintenance_plan_snapshot']['plan_id']
        assert order['alarm_code'] == '700010'
        assert hydraulic_inspection_plan_matches(order['maintenance_plan_snapshot'])
        assert order['diagnosis_snapshot']['device_id'] == DEVICE
        listing = client.get('/api/maintenance/plans').json()
        saved_plan = next(p for p in listing['items'] if p['plan_id'] == plan['plan_id'])
        assert saved_plan['event_id'] == order['event_id'] and saved_plan['device_id'] == DEVICE
        assert str(saved_plan['event_revision']) == '1' and saved_plan['alarm_code'] == '700010'
        assert saved_plan['repair_steps'] == plan['repair_steps']
        assert saved_plan['dispatch']['status'] == 'dispatched', saved_plan['dispatch']
        assert saved_plan['dispatch']['workorder_id'] == order['workorder_id']
        assert saved_plan['dispatch']['assignee'] == owner['user_id']
        result_url = f"/api/v1/agent/event/{event['event_id']}/result?device_id={DEVICE}&event_revision=1"
        readback = client.get(result_url).json()
        assert readback['status'] == 'available'
        assert readback['result']['maintenance_plan']['plan_id'] == order['plan_id']
        assert readback['result']['workorder']['workorder_id'] == order['workorder_id']
        client.cookies.set('maintenance_session', owner_cookie.split('=', 1)[1])
        visible = client.get('/api/workorders').json()
        assert [item['workorder_id'] for item in visible['items']] == [order['workorder_id']]
        before = (len(model.calls), len(boundary.calls))
        replay = client.post('/api/v1/agent/event', json={'event': event}).json()
        assert replay['workorder']['workorder_id'] == order['workorder_id']
        assert (len(model.calls), len(boundary.calls)) == before
        assert len(backend.call('list_workorders', {})['items']) == 1
        fresh = EventResultStore()
        try:
            persisted = fresh.get_result(scoped_event_key(event))
            assert persisted['maintenance_plan']['plan_id'] == plan['plan_id']
            assert persisted['workorder']['workorder_id'] == order['workorder_id']
        finally:
            fresh.close()
        assert not any(operation in {'reserve_inventory', 'start', 'stop', 'start_device', 'stop_device',
                                     'start_line', 'stop_line', 'emergency_stop', 'freecad_mcp'}
                       for _, operation, _ in boundary.calls)
        assert all(operation == 'get_device_logs' for server, operation, _ in boundary.calls if server == 'plc')
        print(json.dumps({'diagnosis_completed': True, 'plan_persisted': True, 'backend_orders': 1,
            'non_primary_assignee': True, 'event_plan_order_linked': True, 'idempotent_replay': True,
            'no_control_or_inventory_writes': True,
            'saved_plan_dispatch': saved_plan.get('dispatch')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
