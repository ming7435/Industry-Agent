"""Persisted two-stage evidence must survive review, retries, and later inspections."""
from copy import deepcopy
from itertools import product
import pytest

from test_quality_vision_api import connected, install_test_preset, picture
from test_combined_quality import register, report, review

BASE = '/api/quality/vision'


@pytest.fixture
def sequence(connected, monkeypatch):
    client, service, root = connected
    install_test_preset(service, root, monkeypatch)
    monkeypatch.setenv('QUALITY_YOLO_WEIGHTS', str(root / 'yolo.pt'))
    monkeypatch.delenv('QUALITY_YOLO_METADATA', raising=False)
    (root / 'yolo.pt').write_bytes(b'fake detector boundary test')
    service.readiness = lambda algorithm: (True, '')

    class Yolo:
        def __init__(self, *args, **kwargs):
            pass

        def predict(self, image, confidence, iou):
            return dict(algorithm='yolo', status='clear', score=0, threshold=confidence,
                        defects=[], image=dict(width=image.width, height=image.height),
                        annotated_image=picture(),
                        steps=[dict(name='test', status='completed', detail='fake detector')])

    service.algorithms.YoloDetector = Yolo
    part = register(client).json()
    body = dict(filename='gear.png', image=picture(), quality_part_id=part['quality_part_id'])
    pc = client.post(BASE + '/detect', json={**body, 'algorithm': 'patchcore',
                                           'model_id': 'patchcore-demo', 'threshold': .5})
    yolo = client.post(BASE + '/detect', json={**body, 'algorithm': 'yolo', 'model_id': 'yolo-default'})
    assert pc.status_code == yolo.status_code == 200
    records = [pc.json(), yolo.json()]
    payload = dict(patchcore_inspection_id=records[0]['inspection_id'],
                   yolo_inspection_id=records[1]['inspection_id'])
    return client, service, part, records, payload


def replace_record(service, record, **changes):
    value = {**deepcopy(record), **changes}
    service._atomic_json(service._owner_root('A') / 'inspections' / (value['inspection_id'] + '.json'), value)
    return value


def test_unknown_anomaly_is_saved_and_both_stages_enter_human_review(sequence):
    client, service, part, records, body = sequence
    response = client.post(BASE + '/sequential/fuse', json=body)
    assert response.status_code == 200, response.text
    fused = response.json()
    assert fused['algorithm'] == 'patchcore_yolo'
    assert fused['status'] == 'defect' and fused['classification'] == 'unknown_anomaly'
    assert fused['patchcore'] == records[0] and fused['yolo'] == records[1]
    assert fused['inspection_ids'] == [r['inspection_id'] for r in records]
    assert fused.get('score') is None and fused.get('threshold') is None
    assert client.get(BASE + '/inspections/' + fused['inspection_id']).json() == fused
    from app.vision.service import VisionService
    assert VisionService(service.root).get_inspection('A', fused['inspection_id']) == fused
    current = report(client)['items'][0]
    assert current['latest_inspection_id'] == fused['inspection_id']
    assert current['status'] == 'pending'
    saved, _ = review(client, current, 'visual', 'fail', inspection_id=fused['inspection_id'])
    assert saved.status_code == 200, saved.text
    evidence = saved.json()['visual']['inspection_evidence']
    assert evidence['classification'] == 'unknown_anomaly'
    assert evidence['inspection_ids'] == fused['inspection_ids']
    assert evidence['stages']['patchcore']['status'] == 'defect'
    assert evidence['stages']['yolo']['status'] == 'clear'
    assert evidence['stages']['patchcore']['memory_bank_sha256'] == records[0]['memory_bank_sha256']


def test_fusion_retry_does_not_invalidate_review_or_increment_revision(sequence):
    client, _, _, _, body = sequence
    first = client.post(BASE + '/sequential/fuse', json=body)
    assert first.status_code == 200, first.text
    current = report(client)['items'][0]
    saved, _ = review(client, current, 'visual', 'pass', inspection_id=first.json()['inspection_id'])
    assert saved.status_code == 200
    retried = client.post(BASE + '/sequential/fuse', json=body)
    assert retried.status_code == 200 and retried.json() == first.json()
    assert report(client)['items'][0] == saved.json()


def test_existing_fusion_retry_never_overwrites_a_later_inspection(sequence):
    client, _, part, _, body = sequence
    first = client.post(BASE + '/sequential/fuse', json=body)
    assert first.status_code == 200
    later = client.post(BASE + '/detect', json=dict(algorithm='yolo', model_id='yolo-default',
        filename='other.png', image=picture('black'), quality_part_id=part['quality_part_id']))
    assert later.status_code == 200
    before = report(client)['items'][0]
    assert client.post(BASE + '/sequential/fuse', json=body).json() == first.json()
    assert report(client)['items'][0] == before
    assert before['latest_inspection_id'] == later.json()['inspection_id']


def test_new_fusion_cannot_replace_later_inspection(sequence):
    client, service, part, _, body = sequence
    later = client.post(BASE + '/detect', json=dict(algorithm='yolo', model_id='yolo-default',
        image=picture('black'), quality_part_id=part['quality_part_id']))
    assert later.status_code == 200
    before = report(client)['items'][0]
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 409
    assert report(client)['items'][0] == before
    assert len(list((service._owner_root('A') / 'inspections').glob('VI-*.json'))) == 3


@pytest.mark.parametrize('pc_defect,yolo_defect', list(product((False, True), repeat=2)))
def test_persisted_fusion_truth_table(sequence, pc_defect, yolo_defect):
    client, service, _, records, body = sequence
    for record, defect in zip(records, (pc_defect, yolo_defect)):
        replace_record(service, record, status='defect' if defect else 'clear', score=.9 if defect else 0,
            defects=[dict(label='anomaly' if record['algorithm'] == 'patchcore' else 'scratch',
                confidence=None if record['algorithm'] == 'patchcore' else .9, bbox=[1, 2, 5, 6])] if defect else [])
    response = client.post(BASE + '/sequential/fuse', json=body)
    assert response.status_code == 200, response.text
    assert response.json()['classification'] == ('known_defect' if yolo_defect else 'unknown_anomaly' if pc_defect else 'clear')


@pytest.mark.parametrize('changes', [
    {'image_sha256': None}, {'image_sha256': 'not-a-hash'}, {'image_sha256': '0' * 64},
    {'image_digest_format': None}, {'image_digest_format': 'other-format'},
    {'filename': 'other.png'}, {'image': {'width': 24, 'height': 21}}, {'part_id': 'OTHER'},
    {'quality_part_id': ''}, {'quality_identity': {'serial_number': 'OTHER'}},
    {'image_source': 'public_gear_reference'}, {'source_context': {'job_id': 'OTHER'}},
    {'algorithm': 'patchcore'}, {'status': 'incomplete'}, {'status': 'defect'},
    {'created_at': '2000-01-01T00:00:00Z'}, {'created_at': 'no-date'},
])
def test_unrelated_or_incomplete_saved_evidence_cannot_fuse(sequence, changes):
    client, service, _, records, body = sequence
    replace_record(service, records[1], **changes)
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 409


def test_missing_pc_digest_also_fails_closed(sequence):
    client, service, _, records, body = sequence
    pc = deepcopy(records[0])
    pc.pop('image_sha256')
    replace_record(service, pc)
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 409


def test_fuse_requires_write_same_origin_owner_and_bounded_id_input(sequence):
    client, _, _, _, body = sequence
    assert client.post(BASE + '/sequential/fuse', json={**body, 'status': 'clear'}).status_code == 422
    assert client.post(BASE + '/sequential/fuse', json={**body, 'yolo_inspection_id': body['patchcore_inspection_id']}).status_code == 422
    client.headers.pop('x-write')
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 401
    client.headers['x-write'] = 'allowed'
    assert client.post(BASE + '/sequential/fuse', json=body, headers={'origin': 'https://outside.invalid'}).status_code == 403
    client.cookies.set('maintenance_session', 'B')
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 404
    client.cookies.clear()
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 401


def test_registry_write_failure_is_recoverable_without_double_revision(sequence, monkeypatch):
    client, service, _, _, body = sequence
    original = service._atomic_json
    before = report(client)['items'][0]['revision']

    def fail_registry(path, value):
        if path.name == 'combined-quality.json':
            raise OSError('simulated storage failure')
        return original(path, value)

    monkeypatch.setattr(service, '_atomic_json', fail_registry)
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 503
    monkeypatch.setattr(service, '_atomic_json', original)
    saved = client.post(BASE + '/sequential/fuse', json=body)
    assert saved.status_code == 200, saved.text
    current = report(client)['items'][0]
    assert current['revision'] == before + 1
    assert current['latest_inspection_id'] == saved.json()['inspection_id']


def test_latest_inspection_is_compared_under_the_write_lock(sequence, monkeypatch):
    client, service, _, records, body = sequence
    from app.vision.combined import CombinedQualityService
    original = CombinedQualityService.record_inspection
    newer = {**records[1], 'inspection_id': 'VI-' + 'f' * 32}

    def concurrent_record(self, owner, inspection, **kwargs):
        if kwargs.get('expected_latest'):
            service._atomic_json(service._owner_root(owner) / 'inspections' / (newer['inspection_id'] + '.json'), newer)
            original(self, owner, newer)
        return original(self, owner, inspection, **kwargs)

    monkeypatch.setattr(CombinedQualityService, 'record_inspection', concurrent_record)
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 409
    assert report(client)['items'][0]['latest_inspection_id'] == newer['inspection_id']
    assert len(list((service._owner_root('A') / 'inspections').glob('VI-*.json'))) == 3


def test_unassociated_image_pair_can_fuse_and_owner_cannot_read_other_account(sequence):
    client, service, _, records, body = sequence
    for stage in records:
        value = deepcopy(stage)
        value.pop('quality_part_id')
        value.pop('quality_identity')
        replace_record(service, value)
    response = client.post(BASE + '/sequential/fuse', json=body)
    assert response.status_code == 200, response.text
    assert 'quality_part_id' not in response.json()
    assert client.post(BASE + '/sequential/fuse', json=body).json() == response.json()
    route = BASE + '/inspections/' + response.json()['inspection_id']
    client.cookies.set('maintenance_session', 'B')
    assert client.get(route).status_code == 404


def test_public_or_simulated_images_cannot_be_fused_as_production_evidence(sequence):
    client, service, _, records, body = sequence
    production = register(client, 'REAL', scope='production').json()
    from app.vision.combined import CombinedQualityService
    for record in records:
        replacement = replace_record(service, record,
            quality_part_id=production['quality_part_id'],
            quality_identity={k: production[k] for k in ('scope', 'batch_id', 'serial_number', 'design_version')},
            image_source='public_gear_reference')
        CombinedQualityService(service).record_inspection('A', replacement)
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 409


def test_failed_aggregate_file_write_does_not_advance_part(sequence, monkeypatch):
    client, service, _, _, body = sequence
    before = report(client)['items'][0]
    original = service._atomic_json

    def fail_aggregate(path, value):
        if value.get('algorithm') == 'patchcore_yolo':
            raise OSError('simulated full disk')
        return original(path, value)

    monkeypatch.setattr(service, '_atomic_json', fail_aggregate)
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 503
    assert report(client)['items'][0] == before
    monkeypatch.setattr(service, '_atomic_json', original)
    assert client.post(BASE + '/sequential/fuse', json=body).status_code == 200
