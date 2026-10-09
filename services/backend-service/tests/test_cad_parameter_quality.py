"""生产零件必须与已绑定的建模版本比较，不能以设计值替代实测值。"""
from copy import deepcopy
from types import SimpleNamespace

import pytest

from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


def design(run_digit='a', diameter=30):
    return {'run_id': 'FC-' + run_digit * 64, 'status': 'completed',
            'prompt': '外径30mm、长50mm、通孔10mm的销轴',
            'validation': {'valid': True, 'step_roundtrip': True, 'solid_count': 1},
            'spec': {'units': 'mm', 'operations': [
                {'type': 'cylinder', 'mode': 'add', 'diameter': diameter, 'length': 50, 'axis': 'z', 'position': [0, 0, 0]},
                {'type': 'cylinder', 'mode': 'cut', 'diameter': 10, 'length': 50, 'axis': 'z', 'position': [0, 0, 0]},
            ]}}


def actual(**changes):
    return {'operations.0.diameter': '30.000', 'operations.0.length': 50,
            'operations.0.axis': 'z', 'operations.1.axis': 'z',
            'operations.1.diameter': 10, 'operations.1.length': 50,
            'operations.1.position.0': 0, 'operations.1.position.1': 0, 'operations.1.position.2': 0,
            'cut_feature_count': 1, **changes}


@pytest.fixture
def service(tmp_path):
    return BackendBusinessService(repository=SQLiteRepository(str(tmp_path / 'cad-quality.db')), team_service=SimpleNamespace())


def save(service, measurements=None, reference=None):
    return service.qms('register_production_part', operator='INSPECTOR', part={
        'part_id': 'PRODUCED-PIN', 'batch_id': 'BATCH-1', 'part_name': '销轴',
        'comparison_scope': 'cad_parameters', 'design_reference': reference or design(),
        'measurements': actual() if measurements is None else measurements})['part']


def test_saved_production_part_keeps_immutable_design_reference(service):
    part = save(service)
    assert part['comparison_scope'] == 'cad_parameters'
    assert part['design_reference']['run_id'] == 'FC-' + 'a' * 64
    assert part['design_reference']['parameters'][0]['expected'] == 30
    fresh = BackendBusinessService(repository=service.repository, team_service=SimpleNamespace())
    assert fresh.qms('get_production_part', part_id='PRODUCED-PIN')['part']['design_reference'] == part['design_reference']


def test_all_measured_parameters_match_without_unrelated_five_checks(service):
    result = service.qms('inspect_part_dimensions', part=save(service))
    assert result['status'] == 'pass'
    assert result['passed'] is True
    assert len(result['items']) == 10
    assert all(item['difference'] == 0 for item in result['items'] if not item.get('kind'))


def test_mismatch_returns_expected_actual_and_difference(service):
    result = service.qms('inspect_part_dimensions', part=save(service, actual(**{'operations.1.diameter': 11})))
    assert result['status'] == 'fail'
    item = next(item for item in result['items'] if item['item'] == 'operations.1.diameter')
    assert (item['expected'], item['actual'], item['difference'], item['passed']) == (10, 11, 1, False)


@pytest.mark.parametrize('value', [None, '', True, 'NaN', 'Infinity', [], {}])
def test_missing_or_invalid_actual_values_never_default_to_design(service, value):
    result = service.qms('inspect_part_dimensions', part=save(service, actual(**{'operations.0.diameter': value})))
    assert result['passed'] is False
    assert result['status'] == 'insufficient_data'


def test_empty_measurements_remain_not_tested(service):
    result = service.qms('inspect_part_dimensions', part=save(service, {}))
    assert result['passed'] is False
    assert result['status'] == 'not_tested'


def test_no_implicit_tolerance_or_client_specification_override(service):
    part = save(service, actual(**{'operations.0.diameter': 30.001}))
    result = service.qms('inspect_part_dimensions', part=part, specifications={'operations.0.diameter': {'min': 0, 'max': 100}})
    assert result['status'] == 'fail'


def test_same_part_cannot_silently_switch_design_version(service):
    saved = save(service)
    with pytest.raises(ValueError, match='设计版本'):
        save(service, reference=design('b', 31))
    assert service.qms('get_production_part', part_id='PRODUCED-PIN')['part'] == saved


def test_invalid_or_incomplete_design_cannot_be_bound(service):
    reference = design()
    reference['status'] = 'running'
    with pytest.raises(ValueError):
        save(service, reference=reference)
    assert service.qms('get_production_part', part_id='PRODUCED-PIN')['found'] is False


def test_parameter_check_is_persisted_and_release_rechecks_measured_values(service):
    part = save(service)
    comparison = service.qms('inspect_part_dimensions', part=part)
    created = service.create_quality_check(part_id=part['part_id'], batch_id='BATCH-1',
        result='passed', comparison_scope='cad_parameters', design_reference=part.get('design_reference', {}),
        measurements=part['measurements'], quality_validation={'dimensions': comparison}, items=comparison['items'])
    check = created['quality_check']
    assert check['result'] == 'passed'
    assert check['design_reference']['run_id'] == 'FC-' + 'a' * 64
    assert service.release_quality_check(check['quality_check_id'])['quality_check']['status'] == 'released'
    forged = deepcopy(check)
    forged['status'] = 'released'
    forged['measurements']['operations.0.diameter'] = 100
    service.repository.save_record('quality', check['quality_check_id'], forged)
    with pytest.raises(ValueError):
        service.close_quality_check(check['quality_check_id'])


def test_pass_flag_and_empty_parameter_items_cannot_bypass_release(service):
    part = save(service)
    response = service.create_quality_check(part_id=part['part_id'], batch_id='BATCH-1', result='passed',
        comparison_scope='cad_parameters', design_reference=part.get('design_reference', {}), measurements={},
        quality_validation={'dimensions': {'status': 'pass', 'passed': True, 'sufficient_data': True, 'items': [{'passed': True}]}})
    assert response['quality_check']['result'] != 'passed'


def test_added_feature_placement_is_also_part_of_design_parameters(service):
    reference = design()
    reference['spec']['operations'] = reference['spec']['operations'][:1]
    reference['spec']['operations'].append({'type': 'cylinder', 'mode': 'add', 'diameter': 40,
        'length': 10, 'axis': 'z', 'position': [0, 0, 50]})
    part = save(service, reference=reference)
    rows = {row['key']: row for row in part['design_reference']['parameters']}
    assert rows['operations.1.position.2']['expected'] == 50
    assert service.qms('inspect_part_dimensions', part=part)['passed'] is False


def test_thread_handedness_is_required_and_opposite_hand_fails():
    from shared.part_design_quality import build_design_reference, compare_design_parameters
    reference = design()
    reference['spec']['operations'] = [{'type': 'thread', 'mode': 'add', 'position': [0, 0, 0],
        'axis': 'z', 'major_diameter': 20, 'pitch': 2, 'length': 10, 'depth': .5,
        'flank_angle': 60, 'hand': 'left'}]
    reference = build_design_reference(reference)
    measurements = {row['key']: row['expected'] for row in reference['parameters']}
    measurements['operations.0.hand'] = 'right'
    assert compare_design_parameters(reference, measurements)['status'] == 'fail'
    del measurements['operations.0.hand']
    assert compare_design_parameters(reference, measurements)['passed'] is False


def test_axis_and_selected_fillet_edges_are_not_omitted():
    from shared.part_design_quality import build_design_reference, compare_design_parameters
    reference = design()
    reference['spec']['operations'] = reference['spec']['operations'][:1]
    reference['spec']['operations'].append({'type': 'fillet', 'radius': 1, 'edges': [1, 3]})
    reference = build_design_reference(reference)
    measurements = {row['key']: row['expected'] for row in reference['parameters']}
    measurements['operations.0.axis'] = 'x'
    assert compare_design_parameters(reference, measurements)['status'] == 'fail'
    measurements['operations.0.axis'] = 'z'
    measurements['operations.1.edges'] = '2,3'
    assert compare_design_parameters(reference, measurements)['status'] == 'fail'
    measurements['operations.1.edges'] = '3,1'
    assert compare_design_parameters(reference, measurements)['passed'] is True


def test_through_hole_compares_finished_depth_not_oversized_boolean_tool(service):
    reference = design()
    reference['spec']['operations'][1].update(length=52, position=[0, 0, -1])
    result = service.qms('inspect_part_dimensions', part=save(service, reference=reference))
    depth = next(row for row in result['items'] if row['item'] == 'operations.1.length')
    assert depth['expected'] == 50
    assert depth['passed'] is True


def test_unsupported_boolean_geometry_cannot_become_a_complete_inspection(service):
    reference = design()
    reference['spec']['operations'][1] = {'type': 'sphere', 'mode': 'cut', 'diameter': 10, 'position': [0, 0, 10]}
    with pytest.raises(ValueError, match='成品|检验'):
        save(service, reference=reference)


def test_adding_material_after_drilling_cannot_keep_the_old_hole_depth(service):
    reference = design()
    reference['spec']['operations'].append({'type': 'cylinder', 'mode': 'add', 'diameter': 30,
        'length': 25, 'axis': 'z', 'position': [0, 0, 25]})
    with pytest.raises(ValueError, match='成品|检验'):
        save(service, reference=reference)
