"""服务异常进入真实持久记录与人工反馈，不重跑故障或伪造业务成功。"""
from copy import deepcopy
from types import SimpleNamespace

import pytest

from test_skill_evolution import IsolatedJsonStore


class CaseTestStore(IsolatedJsonStore):
    """补齐真实断点心跳需要的存储写入；只作用于隔离测试。"""
    def set(self, namespace, key, value):
        with self.lock:
            self.records[(namespace,key)]=deepcopy(value)


def checkpoint(agent='maintenance', *, status='failed', event=True):
    state={'task_id':'TASK-1','trace_id':'TRACE-1','recovery_actor_id':'U-1',
        'next_action':{'target':agent,'required_capability':'repair_planning','side_effect':False},
        'completed_steps':[{'agent':'diagnosis','step':'final'},{'agent':'knowledge','step':'retrieve'}],
        'diagnosis':{'device_id':'M-1','summary':'设备刀塔旋转超时，根因尚待核实'},
        'runtime_result':{'status':status,'stop_reason':'domain_validation_failed'}}
    if event:
        state['event']={'event_id':'E-1','device_id':'M-1','device_name':'数控车床',
            'alarm_code':'700006','severity':'critical','description':'刀塔旋转超时'}
    return {'recovery_id':'REC-1','kind':'runtime','task_id':'TASK-1','trace_id':'TRACE-1',
        'status':status,'state':state,'error':'maintenance-service HTTP 503',
        'created_at':'2026-10-13T03:00:00+00:00','updated_at':'2026-10-13T03:00:01+00:00'}


@pytest.fixture
def cases():
    from app.runtime.service_exceptions import ServiceExceptionCases
    return ServiceExceptionCases(IsolatedJsonStore())


def test_missing_plan_gets_stable_fault_link_and_manual_report_without_fake_workorder(cases):
    source=checkpoint()
    original=deepcopy(source)
    first=cases.record(source)
    second=cases.record(source)
    assert first['case_id']==second['case_id']
    assert len(cases.list())==1
    assert first['device_id']=='M-1' and first['alarm_code']=='700006'
    assert first['fault_summary']=='刀塔旋转超时'
    assert first['failed_agent']=='maintenance'
    assert first['service_error']=='maintenance-service HTTP 503'
    assert first['status']=='awaiting_manual' and first['control_allowed'] is False
    assert not first['workorder_id']
    assert source==original and source['status']=='failed'
    actor={'user_id':'U-1','role':'technician'}
    handled=cases.handle(first['case_id'],'已告知负责人员现场核查，尚未确认维修完成',actor,'REQ-1')
    assert handled['status']=='handled'
    report=cases.report(first['case_id'])
    assert report['persisted'] is True and report['report_type']=='incident_report'
    assert report['scope']=='service_exception_record'
    assert '现场核查' in report['summary']
    assert '设备恢复' in report['summary']
    assert source['status']=='failed'


@pytest.mark.parametrize('agent',['diagnosis','knowledge','cad','maintenance','workorder','quality','report','memory','router'])
def test_each_agent_failure_preserves_actual_reason_and_never_invents_results(cases,agent):
    source=checkpoint(agent)
    item=cases.record(source)
    assert item['failed_agent']==agent
    assert item['service_error']==source['error']
    assert item['status']=='awaiting_manual'
    assert item['control_allowed'] is False
    assert 'passed' not in item and 'repair_steps' not in item


def test_independent_question_or_quality_does_not_invent_a_device_fault(cases):
    source=checkpoint('knowledge',event=False)
    source['state'].pop('diagnosis')
    item=cases.record(source)
    assert item['subject_type']=='knowledge'
    assert not item['device_id'] and not item['alarm_code'] and not item['workorder_id']
    assert item['fault_summary']=='未关联设备故障'


@pytest.mark.parametrize('status,reason',[('running',''),('completed',''),('waiting_approval','approval_required'),
    ('blocked','policy_denied'),('waiting_for_personnel','waiting_for_personnel'),('blocked','maintenance_not_required')])
def test_normal_waiting_or_policy_does_not_masquerade_as_service_failure(cases,status,reason):
    source=checkpoint(status=status)
    source['state']['runtime_result']['stop_reason']=reason
    assert cases.record(source) is None
    assert cases.list()==[]


def test_sensitive_context_is_never_copied_into_case_or_report(cases):
    source=checkpoint()
    source['state']['context']={'password':'private-marker','api_key':'api-00000000-1111-2222-3333-444444444444'}
    source['error']='HTTP 503 password=private-marker api-00000000-1111-2222-3333-444444444444'
    item=cases.record(source)
    assert 'private-marker' not in str(item)
    assert 'api-00000000' not in str(item)
    assert 'context' not in item
    assert 'private-marker' not in str(cases.report(item['case_id']))


def test_replayed_feedback_is_idempotent_but_changed_parameters_cannot_share_receipt(cases):
    from app.runtime.service_exceptions import ServiceCaseConflict
    item=cases.record(checkpoint())
    actor={'user_id':'U-1','role':'technician'}
    first=cases.handle(item['case_id'],'已交接现场核查',actor,'REQ-1')
    assert cases.handle(item['case_id'],'已交接现场核查',actor,'REQ-1')==first
    with pytest.raises(ServiceCaseConflict):
        cases.handle(item['case_id'],'另一个处理说明',actor,'REQ-1')
    assert len(cases.get(item['case_id'])['history'])==2


@pytest.mark.parametrize('actor',[{'user_id':'BOSS','role':'supervisor'}, {'user_id':'OTHER','role':'technician'}])
def test_only_authorized_technician_can_record_manual_handling(cases,actor):
    item=cases.record(checkpoint())
    with pytest.raises(PermissionError):
        cases.handle(item['case_id'],'已处理',actor,'REQ-1')
    assert cases.get(item['case_id'])['status']=='awaiting_manual'


def test_unknown_original_write_stays_unknown_after_manual_handoff(cases):
    source=checkpoint('workorder',status='outcome_unknown')
    source['state']['runtime_execution']={'side_effect_status':'unknown'}
    source['state']['next_action']['side_effect']=True
    original=deepcopy(source)
    item=cases.record(source)
    assert item['requires_reconcile'] is True
    cases.handle(item['case_id'],'已移交核对原工单写入结果，没有重复执行',
        {'user_id':'U-1','role':'technician'},'REQ-1')
    assert source==original
    assert cases.get(item['case_id'])['requires_reconcile'] is True


def test_real_checkpoint_boundary_collects_failed_task_without_replaying_it():
    from app.runtime.recovery import RecoveryManager
    manager=RecoveryManager(CaseTestStore())
    source=checkpoint()
    saved=manager.checkpoint(source['state'],'failed',error=source['error'])
    items=manager.cases.list()
    assert len(items)==1
    assert items[0]['task_id']=='TASK-1' and items[0]['failed_agent']=='maintenance'
    assert manager.get(saved['recovery_id'])['status']=='failed'


def test_old_failed_record_can_be_backfilled_without_execution_or_losing_original_state():
    from app.runtime.recovery import RecoveryManager,NAMESPACE
    store=CaseTestStore()
    source=checkpoint()
    store.get_or_create(NAMESPACE,'REC-1',lambda:source)
    manager=RecoveryManager(store)
    manager.collect_exception_cases()
    assert manager.cases.list()[0]['task_id']=='TASK-1'
    assert store.get(NAMESPACE,'REC-1')==source


@pytest.mark.parametrize('policy',['deny','require_approval'])
def test_typed_policy_decisions_with_specific_reason_are_not_service_errors(cases,policy):
    source=checkpoint(status='blocked')
    source['state']['runtime_policy']={'status':policy,'reason':'quality_scope_violation'}
    source['state']['runtime_result']['stop_reason']='quality_scope_violation'
    assert cases.record(source) is None
    assert cases.list()==[]


def test_exception_uses_actual_execution_error_instead_of_only_generic_stop_code(cases):
    source=checkpoint('workorder',status='timeout')
    source['error']='execution_timeout'
    source['state']['runtime_execution']={'execution_status':'TIMEOUT','side_effect_status':'unknown',
        'error':'backend-service connection timeout; password=synthetic-private'}
    item=cases.record(source)
    assert 'backend-service connection timeout' in item['service_error']
    assert 'synthetic-private' not in str(item)
    assert item['requires_reconcile'] is True


def test_policy_waiting_records_do_not_starve_historical_failure_backfill():
    from app.runtime.recovery import RecoveryManager,NAMESPACE
    store=CaseTestStore()
    for index in range(120):
        source=checkpoint(status='blocked')
        source['recovery_id']=f'REC-POLICY-{index}'
        source['state']['runtime_result']['stop_reason']='policy_denied'
        store.get_or_create(NAMESPACE,source['recovery_id'],lambda:source)
    failure=checkpoint()
    store.get_or_create(NAMESPACE,failure['recovery_id'],lambda:failure)
    manager=RecoveryManager(store)
    manager.collect_exception_cases()
    assert len(manager.cases.list())==1
    assert manager.cases.list()[0]['recovery_id']=='REC-1'


def test_interrupted_task_without_live_owner_gets_manual_case_but_not_active_execution():
    from app.runtime.recovery import RecoveryManager,NAMESPACE,OWNERS
    store=CaseTestStore()
    stale=checkpoint(status='running')
    stale['instance_id']='dead-owner'
    live=deepcopy(stale);live['task_id']='TASK-LIVE';live['recovery_id']='REC-LIVE';live['instance_id']='live-owner'
    store.get_or_create(NAMESPACE,stale['recovery_id'],lambda:stale)
    store.get_or_create(NAMESPACE,live['recovery_id'],lambda:live)
    from time import time
    store.set(OWNERS,'live-owner',{'instance_id':'live-owner','expires_at':time()+60,'active_tasks':['REC-LIVE']})
    manager=RecoveryManager(store)
    manager.collect_exception_cases()
    items=manager.cases.list()
    assert len(items)==1 and items[0]['task_id']=='TASK-1'
    assert items[0]['original_status']=='running' and items[0]['requires_reconcile'] is True
    assert store.get(NAMESPACE,stale['recovery_id'])==stale
    assert store.get(NAMESPACE,live['recovery_id'])==live


def test_missing_business_evidence_retains_fault_case_without_bypassing_policy(cases):
    source=checkpoint(status='blocked')
    source['state']['runtime_policy']={'status':'deny','reason':'missing_required_evidence'}
    source['state']['runtime_result']['stop_reason']='missing_required_evidence'
    item=cases.record(source)
    assert item is not None and item['control_allowed'] is False
    assert item['fault_summary']=='刀塔旋转超时'
    assert source['state']['runtime_policy']['status']=='deny'


def test_production_inspection_failure_routes_to_quality_and_retains_part(cases):
    source=checkpoint('quality',event=False)
    source['kind']='production'
    source['state']['production_action']='inspect'
    source['state']['production_arguments']={'part_id':'12345'}
    item=cases.record(source)
    assert item['subject_type']=='quality' and item['part_id']=='12345'


@pytest.mark.parametrize('error',[
    'HTTP503 {"password":"SYNTHETIC-PRIVATE","token":"SYNTHETIC-TOKEN"}',
    'https://operator:SYNTHETIC-PRIVATE@host.invalid/api',
])
def test_quoted_credentials_and_url_userinfo_are_not_saved_or_reported(cases,error):
    source=checkpoint();source['error']=error
    item=cases.record(source)
    assert 'SYNTHETIC-PRIVATE' not in str(item)
    assert 'SYNTHETIC-TOKEN' not in str(cases.report(item['case_id']))


def test_direct_report_failure_keeps_saved_diagnosis_fault_not_a_generic_alarm():
    from app.runtime.service_exceptions import record_service_failure
    from app.runtime.recovery import RecoveryManager
    manager=RecoveryManager(CaseTestStore())
    state={'task_id':'TASK-SAVED-REPORT','trace_id':'TRACE-SAVED-REPORT','recovery_actor_id':'U-1',
        'event':{'event_id':'E-1','device_id':'M-1'},'workorder':{'workorder_id':'WO-1'},
        'diagnosis':{'fault':'刀塔旋转超时','context':{'password':'SYNTHETIC-PRIVATE'}}}
    record_service_failure(manager,'report',state,'报告服务 HTTP503')
    item=manager.cases.list()[0]
    assert item['fault_summary']=='刀塔旋转超时' and item['workorder_id']=='WO-1'
    assert 'SYNTHETIC-PRIVATE' not in str(manager.get(item['recovery_id']))
