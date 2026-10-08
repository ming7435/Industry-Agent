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
FREECAD_PYTHON = ROOT / '.runtime/freecad/bin/python.exe'
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


def run_kernel(body, tmp_path):
    if not FREECAD_PYTHON.is_file():
        pytest.skip('未安装项目本地 FreeCAD 内核；离线测试不冒充真实验收')
    source = api().KERNEL_SOURCE
    program = (source + '\nimport json\nfrom pathlib import Path\n'
               + 'out = Path(' + repr(str(tmp_path)) + ')\n' + body)
    result = subprocess.run([str(FREECAD_PYTHON), '-c', program], cwd=ROOT,
                            text=True, encoding='utf-8', capture_output=True, timeout=60,
                            env={**os.environ, 'QT_QPA_PLATFORM': 'offscreen'})
    assert result.returncode == 0, result.stdout + result.stderr
    output = next(line[7:] for line in result.stdout.splitlines() if line.startswith('RESULT:'))
    return json.loads(output)


@pytest.mark.parametrize('kind,end,expected_position,expected_q', [
    ('revolute', 90, [0, 0, 20], [0, 0, 0.7071067811865475, 0.7071067811865476]),
    ('slider', 10, [0, 0, 30], [0, 0, 0, 1]),
])
def test_real_native_motion_and_world_exports(kind, end, expected_position, expected_q, tmp_path):
    config = deepcopy(ASSEMBLY)
    config['joints'][0]['type'] = kind
    config['motion']['end'] = end
    config = api().validate_assembly(config, ['Base', 'Arm'])
    data = run_kernel('''doc = App.newDocument("MotionTest")
base = doc.addObject("PartDesign::Feature", "Base")
base.Shape = Part.makeBox(10, 10, 10)
arm = doc.addObject("PartDesign::Feature", "Arm")
arm.Shape = Part.makeBox(20, 4, 4)
doc.recompute()
objects, proof = constrain_assembly(doc, [base, arm], ''' + repr(config) + ''', out)
motion = json.loads((out / "motion.json").read_text(encoding="utf-8"))
Part.export(objects, str(out / "roundtrip.step"))
restored = Part.read(str(out / "roundtrip.step"))
print("RESULT:" + json.dumps({"proof": proof, "motion": motion,
    "bounds": [restored.BoundBox.XMin, restored.BoundBox.ZMax],
    "types": [o.TypeId for o in doc.Objects]}))
App.closeDocument(doc.Name)
''', tmp_path)
    assert data['proof']['assembly']['solver_status'] == 0
    assert data['proof']['assembly']['motion_frames'] == 5
    assert data['proof']['assembly']['motion_interference_checked'] is False
    assert 'Assembly::AssemblyObject' in data['types']
    frames = data['motion']['frames']
    assert [frame['time'] for frame in frames] == [0, .5, 1, 1.5, 2]
    assert frames[-1]['placements'][0]['position'] == [0, 0, 0]
    assert frames[-1]['placements'][1]['position'] == pytest.approx(expected_position)
    assert frames[-1]['placements'][1]['quaternion'] == pytest.approx(expected_q)
    assert data['bounds'] == pytest.approx([0, 24])
    triangles = data['motion']['components'][1]['triangles']
    assert len(triangles) >= 108 and len(triangles) % 9 == 0
    assert min(triangles[2::3]) == 0
    assert max(triangles[2::3]) == 4


def test_real_fixed_joint_places_component_and_returns_world_shapes(tmp_path):
    config = deepcopy(ASSEMBLY)
    config.pop('motion')
    config['joints'][0]['type'] = 'fixed'
    config = api().validate_assembly(config, ['Base', 'Arm'])
    data = run_kernel('''doc = App.newDocument("FixedTest")
objects = []
for name in ("Base", "Arm"):
    obj = doc.addObject("PartDesign::Feature", name)
    obj.Shape = Part.makeBox(10, 10, 10)
    objects.append(obj)
doc.recompute()
objects, proof = constrain_assembly(doc, objects, ''' + repr(config) + ''', out)
print("RESULT:" + json.dumps({"proof": proof, "z": objects[1].Shape.BoundBox.ZMin,
    "motion_exists": (out / "motion.json").exists()}))
App.closeDocument(doc.Name)
''', tmp_path)
    assert data['z'] == pytest.approx(20)
    assert data['proof']['assembly']['motion_frames'] == 0
    assert data['motion_exists'] is False


def test_real_snapshots_preserve_request_identity_when_freecad_deduplicates_labels(tmp_path):
    config = deepcopy(ASSEMBLY)
    config.pop('motion')
    config['joints'][0]['type'] = 'fixed'
    config = api().validate_assembly(config, ['Base', 'Arm'])
    data = run_kernel('''doc = App.newDocument("IdentityTest")
objects = []
for name in ("Base", "Arm"):
    obj = doc.addObject("PartDesign::Feature", name)
    obj.Shape = Part.makeBox(10, 10, 10)
    objects.append(obj)
doc.recompute()
preferences = App.ParamGet("User parameter:BaseApp/Preferences/Document")
previous = preferences.GetBool("DuplicateLabels", False)
try:
    preferences.SetBool("DuplicateLabels", False)
    snapshots, proof = constrain_assembly(doc, objects, ''' + repr(config) + ''', out)
finally:
    preferences.SetBool("DuplicateLabels", previous)
print("RESULT:" + json.dumps({"names": [getattr(o, "IndustryPartName", None) for o in snapshots],
    "labels": [o.Label for o in snapshots],
    "source_names": [getattr(o, "IndustryPartName", None) for o in objects]}))
App.closeDocument(doc.Name)
''', tmp_path)
    assert data['names'] == ['Base', 'Arm']
    assert data['source_names'] == ['Base', 'Arm']
    assert data['labels'] != data['names']


def test_real_fcstd_edit_shows_native_component_and_preserves_drawing_sources(tmp_path):
    config = deepcopy(ASSEMBLY)
    config.pop('motion')
    config['joints'][0]['type'] = 'fixed'
    config = api().validate_assembly(config, ['Base', 'Arm'])
    data = run_kernel('''import FreeCADGui as Gui, TechDraw
Gui.showMainWindow()
Gui.getMainWindow().hide()
doc = App.newDocument("EditableTest")
objects = []
for name in ("Base", "Arm"):
    obj = doc.addObject("PartDesign::Feature", name)
    obj.Shape = Part.makeBox(10, 10, 10)
    objects.append(obj)
doc.recompute()
snapshots, proof = constrain_assembly(doc, objects, ''' + repr(config) + ''', out)
view = doc.addObject("TechDraw::DrawViewPart", "ReviewDrawing")
view.Source = snapshots
finalize_workbenches(doc, snapshots, {"assembly": ''' + repr(config) + '''})
doc.saveAs(str(out / "editable.FCStd"))
App.closeDocument(doc.Name)
doc = App.openDocument(str(out / "editable.FCStd"))
joint = next(o for o in doc.Objects if getattr(o, "JointType", None) == "Fixed")
joint.Offset1 = App.Placement(App.Vector(0, 0, 40), App.Rotation())
doc.recompute()
status = doc.getObject("Assembly").solve()
snapshots = list(doc.getObject("ReviewDrawing").Source)
sources = [o.IndustrySourceObject for o in snapshots]
print("RESULT:" + json.dumps({"solver_status": status,
    "source_visible": [o.ViewObject.Visibility for o in sources],
    "snapshot_visible": [o.ViewObject.Visibility for o in snapshots],
    "arm_z": sources[1].Shape.BoundBox.ZMin,
    "drawing_sources": [o.IndustryPartName for o in snapshots]}))
App.closeDocument(doc.Name)
''', tmp_path)
    assert data['solver_status'] == 0
    assert data['source_visible'] == [True, True]
    assert data['snapshot_visible'] == [False, False]
    assert data['arm_z'] == pytest.approx(40)
    assert data['drawing_sources'] == ['Base', 'Arm']


def test_real_motion_keeps_initial_part_placement_and_local_mesh_separate(tmp_path):
    config = deepcopy(ASSEMBLY)
    config['motion'].update(start=30, end=60)
    config = api().validate_assembly(config, ['Base', 'Arm'])
    data = run_kernel('''import FreeCADGui as Gui
Gui.showMainWindow()
Gui.getMainWindow().hide()
doc = App.newDocument("OffsetTest")
base = doc.addObject("PartDesign::Feature", "Base")
base.Shape = Part.makeBox(10, 10, 10)
base.Placement.Base = App.Vector(100, 200, 0)
arm = doc.addObject("PartDesign::Feature", "Arm")
arm.Shape = Part.makeBox(20, 4, 4)
arm.Placement.Base = App.Vector(-50, -50, 0)
doc.recompute()
objects, proof = constrain_assembly(doc, [base, arm], ''' + repr(config) + ''', out)
motion = json.loads((out / "motion.json").read_text(encoding="utf-8"))
finalize_workbenches(doc, objects, {"assembly": ''' + repr(config) + '''})
doc.saveAs(str(out / "roundtrip.FCStd"))
App.closeDocument(doc.Name)
restored = App.openDocument(str(out / "roundtrip.FCStd"))
restored.recompute()
assembly = next(o for o in restored.Objects if o.TypeId == "Assembly::AssemblyObject")
print("RESULT:" + json.dumps({"motion": motion, "solver_status": assembly.solve(),
    "joint_count": len([o for o in restored.Objects if hasattr(o, "JointType")]),
    "simulation_view": type(restored.getObject("Simulation").ViewObject.Proxy).__name__,
    "motion_view": type(restored.getObject("Motion").ViewObject.Proxy).__name__}))
App.closeDocument(restored.Name)
''', tmp_path)
    assert data['solver_status'] == 0
    assert data['joint_count'] == 1
    assert data['simulation_view'] == 'ViewProviderSimulation'
    assert data['motion_view'] == 'ViewProviderMotion'
    frame = data['motion']['frames'][0]
    assert frame['placements'][0]['position'] == pytest.approx([100, 200, 0])
    assert frame['placements'][1]['position'] == pytest.approx([100, 200, 20])
    assert frame['placements'][1]['quaternion'] == pytest.approx([0, 0, .2588190451, .9659258263])
    triangles = data['motion']['components'][1]['triangles']
    assert min(triangles[0::3]) == pytest.approx(0)
    assert max(triangles[0::3]) == pytest.approx(20)


def test_real_bim_opening_reduces_host_volume_and_is_not_exported(tmp_path):
    config = api().validate_bim(BIM)
    data = run_kernel('''doc = App.newDocument("BimTest")
objects, proof = build_bim(doc, ''' + repr(config) + ''')
print("RESULT:" + json.dumps({"proof": proof, "volumes": [o.Shape.Volume for o in objects],
    "types": [o.IfcType for o in objects], "valid": [o.Shape.isValid() for o in objects],
    "opening_types": [o.IfcType for o in doc.Objects if hasattr(o, "IfcType")]}))
App.closeDocument(doc.Name)
''', tmp_path)
    assert data['volumes'] == pytest.approx([3222000000, 4800000000])
    assert data['types'] == ['Wall', 'Slab']
    assert data['valid'] == [True, True]
    assert 'Opening Element' in data['opening_types']
    assert data['proof']['bim']['opening_volume_removed'] == pytest.approx(378000000)
