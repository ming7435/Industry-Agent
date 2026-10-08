"""Pending engineering can be handed to a person without issuing replacement stock."""
from copy import deepcopy

import pytest

from test_online_device_dispatch import service, registered


def task_values():
    from shared.workorder_dispatch import followup_steps
    diagnosis={'device_id':'M1','alarm_code':'700015','event_id':'E1','confidence':0.886,
        'evidence_status':'ready','evidence':['送料机报警反馈'], 'maintenance_required':True}
    plan={'plan_id':'P1','diagnosis':deepcopy(diagnosis),'repair_steps':['检查送料状态'],
        'safety_requirements':['安全停机'],'required_parts':['TRAK'],'workorder_ready':False,
        'validation_findings':['CAD/BOM 工程证据校验未通过：未解析到工程部件']}
    return dict(device_id='M1',alarm_code='700015',event_id='E1',plan_id='P1',
        steps=followup_steps(),required_parts=['TRAK'],diagnosis_snapshot=diagnosis,
        maintenance_plan_snapshot=plan,dispatch_mode='fault_followup',
        dispatch_findings=plan['validation_findings'],idempotency_key='event:followup')


def test_followup_is_assigned_without_reserving_unknown_brand_as_part(service):
    owner,_=registered(service)
    values=task_values()
    before=deepcopy(values['maintenance_plan_snapshot'])
    order=service.create_workorder(**values)['workorder']
    assigned=service.assign_workorder(order['workorder_id'],owner['user_id'])['workorder']
    assert assigned['status']=='in_progress'
    assert assigned['dispatch_mode']=='fault_followup'
    assert assigned['maintenance_plan_snapshot']==before
    assert not assigned.get('inventory_reservations')
    assert not service._inventory


@pytest.mark.parametrize('change',[{'steps':['更换液压泵']},{'plan_id':'OTHER'},
    {'device_id':'M2'},{'alarm_code':'700006'},{'event_id':'OTHER'}])
def test_followup_scope_cannot_be_used_for_unverified_repair_or_wrong_identity(service,change):
    values=task_values()
    values.update(change)
    with pytest.raises(ValueError):
        service.create_workorder(**values)
    assert not service.repository.list()


def test_actual_replacement_order_keeps_inventory_gate(service):
    owner,_=registered(service)
    order=service.create_workorder(device_id='M1',required_parts=['TRAK'])['workorder']
    with pytest.raises(ValueError):
        service.assign_workorder(order['workorder_id'],owner['user_id'])
    assert not service.get_workorder(order['workorder_id'])['workorder'].get('assignee')
