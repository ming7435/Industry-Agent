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


def test_unfinished_fault_order_outside_current_ledger_also_blocks(setup):
    factory, ledger, controller = setup
    controller.handle_fault('E1', 'M1', 'fault')
    repaired_order(ledger)
    repaired_order(ledger, 'older-event', 'M2', 'WO-old', 'U2')
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
