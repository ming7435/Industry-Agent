import importlib
from shared.freecad_documents import NativeJob
from app.cad_documents.artifacts import ArtifactStore


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
