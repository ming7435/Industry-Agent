"""公共规格、节点工具与扩展文件契约；真实工作台验收另用本机 MCP。"""
from copy import deepcopy
import json
import pytest

from app.tools.cad.freecad_mcp import validate_spec, FreeCADModelError, freecad_mcp, freecad_tool_scope, artifact_path

BOX = {'units': 'mm', 'operations': [{'type': 'box', 'mode': 'add', 'length': 60, 'width': 40, 'height': 20, 'position': [0, 0, 0]}]}
DRAWING = {'projection': 'third_angle', 'scale': 1, 'section': {'origin': [30, 20, 10], 'normal': [0, 1, 0]}}


def drawing_proof():
    return {'verified': True, 'projection': 'third_angle', 'scale': 1, 'paper': 'A3',
            'views': [{'name': name, 'visible_edges': 4} for name in ('Front', 'Top', 'Right', 'Isometric', 'Section')],
            'section': True, 'svg_geometry_elements': 20, 'pdf_bytes': 21, 'pdf_graphics_streams': 1}


def test_drawing_is_preserved_without_changing_existing_geometry():
    spec = {**deepcopy(BOX), 'drawing': deepcopy(DRAWING)}
    assert validate_spec(spec) == spec


@pytest.mark.parametrize('extra', [{'path': 'C:/private'}, {'code': 'print(1)'}, {'tool': 'delete_document'}])
def test_new_features_do_not_accept_arbitrary_execution_fields(extra):
    with pytest.raises(FreeCADModelError):
        validate_spec({**BOX, 'drawing': {**DRAWING, **extra}})


@pytest.mark.parametrize('name', ['drawing.svg', 'drawing.pdf', 'unfold.svg', 'unfold.dxf', 'motion.json'])
def test_workbench_artifacts_use_same_run_directory(tmp_path, monkeypatch, name):
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    run_id = 'FC-' + 'e' * 64
    assert artifact_path(run_id, name) == tmp_path / run_id / name
    with pytest.raises(FreeCADModelError):
        artifact_path(run_id, '../' + name)


class DrawingTransport:
    """仅替代外部MCP执行，工具的规格/归属/文件检查保持真实。"""
    def __init__(self, run_id, spec, broken=None):
        self.run_id, self.spec, self.broken = run_id, spec, broken

    def call_tool(self, name, arguments, **kwargs):
        assert name == 'execute_code'
        compile(arguments['code'], '<trusted-freecad-program>', 'exec')
        for filename in ('model.stl', 'model.step', 'model.FCStd'):
            artifact_path(self.run_id, filename).write_bytes(b'test-transport-export')
        artifact_path(self.run_id, 'drawing.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L10 0L10 10Z"/></svg>', encoding='utf-8')
        artifact_path(self.run_id, 'drawing.pdf').write_bytes(b'%PDF-1.7\n%fixture\n%%EOF')
        proof = {'run_id': self.run_id, 'spec': self.spec, 'units': 'mm', 'valid': True,
            'solid_count': 1, 'step_roundtrip': True, 'volume_mm3': 48000, 'bounds_mm': [60, 40, 20],
            'drawing': drawing_proof()}
        if self.broken == 'proof':
            proof['drawing']['verified'] = False
        if self.broken == 'pdf':
            artifact_path(self.run_id, 'drawing.pdf').write_bytes(b'not a PDF')
        if self.broken == 'svg':
            artifact_path(self.run_id, 'drawing.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', encoding='utf-8')
        artifact_path(self.run_id, 'manifest.json').write_text(json.dumps(proof), encoding='utf-8')
        return {'content': [{'type': 'text', 'text': '执行完成'}]}


def test_verified_drawing_files_return_from_the_real_tool(tmp_path, monkeypatch):
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    spec = {**BOX, 'drawing': DRAWING}
    run_id = 'FC-' + 'd' * 64
    with freecad_tool_scope(DrawingTransport(run_id, spec), run_id):
        result = freecad_mcp(spec)
    assert result['status'] == 'completed'
    assert {a['name'] for a in result['artifacts']} == {'model.stl', 'model.step', 'model.FCStd', 'drawing.svg', 'drawing.pdf'}
    assert len(result['calls']) == 1


@pytest.mark.parametrize('broken', ['proof', 'pdf', 'svg'])
def test_incomplete_drawing_cannot_be_completed(tmp_path, monkeypatch, broken):
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    spec = {**BOX, 'drawing': DRAWING}
    run_id = 'FC-' + 'c' * 64
    with freecad_tool_scope(DrawingTransport(run_id, spec, broken), run_id):
        with pytest.raises(FreeCADModelError):
            freecad_mcp(spec)


@pytest.mark.parametrize('name,mime', [('drawing.svg', 'image/svg+xml'), ('drawing.pdf', 'application/pdf'), ('unfold.dxf', 'image/vnd.dxf'), ('motion.json', 'application/json')])
def test_api_delivers_only_registered_workbench_artifacts(tmp_path, monkeypatch, name, mime):
    from test_freecad_api import api, PREFIX
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    client, store = api()
    run_id = 'FC-' + 'a' * 64
    path = artifact_path(run_id, name)
    path.parent.mkdir()
    path.write_bytes(b'file-body')
    store.set(run_id, {'run_id': run_id, 'status': 'completed', 'artifacts': [{'name': name}]})
    response = client.get(f'{PREFIX}/runs/{run_id}/artifacts/{name}')
    assert response.status_code == 200
    assert response.headers['content-type'].split(';')[0] == mime
    assert response.content == b'file-body'
    store.set(run_id, {'run_id': run_id, 'status': 'failed', 'artifacts': [{'name': name}]})
    assert client.get(f'{PREFIX}/runs/{run_id}/artifacts/{name}').status_code == 404


def motion_fixture():
    # 四面体局部三角网格；帧记录真实零件位姿，而不是镜头角度。
    triangles = [0,0,0, 0,1,0, 1,0,0, 0,0,0, 1,0,0, 0,0,1,
                 0,0,0, 0,0,1, 0,1,0, 1,0,0, 0,1,0, 0,0,1]
    components = [{'name': name, 'triangles': triangles} for name in ('Base', 'Arm')]
    frames = [{'time': time, 'placements': [
        {'name': 'Base', 'position': [0,0,0], 'quaternion': [0,0,0,1]},
        {'name': 'Arm', 'position': [time,0,0], 'quaternion': [0,0,0,1]}]} for time in (0,1)]
    return {'components': components, 'frames': frames}


def test_motion_artifact_requires_complete_mesh_and_each_part_placement(tmp_path):
    from app.tools.cad.freecad_mcp import _validate_extra_file
    path = tmp_path / 'motion.json'
    path.write_text(json.dumps(motion_fixture()), encoding='utf-8')
    _validate_extra_file(path)
    path.write_text('{"components":[{}],"frames":[{},{}]}', encoding='utf-8')
    with pytest.raises(ValueError):
        _validate_extra_file(path)


@pytest.mark.parametrize('broken', ['mesh', 'zero_quaternion', 'missing_part', 'duplicate_time', 'nan', 'unknown_field'])
def test_invalid_motion_data_is_rejected(tmp_path, broken):
    from app.tools.cad.freecad_mcp import _validate_extra_file
    motion = motion_fixture()
    if broken == 'mesh': motion['components'][0]['triangles'] = [0] * 36
    if broken == 'zero_quaternion': motion['frames'][1]['placements'][0]['quaternion'] = [0]*4
    if broken == 'missing_part': motion['frames'][1]['placements'][1]['name'] = 'Other'
    if broken == 'duplicate_time': motion['frames'][1]['time'] = 0
    if broken == 'nan': motion['frames'][1]['placements'][1]['position'][0] = float('nan')
    if broken == 'unknown_field': motion['frames'][1]['code'] = 'unexpected'
    path = tmp_path / 'motion.json'
    path.write_text(json.dumps(motion), encoding='utf-8')
    with pytest.raises(ValueError):
        _validate_extra_file(path)


@pytest.mark.parametrize('change', [{'views': []}, {'projection': 'first_angle'}, {'scale': 2}, {'section': False}, {'pdf_graphics_streams': 0}])
def test_drawing_proof_matches_requested_views_and_projection(change):
    from app.tools.cad.freecad_mcp import _validate_workbench_evidence
    with pytest.raises(ValueError):
        _validate_workbench_evidence({'drawing': DRAWING}, {'drawing': {**drawing_proof(), **change}})


def test_sheet_metal_boolean_is_not_enough_to_prove_unfolding():
    from app.tools.cad.freecad_mcp import _validate_workbench_evidence
    config = {'width': 80, 'base_length': 60, 'flange_length': 30, 'thickness': 2, 'bend_radius': 3, 'bend_angle': 90, 'k_factor': .4}
    with pytest.raises(ValueError):
        _validate_workbench_evidence({'sheet_metal': config}, {'sheet_metal': {'verified': True}})


def test_motion_proof_cannot_change_requested_frame_count():
    from app.tools.cad.freecad_mcp import _validate_workbench_evidence
    config = {'grounded': 'Base', 'joints': [{'name': 'Joint', 'type': 'slider', 'part1': 'Base', 'part2': 'Arm'}],
              'motion': {'frames': 2, 'duration': 1}}
    proof = {'verified': True, 'solver_status': 0, 'grounded': 'Base', 'joint_count': 1,
             'joints': config['joints'], 'motion_frames': 3, 'motion_interference_checked': False}
    with pytest.raises(ValueError):
        _validate_workbench_evidence({'assembly': config}, {'assembly': proof})
