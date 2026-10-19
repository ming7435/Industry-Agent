"""Connector frames preserve the shortest rotation from Z for oblique axes."""
import json
import math

import numpy as np
import pytest
from cadgen import build123d as bd
from scipy.spatial.transform import Rotation

from app.tools.cad.cad_workbenches import validate_assembly
from app.tools.cad.text_to_cad_assembly import constrain_assembly


@pytest.mark.parametrize('kind', ['fixed', 'slider'])
def test_oblique_connector_keeps_the_original_zero_roll_and_real_part_geometry(tmp_path, kind):
    axis = np.ones(3) / math.sqrt(3)
    # Rodrigues rotation about Z cross axis: the original connector convention.
    angle = math.acos(axis[2])
    expected_rotation = Rotation.from_rotvec(np.array([-1, 1, 0]) / math.sqrt(2) * angle).as_matrix()
    anchor = np.array([20., 30., 40.])
    shapes = [bd.Solid.make_box(2, 3, 4), bd.Solid.make_box(10, 4, 2)]
    config = {'grounded': 'Base', 'joints': [{
        'name': 'Mate', 'type': kind, 'part1': 'Base', 'part2': 'Arm',
        'connector1': {'position': anchor.tolist(), 'axis': [1, 1, 1]},
        'connector2': {'position': [0, 0, 0], 'axis': [0, 0, 1]},
    }]}
    if kind == 'slider':
        config['motion'] = {'joint': 'Mate', 'start': 5, 'end': 15, 'duration': 2, 'frames': 3}
    config = validate_assembly(config, ['Base', 'Arm'])
    products, proof = constrain_assembly(shapes, ['Base', 'Arm'], config, tmp_path)
    translation = anchor + (5 * axis if kind == 'slider' else 0)
    expected_vertices = [expected_rotation @ np.array(tuple(vertex)) + translation for vertex in shapes[1].vertices()]
    actual_vertices = [np.array(tuple(vertex)) for vertex in products[1].vertices()]
    assert len(actual_vertices) == len(expected_vertices)
    assert all(min(np.linalg.norm(actual - expected) for actual in actual_vertices) < 1e-6
               for expected in expected_vertices)
    assert tuple(products[0].bounding_box().min) == pytest.approx((0, 0, 0))
    assert products[1].volume == pytest.approx(80)
    assert proof['assembly']['solver_status'] == 0
    if kind == 'slider':
        data = json.loads((tmp_path / 'motion.json').read_text())
        for index, frame in enumerate(data['frames']):
            position = frame['placements'][1]
            assert position['position'] == pytest.approx(anchor + (5 + index * 5) * axis, abs=1e-6)
            assert Rotation.from_quat(position['quaternion']).as_matrix() == pytest.approx(expected_rotation, abs=1e-7)
