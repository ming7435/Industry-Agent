"""钣金严格输入契约；真实折弯与展开验收见 test_text_to_cad_features。"""
import importlib

import pytest


EXAMPLE = {
    'width': 80, 'base_length': 60, 'flange_length': 30,
    'thickness': 2, 'bend_radius': 3, 'bend_angle': 90, 'k_factor': 0.4,
}


def sheetmetal_module():
    return importlib.import_module('app.tools.cad.cad_sheetmetal')


def test_complete_sheet_metal_spec_preserves_dimensions_and_normalizes_numbers():
    result = sheetmetal_module().validate_sheet_metal(EXAMPLE)
    assert result == EXAMPLE
    assert all(type(value) is float for value in result.values())


@pytest.mark.parametrize('missing', list(EXAMPLE))
def test_sheet_metal_never_guesses_missing_parameters(missing):
    value = {key: item for key, item in EXAMPLE.items() if key != missing}
    with pytest.raises(ValueError):
        sheetmetal_module().validate_sheet_metal(value)


@pytest.mark.parametrize('changes', [
    {'width': True}, {'width': '80'}, {'width': float('nan')}, {'width': 10 ** 1000},
    {'base_length': float('inf')}, {'flange_length': -1}, {'thickness': 0},
    {'bend_radius': 0}, {'width': 10001}, {'bend_angle': 0},
    {'bend_angle': 180}, {'bend_angle': -90}, {'k_factor': -0.1},
    {'k_factor': 1.01}, {'thickness': 80}, {'width': 0.000001},
    {'script': 'import os'}, {'output_path': 'C:/outside'},
])
def test_sheet_metal_rejects_invalid_or_unbounded_geometry(changes):
    with pytest.raises(ValueError):
        sheetmetal_module().validate_sheet_metal({**EXAMPLE, **changes})


@pytest.mark.parametrize('value', [None, [], 'L bracket'])
def test_sheet_metal_requires_structured_parameters(value):
    with pytest.raises(ValueError):
        sheetmetal_module().validate_sheet_metal(value)
