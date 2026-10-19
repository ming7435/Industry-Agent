"""Smoke evidence must prove geometry and a usable saved STEP/STL pair."""
import importlib
import math

import pytest


def validate(evidence):
    assert importlib.util.find_spec('scripts.text_to_cad_smoke'), 'text-to-cad smoke verifier is missing'
    return importlib.import_module('scripts.text_to_cad_smoke').validate_geometry(evidence)


def evidence():
    return {'valid': True, 'solids': 1, 'volume': 3000 - 90 * math.pi,
            'step_roundtrip_volume': 3000 - 90 * math.pi, 'stl_facets': 128,
            'bounds_mm': [20, 15, 10]}


def test_saved_geometry_evidence_is_accepted():
    assert validate(evidence()) == evidence()


@pytest.mark.parametrize('field,value', [('valid', False), ('solids', 0), ('volume', 3000),
    ('step_roundtrip_volume', 3000), ('stl_facets', 0), ('bounds_mm', [20, 15, 11])])
def test_invalid_or_incomplete_exports_cannot_pass(field, value):
    report = evidence()
    report[field] = value
    with pytest.raises(RuntimeError):
        validate(report)
