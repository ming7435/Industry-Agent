"""装配/BIM 的参数边界与可选本地真实内核回归。"""
from copy import deepcopy
import importlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess

import pytest


ROOT = Path(__file__).resolve().parents[3]

ASSEMBLY = {
    'grounded': 'Base',
    'joints': [{'name': 'Hinge', 'type': 'revolute', 'part1': 'Base', 'part2': 'Arm',
                'connector1': {'position': [0, 0, 20], 'axis': [0, 0, 1]},
                'connector2': {'position': [0, 0, 0], 'axis': [0, 0, 1]}}],
    'motion': {'joint': 'Hinge', 'start': 0, 'end': 90, 'duration': 2, 'frames': 5},
}
BIM = {
    'walls': [{'name': 'Wall', 'start': [0, 0, 0], 'end': [6000, 0, 0],
               'height': 3000, 'thickness': 200}],
    'slabs': [{'name': 'Slab', 'length': 6000, 'width': 4000,
               'thickness': 200, 'position': [0, -2000, 0]}],
    'openings': [{'name': 'DoorOpening', 'wall': 'Wall', 'offset': 1000,
                  'sill': 0, 'width': 900, 'height': 2100}],
}


def api():
    module = 'app.tools.cad.freecad_workbenches'
    assert importlib.util.find_spec(module) is not None, '缺少真实 Assembly/BIM 扩展模块'
    return importlib.import_module(module)


def test_assembly_preserves_parameters_and_normalizes_connector_axis():
    value = deepcopy(ASSEMBLY)
    value['joints'][0]['connector1']['axis'] = [0, 0, 10]
    actual = api().validate_assembly(value, ['Base', 'Arm'])
    assert actual == ASSEMBLY
    assert value['joints'][0]['connector1']['axis'] == [0, 0, 10]


@pytest.mark.parametrize('edit', [
    lambda x: x.update(code='print(1)'),
    lambda x: x.update(grounded='Unknown'),
    lambda x: x['joints'][0].update(type='ball'),
    lambda x: x['joints'][0].update(part2='Base'),
    lambda x: x['joints'][0]['connector1'].update(axis=[0, 0, 0]),
    lambda x: x['joints'][0]['connector1'].update(position=[float('nan'), 0, 0]),
    lambda x: x['motion'].update(joint='Missing'),
    lambda x: x['motion'].update(frames=1000000),
    lambda x: x['motion'].update(frames=121),
    lambda x: x['motion'].update(duration=True),
    lambda x: x['motion'].update(end=float('inf')),
    lambda x: x['motion'].update(formula='__import__("os")'),
    lambda x: x['joints'][0].update(type='fixed'),
])
def test_assembly_rejects_unsafe_or_unresolvable_configuration(edit):
    value = deepcopy(ASSEMBLY)
    edit(value)
    with pytest.raises(ValueError):
        api().validate_assembly(value, ['Base', 'Arm'])


def test_assembly_rejects_components_disconnected_from_ground():
    with pytest.raises(ValueError):
        api().validate_assembly(ASSEMBLY, ['Base', 'Arm', 'Loose'])


def test_bim_preserves_explicit_geometry():
    assert api().validate_bim(BIM) == BIM


@pytest.mark.parametrize('edit', [
    lambda x: x.update(script='import os'),
    lambda x: x['walls'][0].update(end=[0, 0, 0]),
    lambda x: x['walls'][0].update(end=[6000, 0, 100]),
    lambda x: x['walls'][0].update(height=float('nan')),
    lambda x: x['slabs'][0].update(thickness=-1),
    lambda x: x['slabs'][0].update(name='Wall'),
    lambda x: x['openings'][0].update(wall='Missing'),
    lambda x: x['openings'][0].update(offset=5800),
    lambda x: x['openings'][0].update(sill=2000),
    lambda x: x['openings'][0].update(width=True),
])
def test_bim_rejects_unsafe_or_impossible_geometry(edit):
    value = deepcopy(BIM)
    edit(value)
    with pytest.raises(ValueError):
        api().validate_bim(value)


def test_bim_rejects_overlapping_openings():
    value = deepcopy(BIM)
    value['openings'].append({**value['openings'][0], 'name': 'Other', 'offset': 1200})
    with pytest.raises(ValueError):
        api().validate_bim(value)
