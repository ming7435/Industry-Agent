"""直接业务入口走真实 API/Agent/工具；只替换不可用的外部适配器。"""
import pytest
from test_business_returns_api import business_runtime,sample_part


def fail_external(container,monkeypatch,name,reason):
    original=container.registry.execute
    def execute(tool,*args,**kwargs):
        if tool==name:raise ConnectionError(reason)
        return original(tool,*args,**kwargs)
    monkeypatch.setattr(container.registry,'execute',execute)


def test_real_quality_service_error_creates_case_but_never_passes_or_replays(business_runtime,monkeypatch):
    client,container,backend=business_runtime
    assert client.post('/api/quality/parts/12345/input',json={'part':sample_part()}).status_code==200
    fail_external(container,monkeypatch,'inspect_part_dimensions','quality-service HTTP503 TEST-DIMENSIONS')
    response=client.post('/api/quality/parts/12345',json={})
    assert response.status_code==200,response.text
    body=response.json();assert body['passed'] is False
    items=client.get('/api/runtime/service-exceptions').json()['items']
    assert len(items)==1 and items[0]['subject_type']=='quality'
    assert items[0]['part_id']=='12345' and 'TEST-DIMENSIONS' in items[0]['service_error']
    assert items[0]['task_id']==body['task_id'] and items[0]['trace_id']==body['trace_id']
    assert backend.get_quality_check(body['quality_check_id'])['quality_check']['result']!='passed'
    assert container.recovery.get(items[0]['recovery_id'])['status']=='failed'


def test_real_failed_measurement_is_not_an_unavailable_service(business_runtime):
    client,container,_=business_runtime
    part=sample_part();part['measurements']['diameter_mm']=15
    client.post('/api/quality/parts/12345/input',json={'part':part})
    response=client.post('/api/quality/parts/12345',json={})
    assert response.json()['status']=='fail'
    assert container.recovery.cases.list()==[]


def test_report_persistence_error_has_case_and_keeps_saved_quality_untouched(business_runtime,monkeypatch):
    client,container,backend=business_runtime
    check=backend.create_quality_check(part_id='12345',target_id='12345',result='review')
    original=backend.get_quality_check(check['quality_check_id'])
    fail_external(container,monkeypatch,'persist_report','report-service HTTP503 TEST-PERSIST')
    response=client.post('/api/reports/generate',json={'quality_check_id':check['quality_check_id']})
    assert response.status_code==502,response.text
    items=client.get('/api/runtime/service-exceptions').json()['items']
    assert len(items)==1 and items[0]['failed_agent']=='report'
    assert 'TEST-PERSIST' in items[0]['service_error']
    assert items[0]['part_id']=='12345'
    assert backend.get_quality_check(check['quality_check_id'])==original
    assert backend.list_reports()['items']==[]


def test_freecad_terminal_transport_failure_is_recorded_without_second_tool_call(monkeypatch,tmp_path):
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT',str(tmp_path/'cad-artifacts'))
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.agents.cad.modeling_api import build_freecad_router
    from app.clients.freecad import FreeCADConnectionError
    from app.runtime.recovery import RecoveryManager
    from test_service_exception_cases import CaseTestStore
    from test_freecad_api import MemoryStore
    manager=RecoveryManager(CaseTestStore())
    calls=[]
    class OfflineClient:
        def call_tool(self,*args,**kwargs):
            calls.append(args);raise FreeCADConnectionError('connection_failed','CAD MCP HTTP503 TEST-CAD')
        def close(self):pass
    app=FastAPI();app.state.freecad_run_store=MemoryStore();app.state.freecad_client_factory=OfflineClient;app.state.freecad_model_factory=lambda:None
    app.include_router(build_freecad_router(lambda:None,recovery=manager))
    client=TestClient(app)
    spec={'units':'mm','operations':[{'type':'cylinder','mode':'add','diameter':30,'length':50,'axis':'z','position':[0,0,0]}]}
    body={'prompt':'外径30mm长50mm圆柱','spec':spec,'command_id':'CAD-FAILURE','part_number':'12345'}
    created=client.post('/api/cad/freecad/runs',json=body)
    assert created.status_code==202,created.text
    run_id=created.json()['run_id'];items=manager.cases.list()
    assert len(items)==1 and items[0]['failed_agent']=='cad'
    assert items[0]['part_id']=='12345' and items[0]['task_id']==run_id
    assert 'TEST-CAD' in items[0]['service_error']
    count=len(calls)
    client.post('/api/cad/freecad/runs',json=body)
    assert len(calls)==count and len(manager.cases.list())==1


def test_simulation_factory_failure_has_quality_case_without_fake_sample(connected):
    from test_simulated_quality_api import RUN_ID
    from app.runtime.recovery import RecoveryManager
    from test_service_exception_cases import CaseTestStore
    client,app,repo,calls=connected
    app.state.service_exception_recovery=RecoveryManager(CaseTestStore())
    app.state.factory_error=True
    response=client.post('/api/quality/simulation/detect',json={'design_run_id':RUN_ID,'request_id':'SIM-OFFLINE'})
    assert response.status_code==503 and response.json()['detail']['execution_started'] is False
    items=app.state.service_exception_recovery.cases.list()
    assert len(items)==1 and items[0]['subject_type']=='quality'
    assert 'factory offline' in items[0]['service_error']
    assert items[0]['actor_id']=='U-1' and items[0]['part_id']=='92531'
    assert repo.list_records('simulated_quality_batch')==[]


from test_simulated_quality_api import connected


def test_memory_storage_failure_is_visible_but_empty_query_validation_is_not_service_failure(business_runtime,monkeypatch):
    client,container,_=business_runtime
    def offline(**kwargs):raise ConnectionError('memory-storage HTTP503 TEST-MEMORY')
    monkeypatch.setattr(container.experience_module.long_memory,'search',offline)
    from fastapi.testclient import TestClient
    checking=TestClient(client.app,raise_server_exceptions=False)
    checking.cookies.update(client.cookies)
    response=checking.post('/api/experience/search',json={'query':'刀塔旋转超时'})
    assert response.status_code in {200,503},response.text
    items=checking.get('/api/runtime/service-exceptions').json()['items']
    assert len(items)==1 and items[0]['failed_agent']=='memory'
    assert 'TEST-MEMORY' in items[0]['service_error']


def test_concurrent_feedback_on_real_independent_stores_has_one_winner(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    from app.runtime.durable_store import DurableJsonStore
    from app.runtime.service_exceptions import ServiceExceptionCases,ServiceCaseConflict
    from test_service_exception_cases import checkpoint
    path=str(tmp_path/'case-concurrency.db')
    first=ServiceExceptionCases(DurableJsonStore(path));second=ServiceExceptionCases(DurableJsonStore(path))
    item=first.record(checkpoint())
    def handle(cases,key):
        try:cases.handle(item['case_id'],'已交接负责人'+key,{'user_id':'U-1','role':'technician'},key);return 'handled'
        except ServiceCaseConflict:return 'conflict'
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures=[pool.submit(handle,cases,key) for cases,key in [(first,'REQ-A'),(second,'REQ-B')]]
        assert sorted(f.result() for f in futures)==['conflict','handled']
    saved=first.get(item['case_id'])
    assert saved['revision']==2 and len(saved['history'])==2


def test_failed_quality_input_read_keeps_actual_service_cause(business_runtime,monkeypatch):
    client,container,_=business_runtime
    fail_external(container,monkeypatch,'get_production_part','quality-input HTTP503 TEST-INPUT')
    response=client.post('/api/quality/parts/12345',json={})
    assert response.status_code==200 and response.json()['passed'] is False
    items=client.get('/api/runtime/service-exceptions').json()['items']
    assert len(items)==1 and 'TEST-INPUT' in items[0]['service_error']
    assert items[0]['part_id']=='12345'


def test_quality_write_response_lost_after_actual_commit_is_unknown_not_safe_to_replay(business_runtime,monkeypatch):
    client,container,backend=business_runtime
    client.post('/api/quality/parts/12345/input',json={'part':sample_part()})
    original=container.registry.execute;committed=[]
    def lose(tool,*args,**kwargs):
        result=original(tool,*args,**kwargs)
        if tool=='create_quality_check':
            committed.append(result);raise ConnectionError('quality-write HTTP503 TEST-LOST')
        return result
    monkeypatch.setattr(container.registry,'execute',lose)
    from fastapi.testclient import TestClient
    checking=TestClient(client.app,raise_server_exceptions=False);checking.cookies.update(client.cookies)
    response=checking.post('/api/quality/parts/12345',json={})
    assert response.status_code>=500
    assert len(committed)==1
    assert backend.get_quality_check(committed[0]['quality_check_id'])['quality_check']
    item=container.recovery.cases.list()[0]
    assert item['original_status']=='outcome_unknown' and item['requires_reconcile'] is True
    assert container.recovery.get(item['recovery_id'])['status']=='outcome_unknown'
    assert container.recovery.summary(container.recovery.get(item['recovery_id']))['requires_reconcile'] is True


def test_simulation_final_write_error_keeps_unknown_source_record_and_real_error(connected,monkeypatch):
    from test_simulated_quality_api import RUN_ID
    from app.runtime.recovery import RecoveryManager
    from app.clients.backend import BackendServiceError
    from test_service_exception_cases import CaseTestStore
    client,app,_,_=connected
    app.state.service_exception_recovery=RecoveryManager(CaseTestStore())
    import app.api.quality_simulation as module
    original=module.build_simulation_router
    # 保留真实 Agent 路由；只在测试传输适配器的最终写入返回处模拟响应丢失。
    endpoint=next(route.endpoint for route in app.routes if getattr(route,'path','')=='/api/quality/simulation/detect')
    context=next(cell.cell_contents for cell in endpoint.__closure__ if callable(cell.cell_contents) and getattr(cell.cell_contents,'__name__','')=='context')
    factory=next(cell.cell_contents for cell in context.__closure__ if isinstance(cell.cell_contents,type))
    request=factory.request
    def lose(self,path,body):
        if path.endswith('/detect'):raise BackendServiceError('backend HTTP503 TEST-UNKNOWN-WRITE',503)
        return request(self,path,body)
    monkeypatch.setattr(factory,'request',lose)
    response=client.post('/api/quality/simulation/detect',json={'design_run_id':RUN_ID,'request_id':'SIM-UNKNOWN'})
    assert response.status_code==503
    item=app.state.service_exception_recovery.cases.list()[0]
    source=app.state.service_exception_recovery.get(item['recovery_id'])
    assert item['original_status']=='outcome_unknown' and item['requires_reconcile'] is True
    assert source['status']=='outcome_unknown'
    assert 'TEST-UNKNOWN-WRITE' in item['service_error']
