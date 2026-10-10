"""End-to-end HTTP Backend, actual Runtime/Agents, and isolated factory execution."""
from copy import deepcopy
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from types import SimpleNamespace
import json
import pytest
from fastapi import FastAPI,HTTPException
from fastapi.testclient import TestClient
from virtual_production_test_support import production_backend,OWNER
from test_virtual_factory_client import isolated_factory,run,setup
from test_virtual_production_reconciliation import coordinator
from app.clients.backend import BackendServiceClient
from app.production_simulation.backend import VirtualProductionBackend
from app.production_simulation.reconciler import VirtualProductionReconciler
from app.api.production_simulation import build_virtual_production_router

PREFIX='/api/production/virtual'
@pytest.fixture
def chain(production_backend,isolated_factory):
    app_client=production_backend.client.client
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args):pass
        def do_POST(self):
            response=app_client.post(self.path,json=json.loads(self.rfile.read(int(self.headers['Content-Length']))),headers={'Authorization':self.headers.get('Authorization','')})
            raw=response.content;self.send_response(response.status_code);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=Thread(target=server.serve_forever,daemon=True);thread.start()
    target,_=coordinator(production_backend,isolated_factory)
    backend=VirtualProductionBackend(BackendServiceClient(f'http://127.0.0.1:{server.server_port}'));target.backend=backend
    records={run()['run_id']:run()};hole=run(hole=True);hole['run_id']='FC-'+'b'*64;records[hole['run_id']]=hole
    def reader(request,identity):
        if identity not in records:raise HTTPException(404,'expired CAD')
        return records[identity]
    def client_for(value):
        app=FastAPI();app.include_router(build_virtual_production_router(value,backend,lambda:'isolated-write',reader));client=TestClient(app);client.cookies.set('maintenance_session','owner-session');return client
    try:yield SimpleNamespace(client=client_for(target),target=target,backend=backend,records=records,new_client=client_for,repository=production_backend.repository,factory=isolated_factory)
    finally:server.shutdown();server.server_close();thread.join(timeout=2)

def plan(chain,hole=False):
    identity='FC-'+('b' if hole else 'a')*64
    result=chain.client.post(PREFIX+'/plans',json={'command_id':'VERIFY-SIM-20261009-'+('HOLE' if hole else 'CYLINDER'),
        'design_run_id':identity,'setup':setup(hole),'material':'模拟钢材','batch_id':'VERIFY-SIM-20261009'})
    assert result.status_code==200,result.text
    return result.json()

def start(chain,job):
    for action,state in [('submit','received'),('start','running')]:
        result=chain.client.post(PREFIX+'/jobs/'+job['job_id']+'/'+action,json={'digest':job['program_digest']})
        assert result.status_code==200,result.text;assert result.json()['status']==state

def reconcile(chain,target=None):
    worker=VirtualProductionReconciler(target or chain.target,chain.backend,clock=lambda:10**12)
    try:worker.run_once(10**12)
    finally:worker.close()

def test_cad_factory_quality_chain_without_browser(chain):
    saved=[]
    for hole in (False,True):
        job=plan(chain,hole);start(chain,job);chain.factory[1].tick(20);reconcile(chain)
        completed=chain.client.get(PREFIX+'/jobs/'+job['job_id']).json();assert completed['status']=='completed'
        result=chain.client.post(PREFIX+'/parts/'+job['part_id']+'/inspect',json={'output_digest':completed['output']['output_digest']})
        assert result.status_code==200,result.text;assert result.json()['status']=='pass';assert result.json()['source']=='factory-simulation'
        assert result.json()['design_run_id']==job['design_run_id'];saved.append(completed)
    assert len({job['factory_job_id'] for job in saved})==2
    for kind in ('sim_production_job','sim_produced_part','sim_quality_check'):assert len(chain.repository.list_records(kind))==2
    for kind in ('quality','production_part','workorder'):assert chain.repository.list_records(kind)==[]

def test_restarted_agent_catches_up_completed_factory_job(chain,production_backend):
    job=plan(chain);start(chain,job);chain.factory[1].tick(20)
    posts=[x for x in chain.factory[2] if x['method']=='POST']
    new,_=coordinator(production_backend,chain.factory);new.backend=chain.backend
    reconcile(chain,new);saved=chain.backend.get(OWNER,job['job_id'])
    assert saved['status']=='completed';assert len(chain.repository.list_records('sim_produced_part'))==1
    assert [x for x in chain.factory[2] if x['method']=='POST']==posts

def test_logout_and_cad_expiry_do_not_prevent_saved_output(chain):
    job=plan(chain);start(chain,job);chain.records.clear();chain.client.cookies.clear();chain.factory[1].tick(20);reconcile(chain)
    assert chain.client.get(PREFIX+'/jobs/'+job['job_id']).status_code==401
    chain.client.cookies.set('maintenance_session','owner-session')
    completed=chain.client.get(PREFIX+'/jobs/'+job['job_id']).json();assert completed['output']
    assert chain.client.post(PREFIX+'/parts/'+job['part_id']+'/inspect',json={'output_digest':completed['output']['output_digest']}).json()['status']=='pass'

def test_factory_rejecting_start_returns_409_and_preserves_received_job(chain):
    job=plan(chain);chain.client.post(PREFIX+'/jobs/'+job['job_id']+'/submit',json={'digest':job['program_digest']})
    line=chain.factory[1].factory;original=line.list_devices
    line.list_devices=lambda:[{**item,'status':'stopped'} for item in original()]
    result=chain.client.post(PREFIX+'/jobs/'+job['job_id']+'/start',json={'digest':job['program_digest']})
    assert result.status_code==409,result.text
    assert 'production_line_not_ready' in result.text
    saved=chain.client.get(PREFIX+'/jobs/'+job['job_id']).json();assert saved['status']=='received';assert saved['output'] is None
    line.list_devices=original;reconcile(chain)
    assert chain.client.get(PREFIX+'/jobs/'+job['job_id']).json()['status']=='received'
    assert len([item for item in chain.factory[2] if item['path'].endswith('/start')])==1
