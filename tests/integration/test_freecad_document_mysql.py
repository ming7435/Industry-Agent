from concurrent.futures import ThreadPoolExecutor
from freecad_document_stack import isolated_mysql_config
from app.cad_documents.repository import CadDocumentRepository
from shared.freecad_documents import parse_command,CadDocumentError
import pytest

def test_real_mysql_persists_owner_idempotency_and_single_worker():
    config=isolated_mysql_config();repo=CadDocumentRepository(config)
    doc=repo.create_document('USER-a','request-a','底板','00123')
    assert CadDocumentRepository(config).get_document('USER-a',doc.document_id).part_number=='00123'
    command=parse_command(dict(command_id='CMD-a',document_id=doc.document_id,expected_revision=0,command_type='create_primitive',parameters=dict(primitive_type='box',length=40,width=20,height=10)))
    with ThreadPoolExecutor(2) as pool:claims=list(pool.map(lambda _:repo.claim_command('USER-a',command),[0,1]))
    assert claims[0].job_id==claims[1].job_id
    with ThreadPoolExecutor(2) as pool:jobs=list(pool.map(repo.take_job,['worker-a','worker-b']))
    assert sum(j is not None for j in jobs)==1
    job=next(j for j in jobs if j is not None)
    assert CadDocumentRepository(config).native_job(job.job_id)==job
    with pytest.raises(CadDocumentError):repo.get_document('USER-b',doc.document_id)
