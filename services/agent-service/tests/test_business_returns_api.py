"""接口贯通测试：真实 Backend、Quality/Report Agent、工具与临时业务库。"""
import importlib.util
import importlib
from pathlib import Path
from types import SimpleNamespace
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import json
import pytest
from fastapi.testclient import TestClient
from app.api.server import create_app
from app.runtime.container import AgentContainer
from app.harness.trace import TraceRecorder
from app.harness.runs import build_run_records
from app.tools.registry import ToolRegistry


@pytest.fixture
def business_runtime(tmp_path, monkeypatch):
    root = Path(__file__).resolve().parents[2] / 'backend-service' / 'app'
    name = 'isolated_business_backend'
    spec = importlib.util.spec_from_file_location(name, root / '__init__.py', submodule_search_locations=[str(root)])
    package = importlib.util.module_from_spec(spec)
    sys.modules[name] = package
    spec.loader.exec_module(package)
    backend_type = importlib.import_module(name + '.workorder.service').BackendBusinessService
    repository = importlib.import_module(name + '.workorder.repository').SQLiteRepository(str(tmp_path / 'backend.db'))
    backend = backend_type(repository=repository, team_service=SimpleNamespace())
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            try:
                if self.path.endswith('/session/resolve'):
                    result = {'user': {'user_id':'U-1','role':'technician'}}
                elif hasattr(backend, body['tool']):
                    result = getattr(backend, body['tool'])(**body['arguments'])
                else:
                    result = backend.qms(body['tool'], **body['arguments'])
                status = 200
            except (ValueError, KeyError) as error:
                result, status = {'detail':str(error)},409
            encoded = json.dumps(result,ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type','application/json')
            self.end_headers()
            self.wfile.write(encoded)
        def log_message(self,*_):
            pass
    server = ThreadingHTTPServer(('127.0.0.1',0),Handler)
    thread = Thread(target=server.serve_forever,daemon=True)
    thread.start()
    monkeypatch.setenv('BACKEND_SERVICE_BASE_URL',f'http://127.0.0.1:{server.server_port}')
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN','')
    container = AgentContainer(tools=ToolRegistry())
    runtime = SimpleNamespace(container=container)
    client = TestClient(create_app(orchestrator=runtime))
    client.cookies.set('maintenance_session','isolated-identity')
    try:
        yield client, container, backend
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)


def sample_part():
    # 隔离示例阈值仅用于测试，未写入实际业务记录。
    return {'part_no':'TEST-PIN','part_name':'测试销轴','batch_id':'TEST-BATCH','device_id':'M-TEST',
            'measurements':{'diameter_mm':10,'runout_mm':0.01},
            'specifications':{'diameter_mm':{'min':9.9,'max':10.1},'runout_mm':{'min':0,'max':0.03},'material_grade':'TEST-STEEL'},
            'appearance':dict.fromkeys(('scratch','crack','burr','discoloration','deformation'),False),
            'material':{'grade':'TEST-STEEL'},'function':{'runout_mm':0.01,'rotation_test':True},
            'process':{'cycle_complete':True,'traceable':True,'operator_confirmed':True}}


def test_quality_input_inspection_report_and_real_tools_are_connected(business_runtime):
    client, container, backend = business_runtime
    saved = client.post('/api/quality/parts/P-TEST/input',json={'part':sample_part()})
    assert saved.status_code == 200, saved.text
    result = client.post('/api/quality/parts/P-TEST',json={})
    assert result.status_code == 200,result.text
    body = result.json()
    assert body['passed'] is True
    check = backend.get_quality_check(body['quality_check_id'])['quality_check']
    assert check['evidence'] and check['measurements']['diameter_mm'] == 10
    assert body['report']['persisted'] is True
    assert client.get('/api/reports').json()['count'] == 1
    records = container.trace.list(trace_id=body['trace_id'])
    assert {r['name'] for r in records if r['event']=='agent_completed'} >= {'quality','report'}
    tools = {r['tool_name'] for r in records if r['event']=='tool_completed'}
    assert tools >= {'inspect_part_dimensions','inspect_part_appearance','persist_report'}
    assert any(r.get('skill')=='part_quality_inspection_skill' for r in records)
    persisted = next(r for r in records if r.get('tool_name')=='create_quality_check' and r['event']=='tool_completed')
    assert persisted['agent_run_id'] and persisted['tool_call_id']
    assert persisted['skill']=='part_quality_inspection_skill'
    assert build_run_records(records)[0]['event_count'] == len(records)


def test_unknown_quality_part_returns_insufficient_data_not_internal_error(business_runtime):
    client, _, _ = business_runtime
    response = client.post('/api/quality/parts/UNKNOWN',json={})
    assert response.status_code == 200
    assert response.json()['passed'] is False
    assert response.json()['quality_check_id']
    assert response.json()['status'] in {'review','not_tested','insufficient_data'}


def test_report_generation_uses_saved_quality_not_client_passed(business_runtime):
    client, _, backend = business_runtime
    check = backend.create_quality_check(part_id='P-UNKNOWN',target_id='P-UNKNOWN',result='review')
    response = client.post('/api/reports/generate',json={'quality_check_id':check['quality_check_id']})
    assert response.status_code == 200,response.text
    assert response.json()['report']['sections']['quality']['result'] == 'review'
    assert '数据不足' in response.json()['report']['summary']
    assert client.post('/api/reports/generate',json={'quality_check_id':check['quality_check_id'],'passed':True}).status_code == 422


def test_failed_quality_rectification_reinspection_release_and_close_are_logged(business_runtime):
    client, container, backend = business_runtime
    part = sample_part()
    part['appearance']['burr'] = True
    assert client.post('/api/quality/parts/P-TEST/input',json={'part':part}).status_code == 200
    failed = client.post('/api/quality/parts/P-TEST',json={}).json()
    assert failed['status'] == 'fail'
    check_id = failed['quality_check_id']
    task_response = client.post('/api/v1/closure-tasks',json={'quality_check_id':check_id,'title':'去毛刺','owner':'U-1','actions':['清除毛刺并检测']})
    assert task_response.status_code == 200,task_response.text
    task = task_response.json()
    assert client.post(f'/api/v1/quality/checks/{check_id}/release').status_code == 409
    assert client.post(f"/api/v1/closure-tasks/{task['closure_task_id']}/complete?note=已去毛刺").status_code == 200
    part['appearance']['burr'] = False
    client.post('/api/quality/parts/P-TEST/input',json={'part':part})
    passed = client.post('/api/quality/parts/P-TEST',json={}).json()
    response = client.post(f'/api/v1/quality/checks/{check_id}/reinspect',json={'passed':True,'reinspection_check_id':passed['quality_check_id']})
    assert response.status_code == 200,response.text
    assert client.post(f'/api/v1/quality/checks/{check_id}/release').status_code == 200
    closed=client.post(f'/api/v1/quality/checks/{check_id}/close',json={'note':'完成'})
    assert closed.status_code == 200
    assert '初检未通过' in closed.json()['report']['summary']
    assert '复检通过' in closed.json()['report']['summary'] and '关闭' in closed.json()['report']['summary']
    regenerated=client.post('/api/reports/generate',json={'quality_check_id':check_id})
    assert '复检通过' in regenerated.json()['report']['summary']
    assert backend.get_quality_check(check_id)['quality_check']['status'] == 'closed'
    assert client.get('/api/reports').json()['items'][0]['status'] == 'completed'
    records = container.trace.list(trace_id=failed['trace_id'])
    tools = {r.get('tool_name') for r in records if r['event']=='tool_completed'}
    assert tools >= {'create_closure_task','complete_closure_task','reinspect_quality_check','release_quality_check','close_quality_check'}
    assert any(r.get('skill')=='part_quality_inspection_skill' and r.get('step')=='release_quality_check' for r in records)


def test_report_pdf_uses_actual_report_agent_file_tool_and_can_open(business_runtime,tmp_path,monkeypatch):
    monkeypatch.setenv('REPORT_FILE_DIR', str(tmp_path / 'pdfs'))
    client, container, backend = business_runtime
    check = backend.create_quality_check(part_id='P-PDF',target_type='production_part',target_id='P-PDF',result='review')
    report = client.post('/api/reports/generate',json={'quality_check_id':check['quality_check_id']}).json()
    created = client.post('/api/reports/' + report['report_id'] + '/pdf')
    assert created.status_code == 200,created.text
    opened = client.get(created.json()['open_url'])
    assert opened.status_code == 200 and opened.content.startswith(b'%PDF')
    records = container.trace.list(trace_id=report['trace_id'])
    call = next(r for r in records if r.get('tool_name')=='generate_report_file' and r['event']=='tool_completed')
    assert call['agent_run_id'] and call['skill']=='report_generation_skill'
