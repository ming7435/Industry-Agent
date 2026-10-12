"""预警检查工单经过真实 Runtime 派发，且检查反馈不能启动设备。"""
import json
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.maintenance_plans import list_saved_maintenance_plans
from app.api import team_auth
from app.monitor.line_control import LineController
from app.runtime.dispatcher import RuntimeDispatcher
from runtime_slimming_adapter import build_fault_scenario
from test_line_control import Factory, Ledger, repaired_order


def warning_runtime(tmp_path, monkeypatch):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch, device_id='M-WARNING',
                                        event_id='EV-WARNING', fault='主轴未回参考，需现场核查反馈')
    event['severity'] = 'warning'
    event['realtime_snapshot'].update(status='warning', alarm_code=event['alarm_code'])
    runtime.test_boundary.responses[('knowledge', 'get_alarm_definition')]['severity'] = 'warning'
    for response in runtime.test_model.responses:
        message = response['choices'][0]['message']
        if message.get('content'):
            payload = json.loads(message['content'])
            payload['maintenance_required'] = False
            message['content'] = json.dumps(payload, ensure_ascii=False)
    for operation in ('query_part', 'query_drawing', 'query_bom', 'query_relation', 'fetch_engineering_record'):
        runtime.test_boundary.responses[('cad', operation)] = {
            'components': [], 'drawings': [], 'bom_items': [], 'synthetic': False, 'source': 'isolated-empty-engineering'}
    return runtime, event


def test_nonrepair_warning_finishes_without_a_plan_or_order(tmp_path, monkeypatch):
    runtime, event = warning_runtime(tmp_path, monkeypatch)
    result = runtime.run_abnormal_event(event)
    plan = result['maintenance_plan']
    assert plan == {}
    assert result['runtime_result']['status'] == 'completed', result['runtime_result']
    orders = runtime.container.workorder_service.list()
    assert orders == []
    assert runtime.test_reservations == []
    assert not any(operation in {'stop_device', 'start_device', 'stop_line', 'start_line'}
                   for _, operation, _ in runtime.test_boundary.calls)
    assert result['runtime_result']['stop_reason'] == 'no_repair_required'


def test_saved_inspection_retains_type_without_rewriting_repair_necessity():
    source = {'event': {'device_id': 'M-WARNING', 'event_id': 'EV-WARNING'},
              'diagnosis': {'device_id': 'M-WARNING', 'maintenance_required': False},
              'maintenance_plan': {'plan_id': 'PLAN-INSPECT', 'plan_kind': 'inspection',
                  'inspection_required': True, 'inspection_reason': '可靠预警需要现场核查',
                  'maintenance_required': False, 'workorder_ready': False}}
    projected = list_saved_maintenance_plans([source])['items'][0]
    assert projected.get('plan_kind') == 'inspection'
    assert projected['inspection_required'] is True
    assert projected['inspection_reason'] == '可靠预警需要现场核查'
    assert projected['maintenance_required'] is False


def test_maintenance_receives_current_event_disposition_not_only_diagnosis(tmp_path, monkeypatch):
    runtime, event = warning_runtime(tmp_path, monkeypatch)
    event['disposition'] = 'monitor_only'
    state = {'event': event, 'diagnosis': {
        'device_id': event['device_id'], 'alarm_code': event['alarm_code'], 'severity': 'warning',
        'fault': '当前预警', 'cause': '待观察', 'confidence': .95, 'evidence_status': 'ready',
        'evidence': ['当前采样报警记录'], 'maintenance_required': False, 'disposition': 'operator_check'},
        'knowledge': {'documents': [{'document_id': 'SOP-WARNING'}]}}
    task = RuntimeDispatcher._task_for_agent('repair_planning', state, {})
    with pytest.raises(ValueError, match='无需维修'):
        runtime.container.agents['maintenance'].run(task)


def test_nonrepair_warning_does_not_wait_for_an_owner_or_dispatch_on_login(tmp_path, monkeypatch):
    runtime, event = warning_runtime(tmp_path, monkeypatch)
    candidates = runtime.test_boundary.responses[('mes', 'query_technicians')]['items']
    candidates[0]['primary_device_id'] = 'M-OTHER'
    result = runtime.run_abnormal_event(event)
    assert result['runtime_result']['status'] == 'completed', result['runtime_result']
    orders = runtime.container.workorder_service.list()
    assert orders == []
    candidates[0]['primary_device_id'] = 'M-WARNING'
    assert not result['maintenance_plan']
    assert runtime.container.workorder_service.list() == []
    assert runtime.test_reservations == []


def test_human_inspection_cannot_enter_repair_restart_but_can_save_feedback(monkeypatch):
    calls = []
    order = {'workorder_id': 'WO-CHECK', 'assignee': 'U-CHECK', 'device_id': 'M-CHECK',
             'maintenance_plan_snapshot': {'plan_kind': 'inspection'}}
    monkeypatch.setattr(team_auth, 'team_actor', lambda request: {'user_id': 'U-CHECK', 'role': 'technician'})
    monkeypatch.setattr(team_auth, 'require_assignee', lambda *args: order)
    backend = SimpleNamespace(
        call=lambda name, args: calls.append((name, args)) or {'workorder': order},
        request=lambda path, args: calls.append((path, args)) or {'workorder': order})
    monkeypatch.setattr(team_auth, 'BackendServiceClient', lambda: backend)
    operations = SimpleNamespace(execute_workorder=lambda *args, **kwargs: calls.append(('restart', args)))
    with pytest.raises(HTTPException) as error:
        team_auth.human_action('WO-CHECK', 'mark_repair_completed', {'feedback': '已核查'}, None, operations)
    assert error.value.status_code == 409 and calls == []
    sample = {'device_id': 'M-CHECK', 'status': 'warning', 'alarm_code': '700001'}
    monkeypatch.setattr('app.monitor.factory_api.FactoryApiClient',
                        lambda *args: SimpleNamespace(snapshot=lambda device_id: sample))
    team_auth.human_action('WO-CHECK', 'submit_feedback', {'feedback': '已读取报警，待进一步处理'}, None)
    assert [name for name, _ in calls] == ['/internal/team/inspection/record']
    assert calls[0][1]['actor_id'] == 'U-CHECK'
    assert calls[0][1]['snapshot'] == sample


def test_line_controller_rejects_inspection_before_device_or_ledger_writes(monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    repaired_order(ledger)
    ledger.orders[0]['maintenance_plan_snapshot'] = {'plan_kind': 'inspection'}
    controller = LineController(factory, ledger)
    with pytest.raises(ValueError, match='检查'):
        controller.confirm_and_restart('WO1', 'U1', '已核查')
    assert factory.calls == [] and ledger.line['generation'] == 0
    assert ledger.orders[0]['status'] == 'in_progress'


@pytest.mark.parametrize('inspection_status,expected', [('closed', 'running'), ('in_progress', 'blocked')])
def test_later_formal_repair_waits_only_for_unfinished_inspections(monkeypatch, inspection_status, expected):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    controller = LineController(factory, ledger)
    ledger.orders.append({'workorder_id': 'WO-CHECK', 'device_id': 'M1', 'event_id': 'EARLIER-WARNING',
        'status': inspection_status, 'assignee': 'U1', 'maintenance_plan_snapshot': {'plan_kind': 'inspection'},
        'repair_verification': {'source': 'inspection', 'passed': inspection_status == 'closed'}})
    controller.handle_fault('CURRENT-FAULT', 'M1', 'confirmed fault')
    repaired_order(ledger, event='CURRENT-FAULT')
    result = controller.confirm_and_restart('WO1', 'U1', '本次正式维修已完成并确认恢复')
    assert result['machine_control']['state'] == expected
    starts = [call for call in factory.calls if call[1] == 'start']
    assert bool(starts) is (inspection_status == 'closed')
