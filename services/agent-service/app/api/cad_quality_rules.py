"""确定性对照已完成 FreeCAD 模型的数值几何参数与人工实测值。

这里只计算参数一致性，不签发生产合格证，也不允许模型或客户端指定设计基准值。
"""
from __future__ import annotations

from hashlib import sha256
import json
import math
from typing import Any, Mapping


_NAMES = {
    'cylinder': '圆柱', 'box': '长方体', 'tetrahedron': '正四面体',
    'sphere': '球体', 'cone': '圆锥', 'gear': '齿轮', 'thread': '螺纹',
    'loft': '放样', 'fillet': '圆角', 'chamfer': '倒角',
    'diameter': '直径', 'length': '长度', 'width': '宽度', 'height': '高度',
    'edge_length': '边长', 'bottom_diameter': '底部直径', 'top_diameter': '顶部直径',
    'module': '模数', 'bore_diameter': '孔径', 'major_diameter': '大径',
    'pitch': '螺距', 'depth': '深度', 'radius': '半径', 'distance': '倒角尺寸',
    'teeth': '齿数', 'pressure_angle': '压力角', 'flank_angle': '牙型角',
}
_ANGLE_FIELDS = {'pressure_angle', 'flank_angle'}
_COUNT_FIELDS = {'teeth'}


def design_digest(spec: Mapping[str, Any]) -> str:
    """生成设计参数的内容指纹，用于防止读取后被修改的版本误提交。"""
    payload = json.dumps(spec, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    return sha256(payload.encode('utf-8')).hexdigest()


def comparison_rows(spec: Mapping[str, Any]) -> list[dict[str, Any]]:
    """列出所有受支持的数值几何参数；结构类型/材料/工艺不在本对照的范围内。"""
    if spec.get('units') != 'mm':
        raise ValueError('仅支持以 mm 为单位的已完成 FreeCAD 设计')
    rows: list[dict[str, Any]] = []

    def add(key: str, label: str, nominal: Any, unit: str = 'mm', exact: bool = False) -> None:
        if isinstance(nominal, bool) or not isinstance(nominal, (int, float)) or not math.isfinite(nominal):
            raise ValueError('设计数值无效，不能用于实测对照')
        rows.append({'key': key, 'label': label, 'nominal': float(nominal), 'unit': unit, 'exact': exact})

    def operations(items: Any, root: str, heading: str) -> None:
        if not isinstance(items, list):
            raise ValueError('设计缺少有效的建模操作')
        for n, operation in enumerate(items, 1):
            if not isinstance(operation, dict) or operation.get('type') not in _NAMES:
                raise ValueError('包含不支持的建模操作，不能判定参数一致')
            stem = f'{root}op_{n}_'
            title = f'{heading}{_NAMES[operation["type"]]}{n}'
            for key, value in operation.items():
                if key in ('type', 'mode', 'axis', 'hand', 'edges'):
                    continue
                if key == 'position':
                    if not isinstance(value, list) or len(value) != 3:
                        raise ValueError('设计特征位置不完整')
                    for axis, coordinate in zip('xyz', value):
                        add(stem + 'position_' + axis, title + f' · {axis.upper()} 偏移', coordinate)
                elif key == 'sections':
                    if not isinstance(value, list):
                        raise ValueError('放样截面数据无效')
                    for section_index, section in enumerate(value, 1):
                        if not isinstance(section, dict) or not isinstance(section.get('center'), list) or len(section['center']) != 2:
                            raise ValueError('放样截面位置缺失')
                        section_title = title + f' · 截面{section_index}'
                        add(stem + f'section_{section_index}_z', section_title + ' · Z', section['z'])
                        add(stem + f'section_{section_index}_diameter', section_title + ' · 直径', section['diameter'])
                        for axis, coordinate in zip('xy', section['center']):
                            add(stem + f'section_{section_index}_center_{axis}', section_title + f' · {axis.upper()} 中心', coordinate)
                elif key in _NAMES:
                    unit = '个' if key in _COUNT_FIELDS else '°' if key in _ANGLE_FIELDS else 'mm'
                    add(stem + key, title + ' · ' + _NAMES[key], value, unit, key in _COUNT_FIELDS)
                else:
                    raise ValueError('设计存在未实现的几何参数，不能漏检后判定一致')

    if 'parts' in spec:
        parts = spec['parts']
        if not isinstance(parts, list):
            raise ValueError('装配结构无效')
        for n, part in enumerate(parts, 1):
            if not isinstance(part, dict) or not isinstance(part.get('name'), str):
                raise ValueError('装配零件身份不完整')
            operations(part.get('operations'), f'part_{n}_', f'{part["name"]} · ')
    else:
        operations(spec.get('operations'), '', '')
    if not rows or len(rows) > 300 or len(set(item['key'] for item in rows)) != len(rows):
        raise ValueError('未找到可完整对照的几何参数，或参数数量超出限制')
    return rows


def compare_dimensions(rows: list[dict[str, Any]], measurements: Mapping[str, Any]) -> dict[str, Any]:
    """只对全部实测值和显式公差齐全的模型报告一致/不一致。"""
    expected = {row['key'] for row in rows}
    extras = set(measurements) - expected
    if extras:
        raise ValueError('包含未知的设计参数：' + '、'.join(sorted(extras)[:5]))
    items = []
    missing = []
    matched = mismatched = 0
    for row in rows:
        key = row['key']
        input_row = measurements.get(key)
        if input_row is None or not isinstance(input_row, Mapping) or 'actual' not in input_row or 'tolerance' not in input_row:
            missing.append(key)
            items.append({**row, 'actual': None, 'tolerance': None, 'delta': None, 'matched': None})
            continue
        actual, tolerance = input_row['actual'], input_row['tolerance']
        if (isinstance(actual, bool) or not isinstance(actual, (int, float)) or not math.isfinite(actual)):
            raise ValueError('实测值必须是有限数字：' + key)
        if (isinstance(tolerance, bool) or not isinstance(tolerance, (int, float)) or
                not math.isfinite(tolerance) or tolerance < 0 or tolerance > 10000):
            raise ValueError('公差必须是有效的非负数字：' + key)
        if row.get('exact') and (tolerance != 0 or not float(actual).is_integer()):
            raise ValueError('整数计数参数必须填写整数实测值及零公差：' + key)
        delta = round(float(actual) - float(row['nominal']), 10)
        success = abs(delta) <= float(tolerance) + 1e-9
        matched += int(success)
        mismatched += int(not success)
        items.append({**row, 'actual': float(actual), 'tolerance': float(tolerance), 'delta': delta, 'matched': success})
    status = 'insufficient_data' if missing else 'inconsistent' if mismatched else 'consistent'
    return {'status': status, 'items': items, 'total': len(rows), 'matched': matched,
            'mismatched': mismatched, 'missing': missing, 'tolerance_source': 'manual',
            'inspection_scope': 'numeric_geometry_only'}
