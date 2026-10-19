import importlib
from fastapi import FastAPI
from fastapi.testclient import TestClient
from shared.freecad_documents import CadDocumentError, DocumentHead, DocumentSnapshot


class Application:
    def __init__(self):
        self.backend=self
        self.jobs=0
    def resolve_session(self, token): return {'user_id':'USER-a'} if token=='valid' else None
    def head(self, actor_id, document_id):
        if document_id=='DOC-foreign': raise CadDocumentError('forbidden','无权访问',403)
        return DocumentHead(document_id=document_id,owner_user_id=actor_id,part_name='底板',part_number='00123',revision=1,created_at=0,updated_at=0)
    def snapshot(self, actor_id,document_id,revision):
        return DocumentSnapshot(document_id=document_id,revision=revision,objects=[],product_root_ids=[],source_spec=None,validation={},artifacts=[])
    def submit(self, actor_id,command):
        if command.expected_revision!=1: raise CadDocumentError('revision_conflict','已更新',409)
        self.jobs+=1
        raise AssertionError('this test only submits rejected requests')
    def create(self, actor_id, body): return self.head(actor_id,'DOC-new')


def client(monkeypatch):
    assert importlib.util.find_spec('app.api.freecad_documents'), 'personal document API missing'
    from app.api.freecad_documents import build_document_router
    monkeypatch.setenv('FREECAD_DOCUMENTS_ENABLED','true')
    application=Application(); app=FastAPI()
    app.include_router(build_document_router(lambda request: None,lambda request:application))
    return TestClient(app),application


def test_session_required_for_new_documents(monkeypatch):
    http,app=client(monkeypatch)
    body=dict(request_id='r',part_name='底板',part_number='00123')
    assert http.post('/api/cad/freecad/documents',json=body).status_code==401
    http.cookies.set('maintenance_session','valid')
    assert http.post('/api/cad/freecad/documents',json=body).status_code==202
    assert http.post('/api/cad/freecad/documents',json={**body,'actor_id':'USER-forged'}).status_code==422


def test_stale_revision_rejected_without_execution(monkeypatch):
    http,app=client(monkeypatch); http.cookies.set('maintenance_session','valid')
    body=dict(command_id='CMD-one',document_id='DOC-one',expected_revision=0,command_type='set_label',parameters=dict(object_id='OBJ-old',label='改名'))
    assert http.post('/api/cad/freecad/documents/DOC-one/commands',json=body).status_code==409
    assert app.jobs==0
    assert http.get('/api/cad/freecad/documents/DOC-foreign').status_code==403
    assert http.post('/api/cad/freecad/documents',json=dict(request_id='r',part_name='底板',part_number='00123'),headers={'Origin':'http://evil.example'}).status_code==403


def test_feature_disabled_has_no_write(monkeypatch):
    http,app=client(monkeypatch); http.cookies.set('maintenance_session','valid')
    monkeypatch.setenv('FREECAD_DOCUMENTS_ENABLED','false')
    assert http.post('/api/cad/freecad/documents',json=dict(request_id='r',part_name='底板',part_number='00123')).status_code==503


def test_copy_does_not_claim_legacy_owner(tmp_path,monkeypatch):
    from app.cad_documents.service import CadDocumentApplication
    from app.cad_documents.artifacts import ArtifactStore
    from app.tools.cad import text_to_cad
    calls=[]
    head=DocumentHead(document_id='DOC-copy',owner_user_id='USER-a',part_name='底板',part_number='00123',revision=0,created_at=0,updated_at=0)
    native=tmp_path/'source.FCStd';native.write_bytes(b'trusted-source-document')
    auxiliary=tmp_path/'unfold.svg';auxiliary.write_text('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L10 10"/></svg>',encoding='utf-8')
    monkeypatch.setattr(text_to_cad,'artifact_path',lambda _,name:auxiliary if name=='unfold.svg' else native)
    class Gateway:
        backend=None
        def call(self,operation,**body):
            calls.append((operation,body))
            if operation in {'create_document','get_document'}: return head.model_dump(mode='json')
            if operation=='claim_import': return {}
            raise AssertionError(operation)
    source=dict(run_id='FC-'+'a'*64,status='completed',artifacts=[{'name':'unfold.svg'}],spec={'units':'mm','operations':[{'type':'box','mode':'add','length':40,'width':20,'height':10,'position':[0,0,0]}]},
                validation={'valid':True,'step_roundtrip':True,'solid_count':1,'product_names':['Model']})
    app=CadDocumentApplication(Gateway,ArtifactStore(tmp_path/'managed'),lambda _:source)
    source['part_number']='00456'
    app.create('USER-a',dict(request_id='r',part_name='底板',part_number='',source_run_id=source['run_id']))
    assert native.read_bytes()==b'trusted-source-document'
    assert not any('owner' in op for op,_ in calls)
    assert next(body for op,body in calls if op=='create_document')['part_number']=='00456'
    imported=next(body for op,body in calls if op=='claim_import')
    assert imported['document_id']=='DOC-copy' and imported['actor_id']=='USER-a'
    assert imported['source']['native_artifact']['name']=='model.json'
    import json
    data=json.loads(app.artifacts.entry_path(imported['source']['native_artifact']).read_text(encoding='utf-8'))
    assert data['base_spec']==source['spec']
    assert auxiliary.read_text(encoding='utf-8').startswith('<svg')


def test_command_polling_has_explicit_identity_even_without_envelope(monkeypatch):
    from shared.freecad_documents import CommandRecord
    http,app=client(monkeypatch);http.cookies.set('maintenance_session','valid')
    app.command=lambda *_:CommandRecord(envelope=None,input_digest='a'*64,owner_user_id='USER-a',state='completed',job_id='JOB-a')
    response=http.get('/api/cad/freecad/documents/DOC-one/commands/CMD-publish')
    assert response.status_code==200
    assert response.json()['command_id']=='CMD-publish'
