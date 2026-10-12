"""Only an actual repair requirement may produce a plan and a workorder."""
import json

import pytest

from app.workorder.inspection import inspection_plan_template
from app.workorder.policy import auto_workorder_decision, maintenance_decision
from runtime_slimming_adapter import build_fault_scenario


@pytest.mark.parametrize('disposition', ['no_action', 'monitor_only', 'operator_check'])
def test_nonrepair_diagnosis_finishes_without_planning_or_dispatch(tmp_path, monkeypatch, disposition):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch, device_id='D-NO-REPAIR', event_id='E-NO-REPAIR')
    event['severity'] = 'warning'
    for response in runtime.test_model.responses:
        message = response['choices'][0]['message']
        if message.get('content'):
            diagnosis = json.loads(message['content'])
            diagnosis.update(maintenance_required=False, disposition=disposition)
            message['content'] = json.dumps(diagnosis, ensure_ascii=False)
    result = runtime.run_abnormal_event(event)
    assert result['diagnosis']['status'] == 'completed'
    assert result['runtime_result']['status'] == 'completed', result['runtime_result']
    assert result['runtime_result']['stop_reason'] == 'no_repair_required'
    assert not result.get('maintenance_plan') and not result.get('workorder')
    assert runtime.container.workorder_service.list() == []
    assert runtime.test_reservations == []
    repair_operations = {'create_workorder', 'submit_workorder_draft', 'generate_repair_plan',
                         'query_inventory', 'query_technicians', 'reserve_inventory'}
    assert not any(operation in repair_operations for _, operation, _ in runtime.test_boundary.calls)
    assert result['runtime_result']['actions'] == ['diagnosis']


def test_actual_repair_still_creates_plan_and_assigned_workorder(tmp_path, monkeypatch):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch)
    result = runtime.run_abnormal_event(event)
    assert result['runtime_result']['status'] == 'completed', result['runtime_result']
    plan = result['maintenance_plan']
    orders = runtime.container.workorder_service.list()
    assert plan['plan_id'] and plan['maintenance_required'] is True
    assert len(orders) == 1
    assert orders[0]['plan_id'] == plan['plan_id']
    assert orders[0]['event_id'] == event['event_id']
    assert orders[0]['assignee'] == 'TEST-REGISTERED-U1'


def test_stored_inspection_plan_cannot_create_a_new_nonrepair_order():
    diagnosis = {'device_id': 'D-WARNING', 'alarm_code': '700044', 'confidence': .95,
                 'severity': 'warning', 'evidence_status': 'ready', 'evidence': ['报警记录'],
                 'maintenance_required': False, 'disposition': 'operator_check'}
    event = {'device_id': 'D-WARNING', 'alarm_code': '700044', 'severity': 'warning'}
    plan = {**inspection_plan_template(), 'plan_id': 'PLAN-OLD-CHECK', 'workorder_ready': True}
    allowed, reason = auto_workorder_decision(diagnosis, plan, event)
    assert allowed is False
    assert '无需维修' in reason


def test_plan_cannot_override_a_nonrepair_diagnosis():
    diagnosis = {'maintenance_required': False, 'disposition': 'monitor_only'}
    assert maintenance_decision(diagnosis, {'severity': 'critical'}, {'maintenance_required': True})[0] is False


def test_raw_nonrepair_disposition_is_preserved():
    diagnosis = {'raw': {'maintenance_required': False, 'disposition': 'monitor_only'}}
    assert maintenance_decision(diagnosis, {'severity': 'critical'})[0] is False


def test_direct_nonrepair_plan_request_does_not_execute_the_graph(tmp_path, monkeypatch):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch)
    agent = runtime.container.agents['maintenance']
    monkeypatch.setattr(agent.graph, 'invoke', lambda *_: pytest.fail('Nonrepair request executed planning'))
    with pytest.raises(ValueError, match='无需维修'):
        agent.run({'event': event, 'diagnosis': {'device_id': event['device_id'], 'fault': '驱动优化中',
                   'maintenance_required': False, 'disposition': 'monitor_only'}})
