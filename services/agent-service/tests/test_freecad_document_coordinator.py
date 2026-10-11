import importlib
from shared.freecad_documents import NativeJob
from app.cad_documents.artifacts import ArtifactStore
import pytest


class Backend:
    def __init__(self, job): self.job=job; self.failed=None
    def take_job(self, worker_id):
        value,self.job=self.job,None
        return value
    def engine_state(self): return {'state':'idle','job_id':None}
    def fail_job(self, worker_id, job_id, error_code, outcome_unknown=False):
        self.failed=(job_id,error_code,outcome_unknown)
        return {'state':'outcome_unknown' if outcome_unknown else 'failed'}


def test_lost_submit_queries_original_job(tmp_path):
    assert importlib.util.find_spec('app.cad_documents.coordinator'), 'single worker missing'
    from app.cad_documents.coordinator import CadDocumentWorker
    job=NativeJob(job_id='JOB-a',input_digest='a'*64,job_kind='edit',owner_user_id='USER-a',
                  document_id='DOC-a',expected_revision=0,envelope=None,source={})
    backend=Backend(job)
    calls=[]
    class Native:
        def status(self): return {'connected':True}
        def call_tool(self,*args,**kwargs):
            calls.append(1)
            raise TimeoutError('lost response')
    worker=CadDocumentWorker(backend,Native(),ArtifactStore(tmp_path),'worker-a')
    worker.tick()
    assert backend.failed[2] is True
    worker.reconcile('JOB-a')
    assert len(calls)==1


@pytest.mark.parametrize('kind',['import','publish'])
def test_terminal_receipt_recovers_original_kind_without_native_reexecution(tmp_path,kind):
    from app.cad_documents.coordinator import CadDocumentWorker
    from shared.freecad_documents import NativeReceipt,DocumentSnapshot
    job=NativeJob(job_id='JOB-a',input_digest='a'*64,job_kind=kind,owner_user_id='USER-a',document_id='DOC-a',expected_revision=0,envelope=None)
    receipt=NativeReceipt(job_id=job.job_id,input_digest=job.input_digest,state='completed',snapshot=DocumentSnapshot(document_id='DOC-a',revision=1 if kind=='import' else 0,objects=[],product_root_ids=[],source_spec=None,validation={'valid':True},artifacts=[]),artifacts=[],validation={'valid':True})
    calls=[]
    class Stored:
        def engine_state(self):return {'job_id':'JOB-a','worker_id':'old-worker'}
        def native_job(self,_):return job
        def complete_job(self,worker_id,value):calls.append(('complete',worker_id));return {'state':'completed'}
        def call(self,operation,**body):calls.append((operation,body['worker_id']));return {'state':'completed'}
    class Artifacts:
        def read_receipt(self,_):return receipt
        def validate_candidate(self,value,result):assert value==job;return result
    worker=CadDocumentWorker(Stored(),None,Artifacts(),'new-worker')
    assert worker.reconcile('JOB-a')['state']=='completed'
    assert calls==[('complete' if kind=='import' else 'commit_publication','old-worker')]


def test_legacy_terminal_receipt_survives_lost_native_response(tmp_path,monkeypatch):
    from app.cad_documents.coordinator import CadDocumentWorker
    from freecad_test_kernel import ScriptMCP
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT',str(tmp_path/'legacy'))
    job=NativeJob(job_id='JOB-legacy',input_digest='a'*64,job_kind='legacy_generate',owner_user_id='SYSTEM',document_id=None,expected_revision=None,envelope=None,
                  source={'run_id':'FC-'+'b'*64,'spec':{'units':'mm','operations':[{'type':'box','mode':'add','length':40,'width':20,'height':10,'position':[0,0,0]}]}})
    calls=[]
    class Stored(Backend):
        def complete_job(self,worker_id,receipt):calls.append(receipt);return {'state':'completed'}
    class Lost(ScriptMCP):
        def status(self):return {'connected':True}
        def call_tool(self,*args,**kwargs):super().call_tool(*args,**kwargs);raise TimeoutError('response lost after native completion')
    native=Lost();backend=Stored(job);artifacts=ArtifactStore(tmp_path/'owned')
    worker=CadDocumentWorker(backend,native,artifacts,'old-worker')
    assert worker.tick()['state']=='completed'
    assert artifacts.read_receipt(job.job_id).state=='completed'
    assert len(calls)==1 and calls[0].result['validation']['step_roundtrip'] is True
    assert native.geometry_executions==1


def test_discovery_is_read_only_and_writes_version_bound_receipt(tmp_path,monkeypatch):
    import sys,json,types
    from app.cad_documents.coordinator import CadDocumentWorker
    from app.cad_documents import capabilities
    from shared.freecad_documents import canonical_digest
    version=['1','1','4'];fingerprint=canonical_digest(version)
    monkeypatch.setenv('FREECAD_DISCOVERY_REPORT',str(tmp_path/'discovery.json'))
    monkeypatch.setattr(capabilities,'local_inventory',lambda:{'ready':True,'version_fingerprint':fingerprint})
    monkeypatch.setitem(sys.modules,'FreeCAD',types.SimpleNamespace(Version=lambda:version))
    monkeypatch.setitem(sys.modules,'FreeCADGui',types.SimpleNamespace(listCommands=lambda:['Part_Box','Part_Cylinder']))
    job=NativeJob(job_id='JOB-discover',input_digest='d'*64,job_kind='discover',owner_user_id='SYSTEM',document_id=None,expected_revision=None,envelope=None)
    class Stored(Backend):
        def complete_job(self,worker_id,receipt):return {'state':'completed'}
    class Native:
        def status(self):return {'connected':True}
        def call_tool(self,name,arguments,**kwargs):exec(arguments['code'],{})
    assert CadDocumentWorker(Stored(job),Native(),ArtifactStore(tmp_path/'owned'),'worker').tick()['state']=='completed'
    report=json.loads((tmp_path/'discovery.json').read_text(encoding='utf-8'))
    assert report['commands']==['Part_Box','Part_Cylinder'] and report['version_fingerprint']==fingerprint
