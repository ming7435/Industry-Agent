"""Joint conclusions use persisted sample identity, never a design-wide image."""
from copy import deepcopy
import importlib
import json
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.quality_vision import build_quality_vision_router
from app.vision.joint import JointQualityService, sample_identity
from test_quality_vision_api import connected
from test_vision_pipeline import pipeline
from test_simulated_quality_api import connected as dimension_connected, RUN_ID


@pytest.fixture
def joint(pipeline, dimension_connected):
    _, vision, body, calls, behavior = pipeline
    dimensions, _, repo, _ = dimension_connected
    batch = dimensions.post('/api/quality/simulation/detect', json={'design_run_id': RUN_ID, 'request_id': 'joint-batch'}).json()
    service = importlib.import_module('isolated_simulation_backend.quality_simulation.service').SimulatedQualityService(repo)
    class Backend:
        def resolve_session(self, token):
            return {'user_id': token, 'role': 'technician'} if token in {'U-1', 'U-2'} else None
        def request(self, path, data):
            assert path == '/internal/quality/simulation/request'
            return {'result': service.request(data['actor_id'], data['request_id'])}
    app = FastAPI()
    app.include_router(build_quality_vision_router(lambda: None, backend_factory=Backend, service=vision))
    client = TestClient(app); client.cookies.set('maintenance_session', 'U-1')
    return client, vision, body, behavior, batch


def detect(joint, sample, pc='clear', yolo='defect'):
    client, _, body, behavior, batch = joint
    behavior.update(pc=pc, yolo=yolo)
    return client.post('/api/quality/vision/pipeline/detect', json={**body, 'part_id': RUN_ID,
        'dimension_request_id': batch['request_id'], 'dimension_sample_id': sample['part_id']})


def test_linked_pipeline_updates_only_one_sample_and_survives_reload(joint):
    client, vision, _, _, batch = joint
    endpoint = '/api/quality/vision/joint/joint-batch'
    before = client.get(endpoint).json()
    good = next(row for row in before['items'] if row['dimensions'] == 'pass')
    sample = next(row for row in batch['samples'] if row['part_id'] == good['sample_id'])
    assert before['counts']['qualified'] == 0 and good['status'] == 'pending'
    response = detect(joint, sample)
    assert response.status_code == 200, response.text
    record = response.json()
    assert record['joint_identity'] == sample_identity(batch, sample['part_id'])
    after = client.get(endpoint).json()
    assert after['counts']['qualified'] == 1
    assert sum(row['visual'] == 'pass' for row in after['items']) == 1
    assert next(row for row in after['items'] if row['sample_id'] == sample['part_id'])['handling'].startswith('合格流转')
    assert JointQualityService(vision).report('U-1', batch) == after
    # Reinspection replaces the same sample's conclusion, not the denominator.
    assert detect(joint, sample, pc='defect').status_code == 200
    failed = client.get(endpoint).json()
    row = next(row for row in failed['items'] if row['sample_id'] == sample['part_id'])
    assert failed['counts']['total'] == after['counts']['total'] and failed['counts']['qualified'] == 0
    assert row['status'] == 'unqualified' and '返工评估' in row['handling']
    assert row['issues'][0]['label'] == '划伤'
    assert failed['release_allowed'] is False and failed['execution'] == 'not_executed'


def test_cross_account_batch_design_reference_and_sample_cannot_be_combined(joint):
    client, _, body, _, batch = joint
    sample = batch['samples'][0]
    valid = {**body, 'part_id': RUN_ID, 'dimension_request_id': batch['request_id'], 'dimension_sample_id': sample['part_id']}
    for patch, status in [({'part_id':'another-design'},409),({'dimension_sample_id':'SIM-PART-'+'f'*32},409),
                          ({'image_source':'public_gear_reference'},422),({'dimension_sample_id':''},422),
                          ({'quality_part_id':'CQ-'+'a'*32},422)]:
        assert client.post('/api/quality/vision/pipeline/detect', json={**valid,**patch}).status_code == status
    client.cookies.set('maintenance_session','U-2')
    assert client.get('/api/quality/vision/joint/joint-batch').status_code == 404
    assert client.post('/api/quality/vision/pipeline/detect', json=valid).status_code == 404
    client.cookies.clear()
    assert client.get('/api/quality/vision/joint/joint-batch').status_code == 401


def test_unlocalized_anomaly_remains_unqualified_and_broken_evidence_is_not_pass(joint):
    client, vision, _, _, batch = joint
    report = client.get('/api/quality/vision/joint/joint-batch').json()
    good = next(row for row in report['items'] if row['dimensions'] == 'pass')
    sample = next(row for row in batch['samples'] if row['part_id'] == good['sample_id'])
    response = detect(joint, sample, pc='defect', yolo='clear').json()
    row = next(row for row in client.get('/api/quality/vision/joint/joint-batch').json()['items'] if row['sample_id']==sample['part_id'])
    assert row['status']=='unqualified' and '隔离待复核' in row['handling']
    path = vision._owner_root('U-1') / 'inspections' / (response['inspection_id']+'.json')
    record = json.loads(path.read_text(encoding='utf8')); record['joint_identity']['sample_id']='SIM-PART-'+'e'*32
    vision._atomic_json(path,record)
    row = next(row for row in client.get('/api/quality/vision/joint/joint-batch').json()['items'] if row['sample_id']==sample['part_id'])
    assert row['status']=='pending' and row['evidence_error']


def test_failed_new_artifact_cannot_leave_an_old_joint_pass(joint, monkeypatch):
    client, vision, _, _, batch = joint
    initial=client.get('/api/quality/vision/joint/joint-batch').json()
    sample_id=next(row['sample_id'] for row in initial['items'] if row['dimensions']=='pass')
    sample=next(row for row in batch['samples'] if row['part_id']==sample_id)
    assert detect(joint,sample).status_code==200
    atomic=vision._atomic_json
    def fail_artifact(path,value):
        if value.get('joint_identity'): raise OSError('controlled write failure')
        return atomic(path,value)
    monkeypatch.setattr(vision,'_atomic_json',fail_artifact)
    assert detect(joint,sample,pc='defect').status_code==503
    current=client.get('/api/quality/vision/joint/joint-batch').json()
    row=next(row for row in current['items'] if row['sample_id']==sample_id)
    assert row['status']=='pending' and current['counts']['qualified']==0


@pytest.mark.parametrize('dimension,visual,expected', [
    ('pass','pass','qualified'),('pass','pending','pending'),('pending','pass','pending'),
    ('fail','pass','unqualified'),('pass','fail','unqualified'),('fail','pending','unqualified'),
    ('pending','fail','unqualified'),('pending','pending','pending'),('fail','fail','unqualified')])
def test_truth_table_and_actions(joint, dimension, visual, expected):
    _, vision, _, _, batch = joint
    batch=deepcopy(batch); sample=batch['samples'][0]; batch['samples']=[sample]
    params=batch['basis']['parameters']
    sample['observations']={p['key']:{'value':p['expected'],'unit':p['unit']} for p in params}
    if dimension=='pending': sample['observations']={}
    if dimension=='fail':
        p=next(p for p in params if p['kind']=='number')
        sample['observations'][p['key']]['value']='12345'
    if visual!='pending':
        identity='VI-'+uuid4().hex
        record=dict(inspection_id=identity,algorithm='patchcore_yolo_pipeline',pipeline_version=1,
            joint_identity=sample_identity(batch,sample['part_id']),part_id=RUN_ID,image_source='upload',
            status='clear' if visual=='pass' else 'defect',patchcore={'status':'clear' if visual=='pass' else 'defect'},
            yolo_state='skipped' if visual=='pass' else 'completed',
            yolo=None if visual=='pass' else {'status':'defect','defects':[{'label':'dirt','bbox':[1,2,3,4]}]})
        vision._atomic_json(vision._owner_root('U-1')/'inspections'/(identity+'.json'),record)
        JointQualityService(vision).record_inspection('U-1',record)
    report=JointQualityService(vision).report('U-1',batch)
    assert report['items'][0]['status']==expected
    assert report['counts'][expected]==1
    if visual=='fail': assert '清洗后复检' in report['items'][0]['handling']
    if dimension=='fail': assert '复测后判定返工或重造' in report['items'][0]['handling']
