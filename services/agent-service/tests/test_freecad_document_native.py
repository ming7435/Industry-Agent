import importlib
from uuid import uuid4
import pytest
from shared.freecad_documents import NativeJob, parse_command
from text_to_cad_document_test_runtime import DocumentRuntime

DOC='DOC-12345678-1234-4234-8234-123456789abc'


def run(tmp_path, kind, parameters, previous=None):
    assert importlib.util.find_spec('app.cad_documents'), 'native document adapter missing'
    from app.cad_documents.artifacts import ArtifactStore
    from app.cad_documents.native_program import render_document_program
    store=ArtifactStore(tmp_path)
    command=parse_command(dict(command_id='CMD-'+uuid4().hex,document_id=DOC,
                               expected_revision=previous.snapshot.revision if previous else 0,
                               command_type=kind,parameters=parameters))
    from shared.freecad_documents import command_digest
    job=NativeJob(job_id='JOB-'+uuid4().hex,input_digest=command_digest('USER-a',command),job_kind='edit',
                  owner_user_id='USER-a',document_id=DOC,expected_revision=command.expected_revision,
                  envelope=command,source={'snapshot':previous.snapshot.model_dump(mode='json')} if previous else {})
    source=store.entry_path(next(a for a in previous.artifacts if a['name']=='model.json')) if previous else None
    DocumentRuntime().call_tool('execute_code',{'code':render_document_program(job,store.job_directory(job.job_id),source)})
    return store.validate_candidate(job,store.read_receipt(job.job_id))


def test_candidate_keeps_original_bytes(tmp_path):
    a=run(tmp_path,'create_primitive',dict(primitive_type='cylinder',diameter=20,length=10))
    from app.cad_documents.artifacts import ArtifactStore
    path=ArtifactStore(tmp_path).entry_path(next(v for v in a.artifacts if v['name']=='model.json'))
    before=path.read_bytes()
    b=run(tmp_path,'set_primitive_dimensions',dict(object_id=a.snapshot.objects[0].object_id,dimensions={'diameter':30}),a)
    assert path.read_bytes()==before
    assert b.snapshot.objects[0].object_id==a.snapshot.objects[0].object_id
    props={p.name:p.value for p in a.snapshot.objects[0].properties}
    assert props['diameter']==20
    assert b.validation['volume_mm3']==pytest.approx(2250*3.141592653589793)


def test_duplicate_label_targets_one_uuid(tmp_path):
    a=run(tmp_path,'create_primitive',dict(primitive_type='box',length=40,width=20,height=10))
    b=run(tmp_path,'create_primitive',dict(primitive_type='sphere',diameter=20),a)
    c=run(tmp_path,'set_label',dict(object_id=b.snapshot.objects[0].object_id,label='同名'),b)
    d=run(tmp_path,'set_label',dict(object_id=b.snapshot.objects[1].object_id,label='同名'),c)
    e=run(tmp_path,'set_label',dict(object_id=b.snapshot.objects[1].object_id,label='只改这个'),d)
    assert [o.label for o in e.snapshot.objects]==['同名','只改这个']


def test_replace_spec_allocates_new_object_ids(tmp_path):
    a=run(tmp_path,'create_primitive',dict(primitive_type='box',length=40,width=20,height=10))
    b=run(tmp_path,'replace_from_spec',{'spec':{'units':'mm','operations':[{'type':'box','mode':'add','length':10,'width':10,'height':10,'position':[0,0,0]}]}},a)
    assert set(o.object_id for o in a.snapshot.objects).isdisjoint(o.object_id for o in b.snapshot.objects)
    assert b.snapshot.source_spec['operations'][0]['length']==10


def test_hidden_and_construction_objects_are_distinct(tmp_path):
    a=run(tmp_path,'create_primitive',dict(primitive_type='box',length=40,width=20,height=10))
    b=run(tmp_path,'set_visibility',dict(object_id=a.snapshot.objects[0].object_id,visible=False),a)
    assert b.snapshot.objects[0].visible is False
    assert b.snapshot.product_root_ids==a.snapshot.product_root_ids
    assert b.validation['volume_mm3']==pytest.approx(8000)
def test_candidate_never_opens_the_prior_published_path(tmp_path):
    from app.cad_documents.native_program import render_document_program
    from shared.freecad_documents import NativeJob
    import json
    source=tmp_path/'previous.json'
    source.write_text(json.dumps(dict(schema_version='text_to_cad_model_v1',base_spec=None,source_spec=None,objects=[])))
    original=source.read_bytes();candidate=tmp_path/'candidate';candidate.mkdir()
    job=NativeJob(job_id='JOB-copy',input_digest='a'*64,job_kind='publish',owner_user_id='USER-a',document_id='DOC-a',expected_revision=1,envelope=None)
    code=render_document_program(job,candidate,source)
    assert str(source) not in code
    assert source.read_bytes()==original


def test_import_uses_source_proof_not_empty_destination_revision(tmp_path):
    from app.cad_documents.artifacts import ArtifactStore
    from app.cad_documents.native_program import render_document_program
    from hashlib import sha256
    source=run(tmp_path,'create_primitive',dict(primitive_type='box',length=40,width=20,height=10))
    store=ArtifactStore(tmp_path);source_entry=next(a for a in source.artifacts if a['name']=='model.json')
    auxiliary=[]
    for name,content in [('drawing.svg',b'<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 10 10"/></svg>'),('drawing.pdf',b'%PDF-1.4\n%%EOF')]:
        (store.job_directory(source_entry['job_id'])/name).write_bytes(content)
        auxiliary.append(dict(job_id=source_entry['job_id'],name=name,size=len(content),sha256=sha256(content).hexdigest()))
    job=NativeJob(job_id='JOB-'+uuid4().hex,input_digest='a'*64,job_kind='import',owner_user_id='USER-a',document_id=DOC,expected_revision=0,envelope=None,
        source=dict(snapshot={'validation':{'valid':True,'solid_count':0}},native_artifact=source_entry,
                    product_names=[source.snapshot.objects[0].name],source_validation={**source.validation,'drawing':{'verified':True}},source_artifacts=auxiliary,
                    spec={'units':'mm','operations':[{'type':'box','mode':'add','length':40,'width':20,'height':10,'position':[0,0,0]}],'drawing':{'projection':'third_angle','scale':1,'section':None}}))
    DocumentRuntime().call_tool('execute_code',{'code':render_document_program(job,store.job_directory(job.job_id),store.entry_path(source_entry))})
    receipt=store.read_receipt(job.job_id)
    assert receipt.state=='completed',receipt.result
    assert receipt.validation['volume_mm3']==pytest.approx(8000)
    assert 'drawing' not in receipt.validation
