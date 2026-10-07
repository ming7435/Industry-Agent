"""隔离进程中的真实 Agent/API 合同验证；不调用模型供应商。"""
import json
import os
from urllib.request import Request, urlopen
from fastapi.testclient import TestClient
from app.clients.backend import BackendServiceClient
from app.monitor.factory_api import FactoryApiClient
from app.monitor.line_control import LineController
from app.agents.workorder.agent import WorkOrderAgent
from app.api.server import create_app
from app.runtime.action import ActionModel
from app.runtime.capability import CapabilityRegistry
from app.runtime.dispatcher import RuntimeDispatcher
from app.runtime.execution import ExecutionManager


def public_call(path, body):
    req = Request(os.environ['BACKEND_SERVICE_BASE_URL'] + path, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}, method='POST')
    with urlopen(req, timeout=5) as response:
        return json.load(response), response.headers.get('Set-Cookie', '').split(';')[0]


backend = BackendServiceClient()
factory = FactoryApiClient(os.environ['FACTORY_API_BASE_URL'])
controller = LineController(factory, backend)
tech, _ = public_call('/api/team/register', {'username': 'technician', 'password': 'test-password-123', 'role': 'technician', 'primary_device_id': 'M1'})
supervisor, _ = public_call('/api/team/register', {'username': 'supervisor', 'password': 'test-password-123', 'role': 'supervisor'})
other, _ = public_call('/api/team/register', {'username': 'other-device', 'password': 'test-password-123', 'role': 'technician', 'primary_device_id': 'M2'})
public_call('/api/team/login', {'username': 'other-device', 'password': 'test-password-123'})
_, supervisor_cookie = public_call('/api/team/login', {'username': 'supervisor', 'password': 'test-password-123'})
assert controller.handle_fault('E1', 'M1', '隔离虚拟故障')['state'] == 'stopped'
agent = WorkOrderAgent()
# 固定、已验证诊断输入只用于离线合同测试，仍经过真实派单门禁及 Agent 图。
plan = {'device_id': 'M1', 'plan_id': 'P1', 'repair_steps': ['修复虚拟故障'], 'workorder_ready': True, 'maintenance_required': True, 'diagnosis': {'device_id': 'M1', 'fault': '虚拟故障', 'confidence': 0.95, 'evidence_status': 'validated', 'evidence_validated': True, 'severity': 'fault'}}
plan['risk_level'] = 'high'
capabilities = CapabilityRegistry()
capabilities.register_agent(agent)
dispatcher = RuntimeDispatcher(capabilities, ExecutionManager())
waiting = dispatcher.dispatch(
    ActionModel.agent('workorder', {'required_capability': 'workorder_create'}, side_effect=True, idempotency_key='E1'),
    {'event': {'event_id': 'E1'}, 'maintenance_plan': plan, 'diagnosis': plan['diagnosis'],
     'knowledge': {'documents': [{'id': 'ISOLATED-SOP'}]}, 'cad': {'components': [{'id': 'ISOLATED-PART'}]}},
)
# 高风险创建已进入派工流程，但当前仅有监督和其他设备技师在线，不能误派。
assert not waiting.success, waiting.output
assert waiting.output['status'] == 'waiting_for_personnel', waiting.output
pending_id = waiting.output['workorder_id']
pending = backend.call('get_workorder', {'workorder_id': pending_id})['workorder']
assert pending['status'] == 'open' and not pending.get('assignee'), pending
assert not backend.call('query_team_availability', {'device_id': 'M1'})['available']
_, tech_cookie = public_call('/api/team/login', {'username': 'technician', 'password': 'test-password-123'})
assert backend.call('query_team_availability', {'device_id': 'M1'})['available']
created = agent.run({'action': 'create', 'source': 'monitor', 'event_id': 'E1', 'idempotency_key': 'E1', 'maintenance_plan': plan})
assert created.success, created.model_dump()
assert created.assignee == tech['user']['user_id'], created.model_dump()
order_id = created.workorder_id
assert order_id == pending_id
assert len(backend.call('list_workorders', {})['items']) == 1
api = TestClient(create_app())
assert api.get('/api/workorders').status_code == 401
api.cookies.set('maintenance_session', supervisor_cookie.split('=', 1)[1])
assert api.get('/api/workorders').json()['count'] == 1
assert api.post(f'/api/workorders/{order_id}/action', json={'action': 'mark_repair_completed', 'feedback': '伪造监督维修', 'maintenance_confirmed_by': tech['user']['user_id']}).status_code == 403
reminder, _ = public_call('/api/team/login', {'username': 'supervisor', 'password': 'test-password-123'})
req = Request(os.environ['BACKEND_SERVICE_BASE_URL'] + '/api/team/reminders', data=json.dumps({'workorder_id': order_id, 'text': '请及时维修'}).encode(), headers={'Content-Type': 'application/json', 'Cookie': supervisor_cookie}, method='POST')
with urlopen(req) as response:
    assert json.load(response)['recipient_id'] == tech['user']['user_id']
api.cookies.set('maintenance_session', tech_cookie.split('=', 1)[1])
assert api.get('/api/workorders').json()['count'] == 1
assert api.post(f'/api/workorders/{order_id}/action', json={'action': 'update', 'status': 'in_progress'}).status_code == 200
result = api.post(f'/api/workorders/{order_id}/action', json={'action': 'mark_repair_completed', 'feedback': '已修复虚拟故障', 'maintenance_confirmed_by': 'forged', 'repair_verification': {'passed': True, 'device_recovery': {'device_id': 'wrong', 'status': 'running'}}})
assert result.status_code == 200, result.text
assert result.json()['machine_control']['state'] == 'running', result.text
stored = backend.call('get_workorder', {'workorder_id': order_id})['workorder']
assert stored['maintenance_confirmed_by'] == tech['user']['user_id']
assert stored['repair_verification']['phase'] == 'poststart'
assert stored['accepted_by'] == tech['user']['user_id']
repeat = api.post(f'/api/workorders/{order_id}/action', json={'action': 'mark_repair_completed', 'feedback': '重复确认'})
assert repeat.status_code == 200
assert repeat.json()['machine_control']['state'] == 'running'
print(json.dumps({'workorder_id': order_id, 'state': 'running', 'assignee': stored['assignee']}, ensure_ascii=False))
