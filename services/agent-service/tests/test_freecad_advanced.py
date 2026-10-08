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


def test_thread_export_with_protruding_ends_cannot_be_reported_completed(tmp_path, monkeypatch):
    import json
    from app.tools.cad.freecad_mcp import freecad_mcp, freecad_tool_scope, artifact_path
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    run_id = 'FC-' + 'b'*64
    spec = validate_spec(EXAMPLES['thread'])

    class ProtrudingKernel:
        def call_tool(self, name, arguments, **kwargs):
            evidence = {'run_id': run_id, 'spec': spec, 'units': 'mm', 'valid': True,
                'step_roundtrip': True, 'solid_count': 1, 'volume_mm3': 5930.81506039285,
                'bounds_mm': [20.000011, 20.00001, 20.57735]}
            for name in ('model.stl', 'model.step', 'model.FCStd'):
                artifact_path(run_id, name).write_bytes(b'isolated-export')
            artifact_path(run_id, 'manifest.json').write_text(json.dumps(evidence), encoding='utf-8')
            return {'content': [{'type': 'text', 'text': '执行完成'}]}

    with freecad_tool_scope(ProtrudingKernel(), run_id):
        with pytest.raises(FreeCADModelError):
            freecad_mcp(spec)


def test_advanced_api_executes_graph_skill_and_tool_and_rejects_changed_dimensions(tmp_path, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from freecad_test_kernel import ScriptMCP
    from test_freecad_api import MemoryStore, LocalClient, PREFIX
    from app.agents.cad.modeling_api import build_freecad_router
    from app.harness.trace import TraceRecorder

    class Client(ScriptMCP, LocalClient):
        pass

    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    app = FastAPI()
    trace = TraceRecorder()
    app.state.freecad_run_store = MemoryStore()
    app.state.freecad_client_factory = Client
    app.state.freecad_model_factory = lambda: None
    app.include_router(build_freecad_router(lambda: None, trace=trace))
    client = TestClient(app)
    body = {'prompt': '直径40mm的球体', 'command_id': 'advanced-sphere', 'spec': EXAMPLES['sphere']}
    accepted = client.post(PREFIX + '/runs', json=body)
    assert accepted.status_code == 202
    result = client.get(PREFIX + '/runs/' + accepted.json()['run_id']).json()
    assert result['status'] == 'completed', result
    assert result['spec'] == EXAMPLES['sphere']
    assert result['validation']['bounds_mm'] == [40, 40, 40]
    assert {key: result['execution'][key] for key in ('agent', 'node', 'skill', 'tool')} == {'agent': 'cad', 'node': 'model_3d',
        'skill': 'production_modeling_skill', 'tool': 'freecad_mcp'}
    for artifact in result['artifacts']:
        assert client.get(artifact['url']).status_code == 200
    changed = deepcopy(EXAMPLES['sphere'])
    changed['operations'][0]['diameter'] = 50
    assert client.post(PREFIX + '/runs', json={**body, 'spec': changed}).status_code == 409
    assert client.post(PREFIX + '/runs', json=body).json() == result
    assert len([r for r in trace.list() if r.get('event') == 'tool_completed']) == 1


@pytest.mark.parametrize('kind', ['fillet', 'chamfer'])
@pytest.mark.parametrize('segments', [[(0, 110)], [(0, 90), (100, 110)], [(0, 100)]],
    ids=['concave_volume_increases', 'mixed_edges_same_net_volume', 'no_geometric_change'])
def test_edge_changes_use_actual_geometry_not_a_volume_decrease_assumption(kind, segments, tmp_path):
    """执行真正模板 build；抽象内核以区间集合独立计算布尔体积，不模拟业务判断。"""
    import ast
    import math
    from types import SimpleNamespace
    from app.tools.cad.freecad_mcp import _program

    class KernelShape:
        def __init__(self, regions):
            self.regions = regions
            self.Volume = sum(b-a for a,b in regions)
            self.Solids = [self] if self.Volume > 0 else []
            self.Edges = [object()]
        def isNull(self): return self.Volume == 0
        def isValid(self): return self.Volume >= 0
        def makeFillet(self, radius, edges): return KernelShape(segments)
        def makeChamfer(self, distance, edges): return KernelShape(segments)
        def cut(self, other):
            result = list(self.regions)
            for start,end in other.regions:
                remaining = []
                for a,b in result:
                    if b <= start or a >= end:
                        remaining.append((a,b))
                    else:
                        if a < start: remaining.append((a,start))
                        if b > end: remaining.append((end,b))
                result = remaining
            return KernelShape(result)

    spec = validate_spec({'units': 'mm', 'operations': [
        {'type': 'box', 'mode': 'add', 'length': 100, 'width': 1, 'height': 1, 'position': [0,0,0]},
        {'type': kind, 'radius' if kind == 'fillet' else 'distance': 2, 'edges': [1]},
    ]})
    program = ast.parse(_program(spec, tmp_path, 'FC-'+'c'*64))
    build = next(node for node in ast.walk(program) if isinstance(node, ast.FunctionDef) and node.name == 'build')
    namespace = {'math': math, 'App': SimpleNamespace(Vector=lambda *a: a),
        'Part': SimpleNamespace(makeBox=lambda *a: KernelShape([(0,100)]))}
    exec(compile(ast.Module(body=[build], type_ignores=[]), '<真实CAD模板>', 'exec'), namespace)
    if segments == [(0,100)]:
        with pytest.raises(ValueError):
            namespace['build'](spec['operations'])
    else:
        result = namespace['build'](spec['operations'])
        assert result.regions == segments
        assert result.isValid() and len(result.Solids) == 1
