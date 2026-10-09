import pytest
from test_line_control import Factory, Ledger, repaired_order
from app.monitor.line_control import LineController
from app.runtime.operations import RuntimeOperations


class ManualFactory(Factory):
    def __init__(self):
        super().__init__()
        self.manual_starts = []

    def control_device(self, device_id, action, reason='', *, manual_confirmed=False):
        if action == 'start':
            assert manual_confirmed is True
            self.manual_starts.append(device_id)
        result = super().control_device(device_id, action, reason)
        return {**result, 'action': action, 'device': {'device_id': device_id, 'status': self.states[device_id]}}


class ManualLedger(Ledger):
    def begin_restart(self, generation, **fields):
        assert fields['manual_confirmation'] is True
        assert fields['workorder_id'] == 'WO1'
        result = super().begin_restart(generation)
        return {**result, 'restart_attempt': 1}

    def request(self, path, body):
        if path == '/internal/team/repair/confirm':
            assert body['manual_restart'] is True
            assert not body.get('snapshot')
        return super().request(path, body)

    def finish_restart(self, generation, result):
        line = super().finish_restart(generation, result)
        for fault in self.line['faults']:
            fault['resolved'] = True
        self.line['completed_cycles'] = [{'state': 'running', 'generation': generation,
            'workorder_ids': ['WO1'], 'restart_method': 'manual_confirmation'}]
        return line


@pytest.fixture
def direct(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = ManualFactory(), ManualLedger()
    controller = LineController(factory, ledger)
    controller.handle_fault('OLD-UNLINKED', 'M1', 'old fault')
    repaired_order(ledger, event='CURRENT')
    ledger.orders.append({'workorder_id': 'OLD-WO', 'device_id': 'M2', 'event_id': 'OLD-EVENT',
                          'assignee': 'U2', 'status': 'in_progress'})
    return factory, ledger, controller


def test_confirmation_directly_starts_entire_line_without_snapshots_or_old_task_gates(direct):
    factory, ledger, controller = direct
    factory.alarms['M1'] = '700006'
    snapshot = factory.snapshot
    factory.snapshot = lambda _: (_ for _ in ()).throw(AssertionError('Must not verify device metrics'))
    result = controller.confirm_and_restart('WO1', 'U1', '完成', manual_restart=True)
    assert result['workorder']['status'] == 'completed'
    assert result['machine_control']['state'] == 'running'
    assert factory.manual_starts == ['M1', 'M2']
    controller.confirm_and_restart('WO1', 'U1', '完成', manual_restart=True)
    assert factory.manual_starts == ['M1', 'M2']
    factory.snapshot = snapshot
    controller.handle_fault('NEW-FAULT', 'M1', 'new alarm after restart')
    assert ledger.line['state'] == 'stopped'
    assert factory.states == {'M1': 'stopped', 'M2': 'stopped'}


def test_direct_start_does_not_claim_success_when_a_start_command_fails(direct):
    factory, ledger, controller = direct
    factory.fail_start = 'M2'
    result = controller.confirm_and_restart('WO1', 'U1', '完成', manual_restart=True)
    assert result['workorder']['status'] == 'completed'
    assert result['machine_control']['state'] == 'failed'
    assert factory.states == {'M1': 'stopped', 'M2': 'stopped'}


def test_public_repair_action_requests_manual_restart(monkeypatch):
    class Controller:
        def confirm_and_restart(self, order_id, actor, feedback, **options):
            assert (order_id, actor, feedback) == ('WO1', 'U1', '完成')
            assert options == {'manual_restart': True}
            return {'workorder': {'workorder_id': order_id}}
    operations = RuntimeOperations(None, None, repair_controller=Controller())
    operations.execute_workorder('mark_repair_completed',
        {'workorder_id': 'WO1', 'repair_feedback': {'feedback': '完成'}}, actor_id='U1')
