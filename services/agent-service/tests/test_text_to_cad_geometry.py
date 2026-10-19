"""Actual CAD kernel contracts: no FreeCAD mock and no substituted meshes."""
import math
from pathlib import Path
import subprocess
import sys

import pytest

from app.tools.cad.text_to_cad_kernel import build_operations, build_spec, model_program


def box(length=20, width=15, height=10):
    return {'type': 'box', 'mode': 'add', 'position': [0, 0, 0], 'length': length, 'width': width, 'height': height}


def test_drilled_block_has_exact_volume_and_bounds():
    shape = build_operations([box(), {'type': 'cylinder', 'mode': 'cut', 'position': [10, 7.5, 0],
                                     'axis': 'z', 'diameter': 6, 'length': 10}])
    assert shape.is_valid and len(shape.solids()) == 1
    assert shape.volume == pytest.approx(3000 - math.pi * 90, rel=1e-9)
    assert tuple(shape.bounding_box(optimal=True).size) == pytest.approx((20, 15, 10), abs=1e-6)


def test_tetrahedron_has_four_faces_six_equal_edges():
    shape = build_operations([{'type': 'tetrahedron', 'mode': 'add', 'position': [12, -8, 5], 'edge_length': 100}])
    assert shape.is_valid and len(shape.faces()) == 4 and len(shape.edges()) == 6
    assert [e.length for e in shape.edges()] == pytest.approx([100] * 6)
    assert shape.volume == pytest.approx(100**3 / (6 * math.sqrt(2)))


@pytest.mark.parametrize('feature', [{'type': 'fillet', 'radius': 2, 'edges': 'all'},
                                    {'type': 'chamfer', 'distance': 2, 'edges': [1, 3]}])
def test_edge_features_really_change_geometry(feature):
    shape = build_operations([box(60, 40, 20), feature])
    assert shape.is_valid and 0 < shape.volume < 48000


def test_disconnected_and_ineffective_operations_fail():
    with pytest.raises(ValueError):
        build_operations([box(), {**box(), 'position': [100, 0, 0]}])
    with pytest.raises(ValueError):
        build_operations([box(), {**box(), 'mode': 'cut', 'position': [100, 0, 0]}])


def test_involute_gear_has_a_real_bore():
    shape = build_operations([{'type': 'gear', 'mode': 'add', 'position': [0, 0, 0], 'axis': 'z',
        'module': 2, 'teeth': 20, 'pressure_angle': 20, 'width': 10, 'bore_diameter': 8}])
    assert shape.is_valid and len(shape.solids()) == 1
    assert math.pi * (17.5**2 - 4**2) * 10 < shape.volume < math.pi * (22**2 - 4**2) * 10
    from OCP.BRepAdaptor import BRepAdaptor_Surface
    from OCP.GeomAbs import GeomAbs_Cylinder
    cylinders = [BRepAdaptor_Surface(face.wrapped) for face in shape.faces()]
    root_fillets = [surface for surface in cylinders if surface.GetType() == GeomAbs_Cylinder
                    and math.isclose(surface.Cylinder().Radius(), .38 * 2, abs_tol=1e-6)]
    assert len(root_fillets) == 40, 'each tooth must retain both 0.38-module root fillets'


@pytest.mark.parametrize('operation,expected_bounds', [
    (box(), (20,15,10)),
    ({'type':'gear','mode':'add','position':[0,0,0],'axis':'z',
      'module':2,'teeth':20,'pressure_angle':20,'width':10,'bore_diameter':8}, (44,44,10)),
    ({'type':'thread','mode':'add','position':[0,0,0],'axis':'z',
      'major_diameter':20,'pitch':2,'length':8,'depth':1,'flank_angle':60,'hand':'right'}, (20,20,8)),
])
def test_portable_source_builds_step_stl_and_roundtrips(tmp_path, monkeypatch, operation, expected_bounds):
    from cadgen import read_step
    script = tmp_path / 'model.py'
    script.write_text(model_program({'units': 'mm', 'operations': [operation]}, tmp_path, 'FC-' + 'a'*64, portable=True), encoding='utf-8')
    result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True, timeout=100)
    assert result.returncode == 0, result.stdout + result.stderr
    monkeypatch.setenv('CADGEN_CACHE_DIR', str(tmp_path / '.cadgen-cache'))
    monkeypatch.setenv('CADGEN_DAEMON', '0')
    monkeypatch.setenv('CADGEN_COMPONENT_WORKERS', '1')
    shape = read_step(tmp_path/'model.step')
    assert shape.is_valid and len(shape.solids()) == 1 and shape.volume > 0
    assert tuple(shape.bounding_box(optimal=True).size) == pytest.approx(expected_bounds, rel=1e-6, abs=1e-6)
    if operation['type'] == 'box':
        assert shape.volume == pytest.approx(3000)
    assert (tmp_path/'model.stl').stat().st_size > 84
    assert 'import FreeCAD' not in script.read_text()


def test_static_assembly_keeps_separate_solids_and_rejects_overlap(tmp_path):
    spec = {'units': 'mm', 'parts': [{'name': 'first', 'operations': [box()]},
            {'name': 'second', 'operations': [{**box(), 'position': [30, 0, 0]}]}]}
    shapes, _ = build_spec(spec, tmp_path)
    assert len(shapes) == 2
    spec['parts'][1]['operations'][0]['position'] = [10, 0, 0]
    with pytest.raises(ValueError, match='干涉'):
        build_spec(spec, tmp_path)


@pytest.mark.parametrize('kind,end,last_position', [('revolute',90,[0,0,20]),('slider',10,[0,0,30])])
def test_joint_motion_is_solved_and_ground_stays_fixed(tmp_path, kind, end, last_position):
    import json
    from app.tools.cad.cad_workbenches import validate_assembly
    from app.tools.cad.text_to_cad_assembly import constrain_assembly
    shapes=[build_operations([box()]),build_operations([box(15,3,3)])]
    config=validate_assembly({'grounded':'Base','joints':[{'name':'Joint','type':kind,'part1':'Base','part2':'Arm',
        'connector1':{'position':[0,0,20],'axis':[0,0,1]},'connector2':{'position':[0,0,0],'axis':[0,0,1]}}],
        'motion':{'joint':'Joint','start':0,'end':end,'duration':2,'frames':5}},['Base','Arm'])
    products,evidence=constrain_assembly(shapes,['Base','Arm'],config,tmp_path)
    assert evidence['assembly']['solver_status']==0
    data=json.loads((tmp_path/'motion.json').read_text())
    assert len(data['frames'])==5
    assert data['frames'][-1]['placements'][1]['position']==pytest.approx(last_position,abs=1e-6)
    for frame in data['frames']:
        assert frame['placements'][0]['position']==[0,0,0]
        assert frame['placements'][0]['quaternion']==[0,0,0,1]
    assert products[1].volume==pytest.approx(shapes[1].volume)


def test_building_opening_removes_exact_host_volume(tmp_path):
    from app.tools.cad.cad_workbenches import validate_bim
    from app.tools.cad.text_to_cad_assembly import build_bim
    config=validate_bim({'walls':[{'name':'wall','start':[0,0,0],'end':[6000,0,0],'height':3000,'thickness':200}],
        'slabs':[{'name':'slab','length':6000,'width':4000,'thickness':200,'position':[0,-2000,0]}],
        'openings':[{'name':'door','wall':'wall','offset':1000,'sill':0,'width':900,'height':2100}]})
    shapes,evidence=build_bim(config)
    assert len(shapes)==2
    assert evidence['bim']['opening_volume_removed']==pytest.approx(900*2100*200)
    assert shapes[0].volume==pytest.approx(6000*3000*200-900*2100*200)


def test_loft_keeps_section_height():
    shape=build_operations([{'type':'loft','mode':'add','position':[0,0,5], 'sections':[
        {'z':0,'diameter':40,'center':[0,0]}, {'z':30,'diameter':20,'center':[5,0]},
        {'z':60,'diameter':30,'center':[0,0]}]}])
    assert shape.is_valid
    assert shape.bounding_box(optimal=True).size.Z==pytest.approx(60,abs=1e-6)


def test_thread_keeps_core_and_requested_envelope():
    shape=build_operations([{'type':'thread','mode':'add','position':[0,0,0],'axis':'z',
        'major_diameter':20,'pitch':2,'length':8,'depth':1,'flank_angle':60,'hand':'right'}])
    assert shape.is_valid
    assert math.pi*9**2*8 < shape.volume < math.pi*10**2*8
    # Helical spline booleans carry OCC edge tolerances; use the same one-ppm
    # envelope tolerance enforced by the public model validator.
    assert tuple(shape.bounding_box(optimal=True).size)==pytest.approx((20,20,8),rel=1e-6,abs=1e-6)
