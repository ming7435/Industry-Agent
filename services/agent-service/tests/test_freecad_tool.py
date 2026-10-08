"""真实几何执行边界：模型参数不能变成任意脚本或伪造下载。"""
import importlib
import json
from pathlib import Path

import pytest


def module():
    name = 'app.tools.cad.freecad_mcp'
    assert importlib.util.find_spec(name), '尚未提供本地 FreeCAD MCP 工具'
    return importlib.import_module(name)


def pin():
    return {'units': 'mm', 'operations': [
        {'type': 'cylinder', 'mode': 'add', 'diameter': 30, 'length': 50, 'axis': 'z', 'position': [0, 0, 0]},
        {'type': 'cylinder', 'mode': 'cut', 'diameter': 10, 'length': 50, 'axis': 'z', 'position': [0, 0, 0]},
    ]}


RUN = 'FC-' + 'a' * 64


@pytest.mark.parametrize('change', [
    lambda s: s.update(units='inch'),
    lambda s: s.update(code='import os'),
    lambda s: s['operations'][0].update(diameter=True),
    lambda s: s['operations'][0].update(diameter=float('nan')),
    lambda s: s['operations'][0].update(length=0),
    lambda s: s['operations'][0].update(mode='cut'),
    lambda s: s['operations'][0].update(position=[0, 0]),
    lambda s: s['operations'][0].update(type='gear'),
    lambda s: s.update(operations=s['operations'] * 30),
])
def test_invalid_geometry_is_rejected_before_execution(change):
    m = module()
    spec = pin()
    change(spec)
    with pytest.raises(m.FreeCADModelError):
        m.validate_spec(spec)


def test_parameters_survive_normalization():
    assert module().validate_spec(pin()) == pin()


def test_tetrahedron_exports_four_equilateral_faces_and_six_equal_edges(tmp_path, monkeypatch):
    from freecad_test_kernel import ScriptMCP
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    spec = {'units': 'mm', 'operations': [
        {'type': 'tetrahedron', 'mode': 'add', 'edge_length': 100, 'position': [12, -8, 5]},
    ]}
    with m.freecad_tool_scope(ScriptMCP(), RUN):
        result = m.freecad_mcp(spec)
    evidence = result['validation']
    assert evidence['solid_count'] == 1
    assert evidence['step_roundtrip'] is True
    assert evidence['face_count'] == 4 and evidence['edge_count'] == 6
    assert evidence['edge_lengths_mm'] == pytest.approx([100] * 6)
    assert evidence['face_areas_mm2'] == pytest.approx([4330.127018922193] * 4)
    assert evidence['volume_mm3'] == pytest.approx(117851.1301977579)
    assert evidence['bounds_mm'] == pytest.approx([100, 86.60254037844386, 81.6496580927726])


@pytest.mark.parametrize('change', [
    {'type': []}, {'mode': []}, {'axis': []}, {'diameter': 10 ** 400},
])
def test_malformed_json_parameters_raise_controlled_validation_errors(change):
    m = module()
    spec = pin()
    spec['operations'][0].update(change)
    with pytest.raises(m.FreeCADModelError):
        m.validate_spec(spec)


def test_underlying_xmlrpc_replay_cannot_execute_geometry_twice(tmp_path, monkeypatch):
    from freecad_test_kernel import ScriptMCP
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))

    class ReplayMCP(ScriptMCP):
        def call_tool(self, name, arguments, **kwargs):
            super().call_tool(name, arguments, **kwargs)
            try:
                return super().call_tool(name, arguments, **kwargs)
            except RuntimeError as error:
                return {'content': [{'type': 'text', 'text': 'Failed to execute code: ' + str(error)}]}

    client = ReplayMCP()
    with m.freecad_tool_scope(client, RUN):
        result = m.freecad_mcp(pin())
    assert client.geometry_executions == 1
    assert result['status'] == 'completed'
    assert result['validation']['volume_mm3'] == pytest.approx(31415.9265358979)


def test_claimed_but_unfinished_rpc_is_unknown_and_does_not_execute(tmp_path, monkeypatch):
    from freecad_test_kernel import ScriptMCP
    from app.clients.freecad import FreeCADConnectionError
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))

    class PreviouslyClaimedMCP(ScriptMCP):
        def call_tool(self, name, arguments, **kwargs):
            (m.artifact_path(RUN, 'manifest.json').parent / '.execution-claimed').write_text(RUN)
            try:
                return super().call_tool(name, arguments, **kwargs)
            except RuntimeError as error:
                return {'content': [{'type': 'text', 'text': 'Failed to execute code: ' + str(error)}]}

    client = PreviouslyClaimedMCP()
    with m.freecad_tool_scope(client, RUN):
        with pytest.raises(FreeCADConnectionError) as error:
            m.freecad_mcp(pin())
    assert error.value.code == 'outcome_unknown'
    assert client.geometry_executions == 0


def test_unscoped_tool_cannot_run():
    m = module()
    with pytest.raises(m.FreeCADModelError, match='上下文'):
        m.freecad_mcp(pin())


def test_upstream_text_failure_is_not_a_success(tmp_path, monkeypatch):
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))

    class FailedMCP:
        def call_tool(self, name, arguments, **kwargs):
            assert name == 'execute_code'
            return {'content': [{'type': 'text', 'text': 'Failed to execute code: OCCError'}], 'isError': False}

    with m.freecad_tool_scope(FailedMCP(), RUN):
        with pytest.raises(m.FreeCADModelError, match='未生成'):
            m.freecad_mcp(pin())


def test_success_requires_verified_files_and_single_solid(tmp_path, monkeypatch):
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))

    class NoFilesMCP:
        def call_tool(self, name, arguments, **kwargs):
            return {'content': [{'type': 'text', 'text': 'Code executed successfully: ok'}]}

    with m.freecad_tool_scope(NoFilesMCP(), RUN):
        with pytest.raises(m.FreeCADModelError, match='未生成'):
            m.freecad_mcp(pin())


def test_invalid_export_retains_actual_mcp_return(tmp_path, monkeypatch):
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    response = {'content': [{'type': 'text', 'text': 'Code executed successfully: ok'}]}

    class InvalidFilesMCP:
        def call_tool(self, name, arguments, **kwargs):
            m.artifact_path(RUN, 'manifest.json').write_text('{}', encoding='utf-8')
            return response

    with m.freecad_tool_scope(InvalidFilesMCP(), RUN):
        with pytest.raises(m.FreeCADModelError) as error:
            m.freecad_mcp(pin())
    assert error.value.calls[0]['result'] == response


@pytest.mark.parametrize('change', [
    {'solid_count': True}, {'units': 'inch'}, {'volume_mm3': True}, {'bounds_mm': [True, 30, 50]},
])
def test_export_evidence_requires_correct_units_and_real_numbers(tmp_path, monkeypatch, change):
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))

    class InvalidEvidenceMCP:
        def call_tool(self, name, arguments, **kwargs):
            evidence = {'run_id': RUN, 'spec': pin(), 'valid': True, 'solid_count': 1,
                'volume_mm3': 31415.9265358979, 'bounds_mm': [30, 30, 50], 'step_roundtrip': True,
                'units': 'mm', **change}
            for filename in ('model.stl', 'model.step', 'model.FCStd'):
                m.artifact_path(RUN, filename).write_bytes(b'isolated-export')
            m.artifact_path(RUN, 'manifest.json').write_text(json.dumps(evidence), encoding='utf-8')
            return {'content': [{'type': 'text', 'text': 'Code executed successfully: ok'}]}

    with m.freecad_tool_scope(InvalidEvidenceMCP(), RUN):
        with pytest.raises(m.FreeCADModelError):
            m.freecad_mcp(pin())


@pytest.mark.parametrize('triangulated_bounds', [False, True])
def test_server_generated_program_executes_through_mcp_and_exports(tmp_path, monkeypatch, triangulated_bounds):
    """仅隔离 FreeCAD 依赖，执行真实生成脚本，断言切除后体积与导出副作用。"""
    m = module()
    monkeypatch.setenv('FREECAD_ARTIFACT_ROOT', str(tmp_path))
    from freecad_test_kernel import ScriptMCP
    client = ScriptMCP(triangulated_bounds=triangulated_bounds)
    with m.freecad_tool_scope(client, RUN):
        result = m.freecad_mcp(pin())
        with pytest.raises(m.FreeCADModelError, match='重复'):
            m.freecad_mcp(pin())
    assert result['status'] == 'completed'
    assert result['validation']['volume_mm3'] == pytest.approx(31415.9265358979)
    assert result['validation']['solid_count'] == 1
    assert {a['format'] for a in result['artifacts']} == {'stl', 'step', 'fcstd'}
    assert result['calls'][0]['tool'] == 'execute_code'
    assert m.artifact_path(RUN, 'model.stl').is_file()


@pytest.mark.parametrize('run,name', [(RUN, '../private'), ('../', 'model.stl'), (RUN, 'secret.env')])
def test_artifact_path_is_fixed_and_scoped(run, name):
    with pytest.raises(module().FreeCADModelError):
        module().artifact_path(run, name)
