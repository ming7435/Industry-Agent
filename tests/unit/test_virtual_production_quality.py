"""Catch simulated defects, missing measurements and falsely inferred release evidence."""
from copy import deepcopy
import pytest
from test_virtual_turning import run


def output(design):
    return {'part_id': 'SIM-PART-1', 'job_id': 'SIM-JOB-1', 'design_run_id': design['run_id'],
            'design_digest': design['digest'], 'profile': {'outer_diameter_mm': 20.1, 'inner_diameter_mm': 0, 'length_mm': 10},
            'units': 'mm', 'source': 'factory-simulation', 'simulation_only': True, 'synthetic': True}


def test_output_difference_is_not_release_evidence():
    from shared.virtual_turning import build_virtual_design
    from shared.virtual_production_quality import compare_virtual_output
    design = build_virtual_design(run())
    result = compare_virtual_output(design, output(design))
    assert result['status'] == 'fail'
    assert result['items'][0]['difference'] == '0.1'
    assert result['simulation_only'] is True
    assert [row['key'] for row in result['items']] == ['outer_diameter_mm', 'length_mm']
    assert result.get('qualified') is not True


@pytest.mark.parametrize('hole,actual,expected,difference', [(True, 0, '6', '-6'), (False, 6, '0', '6')])
def test_missing_or_unexpected_hole_is_a_measured_defect(hole, actual, expected, difference):
    from shared.virtual_turning import build_virtual_design
    from shared.virtual_production_quality import compare_virtual_output
    design = build_virtual_design(run(hole=hole))
    value = output(design)
    value['profile'].update(outer_diameter_mm=20, inner_diameter_mm=actual)
    result = compare_virtual_output(design, value)
    assert result['status'] == 'fail'
    item = next(row for row in result['items'] if row['key'] == 'inner_diameter_mm')
    assert item['expected'] == expected and item['actual'] == str(actual) and item['difference'] == difference


@pytest.mark.parametrize('kind', ['missing', 'nonfinite', 'bool', 'mismatch', 'source', 'units', 'exact'])
def test_comparison_keeps_unknown_values_and_identity_conflicts(kind):
    from shared.virtual_turning import build_virtual_design
    from shared.virtual_production_quality import compare_virtual_output
    design = build_virtual_design(run(hole=True))
    value = output(design)
    value['profile']['inner_diameter_mm'] = 6
    expected = 'insufficient_data'
    if kind == 'missing': del value['profile']['length_mm']
    if kind == 'nonfinite': value['profile']['length_mm'] = 'Infinity'
    if kind == 'bool': value['profile']['length_mm'] = True
    if kind == 'mismatch': value['design_run_id'] = 'FC-' + 'b' * 64; expected = 'review'
    if kind == 'source': value['source'] = 'local-simulated-equator-adapter'; expected = 'review'
    if kind == 'units': value['units'] = 'in'; expected = 'review'
    if kind == 'exact': value['profile']['outer_diameter_mm'] = '20.000000'; expected = 'pass'
    result = compare_virtual_output(design, value)
    assert result['status'] == expected
    assert len(result['items']) == 3
    assert 'axis' not in str(result['items'])
