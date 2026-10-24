"""The public machine trial uses only the disposable sandbox receipt."""

from time import monotonic, sleep
from types import SimpleNamespace

from test_expert_center import expert_api, headers, update_body
from test_expert_machine_trials import Machines


class Sandbox:
    fallback = True  # Machine trials must still fail closed.

    def __init__(self, fail=False):
        self.calls = []
        self.fail = fail

    def supports(self, mode):
        return True

    def run(self, payload):
        self.calls.append(payload)
        if self.fail:
            raise RuntimeError('sandbox unavailable')
        return {'ok': True, 'simulation': True,
                'result': {'summary': '刀塔超时', 'diagnosis': '检查反馈', 'recommendation': '核对现场',
                           'maintenance_plan': {'workorder_ready': True},
                           'workorder': {'workorder_id': 'SIM-WO-1', 'status': 'completed', 'simulation': True},
                           'report': {'status': 'completed', 'simulation': True}},
                'criteria': {'diagnosis': True, 'maintenance': True, 'workorder': True,
                             'report': True, 'skill_used': True}}


def _start(api, sandbox, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    manager = api.client.app.state.expert_skills
    factory = Machines()
    manager.trials.factory = factory
    manager.trials.backend = object()  # Any backend query must fail this test.
    manager.trials._sandbox_executor = sandbox
    body = update_body(api)
    actor = {'user_id': 'U-WORKER', 'role': 'technician', 'responsible_device_ids': ['D-1']}
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient',
                        lambda: SimpleNamespace(resolve_session=lambda token: actor if token == 'worker' else None))
    body['machine'] = {'device_id': 'D-1', 'scenario_id': 'turret', 'expected': '闭环完成',
                       'sop_document': '断电挂牌，核对刀塔就位反馈，确认报警消除后复机。'}
    response = api.client.post('/api/expert/skills/diagnosis/alarm_diagnosis_skill/machine-test',
                               json=body, headers=headers('worker'))
    assert response.status_code == 200, response.text
    receipt = response.json()
    deadline = monotonic() + 10
    while receipt['status'] == 'running' and monotonic() < deadline:
        sleep(.01)
        receipt = api.client.get('/api/expert/tests/' + receipt['test_id'], headers=headers('worker')).json()
    return manager, factory, body, receipt


def test_public_machine_trial_stays_in_sandbox(expert_api, monkeypatch):
    sandbox = Sandbox()
    manager, factory, body, receipt = _start(expert_api, sandbox, monkeypatch)
    assert receipt['status'] == 'completed', receipt
    assert receipt['simulation'] is True
    assert receipt['assessment']['accepted'] is True
    assert receipt['workorders'] == [] and receipt['event_id'] == '' and receipt['report_id'] == ''
    assert factory.starts == [] and factory.clears == 0
    assert sandbox.calls[0]['mode'] == 'machine_flow'
    assert body['machine']['expected'] not in str(sandbox.calls[0])
    assert {'diagnosis', 'maintenance'} <= {
        item['agent'] for item in sandbox.calls[0]['definitions']}
    finish = expert_api.client.post('/api/expert/tests/' + receipt['test_id'] + '/finish',
        json={'workorder_id': 'SIM-WO-1', 'feedback': 'done'}, headers=headers('worker'))
    assert finish.status_code == 409


def test_machine_trial_sandbox_failure_cannot_fallback(expert_api, monkeypatch):
    sandbox = Sandbox(fail=True)
    _, factory, _, receipt = _start(expert_api, sandbox, monkeypatch)
    assert receipt['status'] == 'failed'
    assert receipt.get('assessment') is None
    assert factory.starts == []


def test_machine_trial_requires_sandbox_and_sop(expert_api, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    monkeypatch.setenv('SKILL_SANDBOX_ENABLED', 'false')
    manager = expert_api.client.app.state.expert_skills
    factory = Machines()
    manager.trials.factory, manager.trials.backend = factory, object()
    body = update_body(expert_api)
    actor = {'user_id': 'U-WORKER', 'role': 'technician', 'responsible_device_ids': ['D-1']}
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient',
                        lambda: SimpleNamespace(resolve_session=lambda token: actor if token == 'worker' else None))
    body['machine'] = {'device_id': 'D-1', 'scenario_id': 'turret', 'expected': '闭环完成'}
    endpoint = '/api/expert/skills/diagnosis/alarm_diagnosis_skill/machine-test'
    disabled = expert_api.client.post(endpoint, json=body, headers=headers('worker'))
    assert disabled.status_code == 503
    manager.trials._sandbox_executor = Sandbox()
    missing_sop = expert_api.client.post(endpoint, json=body, headers=headers('worker'))
    assert missing_sop.status_code == 422
    assert factory.starts == []
