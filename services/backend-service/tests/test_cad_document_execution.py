from concurrent.futures import ThreadPoolExecutor
import pytest
from shared.freecad_documents import CadDocumentError
from test_cad_document_repository import repository, claim


def test_two_workers_never_execute_together(tmp_path):
    repo=repository(tmp_path/'cad.sqlite')
    doc=repo.create_document('USER-a','r','底板','')
    record=repo.claim_command('USER-a',claim(doc))
    assert hasattr(repo,'take_job'), 'durable executor missing'
    with ThreadPoolExecutor(2) as pool:
        jobs=list(pool.map(repo.take_job,['worker-a','worker-b']))
    assert sum(j is not None for j in jobs)==1
    assert next(j for j in jobs if j is not None).job_id==record.job_id
    assert repo.take_job('worker-c') is None


def test_expired_lease_does_not_release_unknown_job(tmp_path):
    repo=repository(tmp_path/'cad.sqlite')
    doc=repo.create_document('USER-a','r','底板','')
    record=repo.claim_command('USER-a',claim(doc))
    assert hasattr(repo,'take_job'), 'unknown-result barrier missing'
    repo.take_job('worker-a')
    repo.fail_job('worker-a',record.job_id,'transport_timeout',outcome_unknown=True)
    assert repo.get_command('USER-a',doc.document_id,'CMD-one').state=='outcome_unknown'
    with repo.transaction() as db:
        db.execute('UPDATE cad_executor_state SET heartbeat=0 WHERE singleton=1')
    assert repo.take_job('worker-b') is None
    assert repo.get_document('USER-a',doc.document_id).revision==0


def test_completed_receipt_registers_revision_once(tmp_path):
    repo=repository(tmp_path/'cad.sqlite')
    doc=repo.create_document('USER-a','r','底板','')
    record=repo.claim_command('USER-a',claim(doc))
    assert hasattr(repo,'complete_job'), 'durable completion missing'
    job=repo.take_job('worker-a')
    snapshot=repo.read_snapshot('USER-a',doc.document_id,0).model_dump(mode='json')
    snapshot['revision']=1
    receipt=dict(job_id=job.job_id,input_digest=job.input_digest,state='completed',snapshot=snapshot,
                 artifacts=[],validation=snapshot['validation'],result={},error_code=None)
    repo.complete_job('worker-a',receipt)
    repo.complete_job('worker-b',receipt)
    assert repo.get_document('USER-a',doc.document_id).revision==1
    assert repo.get_document('USER-a',doc.document_id).active_command_id is None
