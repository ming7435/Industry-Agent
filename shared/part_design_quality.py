"""生产零件与固定 CAD 设计版本的参数比较；不推测实测值或加工公差。"""
from copy import deepcopy
from decimal import Decimal, InvalidOperation
from hashlib import sha256
import json
import re
from typing import Mapping


SCOPE = 'cad_parameters'
FIELDS = {
    'cylinder': ('diameter', 'length'), 'box': ('length', 'width', 'height'),
    'sphere': ('diameter',), 'tetrahedron': ('edge_length',),
    'cone': ('bottom_diameter', 'top_diameter', 'height'),
    'gear': ('module', 'teeth', 'pressure_angle', 'width', 'bore_diameter'),
    'thread': ('major_diameter', 'pitch', 'length', 'depth', 'flank_angle'),
    'fillet': ('radius',), 'chamfer': ('distance',), 'loft': (),
}
LABELS = {'diameter': '直径', 'length': '长度／深度', 'width': '宽度', 'height': '高度',
    'edge_length': '棱长', 'bottom_diameter': '底部直径', 'top_diameter': '顶部直径',
    'module': '模数', 'teeth': '齿数', 'pressure_angle': '压力角', 'bore_diameter': '轴孔直径',
    'major_diameter': '螺纹大径', 'pitch': '螺距', 'depth': '深度', 'flank_angle': '牙型角',
    'radius': '圆角半径', 'distance': '倒角距离', 'base_length': '底边直段长度',
    'flange_length': '翼边直段长度', 'thickness': '厚度', 'bend_radius': '折弯内半径', 'bend_angle': '折弯角度'}


def _decimal(value):
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)) or not str(value).strip() or len(str(value)) > 100:
        return None
    try:
        number = Decimal(str(value).strip())
        return number if number.is_finite() and abs(number) <= Decimal('100000') else None
    except (InvalidOperation, ValueError):
        return None


def _edge_set(value):
    if value == 'all':
        return 'all'
    if isinstance(value, str) and re.fullmatch(r'\s*\d+(?:\s*,\s*\d+)*\s*', value):
        value = [int(item.strip()) for item in value.split(',')]
    if (not isinstance(value, list) or not 1 <= len(value) <= 128
            or any(type(item) is not int or not 1 <= item <= 10000 for item in value)
            or len(set(value)) != len(value)):
        return None
    return ','.join(str(item) for item in sorted(value))


def _finished_hole(operations, index):
    """简单轴向孔取刀具与主体交集；不把超出成品的刀具尺寸当作孔深。"""
    tool, base = operations[index], operations[0]
    if tool['type'] != 'cylinder' or base.get('type') not in {'cylinder', 'box'}:
        raise ValueError('该布尔切除尚不能可靠转换为成品检验尺寸')
    if any(item.get('mode') != 'cut' for item in operations[1:]):
        raise ValueError('与添加实体、圆角或倒角组合的切除需要独立成品检验基准，不能使用刀具尺寸')
    axis = tool.get('axis')
    if axis not in {'x', 'y', 'z'} or (base['type'] == 'cylinder' and base.get('axis') != axis):
        raise ValueError('非同轴圆柱孔需要明确的成品检验基准')
    dimension = 'xyz'.index(axis)
    origin, position = base.get('position'), tool.get('position')
    if (not isinstance(origin, list) or len(origin) != 3 or not isinstance(position, list) or len(position) != 3
            or any(_decimal(item) is None for item in origin + position)):
        raise ValueError('成品孔位置缺少明确的设计基准')
    origin, position = list(map(_decimal, origin)), list(map(_decimal, position))
    radius = _decimal(tool.get('diameter'))
    if radius is None or radius <= 0:
        raise ValueError('成品孔直径无效')
    radius /= 2
    transverse = [i for i in range(3) if i != dimension]
    if base['type'] == 'cylinder':
        base_diameter = _decimal(base.get('diameter'))
        if base_diameter is None or base_diameter <= 0:
            raise ValueError('主体直径无效')
        base_radius = base_diameter / 2
        offset_squared = sum((position[i] - origin[i]) ** 2 for i in transverse)
        if radius >= base_radius or offset_squared > (base_radius - radius) ** 2:
            raise ValueError('与外轮廓相交的切口需要独立的成品检验基准')
        extent = _decimal(base.get('length'))
    else:
        sizes = [_decimal(base.get(field)) for field in ('length', 'width', 'height')]
        if any(size is None or size <= 0 for size in sizes):
            raise ValueError('主体尺寸无效')
        if any(position[i] - radius < origin[i] or position[i] + radius > origin[i] + sizes[i] for i in transverse):
            raise ValueError('与外轮廓相交的切口需要独立的成品检验基准')
        extent = sizes[dimension]
    tool_length = _decimal(tool.get('length'))
    if extent is None or tool_length is None or extent <= 0 or tool_length <= 0:
        raise ValueError('成品孔深缺少有效尺寸')
    start, end = max(origin[dimension], position[dimension]), min(origin[dimension] + extent, position[dimension] + tool_length)
    if end <= start:
        raise ValueError('切除未与主体相交，不能作为成品孔')
    # 重叠刀具会合并孔形，不能逐刀具声称完整实物检测。
    for other in operations[1:index]:
        if other.get('mode') != 'cut':
            continue
        if other.get('type') != 'cylinder' or other.get('axis') != axis:
            raise ValueError('复合切除需要独立的成品检验基准')
        other_position = list(map(_decimal, other['position']))
        distance_squared = sum((position[i] - other_position[i]) ** 2 for i in transverse)
        if (distance_squared < (radius + _decimal(other['diameter']) / 2) ** 2
                and start < other_position[dimension] + _decimal(other['length']) and end > other_position[dimension]):
            raise ValueError('重叠切除需要独立的成品检验基准')
    position[dimension] = start
    return {**tool, 'length': end - start, 'position': position}


def design_parameters(spec):
    """列出图纸中的尺寸、孔槽位置及特征数量，不把绘图比例作为零件尺寸。"""
    if not isinstance(spec, Mapping) or spec.get('units') != 'mm':
        raise ValueError('设计必须提供明确的毫米参数')
    if set(spec) - {'units', 'operations', 'drawing', 'sheet_metal'}:
        raise ValueError('此入口检验单个生产零件，不支持建筑或整套装配作为一个零件')
    result = []

    def add(key, label, value, unit='mm'):
        number = _decimal(value)
        if number is None:
            raise ValueError('图纸参数缺失或无效：' + label)
        result.append({'key': key, 'name': label, 'expected': float(number), 'unit': unit})

    def choice(key, label, value, options):
        if value not in {item['value'] for item in options}:
            raise ValueError('图纸特征属性缺失：' + label)
        result.append({'key': key, 'name': label, 'expected': value, 'unit': '—', 'kind': 'choice', 'options': options})

    if 'sheet_metal' in spec:
        sheet = spec['sheet_metal']
        if not isinstance(sheet, Mapping):
            raise ValueError('钣金尺寸参数无效')
        for field in ('width', 'base_length', 'flange_length', 'thickness', 'bend_radius', 'bend_angle'):
            add('sheet_metal.' + field, LABELS[field], sheet.get(field), '°' if field == 'bend_angle' else 'mm')
        return result
    operations = spec.get('operations')
    if not isinstance(operations, list) or not 1 <= len(operations) <= 24:
        raise ValueError('图纸缺少零件几何参数')
    cuts = 0
    for index, operation in enumerate(operations):
        if not isinstance(operation, Mapping) or operation.get('type') not in FIELDS:
            raise ValueError('图纸包含尚未接入参数检验的特征')
        cut = operation.get('mode') == 'cut'
        if cut:
            cuts += 1
            operation = _finished_hole(operations, index)
        label = ('孔' if operation['type'] == 'cylinder' else '切除特征') + str(cuts) if cut else ('主体' if index == 0 else '特征' + str(index + 1))
        path = 'operations.' + str(index) + '.'
        for field in FIELDS[operation['type']]:
            unit = '个' if field == 'teeth' else '°' if field.endswith('angle') else 'mm'
            add(path + field, label + ' · ' + LABELS[field], operation.get(field), unit)
        if operation['type'] in {'cylinder', 'cone', 'gear', 'thread'}:
            choice(path + 'axis', label + ' · 轴向（按图纸基准）', operation.get('axis'),
                   [{'value': axis, 'label': axis.upper() + '轴'} for axis in 'xyz'])
        if operation['type'] == 'thread':
            choice(path + 'hand', label + ' · 螺纹旋向', operation.get('hand'),
                   [{'value': 'right', 'label': '右旋'}, {'value': 'left', 'label': '左旋'}])
        if operation['type'] in {'fillet', 'chamfer'}:
            edges = _edge_set(operation.get('edges'))
            if edges is None:
                raise ValueError('圆角／倒角边位置缺失')
            result.append({'key': path + 'edges', 'name': label + ' · 边位置（按图纸边编号）',
                           'expected': edges, 'unit': '—', 'kind': 'edge_set'})
        if cut or (index > 0 and operation['type'] not in {'fillet', 'chamfer'}):
            position = operation.get('position')
            if not isinstance(position, list) or len(position) != 3:
                raise ValueError('特征位置参数缺失')
            for axis, value in enumerate(position):
                add(path + 'position.' + str(axis), label + ' · ' + 'XYZ'[axis] + '位置（按设计基准）', value)
        if operation['type'] == 'loft':
            sections = operation.get('sections')
            if not isinstance(sections, list) or not 2 <= len(sections) <= 12:
                raise ValueError('放样截面参数缺失')
            for section_index, section in enumerate(sections):
                if not isinstance(section, Mapping) or not isinstance(section.get('center'), list) or len(section['center']) != 2:
                    raise ValueError('放样截面中心参数缺失')
                section_path = path + 'sections.' + str(section_index) + '.'
                section_label = label + ' · 截面' + str(section_index + 1)
                for field, name in (('z', '高度'), ('diameter', '直径')):
                    add(section_path + field, section_label + ' · ' + name, section.get(field))
                for axis, value in enumerate(section['center']):
                    add(section_path + 'center.' + str(axis), section_label + ' · ' + 'XY'[axis] + '中心', value)
    if cuts:
        add('cut_feature_count', '孔／切除特征数量', cuts, '个')
    return result


def build_design_reference(run):
    """从服务端已完成的建模记录固定检验基准，传入的 parameters 不作为依据。"""
    if not isinstance(run, Mapping) or not re.fullmatch(r'FC-[a-f0-9]{64}', str(run.get('run_id') or '')):
        raise ValueError('请选择生产建模中已生成的设计版本')
    proof = run.get('validation') or {}
    if (run.get('status') != 'completed' or not isinstance(proof, Mapping) or proof.get('valid') is not True
            or proof.get('step_roundtrip') is not True or proof.get('solid_count') != 1
            or run.get('synthetic') is True or run.get('degraded') is True):
        raise ValueError('设计尚未完成实体和 STEP 校验，不能作为生产检验依据')
    spec = deepcopy(run.get('spec'))
    parameters = design_parameters(spec)
    digest = sha256(json.dumps([run['run_id'], spec], ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()
    return {'run_id': run['run_id'], 'status': 'completed', 'prompt': str(run.get('prompt') or ''),
            'spec': spec, 'validation': deepcopy(proof), 'parameters': parameters, 'digest': digest,
            'source': 'production-modeling'}


def compare_design_parameters(reference, measurements):
    """逐项比较真实录入值，按十进制数值严格一致；缺数据不能判为一致。"""
    reference = build_design_reference(reference)
    measurements = measurements if isinstance(measurements, Mapping) else {}
    rows = []
    for parameter in reference['parameters']:
        kind = parameter.get('kind')
        value = measurements.get(parameter['key'])
        if kind == 'choice':
            expected = parameter['expected']
            actual = value if isinstance(value, str) and value in {item['value'] for item in parameter['options']} else None
        elif kind == 'edge_set':
            expected, actual = parameter['expected'], _edge_set(value)
        else:
            expected, actual = _decimal(parameter['expected']), _decimal(value)
        status = 'not_tested' if actual is None else 'pass' if actual == expected else 'fail'
        rows.append({'item': parameter['key'], 'name': parameter['name'], 'unit': parameter['unit'],
            'expected': expected if kind else float(expected), 'actual': actual if kind else float(actual) if actual is not None else None,
            'difference': float(actual - expected) if actual is not None and not kind else None,
            **({'kind': kind, 'options': parameter.get('options', [])} if kind else {}),
            'passed': status == 'pass', 'sufficient_data': actual is not None, 'status': status})
    unknown = set(measurements) - {row['item'] for row in rows}
    sufficient = all(row['sufficient_data'] for row in rows) and not unknown
    status = 'fail' if any(row['status'] == 'fail' for row in rows) else 'pass' if sufficient else 'insufficient_data' if measurements else 'not_tested'
    return {'success': True, 'passed': status == 'pass', 'qualified': status == 'pass', 'status': status,
        'sufficient_data': sufficient, 'items': rows, 'comparison_scope': SCOPE,
        'design_run_id': reference['run_id'], 'design_digest': reference['digest'],
        'defects': [row for row in rows if row['status'] == 'fail'],
        'findings': ['未定义的检测参数：' + ', '.join(sorted(unknown))] if unknown else [],
        'source': 'backend-qms', 'comparison_rule': 'decimal_exact'}


def design_evidence_is_complete(values):
    """Agent 与 Backend 的放行规则共用同一次确定性重算，不接受仅声明通过。"""
    try:
        expected = compare_design_parameters(values.get('design_reference') or {}, values.get('measurements'))
    except (ValueError, TypeError):
        return False
    checks = values.get('quality_validation') or {}
    check = checks.get('dimensions') if isinstance(checks, Mapping) else None
    return (expected['passed'] and isinstance(check, Mapping)
        and check.get('success') is True and check.get('passed') is True
        and check.get('sufficient_data') is True and check.get('status') == 'pass'
        and check.get('items') == expected['items'] and check.get('design_digest') == expected['design_digest']
        and check.get('synthetic') is not True and check.get('degraded') is not True)
