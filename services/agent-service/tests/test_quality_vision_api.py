"""HTTP/storage boundary tests use fake detectors, not actual model validation."""
import base64
import json
from io import BytesIO
from types import SimpleNamespace

import numpy as np
from PIL import Image
import pytest
from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient

from app.api.quality_vision import CalibrateRequest, build_quality_vision_router
from app.vision.calibration import threshold_strategies
from app.vision.combined import CombinedQualityService
from app.vision.service import VisionService


def install_test_preset(service, root, monkeypatch):
    folder = root / 'preset'
    folder.mkdir()
    bank = folder / 'memory.npz'
    np.savez_compressed(bank, memory_bank=np.ones((4, 6), dtype=np.float32))
    record = {'model_id': 'patchcore-demo', 'name': '合成演示', 'algorithm': 'patchcore',
              'sample_count': 12, 'memory_size': 4, 'suggested_threshold': 0.5,
              'description': '仅用于合成纹理验证', 'demo': True,
              'weights_sha256': service._digest(root / 'trusted-backbone.pt'),
              'memory_bank_sha256': service._digest(bank)}
    (folder / 'model.json').write_text(json.dumps(record), encoding='utf-8')
    monkeypatch.setenv('QUALITY_PATCHCORE_PRESET_DIR', str(folder))
    return folder


def test_shared_preset_is_read_only_and_inspections_remain_private(connected, monkeypatch):
    client, service, root = connected
    folder = install_test_preset(service, root, monkeypatch)
    metadata_before = (folder / 'model.json').read_bytes()
    model = client.get('/api/quality/vision/capabilities').json()['models'][0]
    assert model['model_id'] == 'patchcore-demo' and model['read_only'] and model['demo']
    assert 'weights_sha256' not in model
    body = {'algorithm': 'patchcore', 'model_id': 'patchcore-demo', 'image': picture(), 'threshold': 0.5}
    response = client.post('/api/quality/vision/detect', json=body)
    assert response.status_code == 200, response.text
    record = response.json()
    assert record['model']['demo'] and record['model']['read_only']
    assert client.post('/api/quality/vision/patchcore/calibrate', json={
        'model_id': 'patchcore-demo', 'normal_images': [picture(), picture('gray')],
        'defect_images': [picture('black')]}).status_code == 403
    assert (folder / 'model.json').read_bytes() == metadata_before
    client.cookies.set('maintenance_session', 'B')
    assert client.get('/api/quality/vision/capabilities').json()['models'] == [model]
    assert client.get('/api/quality/vision/inspections/' + record['inspection_id']).status_code == 404
    assert client.post('/api/quality/vision/detect', json=body).status_code == 200


def test_auto_inbox_status_requires_session_and_reports_when_not_configured(connected):
    client, _, _ = connected
    response = client.get('/api/quality/vision/auto/status')
    assert response.status_code == 200
    assert response.json() == {'enabled': False, 'running': False}
    client.cookies.clear()
    assert client.get('/api/quality/vision/auto/status').status_code == 401


def test_auto_inbox_latest_is_read_only_and_session_bound(connected):
    _, service, _ = connected
    class Backend:
        def resolve_session(self, token):
            return {'user_id': token, 'role': 'technician'} if token == 'A' else None
    class Inbox:
        def __init__(self):
            self.starts = 0
        def start(self):
            self.starts += 1
        def status(self):
            return {'enabled': True, 'running': True, 'input_dir': 'test-inbox',
                    'pending_count': 0, 'processed_count': 1, 'failed_count': 0,
                    'last_error': '', 'latest': None}
        def latest(self):
            return {'inspection_id': 'VI-' + 'a' * 32, 'image_source': 'local_inbox'}
    inbox = Inbox()
    app = FastAPI()
    app.include_router(build_quality_vision_router(lambda request: None, backend_factory=Backend,
                                                   service=service, auto_inbox=inbox))
    client = TestClient(app)
    client.cookies.set('maintenance_session', 'A')
    assert inbox.starts == 1
    assert client.get('/api/quality/vision/auto/status').json()['running'] is True
    assert client.get('/api/quality/vision/auto/latest').json()['image_source'] == 'local_inbox'
    client.cookies.clear()
    assert client.get('/api/quality/vision/auto/latest').status_code == 401


def test_part_segmentation_is_authenticated_and_never_creates_defect_inspection(connected, monkeypatch):
    client, _, root = connected
    weights = root / 'part-seg.pt'
    weights.write_bytes(b'test weights; model load is stubbed')
    monkeypatch.setenv('QUALITY_PART_SEG_WEIGHTS', str(weights))

    class FakeSegmenter:
        def __init__(self, path):
            assert path == weights

        def predict(self, image, confidence):
            assert image.size == (24, 20) and confidence == .4
            return {'image': {'width': 24, 'height': 20}, 'detections': [
                {'class': 'endface', 'conf': .95, 'box': [1, 2, 20, 18], 'mask_area': 200}],
                'annotated_image': picture(), 'inference_ms': 2.0}

    monkeypatch.setattr('app.vision.part_segmentation.PartSegmenter', FakeSegmenter)
    assert client.get('/api/quality/vision/capabilities').json()['part_segmentation']['available'] is True
    endpoint = '/api/quality/vision/part-segmentation/predict'
    result = client.post(endpoint, json={'image': picture(), 'confidence': .4})
    assert result.status_code == 200, result.text
    assert result.json()['purpose'] == 'part_segmentation'
    assert result.json()['detections'][0]['class'] == 'endface'
    assert 'status' not in result.json() and 'inspection_id' not in result.json()
    assert not list((root / 'vision').rglob('VI-*.json'))
    assert client.post(endpoint, json={'image': picture(), 'confidence': 0}).status_code == 422
    client.cookies.clear()
    assert client.post(endpoint, json={'image': picture(), 'confidence': .4}).status_code == 401


def test_gear_memory_is_selectable_and_can_qualify_production_parts(connected, monkeypatch):
    client, service, root = connected
    folder = root / 'gear-memory'
    folder.mkdir()
    bank = folder / 'memory.npz'
    np.savez_compressed(bank, memory_bank=np.ones((4, 6), dtype=np.float32))
    strategies = threshold_strategies([.2, .4], [.8])
    record = {'model_id': 'patchcore-gear', 'name': '齿轮正常记忆库',
              'algorithm': 'patchcore', 'sample_count': 2068, 'memory_size': 4,
              'suggested_threshold': strategies['balanced']['threshold'],
              'threshold_method': 'independent_labeled_calibration',
              'calibration_required': False,
              'calibration': {'policy': 'balanced', 'normal_count': 2, 'defect_count': 1,
                              'created_at': '2026-10-21T00:00:00Z', 'strategies': strategies},
              'read_only': True,
              'weights_sha256': service._digest(root / 'trusted-backbone.pt'),
              'memory_bank_sha256': service._digest(bank)}
    (folder / 'model.json').write_text(json.dumps(record), encoding='utf-8')
    monkeypatch.setenv('QUALITY_PATCHCORE_GEAR_PRESET_DIR', str(folder))
    models = client.get('/api/quality/vision/capabilities').json()['models']
    assert [model['model_id'] for model in models] == ['patchcore-gear']
    assert models[0]['read_only'] is True
    body = {'algorithm': 'patchcore', 'model_id': 'patchcore-gear',
            'image': picture(), 'threshold': record['suggested_threshold']}
    assert client.post('/api/quality/vision/detect', json=body).status_code == 200
    production = CombinedQualityService(service).register('A', {
        'scope': 'production', 'batch_id': 'batch-1', 'serial_number': 'part-1',
        'design_version': 'v1'})
    response = client.post('/api/quality/vision/detect', json={
        **body, 'quality_part_id': production['quality_part_id']})
    assert response.status_code == 200, response.text
    assert len(list((root / 'vision').rglob('VI-*.json'))) == 2
    record['weights_sha256'] = '0' * 64
    (folder / 'model.json').write_text(json.dumps(record), encoding='utf-8')
    caps = client.get('/api/quality/vision/capabilities').json()
    assert caps['models'] == [] and caps['model_warnings']


def test_corrupt_preset_warns_without_disabling_personal_training(connected, monkeypatch):
    client, service, root = connected
    folder = install_test_preset(service, root, monkeypatch)
    (folder / 'memory.npz').write_bytes(b'wrong bank')
    caps = client.get('/api/quality/vision/capabilities').json()
    assert caps['models'] == [] and caps['model_warnings']
    assert caps['algorithms'][0]['can_train']
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'patchcore', 'model_id': 'patchcore-demo', 'image': picture(), 'threshold': 0.5})
    assert response.status_code == 503
    assert not list((root / 'vision').rglob('VI-*.json'))
    assert train(client).status_code == 200


@pytest.mark.parametrize('changes', [
    {'sample_count': 1}, {'pipeline_version': 'two'},
    {'calibration_required': False, 'calibration': {}},
    {'calibration_required': False},
    {'calibration_required': False, 'threshold_method': 'independent_labeled_synthetic_calibration',
     'calibration': {'policy': 'recall_priority', 'normal_count': 24, 'defect_count': 72,
                     'created_at': '2026-10-19T00:00:00Z', 'strategies': {}}},
])
def test_malformed_preset_metadata_isolated_from_catalog(connected, monkeypatch, changes):
    client, service, root = connected
    folder = install_test_preset(service, root, monkeypatch)
    path = folder / 'model.json'
    value = json.loads(path.read_text(encoding='utf-8'))
    path.write_text(json.dumps({**value, **changes}), encoding='utf-8')
    caps = client.get('/api/quality/vision/capabilities').json()
    assert not caps['models'] and caps['model_warnings']
    assert caps['algorithms'][0]['can_train']


def test_memory_bank_change_during_inference_cannot_save_mismatched_evidence(connected, monkeypatch):
    client, service, root = connected
    folder = install_test_preset(service, root, monkeypatch)
    original_predict = FakePatchCore.predict
    def predict_and_replace(self, *args):
        result = original_predict(self, *args)
        np.savez_compressed(folder / 'memory.npz', memory_bank=np.zeros((4, 6), dtype=np.float32))
        return result
    monkeypatch.setattr(FakePatchCore, 'predict', predict_and_replace)
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'patchcore', 'model_id': 'patchcore-demo', 'image': picture(), 'threshold': 0.5})
    assert response.status_code == 409
    assert not list((root / 'vision').rglob('VI-*.json'))


def test_yolo_deployment_identity_and_provenance_are_verified(connected, monkeypatch):
    client, service, root = connected
    service.readiness = lambda algorithm: (True, '')
    weights = root / 'defect.onnx'
    weights.write_bytes(b'bounded model test')
    metadata = root / 'model.json'
    metadata.write_text(json.dumps({'name': 'NEU-DET 研究验证', 'description': '钢材表面',
        'classes': ['scratches'], 'source_url': 'https://example.com/model', 'demo': True,
        'weights_sha256': service._digest(weights)}), encoding='utf-8')
    monkeypatch.setenv('QUALITY_YOLO_WEIGHTS', str(weights))
    monkeypatch.setenv('QUALITY_YOLO_METADATA', str(metadata))
    caps = client.get('/api/quality/vision/capabilities').json()
    assert caps['models'][0]['name'] == 'NEU-DET 研究验证'
    assert caps['models'][0]['classes'] == ['scratches']
    weights.write_bytes(b'changed model')
    caps = client.get('/api/quality/vision/capabilities').json()
    assert not caps['algorithms'][1]['available'] and caps['models'] == []
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'yolo', 'model_id': 'yolo-default', 'image': picture()})
    assert response.status_code == 503
    assert not list((root / 'vision').rglob('VI-*.json'))


def picture(color='white'):
    stream = BytesIO()
    Image.new('RGB', (24, 20), color).save(stream, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode()


class FakePatchCore:
    calls = 0

    def __init__(self, weights, config=None):
        self.config = config

    def fit(self, images, coreset_ratio):
        type(self).calls += 1
        count = sum(1 for image in images)
        return {'memory_bank': np.ones((4, 6), dtype=np.float32), 'metadata': {
                'sample_count': count, 'memory_size': 4, 'suggested_threshold': 0.5,
                'calibration_required': True, 'threshold_method': 'fake calibration for boundary test'}}

    def anomaly_map(self, image, bank):
        return np.full((image.height, image.width), image.getpixel((0, 0))[0] / 255, dtype=np.float32)

    def predict(self, image, memory_bank, threshold):
        assert memory_bank.shape == (4, 6)
        return {'algorithm': 'patchcore', 'status': 'defect', 'score': 1.0, 'threshold': threshold,
                'defects': [{'label': 'anomaly', 'confidence': None, 'bbox': [1, 2, 5, 6]}],
                'image': {'width': image.width, 'height': image.height}, 'annotated_image': picture(),
                'steps': [{'name': 'fake inference for boundary test', 'status': 'completed', 'detail': 'stub'}]}


@pytest.fixture
def connected(tmp_path, monkeypatch):
    monkeypatch.delenv('QUALITY_VISION_AUTO_INBOX_DIR', raising=False)
    monkeypatch.setenv('QUALITY_PATCHCORE_BACKBONE_WEIGHTS', str(tmp_path / 'trusted-backbone.pt'))
    (tmp_path / 'trusted-backbone.pt').write_bytes(b'test weights; never deserialized')
    monkeypatch.delenv('QUALITY_YOLO_WEIGHTS', raising=False)
    from app.vision import algorithms
    fake = SimpleNamespace(PatchCoreDetector=FakePatchCore, YoloDetector=None,
                           decode_image=algorithms.decode_image, VisionUnavailable=algorithms.VisionUnavailable)
    service = VisionService(tmp_path / 'vision', algorithms=fake,
                           readiness=lambda algorithm: (True, '') if algorithm == 'patchcore' else (False, '未配置 YOLO 缺陷权重'))
    class Backend:
        def resolve_session(self, token):
            return {'user_id': token, 'role': 'technician'} if token in {'A', 'B'} else None
    def write_auth(request: Request):
        if request.headers.get('x-write') != 'allowed':
            raise HTTPException(401, 'write credential required')
    app = FastAPI()
    app.include_router(build_quality_vision_router(write_auth, backend_factory=Backend, service=service))
    client = TestClient(app)
    client.cookies.set('maintenance_session', 'A')
    client.headers['x-write'] = 'allowed'
    return client, service, tmp_path


def train(client, **changes):
    return client.post('/api/quality/vision/patchcore/train', json={
        'name': '正常件基准', 'images': [picture(), picture()], 'coreset_ratio': 0.1, **changes})


def test_unset_calibration_policy_defaults_to_balanced():
    request = CalibrateRequest(model_id='PC-' + 'a' * 32,
                               normal_images=[picture(), picture('gray')],
                               defect_images=[picture('black')])
    assert request.policy == 'balanced'


def test_session_and_write_authorization_and_same_origin_are_required(connected):
    client, _, _ = connected
    client.cookies.clear()
    assert client.get('/api/quality/vision/capabilities').status_code == 401
    assert train(client).status_code == 401
    client.cookies.set('maintenance_session', 'A')
    client.headers.pop('x-write')
    assert train(client).status_code == 401
    client.headers['x-write'] = 'allowed'
    client.headers['origin'] = 'https://other.example'
    assert train(client).status_code == 403


def test_capability_contract_and_persisted_models_and_inspections_are_owner_isolated(connected):
    client, service, root = connected
    caps = client.get('/api/quality/vision/capabilities').json()
    assert [a['id'] for a in caps['algorithms']] == ['patchcore', 'yolo']
    assert caps['limits'] == {'max_image_bytes': 4194304, 'max_training_images': 100}
    response = train(client)
    assert response.status_code == 200, response.text
    model = response.json()
    assert model['algorithm'] == 'patchcore' and model['sample_count'] == 2
    assert model['memory_size'] == 4 and model['suggested_threshold'] == 0.5
    body = {'algorithm': 'patchcore', 'model_id': model['model_id'], 'image': picture(),
            'filename': 'part.png', 'part_id': 'PART-42', 'threshold': 0.7}
    detected = client.post('/api/quality/vision/detect', json=body)
    assert detected.status_code == 200, detected.text
    record = detected.json()
    assert record['status'] == 'defect' and record['part_id'] == 'PART-42'
    assert record['threshold'] == 0.7 and record['inspection_id']
    assert len(record['model_sha256']) == len(record['image_sha256']) == 64
    assert record['image_digest_format'] == 'rgb-pixels-with-size-v1'
    assert record['parameters'] == {'threshold': 0.7, 'confidence': 0.25, 'iou': 0.45,
                                    'preprocessing': model['preprocessing']}
    assert 'passed' not in record and 'quality_check_id' not in record
    route = '/api/quality/vision/inspections/' + record['inspection_id']
    assert client.get(route).json() == record
    assert len(list((root / 'vision').rglob('*.npz'))) == 1
    assert model in client.get('/api/quality/vision/capabilities').json()['models']
    client.cookies.set('maintenance_session', 'B')
    assert client.get('/api/quality/vision/capabilities').json()['models'] == []
    assert client.post('/api/quality/vision/detect', json=body).status_code == 404
    assert client.get(route).status_code == 404
    # A new service instance reads the same atomic disk snapshot.
    reloaded = VisionService(root / 'vision', algorithms=service.algorithms, readiness=service.readiness)
    assert reloaded.get_inspection('A', record['inspection_id']) == record


@pytest.mark.parametrize('changes', [
    {'images': ['not an image', 'not an image']}, {'images': [picture()]},
    {'images': [picture()] * 101}, {'coreset_ratio': 0}, {'name': ''}, {'weights': 'arbitrary.pt'},
])
def test_invalid_training_input_never_saves_a_model(connected, changes):
    client, _, root = connected
    assert train(client, **changes).status_code == 422
    assert not list((root / 'vision').rglob('*.npz'))


def test_hundred_normal_images_use_bounded_streaming_coreset(connected, monkeypatch):
    client, _, _ = connected
    from app.vision import offline
    seen = {}

    def fake_fit(detector, images, expected_count, per_image_features, coreset_ratio):
        seen.update(expected_count=expected_count, per_image_features=per_image_features,
                    coreset_ratio=coreset_ratio, processed=sum(1 for _ in images))
        return {'memory_bank': np.ones((4, 6), dtype=np.float32), 'metadata': {
            'suggested_threshold': 0.5, 'calibration_required': True,
            'threshold_method': 'heuristic_training_candidate_patch_p99_times_1.2_floor_0.001'}}

    monkeypatch.setattr(offline, 'fit_full_memory', fake_fit)
    response = train(client, images=[picture()] * 100)
    assert response.status_code == 200, response.text
    assert response.json()['sample_count'] == 100
    assert seen == {'expected_count': 100, 'per_image_features': 32,
                    'coreset_ratio': 0.1, 'processed': 100}


def test_missing_models_dependencies_and_threshold_do_not_claim_clear(connected):
    client, service, root = connected
    body = {'algorithm': 'patchcore', 'model_id': 'PC-' + 'a' * 32,
            'image': picture(), 'filename': 'x.png', 'threshold': 0.5}
    assert client.post('/api/quality/vision/detect', json=body).status_code == 404
    del body['threshold']
    assert client.post('/api/quality/vision/detect', json=body).status_code == 422
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'yolo', 'model_id': 'yolo-default', 'image': picture(), 'filename': 'x.png'})
    assert response.status_code == 503 and 'clear' not in response.text
    service.readiness = lambda algorithm: (False, '视觉运行依赖未安装')
    assert train(client).status_code == 503
    assert not list((root / 'vision').rglob('*.npz'))


def test_body_limit_json_and_busy_boundaries(connected):
    client, service, _ = connected
    response = client.post('/api/quality/vision/patchcore/train', content=b'{}',
                           headers={'Content-Length': str(40 * 1024 * 1024 + 1), 'Content-Type': 'application/json'})
    assert response.status_code == 413
    assert client.post('/api/quality/vision/patchcore/train', content=b'{',
                       headers={'Content-Type': 'application/json'}).status_code == 422
    with service.task_lock:
        assert train(client).status_code == 409


def test_weight_change_invalidates_memory_and_internal_errors_do_not_leak_paths(connected):
    client, service, root = connected
    model = train(client).json()
    (root / 'trusted-backbone.pt').write_bytes(b'different backbone')
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'patchcore', 'model_id': model['model_id'], 'image': picture(),
        'filename': 'x.png', 'threshold': 0.5})
    assert response.status_code == 409
    assert str(root) not in response.text
    assert not list((root / 'vision').rglob('VI-*.json'))


def test_inconsistent_detector_result_is_not_saved(connected, monkeypatch):
    client, _, root = connected
    model = train(client).json()
    monkeypatch.setattr(FakePatchCore, 'predict', lambda *args: {
        'algorithm': 'patchcore', 'status': 'clear', 'score': 0.9, 'threshold': 0.5,
        'defects': [], 'image': {'width': 24, 'height': 20}, 'annotated_image': picture(),
        'steps': [{'name': 'invalid result', 'status': 'completed', 'detail': 'stub'}]})
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'patchcore', 'model_id': model['model_id'], 'image': picture(),
        'filename': 'x.png', 'threshold': 0.5})
    assert response.status_code == 503
    assert not list((root / 'vision').rglob('VI-*.json'))


@pytest.mark.parametrize('confidence', [None, -0.1, 1.1, float('nan'), 0.1])
def test_yolo_invalid_confidence_cannot_be_persisted(confidence):
    result = {'algorithm': 'yolo', 'status': 'defect', 'score': 0.8, 'threshold': 0.25,
              'defects': [{'label': 'scratch', 'confidence': confidence, 'bbox': [1, 2, 5, 6]}],
              'image': {'width': 24, 'height': 20}, 'annotated_image': picture(),
              'steps': [{'name': 'inference', 'status': 'completed', 'detail': 'stub'}]}
    with pytest.raises(ValueError):
        VisionService._validate_result(result, 'yolo', (24, 20))


def test_unpickled_memory_and_atomic_model_publication(connected, monkeypatch):
    client, service, root = connected
    model = train(client).json()
    bank = next((root / 'vision').rglob('*.npz'))
    np.savez_compressed(bank, memory_bank=np.array([{'untrusted': 'object array'}], dtype=object))
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'patchcore', 'model_id': model['model_id'], 'image': picture(),
        'filename': 'x.png', 'threshold': 0.5})
    assert response.status_code == 503
    assert not list((root / 'vision').rglob('VI-*.json'))
    def unavailable_storage(*args):
        raise OSError('private local path must not appear in response')
    monkeypatch.setattr(service, '_atomic_json', unavailable_storage)
    failed = train(client)
    assert failed.status_code == 503 and 'private local path' not in failed.text
    assert list((root / 'vision').rglob('*.npz')) == [bank]
    assert len(client.get('/api/quality/vision/capabilities').json()['models']) == 1


def test_training_streams_original_frames_and_closes_them_and_body_is_limited(connected, monkeypatch):
    client, service, _ = connected
    fit = FakePatchCore.fit
    seen = []
    def capture(self, images, coreset_ratio):
        def capture_stream():
            for image in images:
                seen.append(image)
                yield image
        return fit(self, capture_stream(), coreset_ratio)
    monkeypatch.setattr(FakePatchCore, 'fit', capture)
    assert train(client).status_code == 200
    assert [image.size for image in seen] == [(24, 20), (24, 20)]
    for image in seen:
        with pytest.raises(ValueError):
            image.getpixel((0, 0))
    from app.api import quality_vision
    monkeypatch.setattr(quality_vision, 'MAX_REQUEST_BYTES', 128)
    response = client.post('/api/quality/vision/patchcore/train',
                           content=iter([b'{', b'x' * 256]), headers={'Content-Type': 'application/json'})
    assert response.status_code == 413


def calibrate(client, model_id, **changes):
    return client.post('/api/quality/vision/patchcore/calibrate', json={
        'model_id': model_id,
        'normal_images': [picture((10, 10, 10)), picture((20, 20, 20))],
        'defect_images': [picture((180, 180, 180)), picture((220, 220, 220))],
        'policy': 'recall_priority', **changes})


def test_preprocessing_saved_and_used_for_calibration_and_detection(connected, monkeypatch):
    client, service, root = connected
    config = {'input_size': 448, 'resize_mode': 'letterbox', 'contrast': 'clahe', 'blur_sigma': 2.0}
    model = train(client, preprocessing=config).json()
    assert model['preprocessing'] == config
    assert model['pipeline_version'] == 2
    seen = []
    original = FakePatchCore.anomaly_map
    def capture(self, image, bank):
        seen.append(self.config)
        return original(self, image, bank)
    monkeypatch.setattr(FakePatchCore, 'anomaly_map', capture)
    response = calibrate(client, model['model_id'])
    assert response.status_code == 200, response.text
    calibrated = response.json()
    assert seen == [config] * 4
    assert calibrated['calibration_required'] is False
    assert calibrated['threshold_method'] == 'independent_labeled_calibration'
    assert calibrated['calibration']['normal_count'] == 2
    assert calibrated['calibration']['defect_count'] == 2
    assert calibrated['suggested_threshold'] == calibrated['calibration']['strategies']['recall_priority']['threshold']
    assert calibrated['calibration']['strategies']['recall_priority']['metrics']['fnr'] == 0
    assert client.get('/api/quality/vision/capabilities').json()['models'] == [calibrated]
    predict = FakePatchCore.predict
    def capture_predict(self, image, bank, threshold):
        seen.append(self.config)
        return predict(self, image, bank, threshold)
    monkeypatch.setattr(FakePatchCore, 'predict', capture_predict)
    response = client.post('/api/quality/vision/detect', json={
        'algorithm': 'patchcore', 'model_id': model['model_id'], 'image': picture(), 'threshold': 0.7})
    assert response.status_code == 200, response.text
    assert seen[-1] == config
    assert response.json()['parameters']['preprocessing'] == config
    assert 'training_image_sha256' not in calibrated


@pytest.mark.parametrize('changes', [
    {'normal_images': [picture(), picture('black')]},  # training image leakage
    {'defect_images': [picture((10, 10, 10))]},  # duplicate across classes
    {'normal_images': [picture('black'), picture('black')]},  # duplicate within class
    {'normal_images': [picture('black')]}, {'defect_images': []}, {'policy': 'unknown'},
])
def test_calibration_rejects_leakage_duplicates_and_missing_classes(connected, changes):
    client, _, _ = connected
    model = train(client).json()
    response = calibrate(client, model['model_id'], **changes)
    assert response.status_code == 422, response.text
    assert client.get('/api/quality/vision/capabilities').json()['models'][0]['calibration_required'] is True


def test_calibration_is_authenticated_isolated_and_rejects_stale_weights(connected):
    client, service, root = connected
    model = train(client).json()
    client.cookies.set('maintenance_session', 'B')
    assert calibrate(client, model['model_id']).status_code == 404
    client.cookies.clear()
    assert calibrate(client, model['model_id']).status_code == 401
    client.cookies.set('maintenance_session', 'A')
    with service.task_lock:
        assert calibrate(client, model['model_id']).status_code == 409
    (root / 'trusted-backbone.pt').write_bytes(b'changed')
    assert calibrate(client, model['model_id']).status_code == 409


@pytest.mark.parametrize('config', [
    {'input_size': 1024}, {'input_size': True}, {'resize_mode': 'crop'}, {'contrast': 'global'},
    {'blur_sigma': -1}, {'blur_sigma': 9}, {'blur_sigma': True}, {'arbitrary': 'path'},
])
def test_invalid_preprocessing_is_rejected_before_training(connected, config):
    client, _, root = connected
    assert train(client, preprocessing=config).status_code == 422
    assert not list((root / 'vision').rglob('*.npz'))
