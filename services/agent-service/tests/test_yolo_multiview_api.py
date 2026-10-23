"""Exercise deployed crop configuration through the real authenticated API."""
import base64
from io import BytesIO
import json

from PIL import Image
import pytest

from test_quality_vision_api import connected
from test_yolo_multiview import CONFIG, box
from test_yolo_multiview import FINE


@pytest.fixture
def deployed(connected, monkeypatch):
    client, service, root = connected
    weights = root / 'fake.pt'
    weights.write_bytes(b'not deserialized')
    metadata = root / 'model.json'
    value = {'name': 'crop integration test', 'weights_sha256': service._digest(weights),
             'input_size': 640, 'inference': CONFIG}
    metadata.write_text(json.dumps(value), encoding='utf-8')
    monkeypatch.setenv('QUALITY_YOLO_WEIGHTS', str(weights))
    monkeypatch.setenv('QUALITY_YOLO_METADATA', str(metadata))
    service.readiness = lambda _: (True, '')
    calls = []
    behavior = {'change_config': False, 'fail_crop': False}

    class Detector:
        def __init__(self, path, input_size):
            assert path == str(weights) and input_size == 640

        def predict(self, image, confidence, iou):
            calls.append((image.size, confidence, iou))
            if behavior['change_config']:
                metadata.write_text(json.dumps({**value, 'inference': {**CONFIG, 'tile_confidence': .8}}), encoding='utf-8')
            if behavior['fail_crop'] and len(calls) == 2:
                raise RuntimeError('controlled crop failure')
            return {'defects': [box([10, 10, 30, 30])] if len(calls) == 5 else []}

    monkeypatch.setattr('app.vision.yolo_multiview.YoloDetector', Detector)
    with Image.new('RGB', (640, 480)) as image, BytesIO() as buffer:
        image.save(buffer, format='PNG')
        encoded = base64.b64encode(buffer.getvalue()).decode()
    body = {'algorithm': 'yolo', 'model_id': 'yolo-default', 'image': 'data:image/png;base64,' + encoded,
            'confidence': .35, 'iou': .45}
    return client, service, metadata, value, body, calls, behavior


def test_configured_views_map_coordinates_and_persist_configuration(deployed):
    client, service, _, _, body, calls, _ = deployed
    caps = client.get('/api/quality/vision/capabilities').json()
    assert next(m for m in caps['models'] if m['algorithm'] == 'yolo')['inference'] == CONFIG
    response = client.post('/api/quality/vision/detect', json=body)
    assert response.status_code == 200, response.text
    result = response.json()
    assert calls == [((640, 480), .35, .45)] + [((384, 288), .4, .45)] * 4
    assert result['defects'] == [box([266, 202, 286, 222])]
    assert result['status'] == 'defect'
    assert result['parameters']['inference'] == CONFIG
    assert result['model']['inference'] == CONFIG
    assert client.get('/api/quality/vision/inspections/' + result['inspection_id']).json() == result


def test_invalid_tile_config_disables_model_and_cannot_persist_result(deployed):
    client, service, metadata, value, body, calls, _ = deployed
    metadata.write_text(json.dumps({**value, 'inference': {**CONFIG, 'tile_fraction': 0}}), encoding='utf-8')
    caps = client.get('/api/quality/vision/capabilities').json()
    assert not next(a for a in caps['algorithms'] if a['id'] == 'yolo')['available']
    assert client.post('/api/quality/vision/detect', json=body).status_code == 503
    assert not calls and not list(service.root.rglob('VI-*.json'))


@pytest.mark.parametrize('failure,status', [('change_config', 409), ('fail_crop', 503)])
def test_changed_config_or_crop_failure_does_not_publish_partial_result(deployed, failure, status):
    client, service, _, _, body, _, behavior = deployed
    behavior[failure] = True
    assert client.post('/api/quality/vision/detect', json=body).status_code == status
    assert not list(service.root.rglob('VI-*.json'))


def test_class_thresholds_are_validated_against_model_labels(deployed):
    client, service, metadata, value, body, calls, _ = deployed
    changed = {**value, 'inference': FINE, 'classes': ['dirt', 'hair'], 'recommended_confidence': .03}
    metadata.write_text(json.dumps(changed), encoding='utf-8')
    assert client.post('/api/quality/vision/detect', json=body).status_code == 503
    assert not calls
    changed['classes'] = ['dirt', 'hair', 'darkspot']
    metadata.write_text(json.dumps(changed), encoding='utf-8')
    caps = client.get('/api/quality/vision/capabilities').json()
    assert next(m for m in caps['models'] if m['algorithm'] == 'yolo')['inference'] == FINE
    changed['recommended_confidence'] = .8
    metadata.write_text(json.dumps(changed), encoding='utf-8')
    assert client.post('/api/quality/vision/detect', json=body).status_code == 503
    assert not list(service.root.rglob('VI-*.json'))


@pytest.mark.parametrize('grid,expected_calls', [(0, 5), (3, 14)])
def test_fine_defect_metadata_drives_real_view_orchestration(deployed, grid, expected_calls):
    client, _, metadata, value, body, calls, _ = deployed
    config = {**FINE, 'detail_grid_size': grid, 'detail_labels': ['hair'] if grid else []}
    metadata.write_text(json.dumps({**value, 'inference': config, 'classes': list(config['class_confidences']),
                                    'recommended_confidence': .03}), encoding='utf-8')
    response = client.post('/api/quality/vision/detect', json=body)
    assert response.status_code == 200, response.text
    result = response.json()
    assert len(calls) == expected_calls
    assert result['parameters']['inference'] == config
    assert result['defects'] == [box([266, 202, 286, 222])]
