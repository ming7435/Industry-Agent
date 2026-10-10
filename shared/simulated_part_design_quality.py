"""Explicit numerical simulation, not metrology or production release evidence."""
from copy import deepcopy
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from hashlib import sha256
import json
import os
import re
import time

DEVICE_ID = 'RENISHAW-EQUATOR300-001'
RULE = 'nominal_exact_demo_v1'
GENERATOR = 'equator_numeric_v1'
EXTRACTOR = 'simulation_parameters_v1'
DISPLAY_EXTRACTOR = 'simulation_parameters_v2'
SOURCE = 'local-simulated-equator-adapter'
SAMPLE_COUNT = 10


def digest(value):
    return sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def decimal(value):
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)) or len(str(value)) > 100:
        raise ValueError('参数必须是有限数值')
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError('参数必须是有限数值') from None
    if not number.is_finite() or abs(number) > 100000:
        raise ValueError('参数必须是有限数值且在支持范围内')
    return number


def number_text(value):
    value = decimal(value)
    return format(value, 'f').rstrip('0').rstrip('.') if '.' in format(value, 'f') else format(value, 'f')


def enabled():
    return (os.getenv('QUALITY_SIMULATION_ENABLED', '').lower() == 'true'
            and os.getenv('FACTORY_CONTROL_MODE', '').lower() == 'virtual'
            and os.getenv('APP_ENV', 'development').lower() not in {'prod', 'production'})


def require_enabled():
    if not enabled():
        raise ValueError('模拟检测未启用；仅限显式启用的虚拟工厂开发环境')


def _untrusted(value):
    if isinstance(value, dict):
        return any(value.get(key) is True for key in ('synthetic', 'simulation', 'degraded', 'is_synthetic')) or any(_untrusted(v) for v in value.values())
    return isinstance(value, list) and any(_untrusted(v) for v in value)


def _parameters(spec):
    unsupported = '不支持完整模拟尺寸检测：需要单主体及独立开口孔槽'
    if not isinstance(spec, dict) or spec.get('units') != 'mm' or set(spec) - {'units', 'operations', 'drawing'}:
        raise ValueError(unsupported)
    operations = spec.get('operations')
    if not isinstance(operations, list) or not 1 <= len(operations) <= 24 or any(not isinstance(op, dict) for op in operations):
        raise ValueError(unsupported)
    base = operations[0]
    if base.get('mode', 'add') != 'add' or base.get('type') not in {'box', 'cylinder'}:
        raise ValueError(unsupported)
    rows, shapes = [], []

    def add(key, name, value, unit='mm', kind='number'):
        expected = value if kind == 'choice' else number_text(value)
        rows.append({'key': key, 'name': name, 'expected': expected, 'unit': unit, 'kind': kind})

    def position(op):
        values = op.get('position', [0, 0, 0])
        if not isinstance(values, list) or len(values) != 3:
            raise ValueError(unsupported)
        return list(map(decimal, values))

    def sizes(op):
        fields = ['length', 'width', 'height'] if op['type'] == 'box' else ['diameter', 'length']
        result = [decimal(op.get(field)) for field in fields]
        if any(value <= 0 for value in result): raise ValueError('主体或孔槽尺寸必须为正')
        return dict(zip(fields, result))

    labels = {'length': '长度／深度', 'width': '宽度', 'height': '高度／深度', 'diameter': '直径'}
    origin, base_sizes = position(base), sizes(base)
    for field, value in base_sizes.items(): add('operations.0.' + field, '主体 · ' + labels[field], value)
    if base['type'] == 'cylinder':
        axis = base.get('axis', 'z')
        if axis not in 'xyz' or len(axis) != 1: raise ValueError(unsupported)
        add('operations.0.axis', '主体 · 轴向', axis, '—', 'choice')
        if len(operations) > 1: raise ValueError(unsupported)
    else:
        end_base = [origin[i] + base_sizes[field] for i, field in enumerate(['length', 'width', 'height'])]
        for index, op in enumerate(operations[1:], 1):
            if op.get('mode') != 'cut' or op.get('type') not in {'box', 'cylinder'}:
                raise ValueError(unsupported)
            p, s = position(op), sizes(op)
            if op['type'] == 'box':
                lo = [max(p[i], origin[i]) for i in range(3)]
                hi = [min(p[i] + s[field], end_base[i]) for i, field in enumerate(['length', 'width', 'height'])]
                # Only top-open pockets/slots wholly inside the XY outline.
                if (any(hi[i] <= lo[i] for i in range(3)) or hi[2] != end_base[2]
                        or any(p[i] <= origin[i] or p[i] + s[field] >= end_base[i] for i, field in enumerate(['length', 'width']))):
                    raise ValueError(unsupported)
                s = dict(zip(['length', 'width', 'height'], [hi[i] - lo[i] for i in range(3)]))
                shape = {'type': 'box', 'lo': lo, 'hi': hi}
                label = '凹槽' + str(index)
            else:
                axis = op.get('axis', 'z')
                if axis not in {'x', 'y', 'z'}: raise ValueError(unsupported)
                dim = 'xyz'.index(axis); transverse = [i for i in range(3) if i != dim]
                radius = s['diameter'] / 2
                lo, hi = list(p), list(p)
                for i in transverse: lo[i], hi[i] = p[i] - radius, p[i] + radius
                lo[dim], hi[dim] = max(p[dim], origin[dim]), min(p[dim] + s['length'], end_base[dim])
                if (hi[dim] <= lo[dim] or (lo[dim] != origin[dim] and hi[dim] != end_base[dim])
                        or any(lo[i] <= origin[i] or hi[i] >= end_base[i] for i in transverse)):
                    raise ValueError(unsupported)
                s['length'] = hi[dim] - lo[dim]
                shape = {'type': 'cylinder', 'lo': lo, 'hi': hi, 'center': p, 'axis': dim, 'radius': radius}
                label = '孔' + str(index)
                add(f'operations.{index}.axis', label + ' · 轴向', axis, '—', 'choice')
            for other in shapes:
                if not all(shape['lo'][i] <= other['hi'][i] and shape['hi'][i] >= other['lo'][i] for i in range(3)): continue
                intersects = True
                if shape['type'] == other['type'] == 'cylinder' and shape['axis'] == other['axis']:
                    transverse = [i for i in range(3) if i != shape['axis']]
                    intersects = sum((shape['center'][i] - other['center'][i])**2 for i in transverse) <= (shape['radius'] + other['radius'])**2
                elif shape['type'] != other['type']:
                    cyl, box = (shape, other) if shape['type'] == 'cylinder' else (other, shape)
                    transverse = [i for i in range(3) if i != cyl['axis']]
                    intersects = sum((cyl['center'][i] - max(box['lo'][i], min(cyl['center'][i], box['hi'][i])))**2 for i in transverse) <= cyl['radius']**2
                if intersects: raise ValueError(unsupported + '；切除特征相交')
            shapes.append(shape)
            for field, value in s.items(): add(f'operations.{index}.{field}', label + ' · ' + labels[field], value)
            for i in range(3):
                value = shape['lo'][i] if op['type'] == 'box' or i == shape.get('axis') else p[i]
                add(f'operations.{index}.position.{i}', label + ' · ' + 'XYZ'[i] + '位置', value)
        if shapes:
            add('cut_feature_count', '孔／切除特征数量', len(shapes), '个', 'count')
            add('hole_count', '圆孔数量', sum(s['type'] == 'cylinder' for s in shapes), '个', 'count')
            add('pocket_count', '矩形孔槽数量', sum(s['type'] == 'box' for s in shapes), '个', 'count')
    return rows


def _display_parameters(spec, proof):
    """Display any verified model; only final, verified model metrics are comparable.

    Construction operands (especially cutting tools and fillets) are not finished
    dimensions. Keep them visible and pending until their finished-feature mapping
    exists, rather than silently skipping them or inventing measurements.
    """
    if not isinstance(spec, dict) or spec.get('units') != 'mm':
        raise ValueError('建模标准缺少毫米单位的结构化参数')
    rows = [{'key': 'model.solid_count', 'name': '成品模型 · 实体数量',
             'expected': number_text(proof['solid_count']), 'unit': '个', 'kind': 'count', 'comparable': True}]
    bounds = proof.get('bounds_mm')
    if isinstance(bounds, list) and len(bounds) == 3:
        for i, value in enumerate(bounds):
            if decimal(value) <= 0: raise ValueError('模型外形尺寸必须为正')
            rows.append({'key': f'model.bounds_mm.{i}', 'name': '成品外形 · ' + 'XYZ'[i] + '尺寸',
                         'expected': number_text(value), 'unit': 'mm', 'kind': 'number', 'comparable': True})
    labels = {'operations': '特征', 'parts': '组件', 'type': '类型', 'mode': '方式', 'name': '名称',
              'diameter': '直径', 'length': '长度／深度', 'width': '宽度', 'height': '高度／深度',
              'radius': '圆角／半径', 'distance': '倒角距离', 'axis': '轴向', 'position': '位置',
              'bottom_diameter': '底径', 'top_diameter': '顶径', 'edge_length': '边长', 'module': '模数',
              'teeth': '齿数', 'bore_diameter': '孔径', 'major_diameter': '大径', 'pitch': '螺距',
              'depth': '深度', 'thickness': '厚度', 'angle': '角度', 'pressure_angle': '压力角',
              'flank_angle': '牙型角', 'hand': '旋向', 'sections': '截面', 'center': '中心',
              'edges': '边选择', 'sheet_metal': '钣金', 'bends': '折弯', 'bim': '建筑模型',
              'base_length': '底边直段长度', 'flange_length': '翼边直段长度', 'bend_radius': '内弯半径',
              'bend_angle': '折弯角', 'k_factor': 'K 因子', 'start': '起点', 'end': '终点',
              'offset': '偏移距离', 'sill': '窗台高度'}
    lengths = {'diameter', 'length', 'width', 'height', 'radius', 'distance', 'bottom_diameter', 'top_diameter',
               'edge_length', 'module', 'bore_diameter', 'major_diameter', 'pitch', 'depth', 'thickness', 'z',
               'base_length', 'flange_length', 'bend_radius', 'offset', 'sill'}
    def walk(value, path, names, field, depth=0):
        if depth > 24 or len(rows) > 4096: raise ValueError('建模参数超过安全展示范围')
        if isinstance(value, dict):
            if not value:
                walk(None, path, names, field, depth + 1)
            for key in sorted(value):
                walk(value[key], path + [str(key)], names + [labels.get(key, str(key))], key, depth + 1)
        elif isinstance(value, list):
            if not value: walk(None, path, names, field, depth + 1)
            for i, child in enumerate(value):
                walk(child, path + [str(i)], names + [str(i + 1)], field, depth + 1)
        else:
            numeric = type(value) in {int, float}
            expected = number_text(value) if numeric else ('是' if value else '否') if isinstance(value, bool) else '未定义' if value is None else str(value)
            unit = ('mm' if field in lengths or field in {'position', 'center'} or (path[0] == 'bim' and field in {'start', 'end'}) else '°' if field in {'angle', 'pressure_angle', 'flank_angle', 'bend_angle'} else '个' if field == 'teeth' else '—') if numeric else '—'
            rows.append({'key': '.'.join(path), 'name': ' · '.join(names), 'expected': expected,
                         'unit': unit, 'kind': 'number' if numeric else 'display', 'comparable': False,
                         'reason': '设计输入参数，尚未覆盖完整成品特征比对'})
    for key in sorted(spec):
        if key not in {'units', 'drawing'}: walk(spec[key], [key], [labels.get(key, key)], key)
    if len(rows) < 2: raise ValueError('建模标准没有可展示的设计参数')
    return rows


def build_basis(run):
    if not isinstance(run, dict) or not re.fullmatch(r'FC-[a-f0-9]{64}', str(run.get('run_id', ''))):
        raise ValueError('请选择完整生产建模版本')
    proof = run.get('validation') or {}
    if (run.get('status') != 'completed' or not isinstance(proof, dict) or proof.get('valid') is not True
            or proof.get('step_roundtrip') is not True or type(proof.get('solid_count')) is not int
            or proof['solid_count'] < 1 or _untrusted(run)):
        raise ValueError('模型需要完成实体和 STEP 校验，且不能是降级或模拟建模')
    extractor = run.get('extractor')
    if extractor not in {None, EXTRACTOR, DISPLAY_EXTRACTOR}: raise ValueError('建模标准提取版本无效')
    if extractor != DISPLAY_EXTRACTOR and proof['solid_count'] == 1:
        try:
            parameters = _parameters(run.get('spec'))
            extractor = EXTRACTOR
        except ValueError:
            if extractor == EXTRACTOR: raise
            extractor = DISPLAY_EXTRACTOR
    else:
        if extractor == EXTRACTOR: raise ValueError('旧版建模标准仅支持单实体')
        extractor = DISPLAY_EXTRACTOR
    if extractor == DISPLAY_EXTRACTOR: parameters = _display_parameters(run.get('spec'), proof)
    number = str(run.get('part_number') or '')
    if not re.fullmatch(r'\d{5}', number): number = str(int(run['run_id'][-8:], 16) % 100000).zfill(5)
    result = {'run_id': run['run_id'], 'status': 'completed', 'validation': deepcopy(proof), 'spec': deepcopy(run['spec']),
              'part_name': str(run.get('part_name') or '未命名零件')[:120], 'part_number': number,
              'parameters': parameters, 'extractor': extractor, 'source': 'production-modeling'}
    result['digest'] = digest([extractor, result['run_id'], result['spec'], parameters])
    return result


def verify_basis(basis):
    verified = build_basis(basis)
    if any(verified.get(k) != basis.get(k) for k in ['digest', 'parameters', 'extractor', 'source']):
        raise ValueError('已保存建模标准校验失败，请复核')
    return verified


def compare_sample(basis, observations):
    rows, issues = [], []
    review, missing = False, False
    if not isinstance(observations, dict): observations, review = {}, True
    if set(observations) - {p['key'] for p in basis['parameters']}: review = True
    for p in basis['parameters']:
        row = {**p, 'actual': None, 'difference': None, 'status': 'pending'}
        if p.get('comparable') is False:
            missing = True
            rows.append(row)
            continue
        observed = observations.get(p['key'])
        if observed is None:
            missing = True
        else:
            try:
                if not isinstance(observed, dict) or observed.get('unit') != p['unit']: raise ValueError('测量单位无效')
                value = observed.get('value')
                if p['kind'] == 'choice':
                    if value not in {'x', 'y', 'z'}: raise ValueError('方向无效')
                    actual = value
                else:
                    actual = number_text(value)
                    if p['kind'] == 'count' and (decimal(value) < 0 or decimal(value) != decimal(value).to_integral()): raise ValueError('数量无效')
                    row['difference'] = number_text(decimal(actual) - decimal(p['expected']))
                row.update(actual=actual, status='qualified' if actual == p['expected'] else 'unqualified')
                if row['status'] == 'unqualified': issues.append(row)
            except (ValueError, TypeError):
                row['status'], review = 'review', True
        rows.append(row)
    status = 'review' if review else 'pending' if missing else 'unqualified' if issues else 'qualified'
    return {'status': status, 'items': rows, 'issues': issues}


def summarize(basis, samples):
    identifiers = [p['part_id'] for p in samples]
    if len(set(identifiers)) != len(identifiers): raise ValueError('同一批次不能重复统计样本')
    counts = dict(total=len(samples), qualified=0, unqualified=0, pending=0, review=0, determinate=0)
    issues = []
    for sample in samples:
        comparison = compare_sample(basis, sample['observations'])
        counts[comparison['status']] += 1
        issues.extend({**issue, 'part_id': sample['part_id']} for issue in comparison['issues'])
    counts['determinate'] = counts['qualified'] + counts['unqualified']
    def rate(n, d): return float((Decimal(n)*100/Decimal(d)).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)) if d else None
    return {'counts': counts, 'rates': {'qualified': rate(counts['qualified'], counts['determinate']),
                                      'defect': rate(counts['unqualified'], counts['determinate']),
                                      'coverage': rate(counts['determinate'], counts['total'])}, 'issues': issues,
            'status': 'review' if counts['review'] else 'partial' if counts['pending'] else 'unqualified' if counts['unqualified'] else 'qualified'}


def generate_samples(basis, seed, measured_at):
    samples = []
    parameters = [p for p in basis['parameters'] if p.get('comparable') is not False]
    for i in range(SAMPLE_COUNT):
        code = int(digest([GENERATOR, seed, i]), 16)
        # Ensure this numerical demo exercises all three states; rates are calculated from rows.
        scenario = ['matching', 'deviation', 'missing'][i] if i < 3 else ('matching' if code % 10 < 7 else 'deviation' if code % 10 < 9 else 'missing')
        values = {p['key']: {'value': p['expected'], 'unit': p['unit']} for p in parameters}
        target = parameters[code % len(parameters)]
        if scenario == 'deviation':
            if target['kind'] == 'choice':
                values[target['key']]['value'] = 'xyz'[('xyz'.index(target['expected']) + 1) % 3]
            elif target['kind'] == 'count':
                values[target['key']]['value'] = number_text(decimal(target['expected']) + 1)
            else:
                delta = Decimal(code % 9 + 1) / 100
                nominal = decimal(target['expected'])
                values[target['key']]['value'] = number_text(nominal + delta if nominal + delta <= 100000 else nominal - delta)
        elif scenario == 'missing': del values[target['key']]
        samples.append({'part_id': 'SIM-PART-' + digest([seed, i])[:32], 'observations': values,
                        'scenario': scenario, 'generator': GENERATOR, 'measured_at': measured_at,
                        'simulation': True, 'synthetic': True, 'source': SOURCE})
    return samples


def validate_station(snapshot, now=None):
    now = time.time() if now is None else now
    try:
        devices, monitor, detail = snapshot['devices'], snapshot['monitor'], snapshot['detail']
        device = next(d for d in devices if d.get('device_id') == DEVICE_ID)
        raw_time = monitor.get('checked_at') or device.get('updated_at') or snapshot['summary']['updated_at']
        if isinstance(raw_time, bool): raise ValueError('工位快照时间无效')
        timestamp = float(raw_time) / 1000
        if not -5 <= now - timestamp <= 30: raise ValueError('工位快照已过期或时间无效')
        if monitor.get('device_id') != DEVICE_ID or detail.get('device_id') != DEVICE_ID or device.get('device_type') != 'equator_gauge':
            raise ValueError('比对仪身份不匹配')
        if monitor.get('status') != 'running' or device.get('status') != 'running' or detail.get('control_state') != 'running':
            raise ValueError('模拟比对仪未运行，未生成测量样本')
        if any(block.get(field) not in {None, '', 'running'} for block in [device, monitor, detail] for field in ['status', 'control_state']):
            raise ValueError('模拟比对仪运行和控制状态矛盾，未生成测量样本')
        if any(block.get(k) for block in [device, monitor, detail] for k in ['alarm_code', 'alarm_codes', 'alarm_message']):
            raise ValueError('模拟比对仪存在报警，请先处理工位故障')
        metrics = monitor['metrics']
        for key, want in {'equator_power_on': 1, 'axis_comm_ok': 1, 'probe_present': 1,
                          'estop_released': 1, 'probe_fault_flag': 0, 'hold_mode_enabled': 0}.items():
            if decimal(metrics.get(key)) != want: raise ValueError('模拟比对仪信号不满足检测条件：' + key)
        if decimal(metrics.get('recalibration_due_hours')) <= 0: raise ValueError('模拟比对仪已到校准期限')
        machine = next((d for d in devices if d.get('device_id') == 'TRAK-TC820LTYSI-001' and d.get('device_type') == 'turning_center' and d.get('name')), None)
        trace = {'traceability_source': 'simulation_profile' if machine else 'unknown',
                 'measurement_device_id': DEVICE_ID, 'production_device_id': machine['device_id'] if machine else None,
                 'production_device_name': machine['name'] if machine else None,
                 'line_id': 'SIM-LINE-A' if machine else None, 'line_name': '模拟 A 线' if machine else None,
                 'root_cause_status': 'unconfirmed'}
        return {'measurement_device_id': DEVICE_ID, 'checked_at': timestamp,
                'metrics': {k: number_text(metrics[k]) for k in ['equator_power_on', 'axis_comm_ok', 'probe_present', 'estop_released', 'probe_fault_flag', 'hold_mode_enabled', 'recalibration_due_hours']},
                'traceability': trace}
    except (KeyError, StopIteration, TypeError, AttributeError, InvalidOperation):
        raise ValueError('比对仪快照缺少有效身份、时间或检测信号') from None


def recommendations(issues):
    if not issues: return []
    steps = ['核对模型版本、工件测量基准和仪器校准状态。']
    if any('.position.' in row['key'] for row in issues): steps.append('检查定位夹具、工件坐标零点和装夹偏移，确认孔槽位置程序。')
    if any(row['unit'] == 'mm' and '.position.' not in row['key'] for row in issues): steps.append('核对加工程序尺寸、刀具磨损和刀补设置；由授权人员确认后再调整。')
    if any(row['unit'] == '个' or row['kind'] == 'choice' for row in issues): steps.append('核对漏加工工序、孔槽数量和加工方向。')
    return steps + ['复测异常样本和关联批次；模拟关联不能证明机器故障根因，不自动执行设备控制。']
