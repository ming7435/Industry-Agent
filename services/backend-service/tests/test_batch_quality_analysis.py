"""Batch statistics count physical parts, not repeated checks or parameter rows."""
from copy import deepcopy
from types import SimpleNamespace

import pytest

from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


@pytest.fixture
def service(tmp_path):
    return BackendBusinessService(repository=SQLiteRepository(str(tmp_path / 'batch.db')), team_service=SimpleNamespace())


def register(service, part_id, diameter=30, batch_id='B-1', device_id='M-1', line_id='LINE-1'):
    reference = {'run_id': 'FC-' + 'a' * 64, 'status': 'completed', 'prompt': '直径30mm、长50mm的圆柱',
        'validation': {'valid': True, 'step_roundtrip': True, 'solid_count': 1},
        'spec': {'units': 'mm', 'operations': [{'type': 'cylinder', 'mode': 'add', 'diameter': 30,
            'length': 50, 'axis': 'z', 'position': [0, 0, 0]}]}}
    return service.qms('register_production_part', operator='INSPECTOR', part={
        'part_id': part_id, 'part_name': '圆柱', 'batch_id': batch_id, 'device_id': device_id,
        'device_name': '一号加工机', 'line_id': line_id, 'line_name': '一号产线',
        'comparison_scope': 'cad_parameters', 'design_reference': reference,
        'measurements': {'operations.0.diameter': diameter, 'operations.0.length': 50, 'operations.0.axis': 'z'}})['part']


def inspect(service, part):
    check = service.qms('inspect_part_dimensions', part=part)
    return service.create_quality_check(part_id=part['part_id'], batch_id=part['batch_id'],
        device_id=part.get('device_id', ''), line_id=part.get('line_id', ''),
        part_recorded_at=part['recorded_at'], result='passed' if check['passed'] else 'failed',
        comparison_scope='cad_parameters', design_reference=part['design_reference'],
        measurements=part['measurements'], items=check['items'], quality_validation={'dimensions': check})['quality_check']


def report(service, batch_id='B-1'):
    return service.qms('get_batch_quality', batch_id=batch_id)


def test_distinct_parts_define_rate_and_pending_parts_do_not_disappear(service):
    good = register(service, 'P-GOOD', device_id='M-2', line_id='LINE-2')
    inspect(service, good)
    inspect(service, good)  # Repeated inspection is not a second produced part.
    inspect(service, register(service, 'P-BAD-1', diameter=31))
    inspect(service, register(service, 'P-BAD-2', diameter=32))
    register(service, 'P-PENDING')
    inspect(service, register(service, 'P-OTHER-BATCH', batch_id='B-2'))
    result = report(service)
    summary = result['batch_quality']
    assert summary['total_count'] == 4
    assert summary['inspected_count'] == 3
    assert summary['qualified_count'] == 1
    assert summary['unqualified_count'] == 2
    assert summary['pending_count'] == 1
    assert summary['rate_percent'] == 33.33
    assert summary['coverage_percent'] == 75.0
    problems = result['problem_analysis']
    assert [item['device_id'] for item in problems['machines']] == ['M-1']
    assert problems['machines'][0]['unqualified_count'] == 2
    assert problems['machines'][0]['failed_part_ids'] == ['P-BAD-1', 'P-BAD-2']
    assert [item['line_id'] for item in problems['lines']] == ['LINE-1']
    assert problems['lines'][0]['device_ids'] == ['M-1']


def test_latest_reinspection_replaces_failure_but_old_workflow_updates_do_not(service):
    old = inspect(service, register(service, 'P-1', diameter=31))
    inspect(service, register(service, 'P-1'))
    old.update(updated_at='2099-01-01T00:00:00+00:00', status='closed')
    service.repository.save_record('quality', old['quality_check_id'], old)
    result = report(service)
    assert result['batch_quality']['rate_percent'] == 100.0
    assert result['batch_quality']['total_count'] == 1
    assert result['problem_analysis']['machines'] == []


def test_changed_measurements_require_new_inspection(service):
    inspect(service, register(service, 'P-1'))
    register(service, 'P-1', diameter=31)
    summary = report(service)['batch_quality']
    assert summary['inspected_count'] == 0
    assert summary['pending_count'] == 1
    assert summary['rate_percent'] is None


def test_zero_inspections_and_empty_batch_never_default_to_pass(service):
    register(service, 'P-1')
    assert report(service)['batch_quality']['rate_percent'] is None
    assert report(service, 'UNKNOWN')['batch_quality']['total_count'] == 0
    assert report(service, 'UNKNOWN')['batch_quality']['rate_percent'] is None
    with pytest.raises(ValueError):
        report(service, '')


def test_defect_values_drive_solutions_without_claiming_a_machine_root_cause(service):
    inspect(service, register(service, 'P-1', diameter=31))
    problem = report(service)['problem_analysis']['machines'][0]
    assert problem['device_id'] == 'M-1' and problem['line_ids'] == ['LINE-1']
    assert problem['root_cause_status'] == 'unconfirmed'
    assert problem['status'] == 'associated'
    defect = problem['defects'][0]
    assert (defect['expected'], defect['actual'], defect['difference'], defect['unit']) == (30, 31, 1, 'mm')
    assert problem['solutions'][0]['target_device_id'] == 'M-1'
    assert problem['solutions'][0]['target_line_ids'] == ['LINE-1']
    assert problem['solutions'][0]['requires_manual_confirmation'] is True
    assert problem['solutions'][0]['steps'] and problem['solutions'][0]['reinspection_requirements']


def test_missing_traceability_is_reported_not_replaced_with_default_machine(service):
    inspect(service, register(service, 'P-1', diameter=31, device_id='', line_id=''))
    problems = report(service)['problem_analysis']
    assert problems['machines'] == [] and problems['lines'] == []
    assert problems['unlocated_part_ids'] == ['P-1']
    assert problems['issues'][0]['solutions']  # Still explains how to investigate the measured defect.


def test_forged_pass_flags_and_synthetic_data_do_not_raise_batch_rate(service):
    part = register(service, 'P-1', diameter=31)
    check = inspect(service, part)
    check['result'] = 'passed'
    check['quality_validation']['dimensions']['passed'] = True
    service.repository.save_record('quality', check['quality_check_id'], check)
    summary = report(service)['batch_quality']
    assert summary['qualified_count'] == 0 and summary['rate_percent'] is None
    part['synthetic'] = True
    service.repository.save_record('production_part', 'P-1', part)
    assert report(service)['batch_quality']['total_count'] == 0


def test_batch_and_line_identity_come_from_saved_production_record(service):
    part = register(service, 'P-1', diameter=31)
    assert part['line_id'] == 'LINE-1'
    check = inspect(service, part)
    check['batch_id'] = 'B-OTHER'
    service.repository.save_record('quality', check['quality_check_id'], check)
    assert report(service)['batch_quality']['inspected_count'] == 0


def test_stale_design_proof_and_incomplete_measurements_remain_pending(service):
    part = register(service, 'P-1')
    check = inspect(service, part)
    changed = deepcopy(check)
    changed['quality_validation']['dimensions']['design_digest'] = 'untrusted'
    service.repository.save_record('quality', check['quality_check_id'], changed)
    assert report(service)['batch_quality']['rate_percent'] is None
    del part['measurements']['operations.0.axis']
    part = service.qms('register_production_part', operator='INSPECTOR', part=part)['part']
    inspect(service, part)
    assert report(service)['batch_quality']['inspected_count'] == 0


def test_incomplete_inspection_keeps_verified_defects_and_machine_solutions(service):
    part = register(service, 'P-1', diameter=31)
    del part['measurements']['operations.0.axis']
    part = service.qms('register_production_part', operator='INSPECTOR', part=part)['part']
    inspect(service, part)
    result = report(service)
    assert result['batch_quality']['pending_count'] == 1
    assert result['batch_quality']['rate_percent'] is None
    machine = result['problem_analysis']['machines'][0]
    assert machine['device_id'] == 'M-1' and machine['line_ids'] == ['LINE-1']
    assert machine['defects'][0]['actual'] == 31
    assert machine['pending_defect_count'] == 1 and machine['unqualified_count'] == 0
    assert machine['solutions']


def test_delayed_check_for_old_observations_does_not_hide_current_failure(service):
    old = inspect(service, register(service, 'P-1'))
    current = inspect(service, register(service, 'P-1', diameter=31))
    old['created_at'] = '2099-01-01T00:00:00+00:00'
    service.repository.save_record('quality', old['quality_check_id'], old)
    result = report(service)
    assert result['batch_quality']['unqualified_count'] == 1
    assert result['parts'][0]['quality_check_id'] == current['quality_check_id']


def test_failed_check_execution_is_not_counted_as_completed_evidence(service):
    check = inspect(service, register(service, 'P-1'))
    check['quality_validation']['dimensions']['success'] = False
    service.repository.save_record('quality', check['quality_check_id'], check)
    assert report(service)['batch_quality']['inspected_count'] == 0


def test_statistics_explain_registered_part_scope_instead_of_claiming_total_batch_output(service):
    inspect(service, register(service, 'P-1'))
    summary = report(service)['batch_quality']
    assert summary['population_scope'] == 'registered_parts'
    assert '已登记' in summary['population_note'] and '全批次' in summary['population_note']


def test_legacy_check_without_observation_binding_cannot_validate_new_input(service):
    check = inspect(service, register(service, 'P-1'))
    check['part_recorded_at'] = ''
    service.repository.save_record('quality', check['quality_check_id'], check)
    register(service, 'P-1')
    assert report(service)['batch_quality']['inspected_count'] == 0


def test_legacy_partial_inspection_reports_real_failures_not_missing_observations(service):
    part = service.qms('register_production_part', operator='INSPECTOR', part={
        'part_id': 'P-LEGACY', 'batch_id': 'B-1', 'device_id': 'M-1', 'line_id': 'LINE-1',
        'measurements': {'diameter_mm': 31}, 'appearance': {'scratch': True},
        'material': {}, 'function': {}, 'process': {},
        'specifications': {'diameter_mm': {'min': 29, 'max': 30}, 'length_mm': {'min': 49, 'max': 50},
            'material_grade': 'STEEL', 'hardness_hb': {'min': 190, 'max': 220}, 'runout_mm': {'min': 0, 'max': 0.03}}
    })['part']
    operations = {'dimensions': 'inspect_part_dimensions', 'appearance': 'inspect_part_appearance',
        'material': 'inspect_part_material', 'function': 'inspect_part_function', 'process': 'inspect_part_process'}
    checks = {key: service.qms(operation, part=part) for key, operation in operations.items()}
    service.create_quality_check(part_id=part['part_id'], batch_id='B-1', device_id='M-1', line_id='LINE-1',
        part_recorded_at=part['recorded_at'], result='failed', measurements=part['measurements'],
        specifications=part['specifications'], quality_validation=checks)
    result = report(service)
    assert result['batch_quality']['pending_count'] == 1
    defects = result['problem_analysis']['machines'][0]['defects']
    assert {(item['check'], item.get('item')) for item in defects} == {('dimensions', 'diameter_mm'), ('appearance', 'scratch')}
    dimension = next(item for item in defects if item['check'] == 'dimensions')
    assert (dimension['actual'], dimension['difference'], dimension['unit']) == (31, 1, 'mm')
    appearance = next(item for item in defects if item['check'] == 'appearance')
    assert appearance['actual'] is True and appearance['expected'] is False
