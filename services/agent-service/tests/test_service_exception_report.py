"""异常处理报告走真实 Report Agent/PDF 工具，与原失败服务和真实验收分开。"""
import pymupdf

from test_business_returns_api import business_runtime
from test_service_exception_cases import checkpoint


def test_exception_report_and_pdf_are_real_permission_scoped_artifacts_without_resuming(business_runtime,tmp_path,monkeypatch):
    client,container,backend=business_runtime
    monkeypatch.setenv('REPORT_FILE_DIR',str(tmp_path/'exception-pdfs'))
    source=checkpoint()
    saved=container.recovery.checkpoint(source['state'],'failed',error=source['error'])
    case=container.recovery.cases.list()[0]
    report_id=case['report_id']
    current=client.get('/api/reports/'+report_id)
    assert current.status_code==200,current.text
    assert current.json()['report']['scope']=='service_exception_record'
    assert client.post('/api/reports/'+report_id+'/pdf').status_code==409
    feedback=client.post('/api/runtime/service-exceptions/'+case['case_id']+'/feedback',
        json={'request_id':'PDF-1','feedback':'已交接负责人，设备故障仍需现场核查'})
    assert feedback.status_code==200,feedback.text
    generated=client.post('/api/reports/'+report_id+'/pdf')
    assert generated.status_code==200,generated.text
    opened=client.get(generated.json()['open_url'])
    assert opened.status_code==200 and opened.content.startswith(b'%PDF')
    with pymupdf.open(stream=opened.content,filetype='pdf') as document:
        text=''.join(page.get_text() for page in document)
    assert '刀塔旋转超时' in text
    assert 'HTTP503' in ''.join(text.split())
    assert '设备恢复' in text and '不代表' in text
    assert container.recovery.get(saved['recovery_id'])['status']=='failed'
    assert backend.list_workorders()['items']==[]
    records=container.trace.list(trace_id='TRACE-1')
    assert any(r.get('tool_name')=='generate_report_file' and r.get('agent')=='report' for r in records)
    assert client.get('/api/reports/'+report_id+'/json').status_code==200
    client.cookies.clear()
    assert client.get('/api/reports/'+report_id).status_code==401
    assert client.get('/api/reports/'+report_id+'/pdf').status_code==401


def test_exception_report_storage_outage_returns_safe_unavailable_status(business_runtime,monkeypatch):
    client,container,_=business_runtime
    source=checkpoint()
    container.recovery.checkpoint(source['state'],'failed',error=source['error'])
    case=container.recovery.cases.list()[0]
    store=container.recovery.cases.store
    original=store.get
    def unavailable(namespace,key):
        if namespace=='service_exception_cases':raise ConnectionError('mysql://operator:SYNTHETIC-PRIVATE@unavailable/db')
        return original(namespace,key)
    monkeypatch.setattr(store,'get',unavailable)
    response=client.get('/api/reports/'+case['report_id'])
    assert response.status_code==503,response.text
    assert 'SYNTHETIC-PRIVATE' not in response.text
