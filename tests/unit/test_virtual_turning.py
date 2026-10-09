"""Catch incomplete CAD conversion, lossy coordinates and forged execution receipts."""
from copy import deepcopy
import importlib
import math
from pathlib import Path
import sys
import threading

import pytest


def run(axis='z', hole=False):
    value = {'run_id': 'FC-' + 'a' * 64, 'part_name': '试验轴套', 'part_number': 'AX-01',
             'status': 'completed', 'validation': {'valid': True, 'step_roundtrip': True, 'solid_count': 1},
             'spec': {'units': 'mm', 'operations': [
                 {'type': 'cylinder', 'mode': 'add', 'diameter': 20, 'length': 10,
                  'axis': axis, 'position': [1, 2, 3]}]}}
    if hole:
        position = [1, 2, 3]
        position['xyz'.index(axis)] -= 2
        value['spec']['operations'].append({'type': 'cylinder', 'mode': 'cut', 'diameter': 6,
                                           'length': 14, 'axis': axis, 'position': position})
    return value


def setup(hole=False):
    value = {'device_id': 'TRAK-TC820LTYSI-001', 'postprocessor': 'virtual-trak-turning-v1',
             'stock_diameter_mm': 24, 'stock_length_mm': 20, 'grip_length_mm': 5,
             'clearance_mm': 2, 'pass_depth_mm': 2, 'spindle_rpm': 1000,
             'feed_mm_per_rev': .2, 'tolerance_mm': .01, 'tool_id': 1}
    if hole:
        value.update(drill_tool_id=2, drill_diameter_mm=6)
    return value


def factory_module():
    root = Path('C:/Users/12587/Desktop/Factory')
    assert (root / 'simulator/production.py').is_file(), 'isolated factory source is required'
    sys.path.insert(0, str(root))
    return importlib.import_module('simulator.production')


class RunningLine:
    lock = threading.RLock()

    def list_devices(self):
        return [{'device_id': key, 'status': 'running'} for key in [
            'TRAK-TC820LTYSI-001', 'LNS-QL-SERVO-80-S2-001',
            'ELITE-CS612-ROBOT-001', 'RENISHAW-EQUATOR300-001']]


@pytest.mark.parametrize('hole,points,duration,volume', [(False, 7, 6.72, 1000), (True, 12, 12.24, 910)])
def test_generated_program_is_accepted_by_factory(hole, points, duration, volume):
    from shared.virtual_turning import build_virtual_design, build_virtual_program, validate_virtual_program
    design = build_virtual_design(run(hole=hole))
    program = build_virtual_program(design, setup(hole), '模拟钢材')
    assert len(program['toolpath']) == points
    assert program['simulation']['duration_seconds'] == pytest.approx(duration)
    assert program['simulation']['simulated_volume_mm3'] == pytest.approx(volume * math.pi)
    assert program['nc_program'].startswith('(VIRTUAL ONLY - NOT FOR REAL MACHINE)\nG21\nG90\nG95\n')
    assert program['toolpath'][3]['x_mm'] == 20
    assert program['toolpath'][3]['z_mm'] == -10
    assert factory_module().validate_program(program)['volume_mm3'] == pytest.approx(volume * math.pi)
    assert validate_virtual_program(program)['profile']['length_mm'] == 10


@pytest.mark.parametrize('axis', ['x', 'y', 'z'])
def test_offset_axis_and_long_cut_tool_preserve_finished_profile(axis):
    from shared.virtual_turning import build_virtual_design
    design = build_virtual_design(run(axis, hole=True))
    assert design['nominal_profile'] == {'outer_diameter_mm': 20, 'inner_diameter_mm': 6, 'length_mm': 10}
    assert design['transform']['axis'] == axis
    assert design['transform']['origin_mm'] == [1, 2, 3]
    assert design['spec']['operations'][1]['length'] == 14


@pytest.mark.parametrize('bad', [True, float('nan'), float('inf'), '20.0000001', '0', '-1'])
def test_invalid_and_lossy_dimensions_are_rejected(bad):
    from shared.virtual_turning import build_virtual_design, VirtualProductionError
    value = run()
    value['spec']['operations'][0]['diameter'] = bad
    with pytest.raises(VirtualProductionError):
        build_virtual_design(value)


@pytest.mark.parametrize('kind', ['blind', 'off_axis', 'many', 'fillet', 'assembly', 'unfinished', 'synthetic'])
def test_unsupported_model_is_rejected_whole(kind):
    from shared.virtual_turning import build_virtual_design, VirtualProductionError
    value = run(hole=True)
    operations = value['spec']['operations']
    if kind == 'blind': operations[1].update(length=5)
    if kind == 'off_axis': operations[1]['position'][0] += 1
    if kind == 'many': operations.append(deepcopy(operations[1]))
    if kind == 'fillet': operations.append({'type': 'fillet', 'radius': 1})
    if kind == 'assembly': value['spec']['assembly'] = True
    if kind == 'unfinished': value['validation']['step_roundtrip'] = False
    if kind == 'synthetic': value['synthetic'] = True
    with pytest.raises(VirtualProductionError): build_virtual_design(value)


@pytest.mark.parametrize('key,bad', [('feed_mm_per_rev', 0), ('spindle_rpm', True),
    ('pass_depth_mm', .000001), ('stock_length_mm', 12), ('stock_diameter_mm', 19),
    ('clearance_mm', '2.0000001'), ('drill_diameter_mm', 5)])
def test_invalid_setup_never_produces_a_program(key, bad):
    from shared.virtual_turning import build_virtual_design, build_virtual_program, VirtualProductionError
    config = setup(hole=True)
    config[key] = bad
    with pytest.raises(VirtualProductionError):
        build_virtual_program(build_virtual_design(run(hole=True)), config, '模拟钢材')


def test_same_short_number_and_forged_design_are_not_interchangeable():
    from shared.virtual_turning import build_virtual_design, build_virtual_program, VirtualProductionError
    first = build_virtual_design(run())
    other = run()
    other['run_id'] = 'FC-' + 'b' * 64
    assert first['digest'] != build_virtual_design(other)['digest']
    first['spec']['operations'][0]['diameter'] = 21
    with pytest.raises(VirtualProductionError): build_virtual_program(first, setup(), '钢')


@pytest.mark.parametrize('field', ['toolpath', 'duration', 'nc'])
def test_program_validation_recomputes_geometry_and_nc(field):
    from shared.virtual_turning import build_virtual_design, build_virtual_program, validate_virtual_program, VirtualProductionError
    program = build_virtual_program(build_virtual_design(run()), setup(), '钢')
    if field == 'toolpath': program['toolpath'][3]['x_mm'] = 19
    if field == 'duration': program['simulation']['duration_seconds'] = 1
    if field == 'nc': program['nc_program'] += '\nM4'
    with pytest.raises(VirtualProductionError): validate_virtual_program(program)


def test_completed_receipt_requires_executed_path_and_prefix(tmp_path):
    from shared.virtual_turning import (build_virtual_design, build_virtual_program, digest,
                                       validate_factory_receipt, build_virtual_output, VirtualProductionError)
    design = build_virtual_design(run())
    program = build_virtual_program(design, setup(), '钢')
    factory = factory_module().ProductionStore(tmp_path, RunningLine())
    try:
        received = factory.submit('test-program', program)
        job = {'job_id': 'SIM-JOB-test', 'part_id': 'SIM-PART-test', 'design_run_id': design['run_id'],
               'design_digest': design['digest'], 'program': program, 'program_digest': digest(program),
               'factory_command_id': 'test-program', 'factory_job_id': received['job_id'], 'receipt': received}
        factory.start(received['job_id'], digest(program), '测试人员')
        factory.tick(20)
        receipt = factory.get(received['job_id'])
        assert receipt['status'] == 'completed'
        assert validate_factory_receipt(job, receipt)['status'] == 'completed'
        output = build_virtual_output(job, receipt)
        assert output['profile']['outer_diameter_mm'] == 20
        assert output['synthetic'] is True
        for mutate in ['prefix', 'count', 'digest', 'profile', 'unit']:
            bad = deepcopy(receipt)
            if mutate == 'prefix': bad['events'][0]['type'] = 'started'
            if mutate == 'count': bad['executed_points'] = 0
            if mutate == 'digest': bad['program_digest'] = 'f' * 64
            if mutate == 'profile': bad['result_profile']['length_mm'] = float('nan')
            if mutate == 'unit': bad['units'] = 'inch'
            with pytest.raises(VirtualProductionError): build_virtual_output(job, bad)
    finally:
        factory.close()
