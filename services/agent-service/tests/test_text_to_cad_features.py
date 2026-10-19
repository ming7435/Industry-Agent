"""Real kernel checks for sheet-metal development and orthographic drawings."""
import math
import xml.etree.ElementTree as ET

import pytest
from cadgen import build123d as bd

from app.tools.cad.text_to_cad_features import build_sheet_metal, make_drawing


SHEET = dict(width=80, base_length=60, flange_length=30, thickness=2,
             bend_radius=3, bend_angle=90, k_factor=0.4)


@pytest.mark.parametrize('angle', [45, 90, 135])
def test_sheet_metal_is_a_bent_solid_with_the_requested_radius_and_development(tmp_path, angle):
    spec = {**SHEET, 'bend_angle': angle}
    shapes, extra = build_sheet_metal(spec, tmp_path)
    assert len(shapes) == 1 and shapes[0].is_valid and len(shapes[0].solids()) == 1
    body = shapes[0]
    cylindrical = [face for face in body.faces() if face.geom_type == bd.GeomType.CYLINDER]
    assert sorted(face.radius for face in cylindrical) == pytest.approx([3, 5])
    expected = 80 * 2 * (60 + 30 + math.radians(angle) * 4)
    assert body.volume == pytest.approx(expected)
    proof = extra['sheet_metal']
    assert proof['unfold_length_mm'] == pytest.approx(90 + math.radians(angle) * 3.8)
    assert proof['unfold_volume_mm3'] == pytest.approx(80 * 2 * proof['unfold_length_mm'])
    assert proof['bend_line_length_mm'] == pytest.approx(80)
    assert ET.parse(tmp_path / 'unfold.svg').getroot().tag.endswith('svg')
    dxf = (tmp_path / 'unfold.dxf').read_text()
    assert 'ENTITIES' in dxf and 'BEND' in dxf and 'EOF' in dxf


def test_k_factor_changes_the_flat_pattern_without_changing_bent_geometry(tmp_path):
    low, high = tmp_path / 'low', tmp_path / 'high'
    low.mkdir(); high.mkdir()
    a, pa = build_sheet_metal({**SHEET, 'k_factor': 0}, low)
    b, pb = build_sheet_metal({**SHEET, 'k_factor': 1}, high)
    assert a[0].volume == pytest.approx(b[0].volume)
    assert pb['sheet_metal']['unfold_length_mm'] - pa['sheet_metal']['unfold_length_mm'] == pytest.approx(math.pi)


def part():
    return bd.Solid.make_box(60, 40, 20).cut(bd.Solid.make_cylinder(6, 20, bd.Plane(origin=(30, 20, 0))))


@pytest.mark.parametrize('projection', ['first_angle', 'third_angle'])
def test_drawing_contains_real_hlr_views_and_page_vector_content(tmp_path, projection):
    proof = make_drawing([part()], dict(projection=projection, scale=1, section=None), tmp_path)['drawing']
    assert proof['verified'] and proof['projection'] == projection
    assert [view['name'] for view in proof['views']] == ['Front', 'Top', 'Right', 'Isometric']
    views = {view['name']: view for view in proof['views']}
    assert views['Front']['bounds_mm'] == pytest.approx([60, 20], abs=1e-5)
    assert views['Top']['bounds_mm'] == pytest.approx([60, 40], abs=1e-5)
    sign = 1 if projection == 'third_angle' else -1
    assert sign * (views['Top']['position_mm'][1] - views['Front']['position_mm'][1]) > 0
    assert sign * (views['Right']['position_mm'][0] - views['Front']['position_mm'][0]) > 0
    assert proof['svg_geometry_elements'] > 20 and proof['pdf_graphics_streams'] == 1
    import fitz
    pdf = fitz.open(tmp_path / 'drawing.pdf')
    assert len(pdf) == 1 and len(pdf[0].get_drawings()) > 20
    assert 'Front' in pdf[0].get_text()


def test_drawing_section_intersects_real_material_and_rejects_a_missed_plane(tmp_path):
    config = dict(projection='third_angle', scale=1, section={'origin': [30, 20, 10], 'normal': [0, 1, 0]})
    proof = make_drawing([part()], config, tmp_path)['drawing']
    section = proof['views'][-1]
    assert section['name'] == 'Section' and section['cut_faces'] == 2
    assert section['cut_area_mm2'] == pytest.approx(960)
    assert section['origin'] == config['section']['origin']
    with pytest.raises(ValueError, match='剖切'):
        make_drawing([part()], {**config, 'section': {'origin': [0, 100, 0], 'normal': [0, 1, 0]}}, tmp_path)


def test_drawing_refuses_oversized_scale_instead_of_silently_fitting(tmp_path):
    with pytest.raises(ValueError, match='A3'):
        make_drawing([part()], dict(projection='third_angle', scale=10, section=None), tmp_path)
    assert not (tmp_path / 'drawing.svg').exists()
