"""高级建模的真实规格校验与节点契约；内核验收另外通过本地 MCP 执行。"""
from copy import deepcopy

import pytest

from app.tools.cad.freecad_mcp import FreeCADModelError, validate_spec
from app.agents.cad.graph import _dimensions_are_explicit


def single(operation):
    return {'units': 'mm', 'operations': [operation]}


EXAMPLES = {
    'sphere': single({'type': 'sphere', 'mode': 'add', 'diameter': 40, 'position': [0, 0, 0]}),
    'cone': single({'type': 'cone', 'mode': 'add', 'bottom_diameter': 40, 'top_diameter': 0,
        'height': 60, 'axis': 'z', 'position': [0, 0, 0]}),
    'gear': single({'type': 'gear', 'mode': 'add', 'module': 2, 'teeth': 20,
        'pressure_angle': 20, 'width': 10, 'bore_diameter': 8, 'axis': 'z', 'position': [0, 0, 0]}),
    'thread': single({'type': 'thread', 'mode': 'add', 'major_diameter': 20, 'pitch': 2,
        'length': 20, 'depth': 1, 'flank_angle': 60, 'hand': 'right', 'axis': 'z', 'position': [0, 0, 0]}),
    'loft': single({'type': 'loft', 'mode': 'add', 'position': [0, 0, 0], 'sections': [
        {'z': 0, 'diameter': 40, 'center': [0, 0]},
        {'z': 30, 'diameter': 20, 'center': [5, 0]},
        {'z': 60, 'diameter': 30, 'center': [0, 0]},
    ]}),
    'fillet': {'units': 'mm', 'operations': [
        {'type': 'box', 'mode': 'add', 'length': 60, 'width': 40, 'height': 20, 'position': [0, 0, 0]},
        {'type': 'fillet', 'radius': 2, 'edges': 'all'},
    ]},
    'chamfer': {'units': 'mm', 'operations': [
        {'type': 'box', 'mode': 'add', 'length': 60, 'width': 40, 'height': 20, 'position': [0, 0, 0]},
        {'type': 'chamfer', 'distance': 2, 'edges': [1, 3]},
    ]},
    'assembly': {'units': 'mm', 'parts': [
        {'name': '底座', 'operations': [{'type': 'box', 'mode': 'add', 'length': 60, 'width': 40,
            'height': 10, 'position': [0, 0, 0]}]},
        {'name': '球体', 'operations': [{'type': 'sphere', 'mode': 'add', 'diameter': 20,
            'position': [30, 20, 20]}]},
    ]},
}


@pytest.mark.parametrize('kind', list(EXAMPLES))
def test_complete_advanced_specs_preserve_every_user_parameter(kind):
    assert validate_spec(deepcopy(EXAMPLES[kind])) == EXAMPLES[kind]


@pytest.mark.parametrize('kind,change', [
    ('sphere', {'diameter': True}), ('cone', {'top_diameter': -1}),
    ('cone', {'top_diameter': 40}), ('gear', {'teeth': 20.5}),
    ('gear', {'teeth': 20000}), ('gear', {'bore_diameter': 40}),
    ('gear', {'pressure_angle': 90}), ('thread', {'depth': 12}),
    ('thread', {'pitch': 0.01}), ('thread', {'hand': []}),
    ('thread', {'flank_angle': 180}), ('sphere', {'code': 'import os'}),
])
def test_invalid_advanced_parameters_cannot_reach_mcp(kind, change):
    value = deepcopy(EXAMPLES[kind])
    value['operations'][0].update(change)
    with pytest.raises(FreeCADModelError):
        validate_spec(value)


@pytest.mark.parametrize('operations', [
    [{'type': 'fillet', 'radius': 2, 'edges': 'all'}],
    [EXAMPLES['sphere']['operations'][0], {'type': 'fillet', 'radius': 2, 'edges': []}],
    [EXAMPLES['sphere']['operations'][0], {'type': 'fillet', 'radius': 2, 'edges': [True]}],
    [EXAMPLES['sphere']['operations'][0], {'type': 'chamfer', 'distance': 2, 'edges': [1, 1]}],
])
def test_edge_modifiers_require_existing_shape_and_explicit_unique_edges(operations):
    with pytest.raises(FreeCADModelError):
        validate_spec({'units': 'mm', 'operations': operations})


def test_loft_sections_require_increasing_heights_and_complete_centers():
    value = deepcopy(EXAMPLES['loft'])
    value['operations'][0]['sections'][1]['z'] = 0
    with pytest.raises(FreeCADModelError):
        validate_spec(value)


def test_assembly_requires_named_distinct_complete_parts():
    value = deepcopy(EXAMPLES['assembly'])
    value['parts'][1]['name'] = value['parts'][0]['name']
    with pytest.raises(FreeCADModelError):
        validate_spec(value)


@pytest.mark.parametrize('prompt,kind', [
    ('直径40mm的球体', 'sphere'),
    ('底径40mm、顶径0mm、高60mm的圆锥', 'cone'),
    ('模数2mm、齿数20、压力角20度、齿宽10mm、孔径8mm的直齿轮', 'gear'),
    ('大径20mm、螺距2mm、长20mm、牙深1mm、牙型角60度的右旋外螺纹', 'thread'),
    ('长60mm、宽40mm、高20mm的长方体，全部边圆角半径2mm', 'fillet'),
])
def test_explicit_advanced_prompts_are_semantically_matched(prompt, kind):
    assert _dimensions_are_explicit(EXAMPLES[kind], prompt)


@pytest.mark.parametrize('prompt,kind', [
    ('直径40mm的球体，开一个孔', 'sphere'),
    ('底径40mm、顶径0mm、高60mm的圆锥，加键槽', 'cone'),
    ('模数2mm、齿数20、压力角20度、齿宽10mm的直齿轮', 'gear'),
    ('大径20mm、螺距2mm、长20mm的外螺纹', 'thread'),
])
def test_incomplete_or_additional_features_are_not_discarded(prompt, kind):
    assert not _dimensions_are_explicit(EXAMPLES[kind], prompt)
