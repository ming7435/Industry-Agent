"""机器试验只在完成真实业务阶段后授权发布，预览与旧记录不能冒充闭环。"""
from copy import deepcopy
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.skills.machine_testing import MachineTrials
from app.skills.registry import get_skill_registry
from app.harness.runtime import AgentHarness
from test_expert_center import expert_api, headers, update_body
from test_expert_trials import install_model, trial

TARGET = '/api/expert/skills/diagnosis/alarm_diagnosis_skill'
ACTOR = {'user_id': 'U-WORKER', 'role': 'technician', 'responsible_device_ids': ['D-1']}


class Machines:
    def __init__(self):
        self.states = {'D-1': 'running', 'D-2': 'running'}
        self.active = []
        self.starts = []
        self.clears = 0

    def devices(self):
        return [{'device_id': key, 'name': key, 'status': state} for key, state in self.states.items()]

    def scenarios(self, device_id):
        return {'active_scenarios': [s for s in self.active if s['device_id'] == device_id],
                'scenarios': [{'scenario_id': 'turret', 'name': '刀塔超时', 'alarm_code': '700006', 'default_device_id': device_id}]}

    def start_scenario(self, scenario_id, device_id):
        self.starts.append((scenario_id, device_id))
        self.active = [{'scenario_id': scenario_id, 'device_id': device_id}]
        return {'ok': True}

    def stop_scenarios(self):
        self.clears += 1
        self.active = []
        return {'ok': True}


class Business:
    def __init__(self):
        self.orders = {}
        self.cycles = []
        self.reports = []
        self.faults = []

    def list_open_faults(self):
        return self.faults

    def status(self):
        return {'completed_cycles': self.cycles}

    def call(self, tool, arguments):
        if tool == 'list_workorders':
            return {'items': [order for order in self.orders.values()
                              if order.get('device_id') == arguments.get('device_id')]}
        if tool == 'get_workorder':
            return {'workorder': self.orders.get(arguments['workorder_id'])}
        if tool == 'list_reports':
            return {'items': self.reports}
        if tool == 'get_report':
            return {'report': next((report for report in self.reports if report['report_id'] == arguments['report_id']), None)}
        raise AssertionError(tool)


@pytest.fixture
def machine_trial(expert_api, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    manager = expert_api.client.app.state.expert_skills
    factory, backend = Machines(), Business()
    manager.trials.factory, manager.trials.backend = factory, backend
    draft = update_body(expert_api)
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient', lambda: SimpleNamespace(resolve_session=lambda token: ACTOR if token == 'worker' else None))
    body = {**draft, 'machine': {'device_id': 'D-1', 'scenario_id': 'turret', 'expected': '复机并生成报告'}}
    # update_body uses supervisor auth; use detail through the valid worker session.
    return SimpleNamespace(api=expert_api, trials=manager.trials, factory=factory, backend=backend, body=body)


def start(test):
    response = test.api.client.post(TARGET + '/machine-test', json=test.body, headers=headers('worker'))
    assert response.status_code == 200, response.text
    return response.json()


def diagnose(test, receipt, *, execute_skill=True):
    order = {'workorder_id': 'WO-NEW', 'assignee': ACTOR['user_id'], 'status': 'in_progress', 'event_id': 'E-NEW', 'device_id': 'D-1'}
    test.backend.orders['WO-NEW'] = order
    def producer():
        if execute_skill:
            class Agent:
                name = 'diagnosis'
                def run(self, event):
                    registry = get_skill_registry()
                    skill = registry.get('diagnosis', 'alarm_diagnosis_skill')
                    assert skill.document == test.body['document']
                    return {'active_skills': [skill.name], 'summary': '刀塔故障'}
            AgentHarness(Agent()).execute_agent({})
        return {'diagnosis': {'summary': '刀塔故障', 'diagnosis': '反馈异常', 'recommendation': '检查就位反馈'},
                'maintenance_plan': {'plan_id': 'PLAN-NEW'}, 'workorder': order}
    result = test.trials.handle_event({'event_id': 'E-NEW', 'device_id': 'D-1', 'alarm_code': '700006',
        'timestamp': datetime.now(timezone.utc).isoformat()}, producer)
    assert result['workorder']['workorder_id'] == 'WO-NEW'
    test.factory.states = {'D-1': 'emergency_stop', 'D-2': 'emergency_stop'}
    return test.trials.get(receipt['test_id'], ACTOR)


def complete_business(test):
    test.backend.orders['WO-NEW']['status'] = 'completed'
    test.backend.cycles = [{'cycle_id': 'C-NEW', 'workorder_ids': ['WO-NEW']}]
    test.backend.reports = [{'report_id': 'R-NEW', 'cycle_id': 'C-NEW', 'persisted': True}]
    test.factory.states = {'D-1': 'running', 'D-2': 'running'}


def test_sample_preview_cannot_publish_in_production_mode(expert_api):
    install_model(expert_api)
    body = update_body(expert_api)
    receipt = trial(expert_api, body)
    assert receipt['status'] == 'completed'
    response = expert_api.client.post(TARGET, json={**body, 'test_id': receipt['test_id'], 'human_confirmed': True}, headers=headers())
    assert response.status_code == 409
    assert '全流程' in response.text


def test_machine_flow_waits_for_repair_restart_report_and_skill_execution(machine_trial):
    test = machine_trial
    original = test.api.path.read_bytes()
    receipt = start(test)
    assert receipt['status'] == 'awaiting_fault'
    assert test.factory.starts == [('turret', 'D-1')]
    assert start_conflict(test) == 409
    receipt = diagnose(test, receipt)
    assert receipt['status'] == 'awaiting_repair'
    assert test.api.path.read_bytes() == original
    complete_business(test)
    test.backend.reports = []
    assert test.trials.get(receipt['test_id'], ACTOR)['status'] == 'awaiting_report'
    test.backend.reports = [{'report_id': 'R-OLD', 'cycle_id': 'C-OLD', 'persisted': True}]
    assert test.trials.get(receipt['test_id'], ACTOR)['status'] == 'awaiting_report'
    test.backend.reports = [{'report_id': 'R-NEW', 'cycle_id': 'C-NEW', 'persisted': True}]
    receipt = test.trials.get(receipt['test_id'], ACTOR)
    assert receipt['status'] == 'completed' and receipt['report_id'] == 'R-NEW'
    response = test.api.client.post(TARGET, json={**{k: v for k, v in test.body.items() if k != 'machine'},
        'test_id': receipt['test_id'], 'human_confirmed': True}, headers=headers('worker'))
    assert response.status_code == 200, response.text


def start_conflict(test):
    return test.api.client.post(TARGET + '/machine-test', json=test.body, headers=headers('worker')).status_code


def test_full_process_without_selected_skill_is_not_publishable(machine_trial):
    receipt = start(machine_trial)
    diagnose(machine_trial, receipt, execute_skill=False)
    complete_business(machine_trial)
    value = machine_trial.trials.get(receipt['test_id'], ACTOR)
    assert value['status'] == 'failed' and '未调用' in value['message']


def test_metrics_require_real_four_stage_acceptance_and_deduplicate_reads(machine_trial):
    from test_skill_evolution import IsolatedJsonStore
    test = machine_trial
    manager = test.api.client.app.state.expert_skills
    manager.evolution.store = IsolatedJsonStore()
    receipt = start(test)
    diagnose(test, receipt)
    assert test.trials.get(receipt['test_id'], ACTOR).get('assessment') is None
    complete_business(test)
    completed = test.trials.get(receipt['test_id'], ACTOR)
    assert completed['assessment']['accepted'] is True
    assert all(completed['assessment']['criteria'][stage] for stage in
               ('diagnosis', 'maintenance', 'workorder', 'report'))
    manager.evolution.metrics.collect(datetime.now(timezone.utc))
    manager.evolution.metrics.collect(datetime.now(timezone.utc))
    measured = manager.evolution.metrics.status(None, 'diagnosis', 'alarm_diagnosis_skill', datetime.now(timezone.utc))
    assert measured['gate_pass_rate']['numerator'] == 1
    assert measured['gate_pass_rate']['denominator'] == 1
    assert measured['gate_pass_rate']['value'] == 100


def test_running_trial_reads_stage_and_completed_business_without_waiting_for_callback(machine_trial):
    test = machine_trial
    receipt = start(test)
    diagnose(test, receipt)
    complete_business(test)
    order = test.backend.orders['WO-NEW']
    order.update(plan_id='PLAN-NEW', repair_feedback={'feedback': '反馈线路检查完成'},
                 repair_verification={'phase': 'manual_confirmation'},
                 completed_at='2026-10-12T03:00:00+00:00')
    stage = {'event': {'event_id': 'E-NEW', 'device_id': 'D-1', 'event_revision': 1},
             'diagnosis': {'status': 'completed', 'summary': '刀塔超时', 'diagnosis': '反馈异常',
                           'confidence': .91, 'evidence': ['不应展示的内部证据']},
             'maintenance_plan': {'plan_id': 'PLAN-NEW', 'summary': '检查反馈线路', 'steps': ['检查接线', '复测就位信号']}}
    test.trials.runtime.container.event_results = SimpleNamespace(get_result=lambda _: None, get_stage=lambda _: stage)
    test.trials._save_changes(receipt['test_id'], status='running', workorders=[], result=None,
                             progress=[{'label': label, 'completed': False} for label in
                                       ('智能诊断', '维修方案', '工单派发', '维修确认', '整线复机', '汇总报告')])
    test.backend.reports[0]['article_text'] = '本次故障处理已完成，反馈线路复测正常。'
    value = test.trials.get(receipt['test_id'], ACTOR)
    assert value['status'] == 'completed'
    assert len(value['progress']) == 6 and all(step['completed'] for step in value['progress'])
    assert value['details']['diagnosis']['summary'] == '刀塔超时'
    assert 'evidence' not in value['details']['diagnosis']
    assert value['details']['maintenance_plan']['steps'] == ['检查接线', '复测就位信号']
    assert value['details']['workorders'][0]['feedback'] == '反馈线路检查完成'
    assert value['details']['workorders'][0]['confirmation_method'] == 'manual_confirmation'
    assert value['details']['report']['article'] == '本次故障处理已完成，反馈线路复测正常。'


def test_late_dispatch_is_reconciled_by_exact_event_and_cancelled_trial_stays_cancelled(machine_trial):
    test = machine_trial
    receipt = start(test)
    diagnose(test, receipt)
    test.trials._save_changes(receipt['test_id'], status='failed', workorders=[], message='工单尚未返回')
    unrelated = {**test.backend.orders['WO-NEW'], 'workorder_id': 'WO-OTHER', 'event_id': 'E-OLD', 'status': 'completed'}
    test.backend.orders['WO-OTHER'] = unrelated
    value = test.trials.get(receipt['test_id'], ACTOR)
    assert value['status'] == 'awaiting_repair'
    assert [order['workorder_id'] for order in value['workorders']] == ['WO-NEW']
    assert value['progress'][3]['completed'] is False
    complete_business(test)
    test.trials._save_changes(receipt['test_id'], status='failed', cancelled_at='2026-10-12T03:01:00+00:00',
                             message='已按用户要求停止测试')
    value = test.trials.get(receipt['test_id'], ACTOR)
    assert value['status'] == 'failed' and value['cancelled_at']
    assert all(step['completed'] for step in value['progress'])
    assert value['details']['workorders'][0]['status'] == 'completed'


def test_partial_stage_is_visible_but_another_event_cannot_complete_this_trial(machine_trial):
    test = machine_trial
    receipt = start(test)
    test.trials._save_changes(receipt['test_id'], status='running', event_id='E-NEW')
    stage = {'event': {'event_id': 'E-NEW', 'device_id': 'D-1'},
             'diagnosis': {'status': 'completed', 'summary': '诊断已经完成'}}
    test.trials.runtime.container.event_results = SimpleNamespace(get_result=lambda _: None, get_stage=lambda _: stage)
    test.backend.orders['WO-OTHER'] = {'workorder_id': 'WO-OTHER', 'event_id': 'E-OLD', 'device_id': 'D-1', 'status': 'completed'}
    value = test.trials.get(receipt['test_id'], ACTOR)
    assert value['progress'][0]['completed'] is True
    assert all(not step['completed'] for step in value['progress'][1:])
    assert value['details']['diagnosis']['summary'] == '诊断已经完成'
    assert value['workorders'] == []
    assert value['details']['pending_reasons']


def test_late_callback_does_not_revive_a_cancelled_trial(machine_trial):
    test = machine_trial
    receipt = start(test)
    def produce():
        test.trials._save_changes(receipt['test_id'], status='failed', cancelled_at='2026-10-12T03:00:00+00:00',
                                 message='已按用户要求停止测试')
        return {'diagnosis': {'summary': '诊断已返回'}, 'maintenance_plan': {'plan_id': 'PLAN-NEW'},
                'workorder': {'workorder_id': 'WO-NEW', 'device_id': 'D-1', 'event_id': 'E-NEW'}}
    test.trials.handle_event({'event_id': 'E-NEW', 'device_id': 'D-1', 'alarm_code': '700006',
                             'timestamp': datetime.now(timezone.utc).isoformat()}, produce)
    value = test.trials.get(receipt['test_id'], ACTOR)
    assert value['status'] == 'failed'
    assert value['message'] == '已按用户要求停止测试'


def test_stale_or_other_machine_event_does_not_claim_draft(machine_trial):
    test = machine_trial
    receipt = start(test)
    for did, timestamp in [('D-1', '2000-01-01T00:00:00Z'), ('D-2', datetime.now(timezone.utc).isoformat())]:
        test.trials.handle_event({'event_id': 'E-OLD', 'device_id': did, 'alarm_code': '700006', 'timestamp': timestamp}, lambda: {})
    assert test.trials.get(receipt['test_id'], ACTOR)['status'] == 'awaiting_fault'


def test_completion_preserves_unrelated_scenarios_and_rejects_wrong_actor(machine_trial):
    test = machine_trial
    receipt = start(test)
    diagnose(test, receipt)
    with pytest.raises(PermissionError):
        with test.trials.order_scope('WO-NEW', completing=True, actor_id='U-OTHER'):
            pytest.fail('should reject')
    test.factory.active.append({'scenario_id': 'other', 'device_id': 'D-2'})
    with pytest.raises(Exception, match='其它模拟故障'):
        with test.trials.order_scope('WO-NEW', completing=True, actor_id=ACTOR['user_id']):
            pytest.fail('should reject')
    assert test.factory.clears == 0
    test.factory.active.pop()
    with test.trials.order_scope('WO-NEW', completing=True, actor_id=ACTOR['user_id']):
        assert get_skill_registry().get('diagnosis', 'alarm_diagnosis_skill').document == test.body['document']
    assert test.factory.clears == 1


@pytest.mark.parametrize('invalid', ['mode', 'responsibility', 'running', 'fault'])
def test_machine_start_rejects_invalid_preconditions(machine_trial, monkeypatch, invalid):
    test = machine_trial
    if invalid == 'mode': monkeypatch.setenv('FACTORY_CONTROL_MODE', 'real')
    if invalid == 'responsibility': test.body['machine']['device_id'] = 'D-OTHER'
    if invalid == 'running': test.factory.states['D-2'] = 'emergency_stop'
    if invalid == 'fault': test.backend.faults = [{'event_id': 'E-EXISTING'}]
    assert start_conflict(test) == 409
    assert not test.factory.starts


def test_restart_interrupts_trial_and_does_not_resume_equipment_commands(machine_trial):
    receipt = start(machine_trial)
    trials = MachineTrials(machine_trial.trials.manager, machine_trial.trials.runtime, machine_trial.factory, machine_trial.backend)
    value = trials.get(receipt['test_id'], ACTOR)
    assert value['status'] == 'failed' and '重启' in value['message']
    assert len(machine_trial.factory.starts) == 1


def test_draft_reaches_real_runtime_graph_across_execution_threads(tmp_path, monkeypatch):
    from dataclasses import replace
    from formal_lifecycle_adapter import build_lifecycle
    from app.skills.machine_testing import MachineDraftRegistry
    from app.skills.management import AGENTS
    from app.skills.registry import skill_registry_scope
    runtime, event, _, _, _ = build_lifecycle(tmp_path, monkeypatch, device_id='D-DRAFT', event_id='E-DRAFT')
    baseline = get_skill_registry()
    definitions = {agent: baseline.list(agent) for agent in AGENTS}
    original = baseline.get('diagnosis', 'alarm_diagnosis_skill')
    marker = '本次机器测试专用草稿：重点核对刀塔就位反馈。'
    definitions['diagnosis'] = [replace(skill, document=skill.document + '\n\n' + marker)
                                if skill.name == original.name else skill for skill in definitions['diagnosis']]
    frozen = MachineDraftRegistry(baseline.root, definitions)
    with skill_registry_scope(frozen):
        result = runtime.run_abnormal_event(event)
    assert result['workorder']['workorder_id']
    assert ('diagnosis', original.name) in frozen.used
    prompts = str(runtime.test_model.calls)
    assert marker in prompts
    assert marker not in baseline.get('diagnosis', original.name).document


def test_finish_api_uses_assignee_and_normal_operation(machine_trial):
    test = machine_trial
    receipt = start(test)
    diagnose(test, receipt)
    calls = []
    def execute_workorder(action, payload, from_agent, *, actor_id):
        calls.append((action, payload, actor_id))
        with test.trials.order_scope(payload['workorder_id'], completing=True, actor_id=actor_id):
            complete_business(test)
        return {'success': True}
    test.trials.runtime.container.operations = SimpleNamespace(execute_workorder=execute_workorder)
    url = '/api/expert/tests/' + receipt['test_id'] + '/finish'
    assert test.api.client.post(url, json={'workorder_id': 'WO-OLD', 'feedback': '完成'}, headers=headers('worker')).status_code == 409
    assert test.api.client.post(url, json={'workorder_id': 'WO-NEW', 'feedback': ' '}, headers=headers('worker')).status_code == 422
    result = test.api.client.post(url, json={'workorder_id': 'WO-NEW', 'feedback': '模拟检修完成'}, headers=headers('worker'))
    assert result.status_code == 200, result.text
    assert result.json()['status'] == 'completed'
    assert calls == [('mark_repair_completed', {'workorder_id': 'WO-NEW', 'repair_feedback': '模拟检修完成'}, ACTOR['user_id'])]


def test_machine_trial_real_backend_four_device_restart_and_cycle_report(expert_api, tmp_path, monkeypatch):
    from test_manual_restart_integration import DirectFactory
    from test_simple_manual_repair import IsolatedBackend, create_wrong_order
    from app.monitor.line_control import LineController
    from app.runtime.operations import RuntimeOperations
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    draft = update_body(expert_api)
    backend = IsolatedBackend(tmp_path)
    try:
        class Factory(DirectFactory):
            active = []
            def devices(self):
                return [{'device_id': did, 'status': state} for did, state in self.states.items()]
            def scenarios(self, did):
                return {'active_scenarios': [s for s in self.active if s['device_id'] == did],
                    'scenarios': [{'scenario_id': 'turret', 'default_device_id': did, 'alarm_code': '700006', 'name': '刀塔超时'}]}
            def start_scenario(self, scenario_id, did):
                self.active = [{'scenario_id': scenario_id, 'device_id': did}]
                return {'ok': True}
            def stop_scenarios(self):
                self.active = []
                return {'ok': True}
        factory = Factory(backend)
        factory.states.update(M3='running', M4='running')
        controller = LineController(factory, backend)
        manager = expert_api.client.app.state.expert_skills
        trials = manager.trials
        trials.factory, trials.backend = factory, backend
        operations = RuntimeOperations(None, None, factory_client=factory, repair_controller=controller)
        operations.expert_trials = trials
        trials.runtime.container.operations = operations
        monkeypatch.setattr('app.api.team_auth.BackendServiceClient', lambda: backend)
        values = {**draft, 'machine': {'device_id': 'M1', 'scenario_id': 'turret', 'expected': '四台机器复机并保存报告'}}
        response = expert_api.client.post(TARGET + '/machine-test', json=values, headers=headers('owner'))
        assert response.status_code == 200, response.text
        receipt = response.json()
        def produce():
            controller.handle_fault('E1', 'M1', '本次模拟故障')
            order_id = create_wrong_order(backend)
            class Agent:
                name = 'diagnosis'
                def run(self, event):
                    assert get_skill_registry().get('diagnosis', 'alarm_diagnosis_skill').document == draft['document']
                    return {'active_skills': ['alarm_diagnosis_skill']}
            AgentHarness(Agent()).execute_once({})
            order = backend.call('get_workorder', {'workorder_id': order_id})['workorder']
            return {'diagnosis': {'summary': '刀塔超时'}, 'maintenance_plan': order['maintenance_plan_snapshot'], 'workorder': order}
        output = trials.handle_event({'event_id': 'E1', 'device_id': 'M1', 'alarm_code': '700006',
            'timestamp': datetime.now(timezone.utc).isoformat()}, produce)
        order_id = output['workorder']['workorder_id']
        assert all(state == 'stopped' for state in factory.states.values())
        response = expert_api.client.post('/api/expert/tests/' + receipt['test_id'] + '/finish',
            json={'workorder_id': order_id, 'feedback': '模拟检修完成，刀塔反馈恢复'}, headers=headers('owner'))
        assert response.status_code == 200, response.text
        result = response.json()
        assert result['status'] == 'completed', result
        assert result['details']['workorders'][0]['feedback'] == '模拟检修完成，刀塔反馈恢复'
        assert result['details']['workorders'][0]['confirmation_method'] == 'manual_confirmation'
        assert all(state == 'running' for state in factory.states.values())
        assert len([c for c in factory.controls if c[1] == 'start']) == 4
        report = backend.call('get_report', {'report_id': result['report_id']})['report']
        assert report['persisted'] is True and order_id in report['workorder_ids']
        assert report['sections']['diagnosis']['records']
        assert report['sections']['maintenance_plan']['records']
        assert report['sections']['repair_feedback']['records']
        assert backend.call('get_workorder', {'workorder_id': order_id})['workorder']['status'] == 'completed'
    finally:
        backend.shutdown()
