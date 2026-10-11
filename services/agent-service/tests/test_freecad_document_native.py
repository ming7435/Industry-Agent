import importlib
from uuid import uuid4
import pytest
from shared.freecad_documents import NativeJob, parse_command
from freecad_document_test_kernel import FakeKernel

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
    source=store.entry_path(next(a for a in previous.artifacts if a['name']=='model.FCStd')) if previous else None
    FakeKernel().call_tool('execute_code',{'code':render_document_program(job,store.job_directory(job.job_id),source)})
    return store.validate_candidate(job,store.read_receipt(job.job_id))


def test_candidate_keeps_original_bytes(tmp_path):
    a=run(tmp_path,'create_primitive',dict(primitive_type='cylinder',diameter=20,length=10))
    from app.cad_documents.artifacts import ArtifactStore
    path=ArtifactStore(tmp_path).entry_path(next(v for v in a.artifacts if v['name']=='model.FCStd'))
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
    assert b.validation['volume_mm3']==8000
