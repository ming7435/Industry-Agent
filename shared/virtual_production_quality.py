"""Exact simulated profile comparison; no manufacturing tolerance or release decision."""
from collections.abc import Mapping
from shared.virtual_turning import build_virtual_design, number, text_number, SOURCE, SCOPE, VirtualProductionError

RULE = 'virtual_profile_dimensions_v1'


def compare_virtual_output(design: Mapping, output: Mapping) -> dict:
    fixed = build_virtual_design(design)
    identity_ok = (isinstance(output, Mapping) and output.get('design_run_id') == fixed['run_id']
                   and output.get('design_digest') == fixed['digest'] and output.get('source') == SOURCE
                   and output.get('simulation_only') is True and output.get('synthetic') is True and output.get('units') == 'mm')
    fields = [('outer_diameter_mm', '加工区外径'), ('length_mm', '有效加工长度')]
    profile, items = output.get('profile') if isinstance(output, Mapping) else {}, []
    actual_inner = None
    try:
        actual_inner = number(profile.get('inner_diameter_mm') if isinstance(profile, Mapping) else None,
                              'inner_diameter_mm', zero=True, precise=False)
    except VirtualProductionError:
        pass
    if fixed['nominal_profile']['inner_diameter_mm'] or actual_inner:
        fields.append(('inner_diameter_mm', '同轴通孔直径'))
    for key, name in fields:
        expected = number(fixed['nominal_profile'][key], key, zero=key == 'inner_diameter_mm')
        actual, difference, state = None, None, 'insufficient_data'
        try:
            value = number(profile.get(key) if isinstance(profile, Mapping) else None, key,
                           zero=key == 'inner_diameter_mm', precise=False)
            actual, difference = text_number(value), text_number(value - expected)
            state = 'pass' if value == expected else 'fail'
        except VirtualProductionError:
            pass
        items.append({'key': key, 'name': name, 'unit': 'mm', 'expected': text_number(expected),
                      'actual': actual, 'difference': difference, 'status': state if identity_ok else 'review'})
    states = {row['status'] for row in items}
    status = 'review' if not identity_ok else 'insufficient_data' if 'insufficient_data' in states else 'fail' if 'fail' in states else 'pass'
    return {'rule': RULE, 'status': status, 'items': items, 'design_run_id': fixed['run_id'],
            'design_digest': fixed['digest'], 'source': SOURCE, 'simulation_only': True, 'scope': SCOPE}
