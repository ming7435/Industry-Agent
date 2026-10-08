"""真实控制器使用虚拟边界，不访问任何外部设备。"""
from datetime import datetime, timezone
import pytest
from app.monitor.line_control import LineController


class Factory:
    def __init__(self):
        self.states = {'M1': 'running', 'M2': 'running'}
        self.calls = []
        self.alarms = {}
        self.fail_start = ''
        self.timeout_after_apply = False
        self.old = False
        self.wrong = False

    def devices(self):
        return [{'device_id': d} for d in self.states]

    def snapshot(self, device_id):
        return {'device_id': 'wrong' if self.wrong else device_id, 'status': self.states[device_id], 'alarm_code': self.alarms.get(device_id, ''), 'metrics': {'pressure': 1}, 'checked_at': '2000-01-01T00:00:00Z' if self.old else datetime.now(timezone.utc).isoformat()}

    def control_device(self, device_id, action, reason=''):
        self.calls.append((device_id, action))
        if action == 'start' and device_id == self.fail_start:
            raise TimeoutError('test')
        self.states[device_id] = 'running' if action == 'start' else 'stopped'
        if self.timeout_after_apply:
            raise TimeoutError('applied but response lost')
        return {'ok': True}


class Ledger:
    def __init__(self):
        self.line = {'generation': 0, 'state': 'unknown', 'faults': []}
        self.controls = {}
        self.orders = []
        self.new_fault_on_start = False

    def status(self):
        return dict(self.line)

    def claim_fault_event(self, event_id, device_id, device_ids):
        if not any(f['event_id'] == event_id for f in self.line['faults']):
            self.line['generation'] += 1
            self.line['faults'].append({'event_id': event_id, 'device_id': device_id, 'device_ids': device_ids, 'resolved': False})
            self.line['state'] = 'stopping'
        return self.status()

    def claim_control(self, event_id, device_id, action):
        key = (event_id, device_id, action)
        if key in self.controls:
            return {'claimed': False}
        self.controls[key] = {'state': 'pending'}
        return {'claimed': True}

    def record_device_control(self, event_id, device_id, action, outcome):
        self.controls[event_id, device_id, action] = outcome
        self.line.setdefault('controls', {})[event_id + ':' + device_id + ':' + action] = outcome

    def set_stop_result(self, generation, result):
        if generation == self.line['generation']:
            self.line.update(result)
        return self.status()

    def begin_restart(self, generation):
        claimed = self.line['state'] == 'stopped' and generation == self.line['generation']
        if claimed:
            self.line['state'] = 'starting'
        return {'claimed': claimed}

    def finish_restart(self, generation, result):
        if generation == self.line['generation']:
            self.line.update(result)
        return self.status()

    def call(self, tool, arguments):
        if tool == 'list_workorders':
            return {'items': self.orders}
        if tool == 'get_workorder':
            return {'workorder': next(o for o in self.orders if o['workorder_id'] == arguments['workorder_id'])}
        raise AssertionError(tool)

    def request(self, path, body):
        if path == '/internal/team/repair/poststart':
            return {'success': True}
        assert path == '/internal/team/repair/confirm'
        order = next(o for o in self.orders if o['workorder_id'] == body['workorder_id'])
        assert order['assignee'] == body['actor_id']
        order.update(status='completed', maintenance_confirmed_by=body['actor_id'])
        return {'workorder': order}


@pytest.fixture
def setup(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    return factory, ledger, LineController(factory, ledger)


def test_confirmed_fault_stops_entire_line_once_and_timeout_reconciles(setup):
    factory, ledger, controller = setup
    factory.timeout_after_apply = True
    assert controller.handle_fault('E1', 'M1', 'fault')['state'] == 'stopped'
    controller.handle_fault('E1', 'M1', 'fault')
    assert factory.calls == [('M1', 'emergency_stop'), ('M2', 'emergency_stop')]


def test_mode_must_be_explicit_virtual(setup, monkeypatch):
    factory, ledger, controller = setup
    monkeypatch.delenv('FACTORY_CONTROL_MODE')
    assert controller.handle_fault('E1', 'M1', 'fault')['state'] == 'disabled'
    assert factory.calls == []


def repaired_order(ledger, event='E1', device='M1', order='WO1', user='U1'):
    ledger.orders.append({'event_id': event, 'device_id': device, 'workorder_id': order, 'assignee': user, 'status': 'in_progress'})


def inspected_order(ledger, event='E1', device='M1', order='WO-CHECK', user='U1'):
    ledger.orders.append({'event_id': event, 'device_id': device, 'workorder_id': order,
        'assignee': user, 'status': 'closed', 'maintenance_plan_snapshot': {'plan_kind': 'inspection'},
        'repair_feedback': {'operator': user, 'feedback': '核查完成，报警已解除'},
        'repair_verification': {'source': 'inspection', 'phase': 'inspection', 'passed': True,
            'checks': {key: True for key in ('device_identity', 'ready_to_start', 'alarms_clear',
                'metrics_available', 'interlocks_clear', 'recovery_fresh', 'alarm_state_available', 'snapshot_trusted')}}})


def test_verified_inspection_completion_restores_line_without_faking_repair_confirmation(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    inspected_order(ledger)
    assert controller.try_restart_after_inspection('WO-CHECK', 'U1')['state'] == 'running'
    assert factory.calls.count(('M1', 'start')) == factory.calls.count(('M2', 'start')) == 1
    controller.try_restart_after_inspection('WO-CHECK', 'U1')
    assert factory.calls.count(('M1', 'start')) == 1
    assert not ledger.orders[0].get('maintenance_confirmed_by')
    assert ledger.orders[0]['repair_verification']['source'] == 'inspection'


@pytest.mark.parametrize('issue', ['wrong_actor', 'unverified', 'open', 'other_fault', 'active_alarm'])
def test_inspection_cannot_restart_line_until_all_conditions_pass(setup, issue):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    inspected_order(ledger)
    actor = 'U1'
    if issue == 'wrong_actor': actor = 'other'
    if issue == 'unverified': ledger.orders[0]['repair_verification']['checks']['alarms_clear'] = False
    if issue == 'open': ledger.orders[0]['status'] = 'in_progress'
    if issue == 'other_fault': controller.handle_fault('E2', 'M2', 'fault')
    if issue == 'active_alarm': factory.alarms['M2'] = 'F2'
    assert controller.try_restart_after_inspection('WO-CHECK', actor)['state'] == 'blocked'
    assert not any(action == 'start' for _, action in factory.calls)


def test_inspection_partial_restart_failure_rolls_back_entire_line(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    inspected_order(ledger)
    factory.fail_start = 'M2'
    assert controller.try_restart_after_inspection('WO-CHECK', 'U1')['state'] == 'failed'
    assert all(state == 'stopped' for state in factory.states.values())


@pytest.mark.parametrize('real_fault', [False, True])
def test_collateral_stop_event_needs_persisted_no_fault_control_evidence(setup, real_fault):
    factory, ledger, controller = setup
    other = 'ELITE-CS612-ROBOT-001'
    factory.states = {'M1': 'running', other: 'running'}
    controller.handle_fault('E1', 'M1', 'fault')
    inspected_order(ledger)
    controller.handle_fault('STOP-ZERO-EVENT', other, 'stopped zeros')
    evidence = {'source': 'control_boundary', 'active': real_fault, 'evidence_status': 'unavailable', 'control_reason': 'stopped zeros'}
    sample = {'device_id': other, 'status': 'stopped', 'control_state': 'stopped',
              'control_reason': 'stopped zeros', 'fault_evidence': evidence, 'alarm_code': '',
              'metrics': {'robot_power_on': 0}, 'metric_details': {'robot_power_on': {'normal_range': [1, 1]}},
              'checked_at': datetime.now(timezone.utc).isoformat()}
    ledger.line['controls'] = {'STOP-ZERO-EVENT:' + other + ':emergency_stop': {
        'state': 'verified', 'device_id': other, 'action': 'emergency_stop', 'snapshot': sample}}
    result = controller.try_restart_after_inspection('WO-CHECK', 'U1')
    assert result['state'] == ('blocked' if real_fault else 'running')
    if real_fault: assert not any(action == 'start' for _, action in factory.calls)


def test_assignee_confirmation_starts_all_and_duplicate_does_not_start_again(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    with pytest.raises(PermissionError):
        controller.confirm_and_restart('WO1', 'other', 'fixed')
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'running'
    controller.confirm_and_restart('WO1', 'U1', 'fixed')
    assert factory.calls.count(('M1', 'start')) == 1
    assert factory.calls.count(('M2', 'start')) == 1


@pytest.mark.parametrize('issue', ['old', 'wrong', 'alarms'])
def test_stale_wrong_device_and_active_fault_block_restart(setup, issue):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    if issue == 'alarms':
        factory.alarms['M1'] = 'F1'
    else:
        setattr(factory, issue, True)
    result = controller.confirm_and_restart('WO1', 'U1', 'fixed')
    assert result['machine_control']['state'] == 'blocked'
    assert not any(action == 'start' for _, action in factory.calls)


def test_other_unconfirmed_fault_blocks_line(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    controller.handle_fault('E2', 'M2', 'fault')
    repaired_order(ledger)
    repaired_order(ledger, 'E2', 'M2', 'WO2', 'U2')
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'blocked'
    assert controller.confirm_and_restart('WO2', 'U2', 'fixed')['machine_control']['state'] == 'running'


def test_missing_workorder_is_reported_as_untracked_fault_not_unfinished_task(setup):
    factory, ledger, controller = setup
    controller.handle_fault('OLD-MISSING', 'M1', 'older fault')
    controller.handle_fault('E1', 'M1', 'current fault')
    repaired_order(ledger)
    ledger.line['controls'] = {'OLD-MISSING:M1:emergency_stop': {
        'state': 'verified', 'device_id': 'M1', 'action': 'emergency_stop',
        'snapshot': {**factory.snapshot('M1'), 'alarm_code': 'F-OLD'}}}
    result = controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']
    assert result['state'] == 'blocked'
    assert '没有关联工单' in result['reason']
    assert result['fault_blockers'] == [{'event_id': 'OLD-MISSING', 'device_id': 'M1',
        'alarm_code': 'F-OLD', 'kind': 'missing_workorder', 'workorder_ids': []}]
    assert not any(action == 'start' for _, action in factory.calls)


def test_unfinished_task_response_names_actual_blocking_order(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    controller.handle_fault('E2', 'M2', 'another fault')
    repaired_order(ledger)
    repaired_order(ledger, 'E2', 'M2', 'WO2', 'U2')
    result = controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']
    assert result['workorder_ids'] == ['WO2']
    assert result['fault_blockers'][0]['kind'] == 'unfinished_workorder'
    assert result['fault_blockers'][0]['device_id'] == 'M2'


def old_untracked_fault(factory, ledger, controller):
    controller.handle_fault('OLD-MISSING', 'M1', 'older fault')
    controller.handle_fault('E1', 'M1', 'current fault')
    repaired_order(ledger)
    ledger.line['controls'] = {'OLD-MISSING:M1:emergency_stop': {
        'state': 'verified', 'device_id': 'M1', 'action': 'emergency_stop',
        'snapshot': {**factory.snapshot('M1'), 'alarm_code': 'F-OLD',
                     'metric_details': {'pressure': {'normal_range': [0, 2]}}}}}
    original = factory.snapshot
    factory.snapshot = lambda device: {**original(device), 'metric_details': {'pressure': {'normal_range': [0, 2]}}}


def test_explicit_untracked_fault_review_keeps_audit_then_allows_normal_restart(setup):
    factory, ledger, controller = setup
    old_untracked_fault(factory, ledger, controller)
    result = controller.review_untracked_faults(['OLD-MISSING'], {
        'request_id': 'REQUEST-1', 'operator': 'human-user', 'feedback': '旧故障已处理完，请核验设备后解除'})
    assert result['reviewed_events'] == ['OLD-MISSING']
    assert all(not f['resolved'] for f in ledger.line['faults'])
    assert ledger.orders[0]['status'] == 'in_progress'
    assert not any(action == 'start' for _, action in factory.calls)
    review = ledger.line['controls']['OLD-MISSING:M1:fault_recovery_review']
    assert review['source'] == 'explicit_user_fault_recovery'
    assert review['operator'] == 'human-user' and review['feedback'].startswith('旧故障已处理完')
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'running'


@pytest.mark.parametrize('issue', ['no_authorization', 'wrong_event', 'active_alarm', 'old_sample',
                                  'missing_metric', 'unknown_range', 'existing_order', 'unverified_stop', 'synthetic'])
def test_untracked_recovery_review_cannot_skip_real_faults_or_invent_verification(setup, issue):
    factory, ledger, controller = setup
    old_untracked_fault(factory, ledger, controller)
    authorization = {'request_id': 'REQUEST-1', 'operator': 'human-user', 'feedback': '旧故障已处理完'}
    events = ['OLD-MISSING']
    if issue == 'no_authorization': authorization['feedback'] = ''
    if issue == 'wrong_event': events = ['DOES-NOT-EXIST']
    if issue == 'active_alarm': factory.alarms['M1'] = 'F-OLD'
    if issue == 'old_sample': factory.old = True
    if issue in {'missing_metric', 'unknown_range'}:
        original = factory.snapshot
        factory.snapshot = lambda device: {**original(device),
            'metrics': {'other': 1} if issue == 'missing_metric' else {'pressure': 1},
            'metric_details': {} if issue == 'unknown_range' else {'other': {'normal_range': [0, 2]}}}
    if issue == 'existing_order': repaired_order(ledger, 'OLD-MISSING', 'M1', 'WO-OLD')
    if issue == 'unverified_stop': ledger.line['controls']['OLD-MISSING:M1:emergency_stop']['state'] = 'pending'
    if issue == 'synthetic':
        original = factory.snapshot
        factory.snapshot = lambda device: {**original(device), 'raw': {'synthetic': True}}
    with pytest.raises(ValueError): controller.review_untracked_faults(events, authorization)
    assert not any(key.endswith(':fault_recovery_review') for key in ledger.line['controls'])
    assert all(not f['resolved'] for f in ledger.line['faults'])
    assert not any(action == 'start' for _, action in factory.calls)


def test_review_of_old_fault_does_not_cover_a_new_fault(setup):
    factory, ledger, controller = setup
    old_untracked_fault(factory, ledger, controller)
    controller.review_untracked_faults(['OLD-MISSING'], {'request_id': 'R', 'operator': 'user', 'feedback': '旧故障已处理'})
    controller.handle_fault('NEW-FAULT', 'M2', 'new fault')
    result = controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']
    assert result['state'] == 'blocked' and result['event_id'] == 'NEW-FAULT'
    assert not any(action == 'start' for _, action in factory.calls)


@pytest.mark.parametrize('issue', ['event_identity', 'different_stop', 'corrupt_snapshot', 'missing_authorization'])
def test_corrupt_saved_review_stays_blocked(setup, issue):
    factory, ledger, controller = setup
    old_untracked_fault(factory, ledger, controller)
    controller.review_untracked_faults(['OLD-MISSING'], {'request_id': 'R', 'operator': 'user', 'feedback': '旧故障已处理'})
    proof = ledger.line['controls']['OLD-MISSING:M1:fault_recovery_review']
    if issue == 'event_identity': proof['event_id'] = 'E1'
    if issue == 'different_stop': ledger.line['controls']['OLD-MISSING:M1:emergency_stop']['snapshot']['alarm_code'] = 'OTHER'
    if issue == 'corrupt_snapshot': proof['snapshot']['metrics']['pressure'] = 100
    if issue == 'missing_authorization': proof['request_id'] = ''
    result = controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']
    assert result['state'] == 'blocked' and result['event_id'] == 'OLD-MISSING'
    assert not any(action == 'start' for _, action in factory.calls)


@pytest.mark.parametrize('status', ['completed', 'closed'])
def test_other_completed_fault_with_wrong_template_blocks_line_before_restart(setup, status):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    controller.handle_fault('E2', 'M2', 'fault')
    repaired_order(ledger)
    repaired_order(ledger, 'E2', 'M2', 'WO2', 'U2')
    ledger.orders[1].update(
        status=status, maintenance_confirmed_by='U2',
        diagnosis_snapshot={'device_id': 'M2', 'fault': '刀塔旋转超时'},
        maintenance_plan_snapshot={'repair_target': '安全门与接料器互锁系统'},
    )
    result = controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']
    assert result['state'] == 'blocked'
    assert result['workorder_ids'] == ['WO2']
    assert '不匹配' in result['reason']
    assert ledger.line['state'] == 'stopped'
    assert not any(action == 'start' for _, action in factory.calls)


@pytest.mark.parametrize('deleted', [False, True])
def test_unfinished_fault_order_outside_current_ledger_also_blocks(setup, deleted):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    repaired_order(ledger, 'older-event', 'M2', 'WO-old', 'U2')
    if deleted:
        ledger.orders[1]['deleted_at'] = '2026-10-07T14:00:00Z'
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'blocked'
    assert not any(action == 'start' for _, action in factory.calls)


def test_partial_start_backstops_entire_line(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    factory.fail_start = 'M2'
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'failed'
    assert factory.states == {'M1': 'stopped', 'M2': 'stopped'}


def test_snapshot_unavailable_does_not_prevent_best_effort_stop(setup):
    factory, ledger, controller = setup
    def unavailable(device_id):
        raise TimeoutError('read unavailable')
    factory.snapshot = unavailable
    assert controller.handle_fault('E1', 'M1', 'fault')['state'] == 'stop_failed'
    assert factory.calls == [('M1', 'emergency_stop'), ('M2', 'emergency_stop')]


def test_new_fault_during_start_aborts_and_backstops(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    original = factory.control_device
    def control(device_id, action, reason=''):
        result = original(device_id, action, reason)
        if action == 'start':
            ledger.claim_fault_event('E2', 'M2', ['M1', 'M2'])
        return result
    factory.control_device = control
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'failed'
    assert factory.states == {'M1': 'stopped', 'M2': 'stopped'}


def test_stale_stopped_sample_is_not_confirmed_safe(setup):
    factory, ledger, controller = setup
    factory.old = True
    factory.states = {'M1': 'stopped', 'M2': 'stopped'}
    assert controller.handle_fault('E1', 'M1', 'fault')['state'] == 'stop_failed'


def test_declared_factory_ranges_block_restart_without_alarm_label(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    original = factory.snapshot
    def snapshot(device_id):
        return {**original(device_id), 'metrics': {'pressure': 50}, 'metric_details': {'pressure': {'normal_range': [0, 10], 'warn_range': [11, 20], 'alarm_range': [21, 100]}}}
    factory.snapshot = snapshot
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'blocked'
    assert not any(action == 'start' for _, action in factory.calls)


def test_failed_rollback_is_not_reported_as_confirmed_stopped(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    factory.fail_start = 'M2'
    original = factory.control_device
    def control(device_id, action, reason=''):
        if reason == '复机失败回停' and device_id == 'M1':
            raise TimeoutError('not applied')
        return original(device_id, action, reason)
    factory.control_device = control
    result = controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']
    assert result['state'] == 'rollback_failed'
    assert ledger.status()['rollback']['M1']['state'] == 'uncertain'
    assert factory.states['M1'] == 'running'


def test_database_outage_survives_controller_restart_and_blocks_start(setup):
    factory, ledger, controller = setup
    original = ledger.claim_fault_event
    def unavailable(*args):
        raise TimeoutError('database unavailable')
    ledger.claim_fault_event = unavailable
    assert controller.handle_fault('E1', 'M1', 'fault')['state'] == 'unreconciled'
    repaired_order(ledger)
    # 模拟进程退出后重新建立控制器，不能因内存缓存丢失允许复机。
    restarted = LineController(factory, ledger)
    assert restarted.try_restart('WO1', 'U1')['state'] == 'blocked'
    assert restarted.spool.pending()[0]['event_id'] == 'E1'
    ledger.claim_fault_event = original
    assert restarted.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'running'
    assert restarted.spool.pending() == []


def test_poststart_finalize_failure_does_not_resolve_fault(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    original = ledger.request
    def request(path, body):
        if path.endswith('/poststart'):
            raise TimeoutError('database unavailable')
        return original(path, body)
    ledger.request = request
    assert controller.confirm_and_restart('WO1', 'U1', 'fixed')['machine_control']['state'] == 'failed'
    assert not ledger.status()['faults'][0]['resolved']


@pytest.mark.parametrize('failure', ['initialize', 'add', 'claim'])
def test_local_safety_storage_failure_still_stops_every_device(setup, monkeypatch, failure):
    factory, ledger, controller = setup
    def unavailable(*args):
        raise OSError('disk full')
    if failure == 'initialize':
        monkeypatch.setattr('app.monitor.line_control.SafetyStore', unavailable)
        controller = LineController(factory, ledger)
    else:
        monkeypatch.setattr(controller.spool, 'add' if failure == 'add' else 'claim_command', unavailable)
    result = controller.handle_fault('E1', 'M1', 'fault')
    assert result['state'] == 'unreconciled'
    assert factory.calls == [('M1', 'emergency_stop'), ('M2', 'emergency_stop')]
    assert controller.try_restart('WO1', 'U1')['state'] == 'blocked'
