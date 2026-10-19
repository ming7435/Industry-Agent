import importlib
from uuid import uuid4
import pytest
from shared.freecad_documents import NativeJob,canonical_digest
from test_freecad_document_native import run
from text_to_cad_document_test_runtime import DocumentRuntime


def publication(tmp_path,previous):
    from app.cad_documents.artifacts import ArtifactStore
    from app.cad_documents.native_program import render_document_program
    store=ArtifactStore(tmp_path)
    job=NativeJob(job_id='JOB-'+uuid4().hex,input_digest=canonical_digest(['publish',previous.snapshot.revision]),
                  job_kind='publish',owner_user_id='USER-a',document_id=previous.snapshot.document_id,
                  expected_revision=previous.snapshot.revision,envelope=None,source={'snapshot':previous.snapshot.model_dump(mode='json')})
    native=store.entry_path(next(a for a in previous.artifacts if a['name']=='model.json'))
    DocumentRuntime().call_tool('execute_code',{'code':render_document_program(job,store.job_directory(job.job_id),native)})
    return store.validate_candidate(job,store.read_receipt(job.job_id))


def test_hidden_product_still_exports(tmp_path):
    a=run(tmp_path,'create_primitive',dict(primitive_type='box',length=40,width=20,height=10))
    b=run(tmp_path,'set_visibility',dict(object_id=a.snapshot.objects[0].object_id,visible=False),a)
    result=publication(tmp_path,b)
    assert result.validation['solid_count']==1
    assert result.validation['volume_mm3']==pytest.approx(8000)
    assert result.snapshot.revision==b.snapshot.revision


def test_standard_binds_current_geometry(tmp_path):
    module=importlib.import_module('shared.freecad_document_standards')
    assert hasattr(module,'build_document_standard'), 'native standard extraction missing'
    a=run(tmp_path,'create_primitive',dict(primitive_type='sphere',diameter=20))
    first=module.build_document_standard(a.snapshot,'FC-'+'a'*64)
    assert next(p for p in first.parameters if p['source_property']=='diameter')['expected']==20
    b=run(tmp_path,'set_primitive_dimensions',dict(object_id=a.snapshot.objects[0].object_id,dimensions={'diameter':30}),a)
    second=module.build_document_standard(b.snapshot,'FC-'+'b'*64)
    assert first.digest!=second.digest
    body=second.model_dump(mode='json'); body['parameters'][0]['expected']=999
    with pytest.raises(ValueError): module.verify_document_standard(body)


def test_private_run_never_falls_back_to_redis(monkeypatch):
    import app.agents.cad.modeling_api as api
    from starlette.requests import Request
    from fastapi import HTTPException,FastAPI
    assert importlib.util.find_spec('app.cad_documents.publishing'), 'private publication reader missing'
    import app.cad_documents.publishing as pub
    monkeypatch.setenv('FREECAD_DOCUMENTS_ENABLED','true')
    reads=[]
    monkeypatch.setattr(pub,'read_published_run',lambda request,run_id:(_ for _ in ()).throw(HTTPException(403,'private')))
    app=FastAPI(); app.state.freecad_run_store=type('Store',(),{'get':lambda _,i:reads.append(i)})()
    request=Request({'type':'http','app':app,'headers':[]})
    with pytest.raises(HTTPException) as error: api.get_freecad_run_record(request,'FC-'+'a'*64)
    assert error.value.status_code==403 and reads==[]
def test_disabled_writes_still_read_durable_publication(monkeypatch):
    from types import SimpleNamespace
    from app.cad_documents import publishing
    from app.agents.cad.modeling_api import get_freecad_run_record
    monkeypatch.setenv('FREECAD_DOCUMENTS_ENABLED','false')
    monkeypatch.setenv('BACKEND_SERVICE_BASE_URL','http://isolated-backend.invalid')
    record={'run_id':'FC-'+'e'*64,'document_id':'DOC-a','status':'completed'}
    monkeypatch.setattr(publishing,'read_published_run',lambda *_:record)
    request=SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace()))
    assert get_freecad_run_record(request,record['run_id'])==record
