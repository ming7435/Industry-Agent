"""真实 FastAPI 界面只有记录/人工反馈，不允许执行失败续跑或伪造验收。"""
from types import SimpleNamespace

from fastapi import FastAPI,Request
from fastapi.testclient import TestClient
import pytest

from app.api.task_recovery import build_task_recovery_router
from app.runtime.recovery import RecoveryManager
from test_skill_evolution import IsolatedJsonStore
from test_service_exception_cases import checkpoint,CaseTestStore


def api(actor):
    from app.api.service_exceptions import build_service_exception_router
    recovery=RecoveryManager(CaseTestStore())
    source=checkpoint()
    saved=recovery.checkpoint(source['state'],'failed',error=source['error'])
    calls=[]
    runtime=SimpleNamespace(container=SimpleNamespace(recovery=recovery,coordinator=SimpleNamespace(
        resume_failed=lambda record:calls.append(record))))
    app=FastAPI()
    def auth(request:Request): return True
    lookup=lambda request:actor
    app.include_router(build_task_recovery_router(runtime,auth,actor_lookup=lookup))
    app.include_router(build_service_exception_router(runtime,auth,actor_lookup=lookup))
    return TestClient(app),recovery,saved,calls


def test_original_resume_endpoint_is_removed_and_authorized_failure_record_is_readonly():
    client,recovery,saved,calls=api({'user_id':'U-1','role':'technician'})
    items=client.get('/api/runtime/recovery').json()['items']
    assert items[0]['task_id']=='TASK-1'
    assert items[0]['can_resume'] is False
    assert 'state' not in items[0]
    response=client.post('/api/runtime/recovery/'+saved['recovery_id']+'/resume',json={'request_id':'R-1'})
    assert response.status_code==404
    assert calls==[] and recovery.get(saved['recovery_id'])['status']=='failed'


def test_case_api_links_known_fault_accepts_human_feedback_and_serves_real_record_report():
    client,recovery,saved,calls=api({'user_id':'U-1','role':'technician'})
    item=client.get('/api/runtime/service-exceptions').json()['items'][0]
    assert item['alarm_code']=='700006' and item['failed_agent']=='maintenance'
    endpoint='/api/runtime/service-exceptions/'+item['case_id']
    response=client.post(endpoint+'/feedback',json={'request_id':'R-1','feedback':'已移交负责人现场核查'})
    assert response.status_code==200,response.text
    report=client.get(endpoint+'/report').json()['report']
    assert report['scope']=='service_exception_record' and report['persisted'] is True
    assert '现场核查' in report['summary']
    assert recovery.get(saved['recovery_id'])['status']=='failed' and calls==[]


@pytest.mark.parametrize('body',[
    {'request_id':'R-1','feedback':' '},
    {'request_id':'R-1','feedback':'已处理','passed':True},
    {'request_id':'R-1','feedback':'已处理','actor_id':'BOSS'},
    {'request_id':'R-1','feedback':'已处理','status':'completed'},
])
def test_feedback_rejects_empty_or_client_supplied_identity_and_success(body):
    client,recovery,_,_=api({'user_id':'U-1','role':'technician'})
    item=recovery.cases.list()[0]
    response=client.post('/api/runtime/service-exceptions/'+item['case_id']+'/feedback',json=body)
    assert response.status_code==422,response.text
    assert recovery.cases.get(item['case_id'])['status']=='awaiting_manual'


def test_supervisor_is_readonly_other_technician_cannot_read_or_process_case_and_cross_origin_is_rejected():
    client,recovery,_,_=api({'user_id':'BOSS','role':'supervisor'})
    item=client.get('/api/runtime/service-exceptions').json()['items'][0]
    endpoint='/api/runtime/service-exceptions/'+item['case_id']+'/feedback'
    body={'request_id':'R-1','feedback':'已处理'}
    assert client.post(endpoint,json=body).status_code==403
    own,store,_,_=api({'user_id':'U-1','role':'technician'})
    own_id=store.cases.list()[0]['case_id']
    assert own.post('/api/runtime/service-exceptions/'+own_id+'/feedback',json=body,
        headers={'Origin':'https://untrusted.example'}).status_code==403
    other,other_store,_,_=api({'user_id':'OTHER','role':'technician'})
    other_id=other_store.cases.list()[0]['case_id']
    assert other.get('/api/runtime/service-exceptions').json()['items']==[]
    assert other.get('/api/runtime/service-exceptions/'+other_id+'/report').status_code==403
    assert other.post('/api/runtime/service-exceptions/'+other_id+'/feedback',json=body).status_code==403
