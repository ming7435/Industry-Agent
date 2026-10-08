"""Hydraulic recovery must retain the original fault measurements; all IO is fake."""
from copy import deepcopy
from datetime import datetime, timezone

import pytest

from app.monitor.line_control import LineController
from app.workorder.repair_profile import hydraulic_inspection_template
from shared.repair_recovery import repair_checks
from test_line_control import Factory, Ledger


DEVICE = 'TRAK-TC820LTYSI-001'


def hydraulic_order():
    return {
        'workorder_id': 'WO-HYD', 'device_id': DEVICE, 'event_id': 'E-HYD',
        'assignee': 'U1', 'status': 'in_progress', 'alarm_code': '700010',
        'diagnosis_snapshot': {
            'device_id': DEVICE, 'alarm_code': '700010',
            'alarm_definition': {'name': '液压压力未达到'},
            'evidence': ['hydraulic_pressure_psi falling', 'quill_pressure_psi falling'],
        },
        'maintenance_plan_snapshot': {'plan_kind': 'repair', **hydraulic_inspection_template()},
    }


def recovered_sample():
    return {
        'device_id': DEVICE, 'status': 'stopped', 'alarm_code': '',
        'checked_at': datetime.now(timezone.utc).isoformat(),
        # Deliberately unlike a real machine's limits: use current factory configuration.
        'metrics': {'hydraulic_pressure_psi': 45, 'quill_pressure_psi': 15},
        'metric_details': {
            'hydraulic_pressure_psi': {'normal_range': [40, 50]},
            'quill_pressure_psi': {'normal_range': [10, 20]},
        },
    }


def missing_pressure_sample():
    return {**recovered_sample(), 'metrics': {'spindle_speed_rpm': 0},
            'metric_details': {'spindle_speed_rpm': {'normal_range': [0, 100]}}}


def test_confirmation_with_missing_hydraulic_evidence_does_not_complete_or_start(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    factory.states = {DEVICE: 'stopped'}
    factory.snapshot = lambda device_id: missing_pressure_sample()
    ledger.orders = [hydraulic_order()]
    controller = LineController(factory, ledger)
    result = controller.confirm_and_restart('WO-HYD', 'U1', '完成')
    assert result['machine_control']['state'] == 'blocked'
    assert ledger.orders[0]['status'] == 'in_progress'
    assert factory.calls == []


@pytest.mark.parametrize('missing', ['hydraulic_pressure_psi', 'quill_pressure_psi'])
def test_original_fault_metrics_cannot_disappear_together_with_their_configuration(missing):
    sample = recovered_sample()
    sample['metrics'].pop(missing)
    sample['metric_details'].pop(missing)
    checks = repair_checks(DEVICE, sample, 'prestart', order=hydraulic_order())
    assert checks['fault_metrics_complete'] is False
    assert not all(checks.values())


@pytest.mark.parametrize('configuration', [None, {}, {'normal_range': []},
    {'normal_range': [50, 40]}, {'normal_range': ['bad', 50]},
    {'normal_range': [0, float('inf')]}, {'warn_range': [0, 50]}])
def test_hydraulic_recovery_requires_valid_current_factory_acceptance_range(configuration):
    sample = recovered_sample()
    sample['metric_details']['hydraulic_pressure_psi'] = configuration
    checks = repair_checks(DEVICE, sample, 'prestart', order=hydraulic_order())
    assert checks['fault_metrics_complete'] is False


@pytest.mark.parametrize('pressure', [float('nan'), float('inf'), True, '45', 0, 51])
def test_hydraulic_recovery_rejects_invalid_or_out_of_configured_range_pressure(pressure):
    sample = recovered_sample()
    sample['metrics']['hydraulic_pressure_psi'] = pressure
    assert not all(repair_checks(DEVICE, sample, 'prestart', order=hydraulic_order()).values())


def test_hydraulic_recovery_uses_current_configuration_not_manual_or_historical_thresholds():
    order = hydraulic_order()
    order['diagnosis_snapshot']['metric_details'] = {'hydraulic_pressure_psi': {'normal_range': [680, 720]}}
    assert all(repair_checks(DEVICE, recovered_sample(), 'prestart', order=order).values())


def test_feedback_and_old_recovery_snapshots_do_not_invent_new_original_fault_metrics():
    order = hydraulic_order()
    order['repair_feedback'] = {'feedback': '未操作 tailstock_clamp_pressure_psi'}
    order['events'] = [{'snapshot': {'metrics': {'chuck_pressure_psi': 10}}}]
    assert all(repair_checks(DEVICE, recovered_sample(), 'prestart', order=order).values())


@pytest.mark.parametrize('identity', ['plan_diagnosis', 'raw_diagnosis', 'primary_fault'])
def test_nested_order_fault_context_still_requires_hydraulic_evidence(identity):
    order = hydraulic_order()
    diagnosis = order.pop('diagnosis_snapshot')
    order.pop('alarm_code')
    if identity == 'plan_diagnosis':
        order['maintenance_plan_snapshot']['diagnosis'] = diagnosis
    elif identity == 'raw_diagnosis':
        order['diagnosis_snapshot'] = {'device_id': DEVICE, 'raw': diagnosis}
    else:
        diagnosis.pop('alarm_code')
        order['diagnosis_snapshot'] = diagnosis
    assert not all(repair_checks(DEVICE, missing_pressure_sample(), 'prestart', order=order).values())


@pytest.mark.parametrize('location', ['alarm_definition', 'realtime_snapshot'])
def test_original_alarm_related_metrics_and_realtime_snapshot_are_retained(location):
    order = hydraulic_order()
    diagnosis = order['diagnosis_snapshot']
    diagnosis['evidence'] = []
    if location == 'alarm_definition':
        diagnosis['alarm_definition']['related_metrics'] = ['quill_pressure_psi']
    else:
        diagnosis['event'] = {'device_id': DEVICE, 'realtime_snapshot': {
            'device_id': DEVICE, 'metrics': {'quill_pressure_psi': 0}}}
    sample = recovered_sample()
    sample['metrics'].pop('quill_pressure_psi')
    sample['metric_details'].pop('quill_pressure_psi')
    assert repair_checks(DEVICE, sample, 'prestart', order=order)['fault_metrics_complete'] is False


def test_other_devices_nested_snapshot_cannot_expand_original_fault_metrics():
    order = hydraulic_order()
    order['diagnosis_snapshot']['event'] = {'device_id': 'OTHER', 'realtime_snapshot': {
        'device_id': 'OTHER', 'metrics': {'tailstock_clamp_pressure_psi': 0}}}
    assert all(repair_checks(DEVICE, recovered_sample(), 'prestart', order=order).values())


@pytest.mark.parametrize('kind', ['other_model', 'other_fault', 'other_device', 'no_order'])
def test_unrelated_devices_and_faults_keep_existing_recovery_contract(kind):
    order = hydraulic_order()
    device = DEVICE
    if kind == 'other_model':
        device = 'ELITE-CS612-001'
        order['device_id'] = order['diagnosis_snapshot']['device_id'] = device
    elif kind == 'other_fault':
        order['alarm_code'] = order['diagnosis_snapshot']['alarm_code'] = '700006'
        order['diagnosis_snapshot']['alarm_definition']['name'] = '刀塔旋转超时'
        order['diagnosis_snapshot']['cause'] = '液压压力正常，仅为背景指标'
    elif kind == 'other_device':
        device = 'ELITE-CS612-001'
    else:
        order = None
    sample = {**missing_pressure_sample(), 'device_id': device}
    assert all(repair_checks(device, sample, 'prestart', order=order).values())


def test_hydraulic_background_observation_without_alarm_does_not_become_primary_fault():
    order = hydraulic_order()
    order.pop('alarm_code')
    order['diagnosis_snapshot'] = {'device_id': DEVICE,
        'fault': '刀塔旋转超时；未发现液压压力不足，液压指标正常'}
    assert all(repair_checks(DEVICE, missing_pressure_sample(), 'prestart', order=order).values())


def test_other_orders_hydraulic_context_is_checked_before_restarting_whole_line(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    factory.states = {DEVICE: 'stopped', 'M2': 'stopped'}
    original_snapshot = factory.snapshot
    factory.snapshot = lambda device_id: missing_pressure_sample() if device_id == DEVICE else original_snapshot(device_id)
    order = hydraulic_order()
    order.update(status='completed', maintenance_confirmed_by='U1')
    ledger.orders = [order, {'workorder_id': 'WO-OTHER', 'device_id': 'M2', 'event_id': 'E2',
        'assignee': 'U2', 'maintenance_confirmed_by': 'U2', 'status': 'completed'}]
    ledger.line = {'generation': 1, 'state': 'stopped', 'faults': [
        {'event_id': 'E-HYD', 'device_id': DEVICE, 'device_ids': [DEVICE, 'M2'], 'resolved': False}]}
    result = LineController(factory, ledger).try_restart('WO-OTHER', 'U2')
    assert result['state'] == 'blocked'
    assert factory.calls == []


def test_hydraulic_evidence_disappearing_after_start_causes_whole_line_rollback(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    factory.states = {DEVICE: 'stopped'}
    factory.snapshot = lambda device_id: {**(recovered_sample() if factory.states[device_id] == 'stopped'
        else missing_pressure_sample()), 'status': factory.states[device_id]}
    order = deepcopy(hydraulic_order())
    order.update(status='completed', maintenance_confirmed_by='U1')
    ledger.orders = [order]
    ledger.line = {'generation': 1, 'state': 'stopped', 'faults': [
        {'event_id': 'E-HYD', 'device_id': DEVICE, 'device_ids': [DEVICE], 'resolved': False}]}
    result = LineController(factory, ledger).try_restart('WO-HYD', 'U1')
    assert result['state'] == 'failed'
    assert factory.calls == [(DEVICE, 'start'), (DEVICE, 'emergency_stop')]


def test_hydraulic_evidence_disappearing_immediately_before_start_sends_no_start(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    factory.states = {DEVICE: 'stopped'}
    reads = []
    def snapshot(device_id):
        reads.append(device_id)
        return recovered_sample() if len(reads) == 1 else missing_pressure_sample()
    factory.snapshot = snapshot
    order = hydraulic_order()
    order.update(status='completed', maintenance_confirmed_by='U1')
    ledger.orders = [order]
    ledger.line = {'generation': 1, 'state': 'stopped', 'faults': [
        {'event_id': 'E-HYD', 'device_id': DEVICE, 'device_ids': [DEVICE], 'resolved': False}]}
    result = LineController(factory, ledger).try_restart('WO-HYD', 'U1')
    assert result['state'] == 'failed'
    assert not any(action == 'start' for _, action in factory.calls)
