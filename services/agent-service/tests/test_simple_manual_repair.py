"""Real Agent + isolated Backend receipt flow; Factory is an in-memory boundary.

Backend runs in a child process because both services use the package name app.
Only temporary SQLite files are used. No HTTP server or real device is contacted.
"""
from copy import deepcopy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys

from fastapi import HTTPException
from starlette.requests import Request
import pytest

from app.api import team_auth
from app.clients.backend import BackendServiceClient, BackendServiceError
from app.monitor.line_control import LineController
from app.workorder.repair_profile import interlock_inspection_steps
from app.workorder.review import execution_review
from shared.technician_confirmation import trusted_technician_confirmation


BACKEND_PROCESS = r'''
import json, sys
from pathlib import Path
from fastapi.testclient import TestClient
from app import main
from app.team.repository import TeamRepository
from app.team.service import TeamService
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService

directory = Path(sys.argv[1])
team = TeamService(TeamRepository(sqlite_path=str(directory / 'team.db')),
                   devices=lambda: [{'device_id': 'M1'}, {'device_id': 'M2'}])
service = BackendBusinessService(SQLiteRepository(str(directory / 'orders.db')), team_service=team)
actors, sessions = {}, {}
for label, role, device in [('owner', 'technician', 'M1'), ('other', 'technician', 'M2'), ('supervisor', 'technician', 'M1')]:
    actors[label] = team.register(label, 'fixture-password-123', role, device)
    _, sessions[label] = team.login(label, 'fixture-password-123')
# 模拟停用前遗留的监督账号与会话，不通过已移除的监督注册入口。
with team.repository.transaction() as database:
    database.execute("UPDATE team_accounts SET role='supervisor' WHERE user_id=?", (actors['supervisor']['user_id'],))
actors['supervisor']['role'] = 'supervisor'
main._service = service
client = TestClient(main.app)
print(json.dumps({'actors': actors}), flush=True)
for line in sys.stdin:
    try:
        command = json.loads(line)
        if command['op'] == 'request':
            response = client.post(command['path'], json=command['body'])
            result = {'http_status': response.status_code, 'body': response.json()}
        elif command['op'] == 'session':
            result = team.resolve_session(sessions.get(command['label'], 'invalid-fixture-session'))
        elif command['op'] == 'call':
            result = getattr(service, command['tool'])(**command.get('arguments', {}))
        elif command['op'] == 'patch':
            order = service.repository.get(command['workorder_id'])
            for key in command.get('remove', []):
                order.pop(key, None)
            order.update(command.get('values', {}))
            result = service.repository.update(order)
        else:
            raise AssertionError(command['op'])
        print(json.dumps({'result': result}, ensure_ascii=True), flush=True)
    except Exception as error:
        print(json.dumps({'error_type': type(error).__name__, 'error': str(error)}, ensure_ascii=True), flush=True)
'''


class IsolatedBackend(BackendServiceClient):
    """Backend HTTP boundary routed to actual isolated service/router code."""
    def __init__(self, directory):
        root = Path(__file__).resolve().parents[3]
        environment = {**os.environ, 'PYTHONPATH': os.pathsep.join((str(root / 'services/backend-service'), str(root))),
                       'PYTHON_DOTENV_DISABLED': '1', 'APP_ENV': 'testing', 'BACKEND_STORAGE': 'sqlite',
                       'BACKEND_SQLITE_PATH': str(directory / 'unused.db'), 'BACKEND_INTERNAL_TOKEN': ''}
        self.process = subprocess.Popen(
            [sys.executable, '-u', '-c', BACKEND_PROCESS, str(directory)], cwd=root,
            env=environment, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, encoding='utf-8', creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        ready = self.process.stdout.readline()
        assert ready, self.process.stderr.read()
        self.actors = json.loads(ready)['actors']
        self.paths = []
        self.after_confirm = None

    def rpc(self, **command):
        self.process.stdin.write(json.dumps(command, ensure_ascii=True) + '\n')
        self.process.stdin.flush()
        line = self.process.stdout.readline()
        assert line, self.process.stderr.read()
        result = json.loads(line)
        if result.get('error_type'):
            error_type = {'ValueError': ValueError, 'PermissionError': PermissionError, 'KeyError': KeyError}.get(result['error_type'], RuntimeError)
            raise error_type(result['error'])
        return result['result']

    def call(self, tool, arguments=None):
        return self.request('/tools/call', {'tool': tool, 'arguments': arguments or {}})

    def request(self, path, body):
        self.paths.append(path)
        response = self.rpc(op='request', path=path, body=body)
        if response['http_status'] >= 400:
            raise BackendServiceError(str(response['body'].get('detail')), response['http_status'])
        if path == '/internal/team/repair/confirm' and self.after_confirm:
            self.after_confirm(body['workorder_id'])
        return response['body']

    def resolve_session(self, token):
        # Actual tokens stay in the child process; public fixture labels are used here.
        return self.rpc(op='session', label=token)

    def patch(self, workorder_id, **values):
        return self.rpc(op='patch', workorder_id=workorder_id, **values)

    def shutdown(self):
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        finally:
            if self.process.poll() is None:
                self.process.kill()
                self.process.wait(timeout=5)
            self.process.stdout.close()
            self.process.stderr.close()


class FixtureFactory:
    def __init__(self, backend):
        self.backend = backend
        self.states = {'M1': 'running', 'M2': 'running'}
        self.controls = []
        self.samples = []
        self.overrides = {}
        self.before_snapshot = None
        self.before_control = None

    def devices(self):
        return [{'device_id': device} for device in self.states]

    def snapshot(self, device_id):
        self.samples.append(device_id)
        if self.before_snapshot:
            self.before_snapshot(device_id)
        return {'device_id': device_id, 'status': self.states[device_id], 'alarm_code': '',
                'metrics': {'pressure': 1}, 'interlocks_ok': True,
                'checked_at': datetime.now(timezone.utc).isoformat(), **self.overrides.get(device_id, {})}

    def control_device(self, device_id, action, reason=''):
        if self.before_control:
            self.before_control(device_id, action)
        self.controls.append((device_id, action))
        self.states[device_id] = 'running' if action == 'start' else 'stopped'
        return {'ok': True}


def request(label='owner'):
    headers = [] if label is None else [(b'cookie', ('maintenance_session=' + label).encode())]
    return Request({'type': 'http', 'headers': headers})


def create_wrong_order(backend, device='M1', event='E1', label='owner'):
    plan = {'plan_id': 'PLAN-' + event, 'device_id': device, 'plan_kind': 'repair',
            'repair_target': '安全门与接料器互锁系统', 'repair_steps': interlock_inspection_steps(),
            'workorder_ready': True, 'validation_findings': []}
    diagnosis = {'device_id': device, 'event_id': event, 'fault': '刀塔旋转超时',
                 'raw': {'alarm_code': '700006'}}
    result = backend.call('create_workorder', {'device_id': device, 'event_id': event,
        'alarm_code': '700006', 'plan_id': plan['plan_id'], 'steps': plan['repair_steps'],
        'diagnosis_snapshot': diagnosis, 'maintenance_plan_snapshot': plan})
    backend.call('assign_workorder', {'workorder_id': result['workorder_id'],
                                      'assignee': backend.actors[label]['user_id']})
    return result['workorder_id']


@pytest.fixture
def context(tmp_path, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    backend = IsolatedBackend(tmp_path)
    factory = FixtureFactory(backend)
    monkeypatch.setattr(team_auth, 'BackendServiceClient', lambda: backend)
    from app.monitor import factory_api
    monkeypatch.setattr(factory_api, 'FactoryApiClient', lambda *_: factory)
    try:
        order_id = create_wrong_order(backend)
        controller = LineController(factory, backend)
        yield backend, factory, controller, order_id
    finally:
        backend.shutdown()


def order(backend, order_id):
    return backend.call('get_workorder', {'workorder_id': order_id})['workorder']


def complete(order_id, payload=None, label='owner'):
    return team_auth.human_action(order_id, 'mark_repair_completed',
        payload if payload is not None else {'feedback': '已实际处理刀塔故障并复测，报警已解除'}, request(label))


def test_actual_feedback_and_fresh_backend_receipt_complete_old_wrong_plan_then_restart(context):
    backend, factory, controller, order_id = context
    original = order(backend, order_id)
    assert execution_review(original)['required']
    assert not execution_review(original)['human_confirmed']
    assert controller.handle_fault('E1', 'M1', 'fixture turret fault')['state'] == 'stopped'
    proofs_before_start = []
    def inspect_before_control(device, action):
        if action == 'start':
            current = order(backend, order_id)
            proofs_before_start.append(trusted_technician_confirmation(current))
            assert current['repair_verification']['phase'] == 'prestart'
            assert current['repair_verification']['device_recovery']['status'] == 'stopped'
    factory.before_control = inspect_before_control
    result = complete(order_id)
    current = result['workorder']
    assert result['machine_control']['state'] == 'running'
    assert proofs_before_start == [True, True]
    assert factory.controls == [('M1', 'emergency_stop'), ('M2', 'emergency_stop'), ('M1', 'start'), ('M2', 'start')]
    assert current['maintenance_plan_snapshot'] == original['maintenance_plan_snapshot']
    assert current['diagnosis_snapshot'] == original['diagnosis_snapshot']
    assert current['repair_verification']['phase'] == 'poststart'
    assert current['repair_feedback']['feedback'] == '已实际处理刀塔故障并复测，报警已解除'
    assert current['execution_review'] == {'required': True, 'findings': execution_review(original)['findings'], 'human_confirmed': True}
    assert trusted_technician_confirmation(current)
    closed = team_auth.human_action(order_id, 'close', {}, request())['workorder']
    assert closed['status'] == 'closed' and trusted_technician_confirmation(closed)


@pytest.mark.parametrize('label,status', [(None, 401), ('expired', 401), ('other', 403), ('supervisor', 401)])
def test_no_session_non_assignee_or_supervisor_cannot_confirm_or_control(context, label, status):
    backend, factory, _, order_id = context
    with pytest.raises(HTTPException) as failure:
        complete(order_id, {'feedback': '已处理', 'actor_id': backend.actors['owner']['user_id'], 'passed': True}, label)
    assert failure.value.status_code == status
    assert factory.samples == [] and factory.controls == []
    assert order(backend, order_id)['status'] == 'in_progress'
    assert '/internal/team/repair/confirm' not in backend.paths


@pytest.mark.parametrize('bad', [
    {'checked_at': '2000-01-01T00:00:00Z'}, {'device_id': 'M2'}, {'alarm_code': '700006'},
    {'metrics': {}}, {'interlocks_ok': False},
])
def test_feedback_or_client_passed_fields_do_not_replace_fresh_prestart(context, bad):
    backend, factory, controller, order_id = context
    controller.handle_fault('E1', 'M1', 'fixture fault')
    factory.overrides['M1'] = bad
    result = complete(order_id, {'feedback': '已处理', 'passed': True, 'verified': True,
                                  'manual_confirmation': True, 'acknowledged': True})
    assert result['machine_control']['state'] == 'blocked'
    assert not order(backend, order_id).get('technician_confirmation')
    assert not any(action == 'start' for _, action in factory.controls)
    assert '/internal/team/repair/confirm' not in backend.paths


def test_blank_feedback_does_not_confirm_or_restart(context):
    backend, factory, _, order_id = context
    with pytest.raises(ValueError, match='维修反馈'):
        complete(order_id, {'feedback': '  ', 'passed': True})
    assert not order(backend, order_id).get('technician_confirmation')
    assert factory.controls == [] and factory.samples == []


def runtime_complete(backend, factory, controller, order_id, feedback='完成'):
    from app.runtime.operations import RuntimeOperations
    operations = RuntimeOperations(None, None, factory_client=factory, repair_controller=controller)
    return team_auth.human_action(order_id, 'mark_repair_completed',
        {'repair_feedback': {'feedback': feedback}}, request(), operations=operations)


@pytest.mark.parametrize('mode', [None, 'disabled'])
def test_runtime_saves_verified_completion_without_enabling_machine_control(context, monkeypatch, mode):
    backend, factory, controller, order_id = context
    if mode is None:
        monkeypatch.delenv('FACTORY_CONTROL_MODE', raising=False)
    else:
        monkeypatch.setenv('FACTORY_CONTROL_MODE', mode)
    result = runtime_complete(backend, factory, controller, order_id)
    assert result['workorder']['workorder_id'] == order_id
    stored = order(backend, order_id)
    assert stored['status'] == 'completed'
    assert stored['repair_feedback']['feedback'] == '完成'
    assert stored['repair_verification']['phase'] == 'prestart'
    assert trusted_technician_confirmation(stored)
    assert result['machine_control']['state'] == 'blocked'
    assert '未启用' in result['machine_control']['reason']
    assert not controller.enabled()
    assert factory.controls == []
    assert '/internal/team/repair/confirm' in backend.paths
    assert '/internal/team/repair/poststart' not in backend.paths
    with pytest.raises(BackendServiceError):
        team_auth.human_action(order_id, 'close', {}, request())


def test_unavailable_control_spool_does_not_block_completion_when_control_disabled(context, monkeypatch):
    backend, factory, controller, order_id = context
    monkeypatch.delenv('FACTORY_CONTROL_MODE', raising=False)
    controller.spool = None
    result = runtime_complete(backend, factory, controller, order_id)
    assert result['workorder']['status'] == 'completed'
    assert trusted_technician_confirmation(order(backend, order_id))
    assert result['machine_control']['state'] == 'blocked'
    assert factory.controls == []


def test_disabled_control_still_requires_real_recovery_evidence(context, monkeypatch):
    backend, factory, controller, order_id = context
    monkeypatch.delenv('FACTORY_CONTROL_MODE', raising=False)
    factory.overrides['M1'] = {'alarm_code': '700006'}
    result = runtime_complete(backend, factory, controller, order_id)
    assert result['workorder']['workorder_id'] == order_id
    assert result['workorder']['status'] == 'in_progress'
    assert result['machine_control']['checks']['alarms_clear'] is False
    assert '报警' in result['machine_control']['reason']
    assert not order(backend, order_id).get('technician_confirmation')
    assert '/internal/team/repair/confirm' not in backend.paths
    assert factory.controls == []


@pytest.mark.parametrize('has_alarm', [False, True])
def test_actual_action_api_returns_matching_durable_order_with_disabled_control(context, monkeypatch, has_alarm):
    from types import SimpleNamespace
    from fastapi.testclient import TestClient
    from app.api.server import create_app
    from app.runtime.operations import RuntimeOperations
    backend, factory, controller, order_id = context
    monkeypatch.delenv('FACTORY_CONTROL_MODE', raising=False)
    monkeypatch.setattr('app.api.server.BackendServiceClient', lambda: backend)
    if has_alarm:
        factory.overrides['M1'] = {'alarm_code': '700006'}
    operations = RuntimeOperations(None, None, factory_client=factory, repair_controller=controller)
    runtime = SimpleNamespace(container=SimpleNamespace(operations=operations))
    with TestClient(create_app(runtime)) as client:
        client.cookies.set('maintenance_session', 'owner')
        response = client.post('/api/workorders/' + order_id + '/action', json={
            'action': 'mark_repair_completed', 'status': 'completed', 'repair_feedback': {'feedback': '完成'}})
        assert response.status_code == 200, response.text
        result = response.json()
        expected = 'in_progress' if has_alarm else 'completed'
        assert result['workorder']['workorder_id'] == order_id
        assert result['workorder']['status'] == expected
        assert result['machine_control']['state'] == 'blocked'
        items = client.get('/api/workorders').json()['items']
        stored = next(item for item in items if item['workorder_id'] == order_id)
        assert stored['status'] == expected
        assert trusted_technician_confirmation(stored) is (not has_alarm)
        assert factory.controls == []
        client.cookies.set('maintenance_session', 'other')
        assert client.post('/api/workorders/' + order_id + '/action', json={
            'action': 'mark_repair_completed', 'repair_feedback': {'feedback': '完成'}}).status_code == 403


@pytest.mark.parametrize('forgery', ['missing', 'client_boolean', 'wrong_digest', 'wrong_actor'])
def test_missing_or_forged_stored_receipt_blocks_start_and_close(context, forgery):
    backend, factory, controller, order_id = context
    controller.handle_fault('E1', 'M1', 'fixture fault')
    def corrupt_confirmed_fact(workorder_id):
        current = order(backend, workorder_id)
        if forgery in {'missing', 'client_boolean'}:
            backend.patch(workorder_id, remove=['technician_confirmation'], values={
                'passed': True, 'manual_confirmation': True, 'approved': True})
        else:
            receipt = deepcopy(current['technician_confirmation'])
            receipt['plan_snapshot_digest' if forgery == 'wrong_digest' else 'actor_id'] = 'client-forged'
            backend.patch(workorder_id, values={'technician_confirmation': receipt})
    backend.after_confirm = corrupt_confirmed_fact
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert not trusted_technician_confirmation(result['workorder'])
    assert result['workorder']['execution_review']['required']
    assert not result['workorder']['execution_review']['human_confirmed']
    assert not any(action == 'start' for _, action in factory.controls)
    with pytest.raises(HTTPException) as failure:
        team_auth.human_action(order_id, 'close', {}, request())
    assert failure.value.status_code == 409


@pytest.mark.parametrize('status', ['in_progress', 'completed', 'closed'])
def test_other_unconfirmed_fault_or_legacy_wrong_order_blocks_entire_line(context, status):
    backend, factory, controller, order_id = context
    controller.handle_fault('E1', 'M1', 'fixture fault')
    controller.handle_fault('E2', 'M2', 'second fixture fault')
    other_id = create_wrong_order(backend, 'M2', 'E2', 'other')
    if status != 'in_progress':
        backend.patch(other_id, values={'status': status,
            'maintenance_confirmed_by': backend.actors['other']['user_id'], 'passed': True, 'manual_confirmation': True})
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert backend.status()['state'] == 'stopped'
    assert not any(action == 'start' for _, action in factory.controls)
    assert order(backend, order_id)['repair_verification']['phase'] == 'prestart'
    if status != 'in_progress':
        assert result['machine_control']['workorder_ids'] == [other_id]


@pytest.mark.parametrize('line_state', ['running', 'unknown'])
def test_already_running_saves_real_poststart_without_start_control_and_can_close(context, line_state):
    backend, factory, _, order_id = context
    if line_state == 'running':
        backend.finish_restart(0, {'state': 'running', 'devices': {}})
    before = backend.status()
    result = complete(order_id)
    assert result['machine_control'] == {'state': 'running', 'already_running': True}
    assert factory.controls == []
    assert set(factory.samples) == {'M1', 'M2'}
    assert result['workorder']['repair_verification']['phase'] == 'poststart'
    assert trusted_technician_confirmation(result['workorder'])
    assert '/internal/team/repair/poststart' in backend.paths
    assert backend.status() == before
    assert '/internal/line/begin_restart' not in backend.paths
    assert team_auth.human_action(order_id, 'close', {}, request())['workorder']['status'] == 'closed'


@pytest.mark.parametrize('line_state', ['running', 'unknown'])
@pytest.mark.parametrize('bad', [
    {'alarm_code': 'NEW-FAULT'}, {'status': 'stopped'}, {'metrics': {}},
    {'checked_at': '2000-01-01T00:00:00Z'}, {'interlocks_ok': False},
])
def test_already_running_abnormal_other_device_blocks_poststart_and_close(context, bad, line_state):
    backend, factory, _, order_id = context
    if line_state == 'running':
        backend.finish_restart(0, {'state': 'running', 'devices': {}})
    factory.overrides['M2'] = bad
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert result['workorder']['repair_verification']['phase'] == 'prestart'
    assert '/internal/team/repair/poststart' not in backend.paths
    assert factory.controls == []
    with pytest.raises(BackendServiceError):
        team_auth.human_action(order_id, 'close', {}, request())


@pytest.mark.parametrize('line_state', ['running', 'unknown'])
def test_new_fault_during_already_running_readback_blocks_poststart(context, line_state):
    backend, factory, _, order_id = context
    if line_state == 'running':
        backend.finish_restart(0, {'state': 'running', 'devices': {}})
    def new_fault(device):
        if device == 'M2':
            backend.claim_fault_event('E-NEW', 'M2', ['M1', 'M2'])
    factory.before_snapshot = new_fault
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert backend.status()['state'] == 'stopping'
    assert '/internal/team/repair/poststart' not in backend.paths
    assert result['workorder']['repair_verification']['phase'] == 'prestart'
    assert factory.controls == []


@pytest.mark.parametrize('line_state', ['running', 'unknown'])
@pytest.mark.parametrize('deleted', [False, True])
def test_already_running_keeps_older_unfinished_fault_as_restart_blocker(context, line_state, deleted):
    backend, factory, _, order_id = context
    if line_state == 'running':
        backend.finish_restart(0, {'state': 'running', 'devices': {}})
    previous_id = create_wrong_order(backend, event='OLDER-FAULT')
    if deleted:
        backend.patch(previous_id, values={'deleted_at': '2026-09-28T10:00:00+00:00'})
    before = backend.status()
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert result['machine_control']['workorder_ids'] == [previous_id]
    assert order(backend, previous_id)['status'] == 'in_progress'
    assert backend.status() == before
    assert '/internal/team/repair/poststart' not in backend.paths
    assert factory.controls == []


def test_unknown_line_with_unresolved_fault_cannot_use_running_readback(context):
    backend, factory, _, order_id = context
    backend.claim_fault_event('E1', 'M1', ['M1', 'M2'])
    backend.finish_restart(1, {'state': 'unknown', 'devices': {}})
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert '/internal/team/repair/poststart' not in backend.paths
    assert backend.status()['faults'][0]['resolved'] is False
    assert factory.controls == []


def test_unknown_line_readback_requires_current_order_device_in_catalog(context):
    backend, factory, _, order_id = context
    factory.devices = lambda: [{'device_id': 'M2'}]
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert result['machine_control']['reason'] == '当前工单设备不在整线设备目录中'
    assert '/internal/team/repair/poststart' not in backend.paths
    assert factory.controls == []


def retire_old_task(backend, workorder_id, label='owner'):
    old = order(backend, workorder_id)
    cancellation = {key: old.get(key) for key in ('workorder_id', 'device_id', 'event_id', 'assignee')}
    cancellation.update(source='explicit_user_legacy_removal', request_id='ISOLATED-CANCEL-' + workorder_id,
                        operator='isolated-user-request', reason='用户明确撤销历史任务并删除')
    backend.call('update_workorder', {'workorder_id': workorder_id, 'status': 'rejected',
        'administrative_cancellation': cancellation})
    # Legacy hidden rows are fixture data, not the current permanent Delete action.
    backend.patch(workorder_id, values={'deleted_at': '2026-09-28T10:00:00+00:00', 'deleted_by': backend.actors[label]['user_id']})


@pytest.mark.parametrize('controlled_current_fault', [False, True])
def test_explicitly_rejected_and_archived_old_task_no_longer_blocks_unrelated_repair(context, controlled_current_fault):
    backend, factory, controller, order_id = context
    previous_id = create_wrong_order(backend, event='OLD-CANCELLED-TASK')
    before = order(backend, previous_id)
    retire_old_task(backend, previous_id)
    if controlled_current_fault:
        controller.handle_fault('E1', 'M1', 'current actual fault')
    result = complete(order_id)
    assert result['machine_control']['state'] == 'running'
    retired = order(backend, previous_id)
    assert retired['status'] == 'rejected' and retired['deleted_at']
    for key in ('repair_feedback', 'repair_verification', 'maintenance_plan_snapshot', 'diagnosis_snapshot'):
        assert retired[key] == before[key]
    assert not retired.get('maintenance_confirmed_by')
    assert not retired.get('technician_confirmation')
    if not controlled_current_fault:
        assert factory.controls == []


@pytest.mark.parametrize('deleted', [False, True])
def test_rejected_task_without_explicit_cancellation_still_blocks_restart(context, deleted):
    backend, factory, _, order_id = context
    previous_id = create_wrong_order(backend, event='REJECTED-NOT-ARCHIVED')
    backend.call('update_workorder', {'workorder_id': previous_id, 'status': 'rejected'})
    if deleted:
        backend.patch(previous_id, values={'deleted_at': '2026-09-28T10:00:00+00:00'})
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert result['machine_control']['workorder_ids'] == [previous_id]
    assert factory.controls == []


def test_rejected_archived_order_cannot_resolve_an_actual_controlled_fault(context):
    backend, factory, controller, order_id = context
    previous_id = create_wrong_order(backend, 'M2', 'ACTUAL-FAULT', 'other')
    controller.handle_fault('E1', 'M1', 'current actual fault')
    controller.handle_fault('ACTUAL-FAULT', 'M2', 'another actual fault')
    retire_old_task(backend, previous_id, 'other')
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert result['machine_control']['event_id'] == 'ACTUAL-FAULT'
    assert backend.status()['state'] == 'stopped'
    assert not any(action == 'start' for _, action in factory.controls)


def test_permanently_deleting_task_does_not_resolve_its_controlled_fault(context):
    backend, factory, controller, order_id = context
    previous_id = create_wrong_order(backend, 'M2', 'ACTUAL-DELETED-FAULT', 'other')
    controller.handle_fault('E1', 'M1', 'current actual fault')
    controller.handle_fault('ACTUAL-DELETED-FAULT', 'M2', 'another actual fault')
    backend.call('delete_workorder', {'workorder_id':previous_id, 'actor_id':backend.actors['other']['user_id']})
    assert backend.call('get_workorder', {'workorder_id':previous_id})['found'] is False
    result = complete(order_id)
    assert result['machine_control']['state']=='blocked'
    assert result['machine_control']['event_id']=='ACTUAL-DELETED-FAULT'
    assert not any(action=='start' for _, action in factory.controls)


def test_explicit_orphan_fault_review_persists_then_normal_user_completion_restores_line(context):
    backend, factory, controller, order_id = context
    factory.overrides['M1'] = {'metric_details': {'pressure': {'normal_range': [0, 2]}}}
    controller.handle_fault('OLD-NO-ORDER', 'M1', 'isolated old fault')
    controller.handle_fault('E1', 'M1', 'current actual fault')
    before = order(backend, order_id)
    blocked = complete(order_id)
    assert blocked['machine_control']['state'] == 'blocked'
    assert blocked['machine_control']['fault_blockers'][0]['kind'] == 'missing_workorder'
    controller.review_untracked_faults(['OLD-NO-ORDER'], {
        'request_id': 'ISOLATED-EXPLICIT-USER-RECOVERY', 'operator': 'fixture-human-request',
        'feedback': '用户明确确认旧故障已处理完，要求核验设备后解除'})
    line = backend.status()
    assert line['state'] == 'stopped' and not any(f['resolved'] for f in line['faults'])
    proof = line['controls']['OLD-NO-ORDER:M1:fault_recovery_review']
    assert proof['source'] == 'explicit_user_fault_recovery'
    assert proof['checks']['original_fault_metrics'] is True
    assert controller.try_restart(order_id, backend.actors['owner']['user_id'])['state'] == 'running'
    after = order(backend, order_id)
    assert after['repair_verification']['phase'] == 'poststart'
    assert trusted_technician_confirmation(after)
    assert after['maintenance_plan_snapshot'] == before['maintenance_plan_snapshot']
    assert after['diagnosis_snapshot'] == before['diagnosis_snapshot']
    assert all(f['resolved'] for f in backend.status()['faults'])
    assert len(backend.call('list_workorders', {})['items']) == 1


@pytest.mark.parametrize('invalid', ['identity', 'audit_missing', 'reopened'])
def test_retirement_requires_matching_current_cancellation_audit(context, invalid):
    backend, factory, _, order_id = context
    previous_id = create_wrong_order(backend, event='OLD-AUTHORIZATION')
    retire_old_task(backend, previous_id)
    old = order(backend, previous_id)
    if invalid == 'identity':
        cancellation = {**old['administrative_cancellation'], 'device_id': 'OTHER'}
        backend.patch(previous_id, values={'administrative_cancellation': cancellation})
    elif invalid == 'audit_missing':
        backend.patch(previous_id, values={'events': []})
    else:
        backend.call('update_workorder', {'workorder_id': previous_id, 'status': 'open'})
        backend.call('update_workorder', {'workorder_id': previous_id, 'status': 'rejected'})
    result = complete(order_id)
    assert result['machine_control']['state'] == 'blocked'
    assert result['machine_control']['workorder_ids'] == [previous_id]
    assert factory.controls == []
