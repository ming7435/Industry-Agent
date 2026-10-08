"""Saved plans dispatch without regeneration, equipment commands or invented stock."""
from copy import deepcopy
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest


def source():
    diagnosis = {'device_id':'M1', 'alarm_code':'700015', 'event_id':'E1',
        'fault':'送料机报警', 'confidence':0.886, 'evidence_status':'ready',
        'evidence':['送料机就绪信号丢失'], 'maintenance_required':True}
    plan = {'plan_id':'P1', 'diagnosis':deepcopy(diagnosis), 'workorder_ready':False,
        'repair_target':'送料机构', 'repair_steps':['执行安全隔离','检查送料状态'],
        'safety_requirements':['安全停机'], 'required_parts':['TRAK'],
        'validation_findings':['CAD/BOM 工程证据校验未通过：未解析到工程部件',
            '所需备件库存缺失或不可用：TRAK', '备件库存为演示数据，不能作为正式派工依据']}
    return {'event':{'device_id':'M1','alarm_code':'700015','event_id':'E1','timestamp':'2026-10-08T06:22:10+00:00'},
        'diagnosis':diagnosis, 'maintenance_plan':plan, 'status':'blocked'}


class Backend:
    def __init__(self):
        self.orders = []
        self.calls = []
        self.online = True

    def status(self):
        return {'faults':[{'device_id':'M1','event_id':'E1','resolved':False}]}

    def call(self, tool, arguments):
        self.calls.append(tool)
        if tool == 'list_workorders':
            return {'success':True, 'items':deepcopy(self.orders)}
        if tool == 'list_deleted_maintenance_plan_ids':
            return {'deleted_plan_ids':[]}
        if tool == 'query_technicians':
            return {'success':True,'items':[{'technician_id':'U1','registered':True,
                'responsible_device_ids':['M1','M2'], 'online':self.online,'available':self.online}]}
        if tool == 'create_workorder':
            old = next((o for o in self.orders if o['idempotency_key'] == arguments['idempotency_key']),None)
            if old: return {**deepcopy(old),'workorder':deepcopy(old)}
            self.orders.append({'workorder_id':'W1','status':'open', **deepcopy(arguments)})
            return {**deepcopy(self.orders[-1]),'workorder':deepcopy(self.orders[-1])}
        if tool == 'assign_workorder':
            self.orders[-1].update(assignee=arguments['assignee'],status='in_progress')
            return {'workorder':deepcopy(self.orders[-1])}
        raise AssertionError('Unexpected operation '+tool)


def dispatcher(record=None, **changes):
    from app.workorder.saved_dispatch import SavedPlanDispatcher
    record = record or source()
    backend = Backend()
    current = {'device_id':'M1','alarm_code':'700015','found':True,'success':True,
        'checked_at':datetime.now(timezone.utc).isoformat(), **changes}
    store = SimpleNamespace(list_plan_results=lambda:([record], {'status':'ready'}), deleted_plan_ids=lambda:[])
    registry = SimpleNamespace(execute=lambda name,args,**kwargs:deepcopy(current))
    worker = SavedPlanDispatcher(store, backend, registry)
    return worker, backend, record


def test_engineering_pending_plan_creates_linked_assigned_task_once_and_stays_unchanged():
    worker, backend, record = dispatcher()
    before = deepcopy(record)
    worker.sync()
    worker.sync()
    assert len(backend.orders) == 1
    order = backend.orders[0]
    assert (order['device_id'],order['alarm_code'],order['event_id'],order['plan_id'],order['assignee']) == ('M1','700015','E1','P1','U1')
    assert order['maintenance_plan_snapshot'] == before['maintenance_plan']
    assert order['dispatch_mode'] == 'fault_followup'
    assert order['dispatch_findings'] == before['maintenance_plan']['validation_findings']
    assert record == before
    assert not {'reserve_inventory','start_device','stop_device','start_line','stop_line'} & set(backend.calls)


@pytest.mark.parametrize('change', [{'requires_approval':True},{'synthetic':True},
    {'evidence_status':'insufficient'},{'requires_human_review':True},{'confidence':float('nan')},
    {'confidence':0.4},{'evidence':[]},{'event_id':'OTHER'},{'device_id':'OTHER'},
    {'maintenance_required':False},{'disposition':'no_action'}])
def test_diagnosis_gates_remain_effective(change):
    record=source()
    record['diagnosis'].update(change)
    worker,backend,_=dispatcher(record)
    worker.sync()
    assert backend.orders == []


@pytest.mark.parametrize('change', [{'requires_approval':True}, {'repair_steps':[]},
    {'validation_findings':['安全要求不完整']}, {'validation_errors':['设备不一致']}])
def test_only_engineering_pending_findings_can_be_deferred(change):
    record=source()
    record['maintenance_plan'].update(change)
    worker,backend,_=dispatcher(record)
    worker.sync()
    assert backend.orders == []


@pytest.mark.parametrize('changes', [{'alarm_code':None}, {'alarm_code':'700006'},
    {'device_id':'OTHER'}, {'checked_at':'2020-01-01T00:00:00+00:00'}, {'success':False}])
def test_current_alarm_must_match_and_be_fresh(changes):
    worker,backend,_=dispatcher(**changes)
    worker.sync()
    assert backend.orders == []


def test_deleted_plan_or_deleted_order_is_never_recreated():
    worker,backend,_=dispatcher()
    worker.store.deleted_plan_ids=lambda:['P1']
    worker.sync()
    assert backend.orders == []
    worker.store.deleted_plan_ids=lambda:[]
    backend.orders=[{'device_id':'M1','event_id':'E1','plan_id':'P1','deleted_at':'now','workorder_id':'OLD'}]
    worker.sync()
    assert len(backend.orders) == 1


def test_newer_fault_on_same_device_does_not_dispatch_old_plan():
    worker,backend,_=dispatcher()
    backend.status=lambda:{'faults':[{'device_id':'M1','event_id':'E1','resolved':False},
        {'device_id':'M1','event_id':'E2','resolved':False}]}
    worker.sync()
    assert backend.orders == []


def test_owner_login_is_retried_without_regenerating_plan():
    worker,backend,record=dispatcher()
    backend.online=False
    worker.sync()
    assert not backend.orders
    backend.online=True
    worker.sync()
    assert backend.orders[0]['assignee'] == 'U1'
    assert record['maintenance_plan']['plan_id'] == 'P1'


def test_existing_unassigned_order_does_not_bypass_plan_or_diagnosis_gates():
    record=source()
    record['diagnosis']['evidence_status']='insufficient'
    worker,backend,_=dispatcher(record)
    backend.orders=[{'workorder_id':'W1','device_id':'M1','event_id':'E1','plan_id':'P1','status':'open'}]
    worker.sync()
    assert not backend.orders[0].get('assignee')


def test_plan_deleted_during_readback_cannot_dispatch():
    worker,backend,_=dispatcher()
    deleted=[]
    worker.store.deleted_plan_ids=lambda:deleted
    original=worker.registry.execute
    def readback(*args,**kwargs):
        deleted.append('P1')
        return original(*args,**kwargs)
    worker.registry.execute=readback
    worker.sync()
    assert not backend.orders


def test_ready_plan_dispatches_normal_repair_steps_without_changing_plan():
    record=source()
    record['maintenance_plan'].update(workorder_ready=True,validation_findings=[],required_parts=[])
    before=deepcopy(record)
    worker,backend,_=dispatcher(record)
    readback=worker.registry.execute
    worker.registry.execute=lambda name,args,**kwargs: readback(name,args,**kwargs) if name=='get_device_status' else backend.call(name,args)
    worker.sync()
    assert len(backend.orders)==1
    assert backend.orders[0]['steps']==record['maintenance_plan']['repair_steps']
    assert not backend.orders[0].get('dispatch_mode')
    assert backend.orders[0]['assignee']=='U1'
    assert record==before
