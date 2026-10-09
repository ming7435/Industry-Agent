"""Deterministic, constrained machining-zone programs for the loopback simulator."""
from copy import deepcopy
from decimal import Decimal, InvalidOperation, ROUND_CEILING
from hashlib import sha256
import json
import math
import re
from typing import Mapping

DEVICE_ID = 'TRAK-TC820LTYSI-001'
SCHEMA = 'virtual-turning-v1'
POSTPROCESSOR = 'virtual-trak-turning-v1'
SOURCE = 'factory-simulation'
SCOPE = 'machining-zone'
HEADER = '(VIRTUAL ONLY - NOT FOR REAL MACHINE)'
MAX_POINTS = 4000
MAX_SECONDS = 604800


class VirtualProductionError(ValueError):
    def __init__(self, code, message, status=409):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status


def require(condition, code, message='', status=409):
    if not condition:
        raise VirtualProductionError(code, message or code, status)


def digest(value):
    try:
        encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()
    except (ValueError, TypeError, RecursionError):
        raise VirtualProductionError('invalid_json', '数据不是有限 JSON 值', 422) from None
    require(len(encoded) <= 4 * 1024 * 1024, 'payload_too_large', status=413)
    return sha256(encoded).hexdigest()


def number(value, name, low=0, high=10000, zero=False, precise=True):
    require(not isinstance(value, bool) and isinstance(value, (int, float, str, Decimal))
            and len(str(value)) <= 100, 'invalid_' + name, '参数无效：' + name, 422)
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise VirtualProductionError('invalid_' + name, '参数无效：' + name, 422) from None
    require(result.is_finite() and (result >= low if zero else result > low) and result <= high,
            'invalid_' + name, '参数超出模拟范围：' + name, 422)
    if precise:
        require(result == result.quantize(Decimal('.000001')), 'coordinate_precision',
                '参数超过六位小数，无法无损转换：' + name, 422)
    return result


def text_number(value):
    text = format(Decimal(str(value)), 'f')
    return text.rstrip('0').rstrip('.') if '.' in text else text


def _untrusted(value):
    if isinstance(value, Mapping):
        return any(value.get(k) is True for k in ('synthetic', 'simulation', 'degraded', 'is_synthetic')) or any(
            _untrusted(v) for v in value.values())
    return isinstance(value, list) and any(_untrusted(v) for v in value)


def build_virtual_design(run: Mapping) -> dict:
    require(isinstance(run, Mapping) and re.fullmatch(r'FC-[a-f0-9]{64}', str(run.get('run_id', ''))),
            'invalid_design_id', '请选择完整 CAD 设计版本', 422)
    proof = run.get('validation')
    require(run.get('status') == 'completed' and isinstance(proof, Mapping) and proof.get('valid') is True
            and proof.get('step_roundtrip') is True and type(proof.get('solid_count')) is int
            and proof['solid_count'] == 1 and not _untrusted(run),
            'design_not_validated', '设计必须通过单实体及 STEP 回读校验', 422)
    spec = deepcopy(run.get('spec'))
    require(isinstance(spec, Mapping) and spec.get('units') == 'mm'
            and not set(spec) - {'units', 'operations', 'drawing'},
            'unsupported_design', '模拟车削仅支持毫米单圆柱及同轴通孔', 422)
    operations = spec.get('operations')
    require(isinstance(operations, list) and 1 <= len(operations) <= 2, 'unsupported_features',
            '圆角、装配、多孔等特征尚不支持模拟加工', 422)
    parsed = []
    for index, op in enumerate(operations):
        require(isinstance(op, Mapping) and not set(op) - {'type', 'mode', 'diameter', 'length', 'axis', 'position', 'name'}
                and op.get('type') == 'cylinder' and op.get('mode', 'add') == ('add' if index == 0 else 'cut')
                and op.get('axis') in ('x', 'y', 'z'), 'unsupported_features', '必须为单圆柱或单个同轴通孔', 422)
        position = op.get('position')
        require(isinstance(position, list) and len(position) == 3, 'unknown_transform', '缺少 CAD 位置基准', 422)
        parsed.append((number(op.get('diameter'), 'diameter'), number(op.get('length'), 'length'),
                       [number(v, 'position', low=-10000, zero=True) for v in position]))
    outer, length, origin = parsed[0]
    axis = operations[0]['axis']
    inner = Decimal(0)
    if len(parsed) == 2:
        inner, tool_length, position = parsed[1]
        dimension = 'xyz'.index(axis)
        require(operations[1]['axis'] == axis and inner < outer
                and all(position[i] == origin[i] for i in range(3) if i != dimension),
                'non_coaxial_hole', '切除必须为同轴圆孔', 422)
        require(position[dimension] <= origin[dimension]
                and position[dimension] + tool_length >= origin[dimension] + length,
                'blind_hole', '模拟工厂仅支持贯通孔', 422)
    result = {'run_id': run['run_id'], 'status': 'completed', 'spec': spec, 'validation': deepcopy(proof),
              'part_name': str(run.get('part_name') or ''), 'part_number': str(run.get('part_number') or ''),
              'digest': digest([run['run_id'], spec]), 'source': 'production-modeling',
              'nominal_profile': {'outer_diameter_mm': float(outer), 'inner_diameter_mm': float(inner), 'length_mm': float(length)},
              'transform': {'axis': axis, 'origin_mm': list(map(float, origin)),
                            'machine_x': 'diameter', 'machine_z': 'negative-axial-distance', 'units': 'mm'}}
    if 'digest' in run:
        require(run['digest'] == result['digest'], 'design_digest_mismatch', '设计快照摘要不一致')
    return result


def _tool(value, name):
    require(type(value) is int and 1 <= value <= 99, 'invalid_' + name, '刀具编号必须为 1 至 99', 422)
    return value


def _compile(design_id, design_digest, profile, setup, material):
    require(isinstance(material, str) and 0 < len(material.strip()) <= 200, 'invalid_material', status=422)
    require(isinstance(setup, Mapping) and isinstance(profile, Mapping), 'invalid_setup', status=422)
    fields = {'stock_diameter_mm', 'stock_length_mm', 'grip_length_mm', 'clearance_mm', 'pass_depth_mm',
              'spindle_rpm', 'feed_mm_per_rev', 'tolerance_mm', 'tool_id', 'device_id', 'postprocessor'}
    require(fields <= setup.keys() and not set(setup) - fields - {'drill_tool_id', 'drill_diameter_mm'},
            'unsupported_setup_fields', status=422)
    require(setup['device_id'] == DEVICE_ID and setup['postprocessor'] == POSTPROCESSOR, 'unsupported_device', status=422)
    nums = {k: number(setup[k], k, high=100000 if k == 'spindle_rpm' else 1000 if k in ('feed_mm_per_rev', 'tolerance_mm') else 10000)
            for k in fields - {'tool_id', 'device_id', 'postprocessor'}}
    require(set(profile) == {'outer_diameter_mm', 'inner_diameter_mm', 'length_mm'}, 'invalid_profile', status=422)
    outer, inner, length = (number(profile.get(k), k, zero=k == 'inner_diameter_mm')
                            for k in ('outer_diameter_mm', 'inner_diameter_mm', 'length_mm'))
    stock, clearance, depth = (nums[k] for k in ('stock_diameter_mm', 'clearance_mm', 'pass_depth_mm'))
    require(inner < outer <= stock and length + nums['grip_length_mm'] <= nums['stock_length_mm'],
            'insufficient_stock', '毛坯不能覆盖加工区与夹持段', 422)
    safe = stock + 2 * clearance
    require(safe <= 10000, 'clearance_out_of_range', status=422)
    passes = max(1, int(((stock - outer) / (2 * depth)).to_integral_value(rounding=ROUND_CEILING)))
    require(1 + passes * 6 + (5 if inner else 0) <= MAX_POINTS, 'too_many_toolpath_points', status=422)
    tool = _tool(setup['tool_id'], 'tool_id')
    normalized = {**{k: float(v) for k, v in nums.items()}, 'tool_id': tool, 'device_id': DEVICE_ID, 'postprocessor': POSTPROCESSOR}
    points = []

    def point(motion, operation, x, z, active):
        points.append({'motion': motion, 'operation': operation, 'x_mm': float(x), 'z_mm': float(z), 'tool_id': active})

    point('rapid', 'turn', safe, clearance, tool)
    for i in range(1, passes + 1):
        d = max(outer, stock - 2 * depth * i)
        for motion, x, z in [('rapid', d, clearance), ('rapid', d, 0), ('cut', d, -length),
                             ('cut', d, 0), ('rapid', d, clearance), ('rapid', safe, clearance)]:
            point(motion, 'turn', d if motion == 'cut' else x, z, tool)
    if inner:
        drill = _tool(setup.get('drill_tool_id'), 'drill_tool_id')
        drill_d = number(setup.get('drill_diameter_mm'), 'drill_diameter_mm')
        require(drill != tool and drill_d == inner, 'drill_mismatch', '钻头必须匹配通孔且区别于车刀', 422)
        normalized.update(drill_tool_id=drill, drill_diameter_mm=float(drill_d))
        for motion, x, z in [('rapid', 0, clearance), ('rapid', 0, 0), ('cut', 0, -length),
                             ('rapid', 0, clearance), ('rapid', safe, clearance)]:
            point(motion, 'drill', x, z, drill)
    else:
        require(not set(setup) & {'drill_tool_id', 'drill_diameter_mm'}, 'unexpected_drill', status=422)
    rpm, feed = float(nums['spindle_rpm']), float(nums['feed_mm_per_rev'])
    duration = sum(math.hypot((b['x_mm'] - a['x_mm']) / 2, b['z_mm'] - a['z_mm']) * 60 /
                   (1000 if b['motion'] == 'rapid' else rpm * feed) for a, b in zip(points, points[1:]))
    require(math.isfinite(duration) and 0 < duration <= MAX_SECONDS, 'duration_out_of_range', status=422)
    volume = math.pi * float(outer - inner) * float(outer + inner) / 4 * float(length)
    lines, active = [HEADER, 'G21', 'G90', 'G95'], None
    for p in points:
        if active != p['tool_id']:
            lines.extend([f"T{p['tool_id']:02d}", 'M3 S' + text_number(rpm)])
            active = p['tool_id']
        lines.append(('G0' if p['motion'] == 'rapid' else 'G1') + ' X' + text_number(p['x_mm'])
                     + ' Z' + text_number(p['z_mm']) + ('' if p['motion'] == 'rapid' else ' F' + text_number(feed)))
    return {'schema_version': SCHEMA, 'simulation_only': True, 'device_id': DEVICE_ID, 'postprocessor': POSTPROCESSOR,
            'design_id': design_id, 'design_digest': design_digest, 'material': material.strip(), 'setup': normalized,
            'profile': {'outer_diameter_mm': float(outer), 'inner_diameter_mm': float(inner), 'length_mm': float(length)},
            'toolpath': points, 'nc_program': '\n'.join(lines + ['M5', 'M30']),
            'simulation': {'passed': True, 'checks': {'geometry': True, 'bounded_path': True}, 'scope': SCOPE,
                           'duration_seconds': duration, 'expected_volume_mm3': volume, 'simulated_volume_mm3': volume}}


def build_virtual_program(design: Mapping, setup: Mapping, material: str) -> dict:
    fixed = build_virtual_design(design)
    require(design.get('nominal_profile') == fixed['nominal_profile'] and design.get('transform') == fixed['transform'],
            'design_profile_mismatch', '设计加工变换不一致')
    return _compile(fixed['run_id'], fixed['digest'], fixed['nominal_profile'], setup, material)


def validate_virtual_program(program: Mapping) -> dict:
    require(isinstance(program, Mapping), 'invalid_program', status=422)
    digest(program)
    require(re.fullmatch(r'FC-[a-f0-9]{64}', str(program.get('design_id', '')))
            and re.fullmatch(r'[a-f0-9]{64}', str(program.get('design_digest', ''))), 'invalid_program_identity')
    expected = _compile(program['design_id'], program['design_digest'], program.get('profile'), program.get('setup'), program.get('material'))
    require(program == expected, 'program_validation_failed', '刀路、NC、时间或终态校核失败')
    return {'profile': deepcopy(expected['profile']), 'duration_seconds': expected['simulation']['duration_seconds'],
            'volume_mm3': expected['simulation']['simulated_volume_mm3'], 'program_digest': digest(program)}


def validate_factory_receipt(job: Mapping, receipt: Mapping) -> dict:
    require(isinstance(receipt, Mapping) and receipt.get('simulation_only') is True, 'invalid_factory_receipt')
    digest(receipt)
    program = job['program']
    checked = validate_virtual_program(program)
    require(receipt.get('command_id') == job['factory_command_id'] and receipt.get('program_digest') == job['program_digest']
            == checked['program_digest'] and receipt.get('program') == program, 'receipt_identity_conflict')
    require(isinstance(receipt.get('job_id'), str) and re.fullmatch(r'vprod-[a-f0-9]{32}', receipt['job_id'])
            and (not job.get('factory_job_id') or job['factory_job_id'] == receipt['job_id']), 'factory_job_conflict')
    require(receipt.get('units', 'mm') == 'mm', 'receipt_unit_conflict')
    states = {'received', 'running', 'paused', 'interrupted', 'completed'}
    require(receipt.get('status') in states, 'invalid_factory_status')
    progress = number(receipt.get('progress'), 'progress', high=1, zero=True, precise=False)
    elapsed = number(receipt.get('elapsed_seconds'), 'elapsed', high=MAX_SECONDS, zero=True, precise=False)
    count, points = receipt.get('executed_points'), program['toolpath']
    require(type(count) is int and 0 <= count <= len(points), 'invalid_executed_points')
    events = receipt.get('events')
    require(isinstance(events, list) and 1 <= len(events) <= MAX_POINTS + 1000, 'invalid_factory_events')
    previous = job.get('receipt') or {}
    old_events = previous.get('events', [])
    require(events[:len(old_events)] == old_events and progress >= Decimal(str(previous.get('progress', 0)))
            and elapsed >= Decimal(str(previous.get('elapsed_seconds', 0))) and count >= previous.get('executed_points', 0),
            'receipt_progress_regression')
    if previous.get('status') == 'completed':
        require(receipt == previous, 'completed_receipt_conflict')
    reached, state, last_time = 0, None, 0
    for event in events:
        require(isinstance(event, Mapping) and type(event.get('timestamp_ms')) is int and event['timestamp_ms'] >= last_time,
                'invalid_event_timestamp')
        last_time = event['timestamp_ms']
        kind = event.get('type')
        if kind == 'received':
            require(state is None, 'invalid_event_sequence'); state = 'received'
        elif kind in {'started', 'resumed', 'resumed_after_restart'}:
            required = {'started': 'received', 'resumed': 'paused', 'resumed_after_restart': 'interrupted'}[kind]
            require(state == required and event.get('digest') == job['program_digest']
                    and isinstance(event.get('operator'), str) and event['operator'].strip(), 'invalid_start_event')
            state = 'running'
        elif kind == 'point_executed':
            require(state == 'running' and reached < len(points) and type(event.get('point_index')) is int
                    and event['point_index'] == reached and event.get('point') == points[reached], 'invalid_path_evidence')
            reached += 1
        elif kind in {'paused', 'interrupted'}:
            require(state == 'running', 'invalid_event_sequence'); state = kind
        elif kind == 'completed':
            require(state == 'running' and reached == len(points) and event.get('scope') == SCOPE
                    and event.get('quality_verified') is False, 'invalid_completion_event'); state = 'completed'
        else:
            require(False, 'unknown_factory_event')
    require(state == receipt['status'] and reached == count, 'receipt_event_status_conflict')
    if state == 'completed':
        require(progress == 1 and math.isclose(float(elapsed), checked['duration_seconds'], rel_tol=1e-8, abs_tol=1e-6),
                'incomplete_execution')
        profile = receipt.get('result_profile')
        require(isinstance(profile, Mapping) and set(profile) == set(program['profile']), 'missing_output_profile')
        d, h, length = (number(profile.get(k), k, zero=k == 'inner_diameter_mm') for k in
                         ('outer_diameter_mm', 'inner_diameter_mm', 'length_mm'))
        require(h < d <= number(program['setup']['stock_diameter_mm'], 'stock')
                and length + number(program['setup']['grip_length_mm'], 'grip') <= number(program['setup']['stock_length_mm'], 'stock_length'),
                'invalid_output_geometry')
        volume = number(receipt.get('simulated_volume_mm3'), 'volume', high=1e13, precise=False)
        require(math.isclose(float(volume), math.pi * float(d - h) * float(d + h) / 4 * float(length), rel_tol=1e-8, abs_tol=1e-6),
                'output_volume_conflict')
    else:
        require(receipt.get('result_profile') is None and progress < 1, 'premature_output')
    return deepcopy(dict(receipt))


def build_virtual_output(job: Mapping, receipt: Mapping) -> dict:
    checked = validate_factory_receipt(job, receipt)
    require(checked['status'] == 'completed', 'output_not_completed', '等待模拟加工完成')
    value = {'part_id': job['part_id'], 'job_id': job['job_id'], 'design_run_id': job['design_run_id'],
             'design_digest': job['design_digest'], 'program_digest': job['program_digest'],
             'factory_job_id': checked['job_id'], 'profile': deepcopy(checked['result_profile']), 'units': 'mm',
             'source': SOURCE, 'simulation_only': True, 'synthetic': True, 'scope': SCOPE,
             'receipt_digest': digest(checked)}
    value['output_digest'] = digest(value)
    return value
