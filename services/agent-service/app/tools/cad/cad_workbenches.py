"""原生装配与 BIM 的白名单参数及可信 text-to-cad 内核。"""
import math


def _fields(value, required, optional=()):
    if not isinstance(value, dict) or not set(required) <= set(value) or set(value) - set(required) - set(optional):
        raise ValueError('参数必须完整且不能包含代码、路径或未知字段。')


def _number(value, *, positive=False, limit=10000):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError('尺寸、位置和运动参数必须是有限数值。')
    if not math.isfinite(value) or abs(value) > limit or (positive and value <= 0):
        raise ValueError('参数超出资源范围，尺寸和时长必须大于零。')
    return float(value)


def _vector(value):
    if not isinstance(value, list) or len(value) != 3:
        raise ValueError('位置或轴必须为三个有限数值。')
    return [_number(item) for item in value]


def _name(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 64 or any(ord(c) < 32 for c in value):
        raise ValueError('名称必须非空、不含控制字符且不超过64字符。')
    return value


def _connector(value):
    _fields(value, {'position', 'axis'})
    axis = _vector(value['axis'])
    length = math.hypot(*axis)
    if length < 1e-9:
        raise ValueError('关节轴不能是零向量。')
    return {'position': _vector(value['position']), 'axis': [v / length for v in axis]}


def validate_assembly(value, part_names):
    """运动角度使用度，滑动距离使用毫米；所有零件必须连接到固定基体。"""
    _fields(value, {'grounded', 'joints'}, {'motion'})
    names = list(part_names)
    if not 2 <= len(names) <= 8 or any(not isinstance(n, str) for n in names) or len(set(names)) != len(names):
        raise ValueError('装配需要2至8个唯一命名零件。')
    grounded = _name(value['grounded'])
    if grounded not in names:
        raise ValueError('固定基体必须引用当前装配的零件。')
    raw_joints = value['joints']
    if not isinstance(raw_joints, list) or not 1 <= len(raw_joints) <= 16:
        raise ValueError('装配需要1至16个明确关节。')
    joints, joint_names = [], set()
    neighbors = {name: set() for name in names}
    for item in raw_joints:
        _fields(item, {'name', 'type', 'part1', 'part2'}, {'connector1', 'connector2'})
        name, first, second = _name(item['name']), _name(item['part1']), _name(item['part2'])
        kind = item['type']
        if name in joint_names or not isinstance(kind, str) or kind not in {'fixed', 'revolute', 'slider'}:
            raise ValueError('关节名称必须唯一，类型仅支持fixed、revolute、slider。')
        if first not in neighbors or second not in neighbors or first == second:
            raise ValueError('关节必须引用两个不同的已有零件。')
        joint_names.add(name)
        neighbors[first].add(second)
        neighbors[second].add(first)
        joint = {'name': name, 'type': kind, 'part1': first, 'part2': second}
        for key in ('connector1', 'connector2'):
            joint[key] = _connector(item.get(key, {'position': [0, 0, 0], 'axis': [0, 0, 1]}))
        joints.append(joint)
    reached, pending = set(), [grounded]
    while pending:
        name = pending.pop()
        if name not in reached:
            reached.add(name)
            pending.extend(neighbors[name] - reached)
    if reached != set(names):
        raise ValueError('每个零件都必须通过关节连接到固定基体。')
    result = {'grounded': grounded, 'joints': joints}
    if 'motion' in value:
        motion = value['motion']
        _fields(motion, {'joint', 'start', 'end', 'duration', 'frames'})
        name = _name(motion['joint'])
        target = next((joint for joint in joints if joint['name'] == name), None)
        if target is None or target['type'] == 'fixed':
            raise ValueError('运动必须引用一个转动或滑动关节。')
        count = motion['frames']
        if type(count) is not int or not 2 <= count <= 120:
            raise ValueError('运动帧数必须是2至120的整数。')
        start, end = _number(motion['start']), _number(motion['end'])
        if start == end or abs(end - start) > (720 if target['type'] == 'revolute' else 10000):
            raise ValueError('运动区间必须非零，转动跨度至多720度、滑动跨度至多10000毫米。')
        duration = _number(motion['duration'], positive=True, limit=60)
        if duration < .01:
            raise ValueError('运动时长至少0.01秒。')
        result['motion'] = {'joint': name, 'start': start, 'end': end, 'duration': duration, 'frames': count}
    return result


def validate_bim(value):
    """墙中心线、顶面矩形楼板与宿主墙矩形开口，统一毫米。"""
    _fields(value, (), {'walls', 'slabs', 'openings'})
    result = {}
    for key, limit in (('walls', 24), ('slabs', 8), ('openings', 32)):
        items = value.get(key, [])
        if not isinstance(items, list) or len(items) > limit:
            raise ValueError('BIM对象数量超出当前资源范围。')
        result[key] = []
    if not value.get('walls') and not value.get('slabs'):
        raise ValueError('建筑至少需要一面墙或一块楼板。')
    names, walls = set(), {}

    def unique(item):
        name = _name(item['name'])
        if name in names:
            raise ValueError('建筑对象名称必须唯一。')
        names.add(name)
        return name

    for item in value.get('walls', []):
        _fields(item, {'name', 'start', 'end', 'height', 'thickness'})
        start, end = _vector(item['start']), _vector(item['end'])
        length = math.dist(start, end)
        if abs(start[2] - end[2]) > 1e-7 or not 1e-3 <= length <= 10000:
            raise ValueError('墙起止点需在同一水平面，长度需在0.001至10000毫米内。')
        wall = {'name': unique(item), 'start': start, 'end': end,
                'height': _number(item['height'], positive=True),
                'thickness': _number(item['thickness'], positive=True)}
        walls[wall['name']] = (wall, length)
        result['walls'].append(wall)
    for item in value.get('slabs', []):
        _fields(item, {'name', 'length', 'width', 'thickness', 'position'})
        slab = {'name': unique(item), 'length': _number(item['length'], positive=True),
                'width': _number(item['width'], positive=True),
                'thickness': _number(item['thickness'], positive=True), 'position': _vector(item['position'])}
        if any(abs(v) > 10000 for v in (slab['position'][0] + slab['length'],
               slab['position'][1] + slab['width'], slab['position'][2] - slab['thickness'])):
            raise ValueError('楼板边界超出10000毫米资源范围。')
        result['slabs'].append(slab)
    for item in value.get('openings', []):
        _fields(item, {'name', 'wall', 'offset', 'sill', 'width', 'height'})
        host = _name(item['wall'])
        if host not in walls:
            raise ValueError('开口必须引用本次建筑中的墙。')
        opening = {'name': unique(item), 'wall': host,
                   'offset': _number(item['offset']), 'sill': _number(item['sill']),
                   'width': _number(item['width'], positive=True), 'height': _number(item['height'], positive=True)}
        wall, length = walls[host]
        if (opening['offset'] < 0 or opening['sill'] < 0 or opening['offset'] + opening['width'] > length
                or opening['sill'] + opening['height'] > wall['height']
                or opening['width'] >= length or opening['height'] >= wall['height']):
            raise ValueError('开口必须位于宿主墙范围内，不能贯穿墙长或墙高。')
        for previous in result['openings']:
            if previous['wall'] == host and (max(previous['offset'], opening['offset'])
                    < min(previous['offset'] + previous['width'], opening['offset'] + opening['width'])
                    and max(previous['sill'], opening['sill'])
                    < min(previous['sill'] + previous['height'], opening['sill'] + opening['height'])):
                raise ValueError('同一宿主墙的开口不能相互重叠。')
        result['openings'].append(opening)
    return result


