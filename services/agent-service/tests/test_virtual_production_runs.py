from copy import deepcopy
from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from app.harness.runs import build_run_records,run_index_record
from app.harness.trace import TraceRecorder
from app.api.server import create_app
from virtual_production_test_support import production_backend,OWNER
from test_virtual_factory_client import isolated_factory
from test_virtual_production_reconciliation import coordinator,prepared

JOB='SIM-JOB-'+'a'*64
def event(job=JOB):
    return {'timestamp':'2026-10-09T08:00:00Z','type':'production','event':'production_action_saved','name':'virtual_prepare',
      'trace_id':job,'task_id':job,'run_type':'production_simulation','context':{'job_id':job,'actor_id':'USER-1','device_id':'M1'}}

@pytest.mark.parametrize('indexed',[False,True])
def test_production_phases_follow_persisted_facts(indexed):
    from app.production_simulation.run_facts import reconcile_production_runs
    record=run_index_record(event()) if indexed else event()
    runs=build_run_records([record]);assert len(runs)==1
    facts={JOB:{'job_id':JOB,'actor_id':'USER-1','status':'completed','sync_status':'confirmed','output_saved':True,'inspection_status':None}}
    result=reconcile_production_runs(runs,facts)[0]
    assert [p['id'] for p in result['phases']]==['preparation','production','quality']
    assert [p['status'] for p in result['phases']]==['completed','completed','pending']
    facts[JOB]['inspection_status']='pass'
    assert all(p['status']=='completed' for p in reconcile_production_runs(runs,facts)[0]['phases'])

@pytest.mark.parametrize('status,sync,expected',[('running','confirmed','running'),('paused','confirmed','blocked'),
  ('interrupted','confirmed','blocked'),('completed','outcome_unknown','blocked'),('completed','review','error')])
def test_production_http_success_and_unknown_receipts_are_not_completion(status,sync,expected):
    from app.production_simulation.run_facts import reconcile_production_runs
    value=reconcile_production_runs(build_run_records([event()]),{JOB:{'job_id':JOB,'status':status,'sync_status':sync,'output_saved':False}})[0]
    assert value['phases'][1]['status']==expected
    assert value['status']!='completed'

def test_production_does_not_change_same_device_fault_or_quality_group():
    records=[event(),{'type':'runtime','event':'goal_parsed','trace_id':'FAULT','state_change':{'source':'event','raw':{'event_id':'E1','device_id':'M1'}}},
      {'type':'agent','name':'quality','event':'agent_completed','trace_id':'Q1','run_type':'quality'}]
    items=build_run_records(records)
    assert {x['run_type'] for x in items}=={'fault','quality','production_simulation'}
    assert len(next(x for x in items if x['run_type']=='fault')['phases'])==6

def test_production_facts_are_compact_batched_and_authorized(production_backend,isolated_factory):
    from app.production_simulation.run_facts import production_run_facts
    target,backend=coordinator(production_backend,isolated_factory);jobs=[prepared(target,f'logs-{i}') for i in range(3)]
    calls=[];original=backend._call
    def spy(operation,*args,**kwargs):calls.append(operation);return original(operation,*args,**kwargs)
    backend._call=spy
    facts=production_run_facts(backend,OWNER,[job['job_id'] for job in jobs])
    assert calls==['run_facts'];assert len(facts)==3
    assert all('program' not in item and 'output' not in item for item in facts.values())
    assert production_run_facts(backend,{'user_id':'USER-2','role':'technician'},list(facts))=={}

def test_production_trace_does_not_leak_to_another_user(production_backend,isolated_factory):
    target,backend=coordinator(production_backend,isolated_factory);job=prepared(target)
    trace=TraceRecorder();trace.record(**{**event(job['job_id']),'context':{'job_id':job['job_id'],'actor_id':'USER-2'}})
    trace.record(type='runtime',event='goal_parsed',trace_id='FAULT',state_change={'source':'event','raw':{'event_id':'E1'}})
    client=TestClient(create_app(SimpleNamespace(container=SimpleNamespace(trace=trace,virtual_production=target))))
    for token,allowed in [('',False),('other-session',False),('owner-session',True),('supervisor-session',True)]:
        client.cookies.clear()
        if token:client.cookies.set('maintenance_session',token)
        result=client.get('/api/v1/trace',params={'trace_id':job['job_id']});assert result.status_code==200
        assert bool(result.json()['trace']) is allowed
        items=client.get('/api/v1/runs').json()['runs']
        assert any(x['run_type']=='production_simulation' for x in items) is allowed
        assert any(x['run_type']=='fault' for x in items)

def test_backend_unavailable_hides_private_production_and_preserves_fault(production_backend,isolated_factory):
    target,backend=coordinator(production_backend,isolated_factory);job=prepared(target)
    trace=TraceRecorder();trace.record(**event(job['job_id']));trace.record(type='runtime',event='goal_parsed',trace_id='F',state_change={'source':'event','raw':{'event_id':'E1'}})
    client=TestClient(create_app(SimpleNamespace(container=SimpleNamespace(trace=trace,virtual_production=target))))
    client.cookies.set('maintenance_session','owner-session')
    backend.resolve_session=lambda token:(_ for _ in ()).throw(RuntimeError('unavailable'))
    result=client.get('/api/v1/runs').json()
    assert all(x['run_type']!='production_simulation' for x in result['runs']);assert result['storage_warning']
