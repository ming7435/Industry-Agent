"""Linked-flow boundary tests; fake detectors do not establish model accuracy."""
from copy import deepcopy
from concurrent.futures import ThreadPoolExecutor
import json
from threading import Event
from types import SimpleNamespace
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient
import pytest

from app.api.quality_vision import build_quality_vision_router
from app.clients.backend import BackendServiceError
from app.vision.service import VisionService
from test_quality_vision_api import FakePatchCore, install_test_preset, picture


JOB = 'SIM-JOB-' + 'a' * 64
PART = 'SIM-PART-' + 'a' * 64


def source_job():
    output = {'job_id': JOB, 'part_id': PART, 'design_run_id': 'FC-' + 'b' * 64,
              'design_digest': 'c' * 64, 'program_digest': 'd' * 64,
              'output_digest': 'e' * 64, 'factory_job_id': 'vprod-' + 'f' * 32,
              'actor_id': 'A', 'batch_id': 'BATCH-ONE', 'profile': {'outer_diameter_mm': 20},
              'source': 'factory-simulation', 'simulation_only': True, 'synthetic': True}
    return {**output, 'output': output, 'status': 'completed', 'sync_status': 'confirmed',
            'part_name': '圆柱', 'part_number': '1001'}


class FakeYolo:
    fail = False
    calls = 0

    def __init__(self, weights):
        pass

    def predict(self, image, confidence, iou):
        type(self).calls += 1
        if self.fail:
            raise RuntimeError('internal secret must never be exposed')
        return {'algorithm': 'yolo', 'status': 'clear', 'score': 0, 'threshold': confidence,
                'defects': [], 'image': {'width': image.width, 'height': image.height},
                'annotated_image': picture(), 'steps': [{'name': 'stub', 'status': 'completed'}]}


@pytest.fixture
def linked(tmp_path, monkeypatch):
    from app.vision import algorithms
    for key, filename in [('QUALITY_PATCHCORE_BACKBONE_WEIGHTS', 'trusted-backbone.pt'),
                          ('QUALITY_YOLO_WEIGHTS', 'yolo.pt')]:
        (tmp_path / filename).write_bytes(b'trusted test weights, not loaded')
        monkeypatch.setenv(key, str(tmp_path / filename))
    monkeypatch.delenv('QUALITY_YOLO_METADATA', raising=False)
    FakeYolo.fail = False
    FakeYolo.calls = 0
    service = VisionService(tmp_path / 'vision', readiness=lambda _: (True, ''), algorithms=SimpleNamespace(
        PatchCoreDetector=FakePatchCore, YoloDetector=FakeYolo,
        decode_image=algorithms.decode_image, VisionUnavailable=algorithms.VisionUnavailable))
    install_test_preset(service, tmp_path, monkeypatch)
    state = {'job': source_job(), 'calls': []}

    class Backend:
        def resolve_session(self, token):
            return {'user_id': token, 'role': 'supervisor' if token == 'S' else 'technician'} if token in {'A', 'B', 'S'} else None

        def request(self, path, body):
            state['calls'].append((path, deepcopy(body)))
            if body['actor_id'] not in {'A', 'S'}:
                raise BackendServiceError('forbidden', 403)
            if path.endswith('/get'):
                assert body['job_id'] == JOB
                return {'result': deepcopy(state['job'])}
            assert path.endswith('/inspect')
            assert body['part_id'] == PART and body['expected_output_digest'] == 'e' * 64
            return {'result': {key: state['job'][key] for key in
                              ('job_id', 'part_id', 'design_run_id', 'design_digest', 'output_digest', 'actor_id', 'batch_id', 'source', 'simulation_only', 'synthetic')} | {'status': 'pass'}}

    def write_auth(request: Request):
        if request.headers.get('x-write') != 'allowed':
            raise HTTPException(401, 'write auth required')

    app = FastAPI()
    app.include_router(build_quality_vision_router(write_auth, backend_factory=Backend, service=service))
    client = TestClient(app)
    client.cookies.set('maintenance_session', 'A')
    client.headers['x-write'] = 'allowed'
    return client, service, state


def verify(client, **changes):
    return client.post('/api/quality/vision/production/verify', json={'job_id': JOB, 'request_id': str(uuid4()), **changes})


def latest(client):
    return client.get('/api/quality/vision/production/jobs/' + JOB + '/latest')


def test_complete_flow_same_images_provenance_and_idempotent_restore(linked):
    client, service, state = linked
    assert latest(client).json() == {'run': None}
    request_id = str(uuid4())
    response = verify(client, request_id=request_id)
    assert response.status_code == 200, response.text
    run = response.json()
    assert run['status'] == 'completed' and run['source']['part_id'] == PART
    assert run['source']['actor_id'] == 'A'
    assert run['generator']['scope'] == 'synthetic_pipeline_only'
    assert run['parameter_inspection']['status'] == 'pass'
    assert [s['scenario'] for s in run['scenarios']] == ['normal', 'obvious_scratch', 'low_contrast']
    for scenario in run['scenarios']:
        with service._decode(scenario['input_image']) as image:
            assert service._image_digest(image) == scenario['image_sha256']
        assert {r['algorithm'] for r in scenario['results']} == {'patchcore', 'yolo'}
        for result in scenario['results']:
            assert result['part_id'] == PART and result['image_sha256'] == scenario['image_sha256']
            assert result['source_context']['source'] == run['source']
            assert result['source_context']['scenario'] == scenario['scenario']
            assert service.get_inspection('A', result['inspection_id']) == result
    assert run['metrics'] == {'patchcore': {'tp': 2, 'fn': 0, 'tn': 0, 'fp': 1},
                              'yolo': {'tp': 0, 'fn': 2, 'tn': 1, 'fp': 0}}
    assert latest(client).json() == {'run': run}
    assert verify(client, request_id=request_id).json() == run
    assert FakeYolo.calls == 3
    assert sum(path.endswith('/inspect') for path, _ in state['calls']) == 1
    rerun = verify(client).json()
    assert [s['image_sha256'] for s in rerun['scenarios']] == [s['image_sha256'] for s in run['scenarios']]


def test_owner_isolation_and_supervisor_uses_own_record_namespace(linked):
    client, _, _ = linked
    run = verify(client).json()
    client.cookies.set('maintenance_session', 'B')
    assert latest(client).status_code == 403
    assert verify(client).status_code == 403
    client.cookies.set('maintenance_session', 'S')
    assert latest(client).json() == {'run': None}
    own = verify(client).json()
    assert own['status'] == 'completed' and own['source']['actor_id'] == 'A'
    client.cookies.set('maintenance_session', 'A')
    assert latest(client).json()['run']['run_id'] == run['run_id']


@pytest.mark.parametrize('location,key,value', [
    ('job', 'status', 'running'), ('job', 'sync_status', 'review'),
    ('job', 'simulation_only', False), ('output', 'synthetic', False),
    ('output', 'source', 'formal'), ('output', 'part_id', 'SIM-PART-' + '0' * 64),
    ('output', 'design_digest', '0' * 64), ('output', 'output_digest', '../bad'),
])
def test_source_guard_runs_before_inspection_or_inference(linked, location, key, value):
    client, service, state = linked
    (state['job'] if location == 'job' else state['job']['output'])[key] = value
    response = verify(client)
    assert response.status_code == 409, response.text
    assert not FakeYolo.calls and not list(service.root.rglob('VI-*.json'))
    assert all(path.endswith('/get') for path, _ in state['calls'])


def test_failed_partial_result_is_saved_and_same_request_does_not_retry(linked):
    client, _, _ = linked
    FakeYolo.fail = True
    request_id = str(uuid4())
    response = verify(client, request_id=request_id)
    assert response.status_code == 200, response.text
    run = response.json()
    assert run['status'] == 'failed' and run['error']
    assert len(run['scenarios']) == 1 and len(run['scenarios'][0]['results']) == 1
    assert 'internal secret' not in json.dumps(run)
    assert latest(client).json()['run'] == run
    FakeYolo.fail = False
    assert verify(client, request_id=request_id).json() == run
    assert FakeYolo.calls == 1
    assert verify(client).json()['status'] == 'completed'


def test_auth_strict_schema_and_origin_cannot_supply_source(linked):
    client, _, state = linked
    client.cookies.clear()
    assert verify(client).status_code == 401
    client.cookies.set('maintenance_session', 'A')
    client.headers.pop('x-write')
    assert verify(client).status_code == 401
    client.headers['x-write'] = 'allowed'
    assert verify(client, source=source_job()).status_code == 422
    assert verify(client, request_id='not-a-uuid').status_code == 422
    client.headers['origin'] = 'https://untrusted.example'
    assert verify(client).status_code == 403
    assert not state['calls']


def test_running_progress_is_readable_without_restarting_inference(linked, monkeypatch):
    client, _, _ = linked
    entered, release = Event(), Event()
    original = FakeYolo.predict

    def blocked(self, *arguments):
        entered.set()
        assert release.wait(10)
        return original(self, *arguments)

    monkeypatch.setattr(FakeYolo, 'predict', blocked)
    request_id = str(uuid4())
    with ThreadPoolExecutor(max_workers=1) as worker:
        future = worker.submit(verify, client, request_id=request_id)
        try:
            assert entered.wait(10)
            progress = latest(client).json()['run']
            assert progress['status'] == 'running'
            assert len(progress['scenarios'][0]['results']) == 1
            assert verify(client, request_id=request_id).json() == progress
            assert verify(client).status_code == 409
        finally:
            release.set()
        assert future.result(timeout=15).json()['status'] == 'completed'
    assert FakeYolo.calls == 3


def test_interrupted_record_becomes_failed_and_original_request_stays_idempotent(linked):
    from app.vision.production import ProductionVisionService
    client, service, _ = linked
    run = verify(client).json()
    run['status'] = 'running'
    ProductionVisionService(service)._save('A', run)
    restored = latest(client).json()['run']
    assert restored['status'] == 'failed' and restored['error']
    assert restored['scenarios'] == run['scenarios']
    assert verify(client, request_id=run['request_id']).json() == restored
    assert FakeYolo.calls == 3


def test_corrupt_saved_record_or_foreign_index_is_not_returned(linked):
    from app.vision.production import ProductionVisionService
    client, service, _ = linked
    flow = ProductionVisionService(service)
    run = verify(client).json()
    path = flow._folder('A') / 'runs' / (run['run_id'] + '.json')
    envelope = json.loads(path.read_text(encoding='utf-8'))
    envelope['record']['source']['part_id'] = 'forged-part'
    service._atomic_json(path, envelope)
    assert latest(client).status_code == 409
    service._atomic_json(flow._pointer_path('A', JOB), {'owner_id': 'B', 'job_id': JOB, 'run_id': run['run_id']})
    assert latest(client).status_code == 503


def test_request_cannot_change_bound_source_and_generated_masks_match_labels(linked):
    client, service, state = linked
    run = verify(client).json()
    for scenario in run['scenarios']:
        with service._decode(scenario['mask_image']) as image:
            assert any(image.tobytes()) is (scenario['label'] == 'defect')
    state['job']['output']['output_digest'] = '1' * 64
    state['job']['output_digest'] = '1' * 64
    assert verify(client, request_id=run['request_id']).status_code == 409
    assert FakeYolo.calls == 3


def test_public_detect_cannot_inject_trusted_source_context(linked):
    client, _, _ = linked
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'yolo', 'model_id': 'yolo-default', 'image': picture(),
        'source_context': {'source': source_job()}})
    assert response.status_code == 422
    assert not FakeYolo.calls


def test_replay_repairs_missing_latest_pointer_after_initial_crash_gap(linked):
    from app.vision.production import ProductionVisionService
    client, service, _ = linked
    flow = ProductionVisionService(service)
    run = verify(client).json()
    run['status'] = 'running'
    flow._save('A', run)
    flow._pointer_path('A', JOB).unlink()
    assert latest(client).json() == {'run': None}
    restored = verify(client, request_id=run['request_id']).json()
    assert restored['status'] == 'failed'
    assert latest(client).json() == {'run': restored}
    assert FakeYolo.calls == 3


def test_replay_repairs_older_pointer_but_never_replaces_a_newer_run(linked):
    from app.vision.production import ProductionVisionService
    client, service, _ = linked
    flow = ProductionVisionService(service)
    older = verify(client).json()
    previous_pointer = flow._pointer_path('A', JOB).read_bytes()
    newer = verify(client).json()
    flow._pointer_path('A', JOB).write_bytes(previous_pointer)
    assert verify(client, request_id=newer['request_id']).json() == newer
    assert latest(client).json()['run'] == newer
    assert verify(client, request_id=older['request_id']).json() == older
    assert latest(client).json()['run'] == newer
    assert FakeYolo.calls == 6


def test_pointer_repair_never_hides_corruption_or_dangling_target(linked):
    from app.vision.production import ProductionVisionService
    client, service, _ = linked
    flow = ProductionVisionService(service)
    run = verify(client).json()
    pointer = flow._pointer_path('A', JOB)
    for value in [{'owner_id': 'B', 'job_id': JOB, 'run_id': run['run_id']},
                  {'owner_id': 'A', 'job_id': JOB, 'run_id': 'PV-' + '0' * 32}]:
        service._atomic_json(pointer, value)
        response = verify(client, request_id=run['request_id'])
        assert response.status_code == 503
        assert json.loads(pointer.read_text(encoding='utf-8')) == value
    assert FakeYolo.calls == 3


def test_idempotent_replay_skips_pointer_repair_while_flow_lock_is_held(linked):
    from app.vision.production import ProductionVisionService, _FLOW_LOCK
    client, service, _ = linked
    flow = ProductionVisionService(service)
    run = verify(client).json()
    pointer = flow._pointer_path('A', JOB)
    pointer.unlink()
    assert _FLOW_LOCK.acquire(blocking=False)
    try:
        assert verify(client, request_id=run['request_id']).json() == run
        assert not pointer.exists()
    finally:
        _FLOW_LOCK.release()
    assert verify(client, request_id=run['request_id']).json() == run
    assert latest(client).json()['run'] == run


def test_zero_overlap_image_alarms_are_not_localization_true_positives(linked):
    client, _, _ = linked
    run = verify(client).json()
    assert run['metrics']['patchcore']['tp'] == 2  # Alarm-only result, not localization.
    assert run['localization_metrics'] == {
        'method': 'label_agnostic_bbox_iou', 'iou_threshold': .5,
        'patchcore': {'tp': 0, 'fn': 2, 'fp': 3, 'ground_truth_count': 2},
        'yolo': {'tp': 0, 'fn': 2, 'fp': 0, 'ground_truth_count': 2}}
    for scene in run['scenarios']:
        evaluation = scene['localization']
        assert len(evaluation['ground_truth_boxes']) == (0 if scene['label'] == 'normal' else 1)
        assert evaluation['results']['patchcore']['tp'] == 0
        assert evaluation['results']['patchcore']['fp'] == 1
        assert scene['results'][0]['defects'][0]['confidence'] is None
    assert latest(client).json()['run'] == run


def test_full_frame_patchcore_region_does_not_count_as_precise_localization(linked, monkeypatch):
    client, _, _ = linked
    original = FakePatchCore.predict

    def full_frame(self, image, *args):
        result = original(self, image, *args)
        result['defects'][0]['bbox'] = [0, 0, image.width, image.height]
        return result

    monkeypatch.setattr(FakePatchCore, 'predict', full_frame)
    run = verify(client).json()
    assert run['metrics']['patchcore']['tp'] == 2
    assert run['localization_metrics']['patchcore'] == {'tp': 0, 'fn': 2, 'fp': 3, 'ground_truth_count': 2}
    for scene in run['scenarios'][1:]:
        ground_truth = scene['localization']['ground_truth_boxes'][0]
        predicted = scene['results'][0]['defects'][0]['bbox']
        assert predicted[0] <= ground_truth[0] < ground_truth[2] <= predicted[2]
        assert predicted[1] <= ground_truth[1] < ground_truth[3] <= predicted[3]
        assert scene['localization']['results']['patchcore']['fn'] == 1


def test_localization_counts_and_ground_truth_are_recomputed_on_read(linked):
    from app.vision.production import ProductionVisionService
    client, service, _ = linked
    flow = ProductionVisionService(service)
    run = verify(client).json()
    run['localization_metrics']['patchcore']['tp'] = 2
    flow._save('A', run)  # Even a freshly hashed but inconsistent record is rejected.
    assert latest(client).status_code == 409
    run = verify(client).json()
    run['scenarios'][1]['localization']['ground_truth_boxes'] = [[1, 2, 5, 6]]
    flow._save('A', run)
    assert latest(client).status_code == 409


def test_historical_records_without_localization_remain_unmodified_and_readable(linked):
    from app.vision.production import ProductionVisionService
    client, service, _ = linked
    flow = ProductionVisionService(service)
    old = verify(client).json()
    old.pop('localization_metrics', None)
    for scene in old['scenarios']:
        scene.pop('localization', None)
    flow._save('A', old)
    path = flow._folder('A') / 'runs' / (old['run_id'] + '.json')
    saved_bytes = path.read_bytes()
    assert latest(client).json()['run'] == old
    assert verify(client, request_id=old['request_id']).json() == old
    assert path.read_bytes() == saved_bytes


def yolo_metadata(service, root, monkeypatch, **changes):
    path = root / 'calibrated-yolo.json'
    record = {'name': 'Calibrated test deployment', 'weights_sha256': service._digest(root / 'yolo.pt'),
              'recommended_confidence': .6, 'recommended_iou': .45,
              'calibration_scope': 'synthetic_calibration_only', **changes}
    path.write_text(json.dumps(record), encoding='utf-8')
    monkeypatch.setenv('QUALITY_YOLO_METADATA', str(path))


def test_production_uses_saved_yolo_defaults_and_retains_parameter_provenance(linked, monkeypatch):
    client, service, _ = linked
    yolo_metadata(service, service.root.parent, monkeypatch, recommended_confidence=.65, recommended_iou=.35)
    model = next(item for item in client.get('/api/quality/vision/capabilities').json()['models'] if item['algorithm'] == 'yolo')
    assert model['recommended_confidence'] == .65 and model['recommended_iou'] == .35
    assert model['calibration_scope'] == 'synthetic_calibration_only'
    run = verify(client).json()
    assert run['status'] == 'completed'
    for scene in run['scenarios']:
        result = next(item for item in scene['results'] if item['algorithm'] == 'yolo')
        assert result['parameters'] == {'threshold': .65, 'confidence': .65, 'iou': .35, 'input_size': 640}
        assert result['model']['recommended_confidence'] == .65
    assert latest(client).json()['run'] == run


@pytest.mark.parametrize('changes', [
    {'recommended_confidence': 0}, {'recommended_confidence': 1.1}, {'recommended_confidence': True},
    {'recommended_confidence': '0.5'}, {'recommended_confidence': float('nan')},
    {'recommended_iou': 0}, {'recommended_iou': float('inf')}, {'calibration_scope': {}},
])
def test_invalid_calibrated_model_metadata_fails_safely_before_inference(linked, monkeypatch, changes):
    client, service, _ = linked
    yolo_metadata(service, service.root.parent, monkeypatch, **changes)
    caps = client.get('/api/quality/vision/capabilities').json()
    assert not next(item for item in caps['algorithms'] if item['id'] == 'yolo')['available']
    result = verify(client).json()
    assert result['status'] == 'failed'
    assert not FakeYolo.calls and result['scenarios'] == []


def test_yolo_metadata_without_recommendation_keeps_existing_defaults(linked, monkeypatch):
    _, service, _ = linked
    assert service._yolo_model()['recommended_confidence'] == .25
    assert service._yolo_model()['recommended_iou'] == .45
    yolo_metadata(service, service.root.parent, monkeypatch)
    path = service.root.parent / 'calibrated-yolo.json'
    value = json.loads(path.read_text())
    value.pop('recommended_confidence')
    value.pop('recommended_iou')
    path.write_text(json.dumps(value), encoding='utf-8')
    assert service._yolo_model()['recommended_confidence'] == .25
    assert service._yolo_model()['recommended_iou'] == .45
