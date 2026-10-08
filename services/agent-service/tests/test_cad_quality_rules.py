from __future__ import annotations

import math

from app.api.cad_quality_rules import comparison_rows, compare_dimensions, design_digest


SPEC = {
    'units': 'mm',
    'operations': [
        {'type': 'cylinder', 'mode': 'add', 'axis': 'z', 'position': [0, 0, 0], 'diameter': 30, 'length': 50},
        {'type': 'cylinder', 'mode': 'cut', 'axis': 'z', 'position': [0, 0, 0], 'diameter': 10, 'length': 50},
    ],
}


def submitted(rows, tolerance=0.05):
    return {row['key']: {'actual': row['nominal'], 'tolerance': tolerance} for row in rows}


def test_every_feature_gets_separate_measurement_keys():
    rows = comparison_rows(SPEC)
    assert [item['key'] for item in rows if 'diameter' in item['key']] == [
        'op_1_diameter', 'op_2_diameter'
    ]
    assert len({item['key'] for item in rows}) == len(rows)
    assert any(row['nominal'] == 0 and row['key'] == 'op_2_position_x' for row in rows)
    assert all(row['unit'] == 'mm' for row in rows)


def test_matching_within_declared_tolerance_is_consistent():
    rows = comparison_rows(SPEC)
    values = submitted(rows)
    values['op_2_diameter']['actual'] = 10.04
    outcome = compare_dimensions(rows, values)
    assert outcome['status'] == 'consistent'
    assert outcome['matched'] == len(rows)
    assert outcome['missing'] == []
    assert next(item for item in outcome['items'] if item['key'] == 'op_2_diameter')['delta'] == 0.04


def test_outside_tolerance_is_inconsistent():
    rows = comparison_rows(SPEC)
    values = submitted(rows)
    values['op_1_length']['actual'] = 50.1
    outcome = compare_dimensions(rows, values)
    assert outcome['status'] == 'inconsistent'
    assert outcome['mismatched'] == 1


def test_incomplete_measurements_are_not_passed_or_saved_as_consistent():
    rows = comparison_rows(SPEC)
    values = submitted(rows)
    values.pop('op_2_length')
    outcome = compare_dimensions(rows, values)
    assert outcome['status'] == 'insufficient_data'
    assert 'op_2_length' in outcome['missing']


def test_unknown_measurement_and_invalid_tolerance_are_rejected():
    rows = comparison_rows(SPEC)
    values = submitted(rows)
    values['spoofed'] = {'actual': 0, 'tolerance': 0}
    try:
        compare_dimensions(rows, values)
        assert False, 'unknown keys must fail'
    except ValueError as error:
        assert '未知' in str(error)
    values.pop('spoofed')
    values['op_1_length']['tolerance'] = -0.1
    try:
        compare_dimensions(rows, values)
        assert False, 'negative tolerance must fail'
    except ValueError as error:
        assert '公差' in str(error)
    values['op_1_length']['tolerance'] = 0
    values['op_1_length']['actual'] = math.nan
    try:
        compare_dimensions(rows, values)
        assert False, 'nonfinite values must fail'
    except ValueError:
        pass


def test_integer_gear_teeth_require_exact_count():
    spec = {'units': 'mm', 'operations': [
        {'type': 'gear', 'mode': 'add', 'axis': 'z', 'position': [0, 0, 0], 'module': 2,
         'width': 10, 'bore_diameter': 5, 'teeth': 24, 'pressure_angle': 20},
    ]}
    rows = comparison_rows(spec)
    count = next(item for item in rows if item['key'] == 'op_1_teeth')
    assert count['unit'] == '个' and count['exact'] is True
    values = submitted(rows)
    values['op_1_teeth'] = {'actual': 25, 'tolerance': 99}
    try:
        compare_dimensions(rows, values)
        assert False, 'integer tooth-count tolerance must not be relaxed'
    except ValueError as error:
        assert '整数' in str(error) or '公差' in str(error)


def test_assembly_rows_include_part_names_and_digest_is_version_specific():
    spec = {'units': 'mm', 'parts': [
        {'name': '端盖', 'operations': [SPEC['operations'][0]]},
        {'name': '轴套', 'operations': [SPEC['operations'][1]]},
    ]}
    rows = comparison_rows(spec)
    assert any(item['key'].startswith('part_1_op_1_') and '端盖' in item['label'] for item in rows)
    assert any(item['key'].startswith('part_2_op_1_') and '轴套' in item['label'] for item in rows)
    assert design_digest(spec) != design_digest(SPEC)
