"""Dedicated MySQL schema and owned test processes. Never starts or stops FreeCAD/factory/Docker."""
from contextlib import contextmanager
import hmac
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import time
from types import SimpleNamespace
from uuid import uuid4

ROOT=Path(__file__).resolve().parents[2]
class SafeConfig(dict):
    def __repr__(self):return '<isolated MySQL configuration; credentials hidden>'

def isolated_mysql_config():
    import mysql.connector
    from dotenv import dotenv_values
    values=dotenv_values(ROOT/'.env')
    config=SafeConfig(host=values.get('MYSQL_HOST') or '127.0.0.1',port=int(values.get('MYSQL_PORT') or 3306),
                      user=values.get('MYSQL_USER') or 'root',password=values.get('MYSQL_PASSWORD') or '',connection_timeout=5)
    name='industry_cad_test_'+uuid4().hex
    try:
        connection=mysql.connector.connect(**config);cursor=connection.cursor()
        cursor.execute('CREATE DATABASE `'+name+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
        cursor.close();connection.close()
    except mysql.connector.Error:raise RuntimeError('隔离 MySQL 测试库不可用，未使用 SQLite 替代') from None
    # Retained for inspection, never erases any existing database.
    config['database']=name;return config

def stop_owned_processes(processes):
    for process in reversed(processes):
        if process.poll() is None:process.terminate()
    for process in reversed(processes):
        try:process.wait(timeout=5)
        except subprocess.TimeoutExpired:process.kill();process.wait(timeout=5)

@contextmanager
def start_isolated_document_stack(tmp_root,mysql_config):
    import httpx
    from scripts.start_all import _default_env
    tmp_root=Path(tmp_root);tmp_root.mkdir(parents=True,exist_ok=True)
    if not str(mysql_config['database']).startswith('industry_cad_test_'):raise ValueError('仅允许隔离测试库')
    for port in (18030,18010,18001):
        with socket.socket() as sock:
            try:sock.bind(('127.0.0.1',port))
            except OSError:raise RuntimeError(f'隔离端口 {port} 已占用，不复用或终止现有服务') from None
    env={**_default_env(),'APP_ENV':'development','BACKEND_STORAGE':'mysql','WORKORDER_BACKEND':'mysql',
         'FREECAD_DOCUMENTS_ENABLED':'true','BACKEND_SERVICE_BASE_URL':'http://127.0.0.1:18030','AGENT_SERVICE_BASE_URL':'http://127.0.0.1:18010',
         'MONITOR_WEB_PORT':'18001','BACKEND_INTERNAL_TOKEN':secrets.token_urlsafe(32),'AGENT_API_TOKEN':secrets.token_urlsafe(32),
         'FREECAD_DOCUMENT_ARTIFACT_ROOT':str(tmp_root/'artifacts'),'FREECAD_ARTIFACT_ROOT':str(tmp_root/'legacy'),'REDIS_URL':'redis://127.0.0.1:6379/15',
         'MODEL_SERVICE_BASE_URL':'','MODEL_PROVIDER':'fake','PYTHONIOENCODING':'utf-8','PYTHONPATH':str(ROOT),
         'NO_PROXY':'127.0.0.1,localhost,::1','no_proxy':'127.0.0.1,localhost,::1',
         'FREECAD_WORKER_LOCK':str(ROOT/'.runtime/cad-document-worker.lock')}
    for key in ('host','port','user','password','database'):env['MYSQL_'+key.upper()]=str(mysql_config[key])
    processes=[];logs=[];client=None
    try:
        for kind,port in [('backend',18030),('agent',18010),('monitor',18001),('worker',None)]:
            log=(tmp_root/(kind+'.log')).open('wb');logs.append(log)
            command=[sys.executable,str(Path(__file__).resolve()),'--serve',kind]
            process=subprocess.Popen(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0));processes.append(process)
            if port:
                deadline=time.monotonic()+90
                while time.monotonic()<deadline:
                    if process.poll() is not None:raise RuntimeError(f'隔离 {kind} 启动失败；请检查脱敏日志')
                    try:
                        response=httpx.get(f'http://127.0.0.1:{port}/health',timeout=1,trust_env=False)
                        if response.status_code==200:break
                    except httpx.HTTPError:pass
                    time.sleep(.1)
                else:raise RuntimeError(f'隔离 {kind} 尚未就绪')
        client=httpx.Client(base_url='http://127.0.0.1:18001',headers={'Origin':'http://127.0.0.1:18001'},timeout=15,trust_env=False)
        password=secrets.token_urlsafe(20)
        credentials=dict(username='cad-test-'+uuid4().hex[:12],password=password)
        response=client.post('/api/team/register',json={**credentials,'role':'technician','primary_device_id':'RENISHAW-EQUATOR300-001'})
        if response.status_code not in (200,201):raise RuntimeError('隔离账号注册失败：HTTP '+str(response.status_code))
        actor=response.json()['user'];response=client.post('/api/team/login',json=credentials)
        if response.status_code!=200:raise RuntimeError('隔离账号登录失败')
        yield dict(agent_url='http://127.0.0.1:18010',monitor_url='http://127.0.0.1:18001',backend_url='http://127.0.0.1:18030',
                   actor=actor,worker_id='isolated-process',client=client,env=env,artifacts=tmp_root/'artifacts')
    finally:
        if client is not None:client.close()
        stop_owned_processes(processes)
        for log in logs:log.close()

def serve(kind):
    if kind=='worker':
        from scripts.freecad_document_worker import main
        return main()
    sys.path.insert(0,str(ROOT/'services'/('backend-service' if kind=='backend' else 'agent-service')))
    from fastapi import FastAPI,HTTPException,Request
    if kind=='backend':
        from app.cad_documents.repository import CadDocumentRepository
        from app.cad_documents.service import CadDocumentService
        from app.cad_documents.routes import create_router
        from app.team.routes import create_router as team_router,internal_auth
        from app.team.service import TeamService
        repository=CadDocumentRepository();service=CadDocumentService(repository)
        team=TeamService(devices=lambda:[{'device_id':'RENISHAW-EQUATOR300-001','name':'比对仪'}])
        app=FastAPI();app.include_router(create_router(lambda:service));app.include_router(team_router(lambda:SimpleNamespace(team=team)))
    elif kind=='agent':
        from app.api.freecad_documents import build_document_router
        from app.cad_documents.publishing import read_published_run
        from app.api.quality_simulation import build_simulation_router
        def writing(request):
            if not hmac.compare_digest(request.headers.get('Authorization','').removeprefix('Bearer '),os.environ['AGENT_API_TOKEN']):raise HTTPException(401,'写操作需要有效令牌')
        app=FastAPI();app.include_router(build_document_router(writing))
        @app.get('/api/cad/freecad/runs/{run_id}')
        def published(run_id:str,request:Request):
            value=read_published_run(request,run_id)
            if value is None:raise HTTPException(404,'设计不存在')
            return value
        # Only standards are read in this live harness: no factory and no measurement generation.
        @app.get('/api/quality/simulation/designs/{run_id}')
        def standard(run_id:str,request:Request):
            from shared.simulated_part_design_quality import build_basis
            return {'basis':build_basis(published(run_id,request)),'latest':None}
    elif kind=='monitor':
        import monitor_web_server as monitor
        from http.server import ThreadingHTTPServer
        class Handler(monitor.MonitorRequestHandler):
            def do_GET(self):
                if self.path=='/health':return self._json({'status':'ok'})
                return super().do_GET()
        return ThreadingHTTPServer(('127.0.0.1',18001),Handler).serve_forever()
    else:raise ValueError('unknown test service')
    @app.get('/health')
    def health():return {'status':'ok'}
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=18030 if kind=='backend' else 18010,log_level='error')

if __name__=='__main__':
    if sys.argv[1:2]!=['--serve']:raise SystemExit('isolated test helper')
    sys.path.insert(0,str(ROOT));serve(sys.argv[2])
