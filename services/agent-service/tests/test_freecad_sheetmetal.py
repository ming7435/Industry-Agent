"""钣金输入契约及可选的独立 FreeCAD 内核验收。"""
import importlib
import json
import os
from pathlib import Path
import subprocess

import pytest


EXAMPLE = {
    'width': 80, 'base_length': 60, 'flange_length': 30,
    'thickness': 2, 'bend_radius': 3, 'bend_angle': 90, 'k_factor': 0.4,
}


def sheetmetal_module():
    source = Path(__file__).resolve().parents[1] / 'app/tools/cad/freecad_sheetmetal.py'
    assert source.is_file(), '钣金模块尚未实现'
    spec = importlib.util.spec_from_file_location('freecad_sheetmetal_contract', source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


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


def test_sheet_metal_missing_addon_is_an_explicit_failure(tmp_path, monkeypatch):
    module = sheetmetal_module()
    import builtins
    real_import = builtins.__import__

    def blocked(name, *args, **kwargs):
        if name == 'SheetMetalCmd':
            raise ImportError('addon unavailable')
        return real_import(name, *args, **kwargs)

    scope = {}
    exec(module.KERNEL_SOURCE, scope)
    monkeypatch.setattr(builtins, '__import__', blocked)
    with pytest.raises(RuntimeError, match='SheetMetal'):
        scope['build_sheet_metal'](None, EXAMPLE, tmp_path)
    assert not list(tmp_path.iterdir())


@pytest.mark.skipif(os.getenv('FREECAD_SHEETMETAL_INTEGRATION') != '1',
                    reason='独立 FreeCAD 验收需显式开启，离线测试不代替内核验收')
@pytest.mark.parametrize('angle,kfactor', [(90, 0.4), (60, 0.5)])
def test_real_bent_sheet_and_unfold_are_valid_and_editable(tmp_path, angle, kfactor):
    module = sheetmetal_module()
    root = Path(__file__).resolve().parents[3]
    runtime = root / '.runtime' / 'freecad'
    config = {**EXAMPLE, 'bend_angle': angle, 'k_factor': kfactor}
    code = '''import sys, os, json, math
from pathlib import Path
runtime, source, output, config = sys.argv[1:]
runtime = Path(runtime)
sys.path[:0] = [str(runtime / 'bin'), str(runtime / 'lib')]
for item in (runtime / 'Mod').iterdir():
    if item.is_dir(): sys.path.append(str(item))
import FreeCAD as App
import FreeCADGui
FreeCADGui.setupWithoutGUI()
namespace = {}
exec(Path(source).read_text(encoding='utf-8'), namespace)
exec(namespace['KERNEL_SOURCE'], namespace)
doc = App.newDocument('SheetMetalIndependentVerification')
objects, proof = namespace['build_sheet_metal'](doc, json.loads(config), Path(output))
assert len(objects) == 1
assert objects[0].Shape.isValid() and len(objects[0].Shape.Solids) == 1
assert sum(isinstance(face.Surface, __import__('Part').Cylinder) for face in objects[0].Shape.Faces) == 2
assert doc.getObject('SheetMetalUnfold').Proxy is not None
doc.saveAs(str(Path(output) / 'model.FCStd'))
App.closeDocument(doc.Name)
doc = App.openDocument(str(Path(output) / 'model.FCStd'))
doc.recompute()
assert doc.getObject('SheetMetalBend').Shape.isValid()
assert doc.getObject('SheetMetalUnfold').Shape.isValid()
doc.getObject('SheetMetalBend').radius = 4
doc.recompute()
expected_volume = 160 * (90 + math.radians(json.loads(config)['bend_angle']) *
                         (4 + 2 * json.loads(config)['k_factor']))
assert math.isclose(doc.getObject('SheetMetalUnfold').Shape.Volume, expected_volume, rel_tol=1e-6)
App.closeDocument(doc.Name)
print('SHEETMETAL_RESULT=' + json.dumps(proof))
'''
    completed = subprocess.run(
        [str(runtime / 'bin' / 'python.exe'), '-c', code, str(runtime), module.__file__,
         str(tmp_path), json.dumps(config)], capture_output=True, text=True,
        encoding='utf-8', errors='replace', timeout=90,
        env={**os.environ, 'QT_QPA_PLATFORM': 'offscreen', 'PYTHONIOENCODING': 'utf-8'},
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr
    line = next(line for line in completed.stdout.splitlines() if line.startswith('SHEETMETAL_RESULT='))
    proof = json.loads(line.split('=', 1)[1])['sheet_metal']
    assert proof['verified'] is True and proof['bend_count'] == 1
    assert proof['plugin_version'] == '0.8.24'
    # 手算：80 * [60 + 30 + (3 + 0.4*2) * pi/2]。
    if angle == 90:
        assert proof['unfold_area_mm2'] == pytest.approx(7677.522083345648, rel=1e-6)
        assert proof['unfold_volume_mm3'] == pytest.approx(15355.044166691296, rel=1e-6)
    assert '<svg' in (tmp_path / 'unfold.svg').read_text(encoding='utf-8')
    dxf = (tmp_path / 'unfold.dxf').read_text(encoding='utf-8')
    assert 'SECTION' in dxf and 'ENTITIES' in dxf and 'EOF' in dxf
