"""Quality Agent classification must not turn observations into invented causes/actions."""
from copy import deepcopy

import pytest
from app.agents.quality.agent import QualityAgent


def dimensional():
    return {
        'batch_id': 'SIM-BATCH-example', 'design_run_id': 'FC-' + 'a' * 64,
        'simulation': True, 'synthetic': True, 'status': 'partial',
        'basis': {'parameters': [
            {'key': 'model.bounds_mm.1', 'name': '成品外形 · Y尺寸', 'expected': '20', 'unit': 'mm', 'comparable': True},
            {'key': 'operations.0.radius', 'name': '圆角', 'expected': '2', 'unit': 'mm', 'comparable': False}]},
        'samples': [{'part_id': 'SIM-PART-1', 'observations': {'model.bounds_mm.1': {'value': '20.03', 'unit': 'mm'}}},
                    {'part_id': 'SIM-PART-2', 'observations': {}}],
        'issues': [{'part_id': 'SIM-PART-1', 'key': 'model.bounds_mm.1', 'name': '成品外形 · Y尺寸',
                    'expected': '20', 'actual': '20.03', 'difference': '0.03', 'unit': 'mm'}],
        'traceability': {'production_device_id': 'LATHE-1', 'production_device_name': '车床', 'traceability_source': 'simulation_profile'},
    }


def visual(label='dirt'):
    return {'inspection_id': 'VI-' + 'b' * 32, 'algorithm': 'patchcore_yolo_pipeline',
            'status': 'defect', 'classification': 'known_defect', 'part_id': 'FC-' + 'a' * 64,
            'image_source': 'upload', 'image': {'width': 100, 'height': 100},
            'patchcore': {'status': 'defect'}, 'yolo_state': 'completed',
            'yolo': {'status': 'defect', 'defects': [{'label': label, 'confidence': .8, 'bbox': [10, 20, 30, 40]}]}}


def assess(record, kind):
    return QualityAgent.assess_inspection(record, kind=kind)


def test_dimension_difference_does_not_prove_machine_drawing_fault_or_scrap():
    record = dimensional(); before = deepcopy(record)
    result = assess(record, 'dimensions')
    assert result['agent'] == 'quality' and result['source_id'] == record['batch_id']
    issue = next(i for i in result['issues'] if i['category'] == 'dimension')
    assert issue['location'] == '成品外形 · Y尺寸'
    assert issue['cause_status'] == 'unconfirmed'
    assert set(issue['cause_categories']) == {'equipment_parameters', 'drawing', 'measurement'}
    assert issue['disposition']['code'] == 'remeasure'
    assert result['release_allowed'] is False and result['execution'] == 'not_executed'
    assert result['checks']['vision'] == 'not_tested'
    assert record == before


def test_missing_measurements_are_not_drawing_faults_and_uncovered_features_stay_pending():
    result = assess(dimensional(), 'dimensions')
    missing = [i for i in result['issues'] if i['category'] == 'acquisition']
    assert len(missing) == 1 and missing[0]['part_id'] == 'SIM-PART-2'
    assert missing[0]['disposition']['code'] == 'complete_measurement'
    assert missing[0]['cause_categories'] == ['measurement']
    assert result['uncovered_count'] == 1


@pytest.mark.parametrize('label,category,disposition', [
    ('dirt', 'surface_contamination', 'clean_reinspect'), ('hair', 'foreign_material', 'remove_reinspect'),
    ('scratch', 'surface_damage', 'rework_review'), ('broken', 'structural_damage', 'scrap_review'),
    ('missing', 'structural_damage', 'scrap_review'), ('new-unknown-class', 'visual_unknown', 'hold_review'),
])
def test_visual_categories_keep_pixel_location_and_distinguish_disposition(label, category, disposition):
    result = assess(visual(label), 'vision')
    issue = result['issues'][0]
    assert issue['category'] == category and issue['bbox'] == [10, 20, 30, 40]
    assert issue['disposition']['code'] == disposition
    assert issue['cause_status'] == 'unconfirmed'
    assert result['checks']['dimensions'] == 'not_tested'
    assert result['release_allowed'] is False and result['execution'] == 'not_executed'
    if disposition == 'scrap_review':
        assert issue['disposition']['requires_confirmation'] is True


@pytest.mark.parametrize('state', ['failed', 'completed'])
def test_unlocalized_patchcore_anomaly_is_never_converted_to_clear_or_a_fabricated_defect(state):
    record = visual(); record.update(classification='localization_failed' if state == 'failed' else 'unknown_anomaly',
                                    yolo_state=state, yolo=None if state == 'failed' else {'status': 'clear', 'defects': []})
    result = assess(record, 'vision')
    assert result['issues'][0]['category'] == 'visual_unknown'
    assert result['issues'][0]['bbox'] is None
    assert result['issues'][0]['disposition']['code'] == 'hold_review'
    assert result['status'] == 'review'


def test_reference_images_and_clear_prediction_never_release_a_part():
    record = visual(); record.update(status='clear', classification='clear', yolo_state='skipped', yolo=None,
                                    patchcore={'status': 'clear'}, image_source='public_gear_reference', part_id='')
    result = assess(record, 'vision')
    assert result['scope'] == 'reference_image'
    assert result['issues'] == [] and result['release_allowed'] is False
    assert result['checks'] == {'dimensions': 'not_tested', 'vision': 'clear'}


def test_invalid_or_review_dimension_record_cannot_produce_confirmed_quality_issues():
    record = dimensional(); record['status'] = 'review'
    assert assess(record, 'dimensions')['issues'] == []
    with pytest.raises(ValueError):
        assess({'issues': []}, 'dimensions')
