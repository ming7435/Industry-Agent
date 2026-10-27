from uuid import uuid4
from test_quality_vision_api import connected


def save(service, *, owner='A', status='defect', labels=('dirt',), source='upload', part_id='PART-1', state=None):
    identity = 'VI-' + uuid4().hex
    state = state or ('completed' if status == 'defect' else 'skipped')
    record = {'inspection_id': identity, 'algorithm': 'patchcore_yolo_pipeline', 'pipeline_version': 1,
              'status': status, 'patchcore': {'status': status}, 'image_source': source, 'part_id': part_id,
              'yolo_state': state, 'yolo': {'status': 'defect' if labels else 'clear',
                  'defects': [{'label': label} for label in labels]} if state == 'completed' else None}
    path = service._owner_root(owner) / 'inspections' / (identity + '.json')
    service._atomic_json(path, record)
    return path, record


def test_pipeline_rate_type_image_counts_and_scope_are_not_mixed(connected):
    client, service, _ = connected
    save(service, status='clear')
    save(service, labels=('dirt', 'dirt', 'hair'))
    save(service, labels=(), state='failed')
    save(service, source='public_gear_reference')
    save(service, owner='B')
    save(service, part_id='PART-2')
    # Detector stage records do not create two extra inspected images.
    path, record = save(service)
    service._atomic_json(path, {**record, 'algorithm': 'patchcore'})
    response = client.get('/api/quality/vision/statistics', params={'part_id': 'PART-1'})
    assert response.status_code == 200
    stats = response.json()
    assert stats['counts'] == {'total': 3, 'qualified': 1, 'unqualified': 2, 'unlocalized': 1}
    assert stats['qualified_rate'] == 33.33
    types = {row['key']: row for row in stats['types']}
    assert types['dirt']['image_count'] == 1 and types['dirt']['occurrences'] == 2
    assert types['hair']['image_count'] == 1 and types['hair']['share'] == 50
    assert types['unlocalized']['image_count'] == 1 and types['unlocalized']['occurrences'] == 0
    assert client.get('/api/quality/vision/statistics').json()['counts']['total'] == 4
    assert client.get('/api/quality/vision/statistics?image_source=public_gear_reference').json()['counts']['total'] == 1


def test_statistics_reload_ownership_and_no_empty_pass_rate(connected):
    client, service, _ = connected
    assert client.get('/api/quality/vision/statistics').json()['qualified_rate'] is None
    path, record = save(service, status='clear')
    assert client.get('/api/quality/vision/statistics').json()['qualified_rate'] == 100
    service._atomic_json(path, {**record, 'status': 'defect'})
    bad = client.get('/api/quality/vision/statistics').json()
    assert bad['counts']['total'] == 0 and bad['qualified_rate'] is None and bad['invalid_records'] == 1
    client.cookies.set('maintenance_session', 'B')
    assert client.get('/api/quality/vision/statistics').json()['invalid_records'] == 0
    client.cookies.clear()
    assert client.get('/api/quality/vision/statistics').status_code == 401


def test_research_localizer_anomalies_are_counted_without_inflating_pass_rate(connected):
    client, service, _ = connected
    save(service, status='clear')
    path, record = save(service, labels=('dirt', 'dirt'))
    record['yolo']['model'] = {'model_id': 'yolo-default', 'demo': True}
    service._atomic_json(path, record)
    path, _ = save(service)
    path.write_text('{broken', encoding='utf8')
    stats = client.get('/api/quality/vision/statistics').json()
    assert stats['counts']['total'] == 2 and stats['qualified_rate'] == 50
    assert stats['research_model_count'] == 1
    assert stats['types'][0]['key'] == 'dirt' and stats['types'][0]['occurrences'] == 2
    assert stats['invalid_records'] == 1
