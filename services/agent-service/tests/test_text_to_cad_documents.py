"""Persistent document migration exercises real geometry and immutable source files."""
from hashlib import sha256
import json
from pathlib import Path
from uuid import uuid4

import pytest

from app.cad_documents.artifacts import ArtifactStore
from app.cad_documents.native_program import render_document_program
from shared.freecad_documents import NativeJob, command_digest, parse_command


def execute_document(root, kind, parameters, previous=None, job_kind='edit'):
    command = parse_command(dict(command_id='CMD-'+uuid4().hex, document_id='DOC-migration',
        expected_revision=previous.snapshot.revision if previous else 0,
        command_type=kind, parameters=parameters)) if job_kind == 'edit' else None
    revision = previous.snapshot.revision if previous else 0
    job = NativeJob(job_id='JOB-'+uuid4().hex, input_digest=command_digest('USER-a', command) if command else 'a'*64,
        job_kind=job_kind, owner_user_id='USER-a', document_id='DOC-migration', expected_revision=revision,
        envelope=command, source={'snapshot':previous.snapshot.model_dump(mode='json')} if previous else {})
    store = ArtifactStore(root)
    source = store.entry_path(next(a for a in previous.artifacts if a['name']=='model.json')) if previous else None
    code = render_document_program(job, store.job_directory(job.job_id), source)
    from text_to_cad_document_test_runtime import DocumentRuntime
    DocumentRuntime().call_tool('execute_code',{'code':code})
    receipt = store.read_receipt(job.job_id)
    assert receipt is not None and receipt.state == 'completed', receipt.result if receipt else 'missing receipt'
    return store.validate_candidate(job, receipt)


def test_new_source_artifacts_are_managed_and_historical_fcstd_stays_readable(tmp_path):
    store = ArtifactStore(tmp_path)
    for name in ('model.json', 'model.py', 'model.FCStd'):
        path = store.job_directory('JOB-source')/name
        path.write_bytes(b'trusted-source')
        entry = dict(job_id='JOB-source', name=name, size=14, sha256=sha256(b'trusted-source').hexdigest())
        assert store.entry_path(entry) == path


def test_edit_rebuilds_real_step_without_touching_prior_source(tmp_path):
    first = execute_document(tmp_path, 'create_primitive', dict(primitive_type='box',length=40,width=20,height=10))
    names = {a['name'] for a in first.artifacts}
    assert {'model.json','model.py','model.step','model.stl'} <= names
    assert 'model.FCStd' not in names
    store = ArtifactStore(tmp_path)
    source = store.entry_path(next(a for a in first.artifacts if a['name']=='model.json'))
    before = source.read_bytes()
    oid = first.snapshot.objects[0].object_id
    second = execute_document(tmp_path, 'set_primitive_dimensions', dict(object_id=oid,dimensions={'length':50}),first)
    assert source.read_bytes() == before
    assert second.snapshot.objects[0].object_id == oid
    assert first.validation['volume_mm3'] == pytest.approx(8000)
    assert second.validation['volume_mm3'] == pytest.approx(10000)
    assert second.validation['step_roundtrip'] is True
    assert second.validation['provider'] == 'text-to-cad'


def test_hidden_product_remains_in_published_geometry(tmp_path):
    first = execute_document(tmp_path,'create_primitive',dict(primitive_type='sphere',diameter=20))
    hidden = execute_document(tmp_path,'set_visibility',dict(object_id=first.snapshot.objects[0].object_id,visible=False),first)
    published = execute_document(tmp_path,None,None,hidden,job_kind='publish')
    assert published.snapshot.objects[0].visible is False
    assert published.snapshot.revision == hidden.snapshot.revision
    assert published.validation['solid_count'] == 1
    assert published.validation['volume_mm3'] == pytest.approx(4188.790204786391)


def test_unrecoverable_fcstd_fails_explicitly_without_executing_it(tmp_path):
    source = tmp_path/'old.FCStd'; source.write_bytes(b'opaque historical native document')
    job = NativeJob(job_id='JOB-old',input_digest='a'*64,job_kind='publish',owner_user_id='USER-a',
                    document_id='DOC-a',expected_revision=1,envelope=None,source={})
    candidate = tmp_path/'candidate'; candidate.mkdir()
    with pytest.raises(ValueError,match='迁移|migration'):
        render_document_program(job,candidate,source)
    assert source.read_bytes() == b'opaque historical native document'


def test_legacy_gui_inventory_cannot_advertise_new_engine_commands():
    from app.cad_documents.catalog import build_catalog
    value=build_catalog({'ready':True,'version_fingerprint':'v','pid':1},
        {'commands':['Part_Box'],'version_fingerprint':'v','runtime_pid':1})
    assert value['current'] is False
    assert all(command['action'] is None for command in value['commands'])


def test_publication_retains_python_and_parameter_sources(tmp_path):
    # ArtifactStore must enforce both source halves, not accept a historical FCStd as a new revision.
    from shared.freecad_documents import NativeReceipt, DocumentSnapshot
    store=ArtifactStore(tmp_path)
    path=store.job_directory('JOB-new')/'model.FCStd';path.write_bytes(b'historical')
    artifact=dict(job_id='JOB-new',name='model.FCStd',size=10,sha256=sha256(b'historical').hexdigest())
    snapshot=DocumentSnapshot(document_id='DOC-a',revision=1,objects=[],product_root_ids=[],source_spec=None,
        validation={'valid':True},artifacts=[artifact])
    receipt=NativeReceipt(job_id='JOB-new',input_digest='a'*64,state='completed',snapshot=snapshot,
        artifacts=[artifact],validation={'valid':True})
    job=NativeJob(job_id='JOB-new',input_digest='a'*64,job_kind='edit',owner_user_id='USER-a',document_id='DOC-a',
        expected_revision=0,envelope=None)
    with pytest.raises(ValueError):store.validate_candidate(job,receipt)


def test_unsupported_historical_edit_keeps_explicit_migration_error(tmp_path):
    from app.cad_documents.coordinator import CadDocumentWorker
    from test_freecad_document_coordinator import Backend
    store=ArtifactStore(tmp_path)
    path=store.job_directory('JOB-old')/'model.FCStd';path.write_bytes(b'old')
    artifact=dict(job_id='JOB-old',name='model.FCStd',size=3,sha256=sha256(b'old').hexdigest())
    job=NativeJob(job_id='JOB-edit',input_digest='a'*64,job_kind='publish',owner_user_id='USER-a',
        document_id='DOC-a',expected_revision=1,envelope=None,source={'snapshot':{'artifacts':[artifact]}})
    backend=Backend(job)
    class Connected:
        def status(self):return {'connected':True}
        def call_tool(self,*args,**kwargs):raise AssertionError('legacy native files must not be executed')
    worker=CadDocumentWorker(backend,Connected(),store,'worker-a')
    assert worker.tick()['state']=='failed'
    assert backend.failed==('JOB-edit','migration_required',False)


def test_model_data_cannot_turn_object_identity_into_a_write_path(tmp_path):
    source=tmp_path/'model.json'
    source.write_text(json.dumps(dict(schema_version='text_to_cad_model_v1',base_spec=None,source_spec=None,
        objects=[dict(object_id='../outside',name='bad',label='bad',visible=True,
            primitive=dict(primitive_type='box',length=1,width=1,height=1),position=[0,0,0],rotation={'axis':[0,0,1],'angle':0})])))
    job=NativeJob(job_id='JOB-bad',input_digest='a'*64,job_kind='publish',owner_user_id='USER-a',
        document_id='DOC-a',expected_revision=1,envelope=None)
    with pytest.raises(ValueError):render_document_program(job,tmp_path,source)


def test_copy_rechecks_saved_geometry_evidence(tmp_path):
    from text_to_cad_document_test_runtime import DocumentRuntime
    first=execute_document(tmp_path,'create_primitive',dict(primitive_type='box',length=40,width=20,height=10))
    store=ArtifactStore(tmp_path)
    source=store.entry_path(next(a for a in first.artifacts if a['name']=='model.json'))
    job=NativeJob(job_id='JOB-import-wrong-proof',input_digest='a'*64,job_kind='import',owner_user_id='USER-a',
        document_id='DOC-copy',expected_revision=0,envelope=None,
        source={'source_validation':{**first.validation,'volume_mm3':1}})
    code=render_document_program(job,store.job_directory(job.job_id),source)
    DocumentRuntime().call_tool('execute_code',{'code':code})
    receipt=store.read_receipt(job.job_id)
    assert receipt.state=='failed'
    assert 'source geometry' in receipt.result['error_detail']


@pytest.mark.parametrize('angle',[None,180])
def test_legacy_partial_cylinder_requires_migration_instead_of_becoming_full(tmp_path,angle):
    properties=[dict(name='diameter',value=20),dict(name='length',value=10),
                dict(name='position',value=[0,0,0]),dict(name='rotation',value={'axis':[0,0,1],'angle':0})]
    if angle is not None:properties.append(dict(name='native.Angle',value=angle))
    source=tmp_path/'old.FCStd';source.write_bytes(b'historical')
    job=NativeJob(job_id='JOB-old-partial',input_digest='a'*64,job_kind='publish',owner_user_id='USER-a',
        document_id='DOC-a',expected_revision=1,envelope=None,source={'snapshot':dict(
            source_spec=None,product_root_ids=['OBJ-cylinder'],objects=[dict(object_id='OBJ-cylinder',name='Cylinder',
                label='Cylinder',visible=True,type_id='Part::Cylinder',editable_commands=['set_primitive_dimensions'],properties=properties)])})
    with pytest.raises(ValueError,match='迁移|migration'):render_document_program(job,tmp_path,source)


def test_historical_fcstd_rebuilds_saved_spec_and_preserves_object_identity(tmp_path):
    from text_to_cad_document_test_runtime import DocumentRuntime
    source=tmp_path/'historical.FCStd';source.write_bytes(b'preserved legacy bytes')
    spec={'units':'mm','operations':[{'type':'box','mode':'add','length':40,'width':20,'height':10,'position':[0,0,0]}]}
    previous=dict(source_spec=spec,product_root_ids=['OBJ-original'],objects=[dict(
        object_id='OBJ-original',name='Model',label='旧零件',visible=False)],
        validation=dict(valid=True,solid_count=1,volume_mm3=8000,bounds_mm=[40,20,10]))
    job=NativeJob(job_id='JOB-historical',input_digest='a'*64,job_kind='publish',owner_user_id='USER-a',
        document_id='DOC-a',expected_revision=7,envelope=None,source={'snapshot':previous})
    store=ArtifactStore(tmp_path/'managed')
    DocumentRuntime().call_tool('execute_code',{'code':render_document_program(job,store.job_directory(job.job_id),source)})
    receipt=store.validate_candidate(job,store.read_receipt(job.job_id))
    assert receipt.state=='completed',receipt.result
    assert receipt.snapshot.revision==7
    assert receipt.snapshot.objects[0].object_id=='OBJ-original'
    assert receipt.snapshot.objects[0].label=='旧零件'
    assert receipt.snapshot.objects[0].visible is False
    assert source.read_bytes()==b'preserved legacy bytes'
    assert 'model.FCStd' not in {entry['name'] for entry in receipt.artifacts}
