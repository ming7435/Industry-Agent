"""Exercise orchestration with controlled detectors; accuracy is verified separately."""
import pytest

from app.vision.combined import CombinedQualityService
from app.vision.service import VisionServiceError
from test_quality_vision_api import connected, install_test_preset, picture
from test_combined_quality import register, review


ENDPOINT = '/api/quality/vision/pipeline/detect'


@pytest.fixture
def pipeline(connected, monkeypatch):
    client, service, root = connected
    install_test_preset(service, root, monkeypatch)
    weights = root / 'fake-yolo.pt'
    weights.write_bytes(b'not loaded; controlled detector')
    monkeypatch.setenv('QUALITY_YOLO_WEIGHTS', str(weights))
    monkeypatch.delenv('QUALITY_YOLO_METADATA', raising=False)
    monkeypatch.setattr(service, 'readiness', lambda name: (True, ''))
    calls, behavior = [], {'pc': 'defect', 'yolo': 'defect'}

    class PC:
        def __init__(self, *args, **kwargs):
            pass

        def predict(self, image, bank, threshold):
            calls.append(('patchcore', image.tobytes(), service.task_lock.locked()))
            if behavior['pc'] == 'failed':
                raise RuntimeError('controlled PC failure')
            defect = behavior['pc'] == 'defect'
            return {'algorithm': 'patchcore', 'status': 'defect' if defect else 'clear',
                    'score': 1.0 if defect else .1, 'threshold': threshold,
                    'defects': [{'label': 'anomaly', 'confidence': None, 'bbox': [1, 2, 5, 6]}] if defect else [],
                    'image': {'width': image.width, 'height': image.height},
                    'annotated_image': picture(), 'heatmap_image': picture(),
                    'steps': [{'name': 'predict', 'status': 'completed', 'detail': 'controlled inference'}]}

    class YOLO:
        def __init__(self, *args, **kwargs):
            pass

        def predict(self, image, confidence, iou):
            calls.append(('yolo', image.tobytes(), service.task_lock.locked()))
            if behavior['yolo'] == 'failed':
                raise RuntimeError('controlled YOLO failure')
            defect = behavior['yolo'] == 'defect'
            return {'algorithm': 'yolo', 'status': 'defect' if defect else 'clear',
                    'score': .9 if defect else 0, 'threshold': confidence,
                    'defects': [{'label': 'scratch', 'confidence': .9, 'bbox': [1, 2, 5, 6]}] if defect else [],
                    'image': {'width': image.width, 'height': image.height}, 'annotated_image': picture(),
                    'steps': [{'name': 'detect', 'status': 'completed', 'detail': 'controlled inference'}]}

    monkeypatch.setattr(service.algorithms, 'PatchCoreDetector', PC)
    monkeypatch.setattr(service.algorithms, 'YoloDetector', YOLO)
    body = {'patchcore_model_id': 'patchcore-demo', 'image': picture(), 'filename': 'gear.png',
            'threshold': .5, 'confidence': .3, 'iou': .45}
    return client, service, body, calls, behavior


@pytest.mark.parametrize('pc,yolo,classification,state,order', [
    ('clear', 'failed', 'clear', 'skipped', ['patchcore']),
    ('defect', 'defect', 'known_defect', 'completed', ['patchcore', 'yolo']),
    ('defect', 'clear', 'unknown_anomaly', 'completed', ['patchcore', 'yolo']),
    ('defect', 'failed', 'localization_failed', 'failed', ['patchcore', 'yolo']),
])
def test_gated_order_same_pixels_and_persisted_verdict(pipeline, pc, yolo, classification, state, order):
    client, service, body, calls, behavior = pipeline
    behavior.update(pc=pc, yolo=yolo)
    response = client.post(ENDPOINT, json=body)
    assert response.status_code == 200, response.text
    record = response.json()
    assert [call[0] for call in calls] == order
    assert all(call[1:] == calls[0][1:] and call[2] for call in calls)
    assert record['classification'] == classification and record['yolo_state'] == state
    assert record['status'] == pc
    assert record['patchcore']['image_sha256'] == record['image_sha256']
    assert (record['yolo'] is None) == (state != 'completed')
    if record['yolo']:
        assert record['yolo']['image_sha256'] == record['image_sha256']
        assert record['patchcore']['created_at'] <= record['yolo']['created_at']
    path = '/api/quality/vision/inspections/' + record['inspection_id']
    assert client.get(path).json() == record
    assert not service.task_lock.locked()
    client.cookies.set('maintenance_session', 'B')
    assert client.get(path).status_code == 404


def test_pc_failure_or_busy_does_not_run_yolo_or_publish(pipeline):
    client, service, body, calls, behavior = pipeline
    behavior['pc'] = 'failed'
    assert client.post(ENDPOINT, json=body).status_code == 503
    assert [call[0] for call in calls] == ['patchcore']
    assert not list(service.root.rglob('VI-*.json'))
    with service._task():
        assert client.post(ENDPOINT, json=body).status_code == 409
    assert len(calls) == 1


def test_yolo_unavailable_retains_anomaly(pipeline, monkeypatch):
    client, service, body, calls, _ = pipeline
    monkeypatch.setattr(service, 'readiness', lambda name: (name == 'patchcore', '模型未配置'))
    result = client.post(ENDPOINT, json=body).json()
    assert result['status'] == 'defect' and result['yolo_state'] == 'failed'
    assert [c[0] for c in calls] == ['patchcore']


def test_request_authorization_and_client_verdicts_are_rejected(pipeline):
    client, _, body, calls, _ = pipeline
    for extra in ({'status': 'clear'}, {'yolo_state': 'skipped'}, {'source_context': {}}, {'threshold': 0}):
        assert client.post(ENDPOINT, json={**body, **extra}).status_code == 422
    assert client.post(ENDPOINT, json=body, headers={'origin': 'https://outside.invalid'}).status_code == 403
    client.headers.pop('x-write')
    assert client.post(ENDPOINT, json=body).status_code == 401
    client.headers['x-write'] = 'allowed'
    client.cookies.clear()
    assert client.post(ENDPOINT, json=body).status_code == 401
    assert not calls


@pytest.mark.parametrize('pc,yolo', [('clear', 'clear'), ('defect', 'defect'), ('defect', 'failed')])
def test_combined_review_references_whole_pipeline_and_invalidates_old_pass(pipeline, pc, yolo):
    client, service, body, _, behavior = pipeline
    part = register(client).json()
    approved, _ = review(client, part, 'visual', 'pass')
    assert approved.status_code == 200
    behavior.update(pc=pc, yolo=yolo)
    result = client.post(ENDPOINT, json={**body, 'quality_part_id': part['quality_part_id']}).json()
    current = CombinedQualityService(service).get_part('A', part['quality_part_id'])
    assert current['latest_inspection_id'] == result['inspection_id']
    assert current['visual']['decision'] == 'pending'
    response, _ = review(client, current, 'visual', 'pending', inspection_id=result['inspection_id'])
    assert response.status_code == 200, response.text
    evidence = response.json()['visual']['inspection_evidence']
    assert evidence['classification'] == result['classification']
    assert evidence['yolo_state'] == result['yolo_state']
    assert ('yolo' in evidence['stages']) == (result['yolo_state'] == 'completed')
