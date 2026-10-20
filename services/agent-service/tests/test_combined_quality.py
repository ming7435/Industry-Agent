"""Combined rates use distinct physical parts and explicit human review."""
from itertools import product
from uuid import uuid4

import pytest

from test_quality_vision_api import connected, install_test_preset, picture

BASE = '/api/quality/vision/combined/parts'


def register(client, serial='G-1', **changes):
    return client.post(BASE, json={'scope': 'validation', 'batch_id': 'B-1',
                                 'serial_number': serial, 'design_version': 'V-1', **changes})


def review(client, part, kind, decision, **changes):
    body = {'request_id': str(uuid4()), 'expected_revision': part['revision'], 'kind': kind,
            'decision': decision, 'all_required_checked': decision == 'pass',
            'evidence_reference': 'REPORT-' + kind, 'notes': '核对同一实物及全部必检内容',
            'inspection_id': '', **changes}
    return client.post(BASE + '/' + part['quality_part_id'] + '/reviews', json=body), body


def report(client, scope='validation', batch=''):
    response = client.get(BASE, params={'scope': scope, 'batch_id': batch})
    assert response.status_code == 200, response.text
    return response.json()


@pytest.mark.parametrize('parameters,visual', list(product(('pass', 'fail', 'pending'), repeat=2)))
def test_two_channel_truth_table(connected, parameters, visual):
    client, _, _ = connected
    part = register(client).json()
    p, _ = review(client, part, 'parameters', parameters)
    assert p.status_code == 200, p.text
    v, _ = review(client, p.json(), 'visual', visual)
    assert v.status_code == 200, v.text
    expected = 'unqualified' if 'fail' in (parameters, visual) else (
        'qualified' if (parameters, visual) == ('pass', 'pass') else 'pending')
    assert v.json()['status'] == expected
    assert report(client)['summary'][expected] == 1


def test_denominator_pending_coverage_scope_batch_and_restart(connected):
    client, service, _ = connected
    assert report(client)['summary']['rate_percent'] is None
    good = register(client, 'GOOD').json()
    assert register(client, 'GOOD').json()['quality_part_id'] == good['quality_part_id']
    first, _ = review(client, good, 'parameters', 'pass')
    second, _ = review(client, first.json(), 'visual', 'pass')
    bad = register(client, 'BAD').json()
    review(client, bad, 'visual', 'fail')  # One confirmed failure is decisive even without dimensions.
    register(client, 'PENDING')
    register(client, 'OTHER', batch_id='B-2')
    register(client, 'GOOD', scope='production')  # Isolated from validation examples.
    totals = report(client, batch='B-1')['summary']
    assert totals == dict(total=3, qualified=1, unqualified=1, pending=1,
                          determinate=2, rate_percent=50.0, coverage_percent=66.67)
    assert report(client, scope='production')['summary']['rate_percent'] is None
    from app.vision.combined import CombinedQualityService
    from app.vision.service import VisionService
    reloaded = CombinedQualityService(VisionService(service.root))
    assert reloaded.list_parts('A', 'validation', 'B-1')['summary'] == totals
    assert reloaded.get_part('A', second.json()['quality_part_id'])['visual']['source'] == 'human_review'


def test_revision_retry_and_reinspection_do_not_duplicate_or_restore_old_verdict(connected):
    client, _, _ = connected
    part = register(client).json()
    failed, body = review(client, part, 'visual', 'fail')
    path = BASE + '/' + part['quality_part_id'] + '/reviews'
    assert client.post(path, json=body).json()['revision'] == 1
    assert review(client, part, 'parameters', 'pass')[0].status_code == 409
    pending, _ = review(client, failed.json(), 'visual', 'pending')
    retried = client.post(path, json=body)
    assert retried.json()['status'] == 'pending' and retried.json()['revision'] == 2
    assert len(retried.json()['history']) == 2
    assert client.post(path, json={**body, 'decision': 'pass'}).status_code == 409
    assert report(client)['summary'] == dict(total=1, qualified=0, unqualified=0, pending=1,
                                           determinate=0, rate_percent=None, coverage_percent=0.0)
    assert pending.json()['status'] == 'pending'


def test_identity_is_immutable_and_owner_isolation(connected):
    client, _, _ = connected
    part = register(client, scope='production').json()
    assert register(client, scope='production', design_version='V-2').status_code == 409
    assert register(client, scope='production', batch_id='B-2').status_code == 409
    client.cookies.set('maintenance_session', 'B')
    assert report(client, scope='production')['items'] == []
    assert review(client, part, 'visual', 'fail')[0].status_code == 404


def test_missing_evidence_incomplete_checks_and_auth_cannot_create_pass(connected):
    client, _, _ = connected
    part = register(client).json()
    assert review(client, part, 'parameters', 'pass', all_required_checked=False)[0].status_code == 422
    assert review(client, part, 'visual', 'pass', evidence_reference='  ')[0].status_code == 422
    assert review(client, part, 'visual', 'fail', notes='  ')[0].status_code == 422
    assert register(client, batch_id='  ').status_code == 422
    assert report(client)['summary']['pending'] == 1
    assert client.post(BASE, json={'batch_id': 'B', 'serial_number': 'G', 'design_version': 'V',
                                  'status': 'qualified'}).status_code == 422
    client.headers.pop('x-write')
    assert register(client, 'G-2').status_code == 401
    client.headers['x-write'] = 'allowed'
    assert client.post(BASE, headers={'origin': 'https://outside.invalid'}, json={}).status_code == 403
    client.cookies.clear()
    assert client.get(BASE).status_code == 401


def test_vision_evidence_binding_model_result_never_automatically_qualifies(connected, monkeypatch):
    client, service, root = connected
    install_test_preset(service, root, monkeypatch)
    part = register(client).json()
    other = register(client, 'OTHER').json()
    body = {'algorithm': 'patchcore', 'model_id': 'patchcore-demo', 'image': picture(),
            'threshold': .5, 'quality_part_id': part['quality_part_id'],
            'image_source': 'public_gear_reference'}
    response = client.post('/api/quality/vision/detect', json=body)
    assert response.status_code == 200, response.text
    inspection = response.json()
    assert inspection['quality_identity']['serial_number'] == 'G-1'
    assert inspection['image_source'] == 'public_gear_reference'
    assert report(client)['summary']['pending'] == 2  # Even a detector failure needs explicit review.
    part = next(p for p in report(client)['items'] if p['quality_part_id'] == part['quality_part_id'])
    assert review(client, other, 'visual', 'fail', inspection_id=inspection['inspection_id'])[0].status_code == 409
    saved, _ = review(client, part, 'visual', 'fail', inspection_id=inspection['inspection_id'])
    assert saved.status_code == 200
    assert saved.json()['visual']['inspection_evidence']['image_sha256'] == inspection['image_sha256']
    production = register(client, 'REAL', scope='production').json()
    assert client.post('/api/quality/vision/detect', json={
        **body, 'quality_part_id': production['quality_part_id']}).status_code == 409
    client.cookies.set('maintenance_session', 'B')
    assert client.post('/api/quality/vision/detect', json=body).status_code == 404


def test_new_visual_evidence_invalidates_old_pass_and_never_erases_confirmed_failure(connected, monkeypatch):
    client, service, root = connected
    install_test_preset(service, root, monkeypatch)
    part = register(client).json()
    first, _ = review(client, part, 'parameters', 'pass')
    good, _ = review(client, first.json(), 'visual', 'pass')
    assert good.json()['status'] == 'qualified'
    body = {'algorithm': 'patchcore', 'model_id': 'patchcore-demo', 'image': picture(),
            'threshold': .5, 'quality_part_id': part['quality_part_id']}
    assert client.post('/api/quality/vision/detect', json=body).status_code == 200
    latest = report(client)['items'][0]
    assert latest['status'] == 'pending' and latest['visual']['source'] == 'inspection_pending_review'
    assert report(client)['summary']['rate_percent'] is None
    assert review(client, good.json(), 'visual', 'pass')[0].status_code == 409
    failed, _ = review(client, latest, 'visual', 'fail')
    assert client.post('/api/quality/vision/detect', json=body).status_code == 200
    assert report(client)['items'][0]['visual']['decision'] == 'fail'
    assert report(client)['items'][0]['status'] == failed.json()['status'] == 'unqualified'


def test_corrupt_saved_registry_does_not_default_to_zero_or_qualified(connected):
    client, service, _ = connected
    part = register(client).json()
    path = service._owner_root('A') / 'combined-quality.json'
    path.write_text('{"schema_version":1,"parts":{"corrupt":{}}}', encoding='utf-8')
    assert client.get(BASE).status_code == 503
    assert review(client, part, 'visual', 'pass')[0].status_code == 503
