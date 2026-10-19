"""text-to-cad 建模入口：结构化参数生成可信脚本，不运行模型提供的代码。"""
from contextlib import contextmanager
from contextvars import ContextVar
import json
import math
import os
from pathlib import Path
import re
import threading
import xml.etree.ElementTree as ET


class TextToCadModelError(ValueError):
    """可向用户展示的受控建模错误。"""


_scope = ContextVar('text_to_cad_tool_scope', default=None)
_execution_lock = threading.Lock()
_FILES = {'model.stl': 'stl', 'model.step': 'step', 'model.py': 'py'}
ARTIFACT_TYPES = {**{name: ('model/stl' if ext == 'stl' else 'application/step' if ext == 'step' else 'application/octet-stream') for name, ext in _FILES.items()},
    'model.json': 'application/json', 'model.FCStd': 'application/octet-stream', 'model.fcstd': 'application/octet-stream', 'model.py': 'text/x-python', 'drawing.svg': 'image/svg+xml', 'drawing.pdf': 'application/pdf',
    'unfold.svg': 'image/svg+xml', 'unfold.dxf': 'image/vnd.dxf', 'motion.json': 'application/json'}


def validate_spec(spec):
    """保持旧零件协议，工作台扩展必须逐项验证，不接收任意脚本。"""
    if not isinstance(spec, dict) or spec.get('units') != 'mm':
        raise TextToCadModelError('请提供毫米单位的完整结构化规格。')
    base = {k: v for k, v in spec.items() if k not in {'drawing', 'assembly'}}
    try:
        if set(base) == {'units', 'bim'}:
            from .cad_workbenches import validate_bim
            normalized = {'units': 'mm', 'bim': validate_bim(base['bim'])}
        elif set(base) == {'units', 'sheet_metal'}:
            from .cad_sheetmetal import validate_sheet_metal
            normalized = {'units': 'mm', 'sheet_metal': validate_sheet_metal(base['sheet_metal'])}
        else:
            normalized = _validate_geometry(base)
        if 'assembly' in spec:
            if 'parts' not in normalized:
                raise ValueError('装配约束必须同时提供独立零件。')
            from .cad_workbenches import validate_assembly
            normalized['assembly'] = validate_assembly(spec['assembly'], [p['name'] for p in normalized['parts']])
        if 'drawing' in spec:
            from .cad_drawing import validate_drawing
            normalized['drawing'] = validate_drawing(spec['drawing'])
        return normalized
    except (ValueError, TypeError, OverflowError) as error:
        raise TextToCadModelError(str(error)) from None


def _validate_geometry(spec):
    if not isinstance(spec, dict) or set(spec) not in ({'units', 'operations'}, {'units', 'parts'}) or spec.get('units') != 'mm':
        raise TextToCadModelError('请明确毫米单位和 operations 参数；不接受代码或额外字段。')
    if 'parts' in spec:
        parts = spec['parts']
        if not isinstance(parts, list) or not 2 <= len(parts) <= 8:
            raise TextToCadModelError('静态装配需要 2 至 8 个明确命名的零件。')
        normalized, names = [], set()
        for part in parts:
            if not isinstance(part, dict) or set(part) != {'name', 'operations'}:
                raise TextToCadModelError('装配零件仅接受名称与完整 operations。')
            name = part['name']
            if not isinstance(name, str) or not name.strip() or len(name) > 64 or name in names:
                raise TextToCadModelError('装配零件名称必须非空、唯一且不超过 64 字符。')
            names.add(name)
            normalized.append({'name': name, 'operations': validate_spec({'units': 'mm', 'operations': part['operations']})['operations']})
        if sum(len(p['operations']) for p in normalized) > 24:
            raise TextToCadModelError('单次装配总操作数不能超过 24。')
        return {'units': 'mm', 'parts': normalized}
    operations = spec.get('operations')
    if not isinstance(operations, list) or not 1 <= len(operations) <= 24:
        raise TextToCadModelError('请提供 1 至 24 个明确的建模操作。')

    def number(value, positive=False):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TextToCadModelError('尺寸和位置必须为有限数值。')
        # 这是执行资源上限，不是工业零件合格阈值。
        if abs(value) > 10000 or (positive and value <= 0):
            raise TextToCadModelError('尺寸必须大于零；当前单次建模坐标及尺寸范围为 ±10000 mm。')
        if not math.isfinite(value):
            raise TextToCadModelError('尺寸和位置必须为有限数值。')
        return float(value)

    result = []
    for index, operation in enumerate(operations):
        if not isinstance(operation, dict):
            raise TextToCadModelError('每一步必须是结构化建模参数。')
        kind = operation.get('type')
        if not isinstance(kind, str) or kind not in {'cylinder', 'box', 'tetrahedron', 'sphere', 'cone', 'gear', 'thread', 'loft', 'fillet', 'chamfer'}:
            raise TextToCadModelError('不支持此几何操作；请使用已开放的形体或特征，不能忽略要求。')
        if kind in {'fillet', 'chamfer'}:
            dimension = 'radius' if kind == 'fillet' else 'distance'
            if index == 0 or set(operation) != {'type', dimension, 'edges'}:
                raise TextToCadModelError('圆角/倒角需要已有实体、明确尺寸与边选择。')
            edges = operation['edges']
            if edges != 'all' and (not isinstance(edges, list) or not 1 <= len(edges) <= 128 or
                    any(type(e) is not int or not 1 <= e <= 10000 for e in edges) or len(set(edges)) != len(edges)):
                raise TextToCadModelError('边必须为 all 或唯一的正整数边编号列表（从 1 开始）。')
            result.append({**operation, dimension: number(operation[dimension], positive=True)})
            continue
        dimensions = {'cylinder': ('diameter', 'length'), 'box': ('length', 'width', 'height'),
            'tetrahedron': ('edge_length',), 'sphere': ('diameter',),
            'cone': ('bottom_diameter', 'top_diameter', 'height'),
            'gear': ('module', 'width', 'bore_diameter'),
            'thread': ('major_diameter', 'pitch', 'length', 'depth'), 'loft': ()}[kind]
        keys = {'type', 'mode', 'position', *dimensions} | ({'axis'} if kind in {'cylinder', 'cone', 'gear', 'thread'} else set())
        keys |= {'gear': {'teeth', 'pressure_angle'}, 'thread': {'flank_angle', 'hand'}, 'loft': {'sections'}}.get(kind, set())
        if set(operation) != keys:
            raise TextToCadModelError('尺寸、位置、轴向必须完整；正四面体需明确边长，不能包含额外字段。')
        if not isinstance(operation['mode'], str) or operation['mode'] not in {'add', 'cut'} or (index == 0 and operation['mode'] != 'add'):
            raise TextToCadModelError('首步必须创建实体，后续操作只支持添加或切除。')
        position = operation['position']
        if not isinstance(position, list) or len(position) != 3:
            raise TextToCadModelError('位置必须明确为 [x, y, z]。')
        current = {**operation, 'position': [number(v) for v in position]}
        for key in dimensions:
            zero_allowed = key in {'top_diameter', 'bore_diameter'}
            current[key] = number(operation[key], positive=not zero_allowed)
            if current[key] < 0:
                raise TextToCadModelError('顶径与孔径不能为负；无孔时请明确填写 0。')
        if kind in {'cylinder', 'cone', 'gear', 'thread'} and (not isinstance(operation['axis'], str) or operation['axis'] not in {'x', 'y', 'z'}):
            raise TextToCadModelError('圆柱轴向只支持 x、y、z。')
        if kind == 'cone' and current['bottom_diameter'] <= current['top_diameter']:
            raise TextToCadModelError('圆锥/圆台的底径必须大于顶径；尖顶明确填写 0。')
        if kind == 'gear':
            teeth = operation['teeth']
            angle = number(operation['pressure_angle'], positive=True)
            if type(teeth) is not int or not 8 <= teeth <= 120 or not 10 <= angle <= 35:
                raise TextToCadModelError('当前直齿轮资源范围为 8–120 齿、压力角 10–35 度。')
            root_diameter = current['module'] * (teeth - 2.5)
            if current['module'] * (teeth + 2) > 10000 or current['bore_diameter'] >= root_diameter:
                raise TextToCadModelError('齿轮外径超出资源上限，或孔径不小于齿根直径。')
            current['pressure_angle'] = angle
        if kind == 'thread':
            angle = number(operation['flank_angle'], positive=True)
            if not isinstance(operation['hand'], str) or operation['hand'] not in {'right', 'left'} or not 20 <= angle <= 90:
                raise TextToCadModelError('请明确 left/right 旋向与 20–90 度牙型角。')
            if current['depth'] >= current['major_diameter'] / 2 or current['length'] / current['pitch'] > 40 or current['length'] < current['pitch']:
                raise TextToCadModelError('牙深必须小于半径；单次支持 1–40 圈外螺纹。')
            if 2 * current['depth'] * math.tan(math.radians(angle / 2)) >= current['pitch']:
                raise TextToCadModelError('牙型底宽必须小于螺距，不能形成重叠牙型。')
            current['flank_angle'] = angle
        if kind == 'loft':
            sections = operation['sections']
            if not isinstance(sections, list) or not 2 <= len(sections) <= 12:
                raise TextToCadModelError('曲面放样需要 2–12 个完整圆形截面。')
            normalized_sections, previous_z = [], None
            for section in sections:
                if not isinstance(section, dict) or set(section) != {'z', 'diameter', 'center'} or not isinstance(section['center'], list) or len(section['center']) != 2:
                    raise TextToCadModelError('每个截面必须明确 z、diameter、center=[x,y]。')
                z = number(section['z'])
                if previous_z is not None and z <= previous_z:
                    raise TextToCadModelError('放样截面的高度必须严格递增。')
                normalized_sections.append({'z': z, 'diameter': number(section['diameter'], positive=True), 'center': [number(v) for v in section['center']]})
                previous_z = z
            current['sections'] = normalized_sections
        result.append(current)
    return {'units': 'mm', 'operations': result}


def artifact_path(run_id, name):
    if not isinstance(run_id, str) or not re.fullmatch(r'FC-[a-f0-9]{64}', run_id) or name not in {*ARTIFACT_TYPES, 'manifest.json'}:
        raise TextToCadModelError('无效的建模文件标识。')
    root = Path(os.getenv('TEXT_TO_CAD_ARTIFACT_ROOT') or os.getenv('FREECAD_ARTIFACT_ROOT') or Path(__file__).resolve().parents[5] / '.runtime' / 'cad-models').resolve()
    target = (root / run_id / name).resolve()
    if not target.is_relative_to(root) or target.parent != root / run_id:
        raise TextToCadModelError('建模文件必须位于本任务目录。')
    return target


@contextmanager
def text_to_cad_tool_scope(client, run_id):
    artifact_path(run_id, 'manifest.json')
    token = _scope.set({'client': client, 'run_id': run_id, 'executed': False})
    try:
        yield
    finally:
        _scope.reset(token)


def _program(spec, directory, run_id):
    from .text_to_cad_source import model_program
    return model_program(spec, directory, run_id, claim=True)


def text_to_cad(spec):
    normalized = validate_spec(spec)
    context = _scope.get()
    if context is None:
        raise TextToCadModelError('text-to-cad 工具缺少服务端任务上下文。')
    from app.cad_documents import documents_enabled
    from app.cad_documents.gateway import Gateway, worker_execution
    if documents_enabled() and not worker_execution.get():
        if context['executed']:
            raise TextToCadModelError('同一建模命令不能重复执行。')
        context['executed'] = True
        gateway = Gateway()
        return gateway.wait_legacy(gateway.enqueue_legacy(context['run_id'], normalized))
    if context['executed']:
        raise TextToCadModelError('同一建模命令不能重复执行。')
    if not _execution_lock.acquire(blocking=False):
        raise TextToCadModelError('text-to-cad 正在处理其他实体，请稍后新建任务。')
    try:
        context['executed'] = True
        run_id = context['run_id']
        manifest = artifact_path(run_id, 'manifest.json')
        try:
            manifest.parent.mkdir(parents=True, exist_ok=False)
        except FileExistsError:
            raise TextToCadModelError('此命令已有执行目录，禁止重复执行；请查询原任务。') from None
        from .text_to_cad_source import model_program
        (manifest.parent / 'model.py').write_text(model_program(normalized, manifest.parent, run_id, portable=True), encoding='utf-8')
        arguments = {'code': _program(normalized, manifest.parent, run_id), 'include_screenshot': False, 'timeout': 230.0}
        try:
            result = context['client'].call_tool('execute_code', arguments, timeout=240)
        except Exception as error:
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'error': 'CAD 子进程执行未返回明确结果。'}]
            raise
        texts = '\n'.join(v.get('text', '') for v in result.get('content', []) if isinstance(v, dict) and v.get('type') == 'text') if isinstance(result, dict) else ''
        claimed = 'INDUSTRY_CAD_EXECUTION_ALREADY_CLAIMED' in texts
        if 'gui dispatch timed out' in texts.lower() or 'still running' in texts.lower() or (claimed and not manifest.is_file()):
            from app.clients.text_to_cad import TextToCadConnectionError
            error = TextToCadConnectionError('outcome_unknown',
                'text-to-cad 执行超时，任务可能已有产物；请核对原任务，不会自动重放。', 504)
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]
            raise error
        # 重发被执行标记拒绝后只能读取原任务的完整证据，不重新执行。
        if not isinstance(result, dict) or ((result.get('isError') or 'Failed to execute code' in texts) and not claimed) or not manifest.is_file():
            error = TextToCadModelError('text-to-cad 未生成经过校验的实体。请检查建模参数和本地几何内核。')
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]
            raise error
        try:
            value = read_validated_result(normalized, run_id)
        except TextToCadModelError as error:
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]
            raise
        return {**value, 'calls': [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]}
    finally:
        _execution_lock.release()




def read_validated_result(normalized, run_id):
    """Read original terminal evidence only; shared by normal replies and durable recovery."""
    normalized = validate_spec(normalized)
    manifest = artifact_path(run_id, 'manifest.json')
    try:
        evidence = json.loads(manifest.read_text(encoding='utf-8'))

        def positive_number(value):
            return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > 0

        # 业务校验不能依赖 assert，Python 优化模式下也必须执行。
        if evidence['run_id'] != run_id or evidence['spec'] != normalized or evidence['units'] != 'mm':
            raise ValueError('实体证据归属或单位不匹配')
        expected_solids = len(normalized['parts']) if 'parts' in normalized else len(normalized['bim']['walls']) + len(normalized['bim']['slabs']) if 'bim' in normalized else 1
        if evidence['valid'] is not True or evidence['step_roundtrip'] is not True or type(evidence['solid_count']) is not int or evidence['solid_count'] != expected_solids:
            raise ValueError('实体或 STEP 验证未通过')
        if 'parts' in normalized:
            components = evidence.get('components')
            if evidence.get('model_kind') != 'assembly' or evidence.get('component_count') != expected_solids or evidence.get('interference_checked') is not True or not isinstance(components, list) or len(components) != expected_solids:
                raise ValueError('装配校验未通过')
            if [p.get('name') for p in components] != [p['name'] for p in normalized['parts']] or any(p.get('solid_count') != 1 or not positive_number(p.get('volume_mm3')) for p in components):
                raise ValueError('装配零件证据归属不匹配')
        if not positive_number(evidence['volume_mm3']):
            raise ValueError('实体体积无效')
        if not isinstance(evidence['bounds_mm'], list) or len(evidence['bounds_mm']) != 3 or not all(positive_number(v) for v in evidence['bounds_mm']):
            raise ValueError('实体包围尺寸无效')
        operations = normalized.get('operations', [])
        if len(operations) == 1 and operations[0]['type'] == 'thread':
            thread = operations[0]
            expected = [thread['major_diameter']] * 3
            expected['xyz'.index(thread['axis'])] = thread['length']
            if any(abs(a-b) > max(1e-6, b*1e-6) for a,b in zip(evidence['bounds_mm'], expected)):
                raise ValueError('外螺纹实体尺寸不符合指定大径与长度')
        files = _requested_files(normalized)
        _validate_workbench_evidence(normalized, evidence)
        for name in files:
            path = artifact_path(run_id, name)
            if not path.is_file() or not 0 < path.stat().st_size <= 100 * 1024 * 1024:
                raise ValueError('导出文件无效')
            _validate_extra_file(path)
        if normalized.get('assembly', {}).get('motion'):
            motion = json.loads(artifact_path(run_id, 'motion.json').read_text(encoding='utf-8'))
            wanted = normalized['assembly']['motion']
            if [p['name'] for p in motion['components']] != [p['name'] for p in normalized['parts']] or len(motion['frames']) != wanted['frames']:
                raise ValueError('运动数据的零件或帧数不符合请求')
            if not math.isclose(motion['frames'][-1]['time'], wanted['duration'], abs_tol=1e-8):
                raise ValueError('运动时长不符合请求')
    except (ValueError, KeyError, TypeError, OSError):
        error = TextToCadModelError('text-to-cad 未生成完整、有效且属于本任务的实体文件。')
        raise error from None
    return {'status': 'completed', 'answer': 'text-to-cad 实体及 STEP 回读校验通过，可旋转预览并下载设计文件。',
        'validation': {k: v for k, v in evidence.items() if k not in {'spec', 'run_id'}},
        'artifacts': [{'name': name, 'format': name.rsplit('.', 1)[1].lower(), 'url': f'/api/cad/text-to-cad/runs/{run_id}/artifacts/{name}'} for name in files]}

def _requested_files(spec):
    files = list(_FILES)
    if 'drawing' in spec:
        files.extend(['drawing.svg', 'drawing.pdf'])
    if 'sheet_metal' in spec:
        files.extend(['unfold.svg', 'unfold.dxf'])
    if spec.get('assembly', {}).get('motion'):
        files.append('motion.json')
    return files


def _validate_workbench_evidence(spec, evidence):
    """核对实际工作台证明与用户规格，不接受只有 verified 标记的占位结果。"""
    def near(actual, expected):
        return type(actual) in (int, float) and math.isfinite(actual) and math.isclose(actual, expected, rel_tol=1e-6, abs_tol=1e-6)

    def positive(value):
        return type(value) in (int, float) and math.isfinite(value) and value > 0

    for feature in ('drawing', 'assembly', 'bim', 'sheet_metal'):
        if feature in spec and (not isinstance(evidence.get(feature), dict) or evidence[feature].get('verified') is not True):
            raise ValueError('工作台缺少实际执行验证')
    if 'drawing' in spec:
        config, proof = spec['drawing'], evidence['drawing']
        names = ['Front', 'Top', 'Right', 'Isometric'] + (['Section'] if config.get('section') else [])
        views = proof.get('views')
        if (proof.get('projection') != config['projection'] or not near(proof.get('scale'), config['scale'])
                or proof.get('section') is not bool(config.get('section')) or not isinstance(views, list)
                or any(not isinstance(v, dict) for v in views) or [v.get('name') for v in views] != names
                or any(not positive(v.get('visible_edges')) for v in views)
                or any(not positive(proof.get(key)) for key in ('svg_geometry_elements', 'pdf_bytes', 'pdf_graphics_streams'))):
            raise ValueError('工程视图证明与请求不一致')
    if 'assembly' in spec:
        config, proof = spec['assembly'], evidence['assembly']
        joints = [{key: joint[key] for key in ('name', 'type', 'part1', 'part2')} for joint in config['joints']]
        if (type(proof.get('solver_status')) is not int or proof['solver_status'] != 0
                or proof.get('grounded') != config['grounded'] or proof.get('joints') != joints
                or proof.get('joint_count') != len(joints)
                or proof.get('motion_frames') != config.get('motion', {}).get('frames', 0)
                or proof.get('motion_interference_checked') is not False):
            raise ValueError('装配求解或运动证明与请求不一致')
    if 'bim' in spec:
        config, proof = spec['bim'], evidence['bim']
        if any(proof.get(key) != len(config[key]) for key in ('walls', 'slabs', 'openings')):
            raise ValueError('建筑对象数量与请求不一致')
        if config['openings'] and not positive(proof.get('opening_volume_removed')):
            raise ValueError('建筑开口未实际切除墙体')
    if 'sheet_metal' in spec:
        config, proof = spec['sheet_metal'], evidence['sheet_metal']
        length = config['base_length'] + config['flange_length'] + math.radians(config['bend_angle']) * (config['bend_radius'] + config['k_factor'] * config['thickness'])
        expected = {'k_factor': config['k_factor'], 'bend_angle_deg': config['bend_angle'],
            'inner_bend_radius_mm': config['bend_radius'], 'thickness_mm': config['thickness'],
            'unfold_width_mm': config['width'], 'unfold_length_mm': length,
            'unfold_area_mm2': config['width'] * length, 'unfold_volume_mm3': config['width'] * length * config['thickness'],
            'bend_line_length_mm': config['width']}
        if (proof.get('bend_count') != 1 or proof.get('cylindrical_face_count') != 2
                or proof.get('k_factor_standard') != 'ansi' or not proof.get('plugin_version')
                or any(not near(proof.get(key), value) for key, value in expected.items())
                or not near(proof.get('bent_volume_mm3'), evidence.get('volume_mm3', -1))):
            raise ValueError('钣金折弯或展开补偿证明与请求不一致')


def _validate_extra_file(path):
    """拓展产物必须是真实可读文件；SVG不允许脚本或外部引用。"""
    if path.suffix == '.pdf':
        if not path.read_bytes().startswith(b'%PDF-'):
            raise ValueError('无效PDF')
    elif path.suffix == '.svg':
        try:
            root = ET.fromstring(path.read_bytes())
        except ET.ParseError as error:
            raise ValueError('无效SVG') from error
        if root.tag.split('}')[-1] != 'svg' or not any(el.tag.split('}')[-1] in {'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect'} for el in root.iter()):
            raise ValueError('SVG缺少实际图形')
        for el in root.iter():
            if el.tag.split('}')[-1].lower() in {'script', 'foreignobject'}:
                raise ValueError('SVG包含不允许的内容')
            for key, value in el.attrib.items():
                if key.lower().startswith('on') or (key.split('}')[-1] == 'href' and not value.startswith('#')):
                    raise ValueError('SVG包含外部引用或事件')
    elif path.suffix == '.dxf':
        value = path.read_text(encoding='utf-8', errors='replace')
        if 'SECTION' not in value or 'ENTITIES' not in value or 'EOF' not in value:
            raise ValueError('无效DXF')
    elif path.name == 'motion.json':
        if path.stat().st_size > 32 * 1024 * 1024:
            raise ValueError('运动数据超出资源上限')
        motion = json.loads(path.read_text(encoding='utf-8'))
        _validate_motion(motion)


def _validate_motion(motion):
    """网格及逐帧零件位姿完整性；不将镜头转动当作机构运动。"""
    def fields(value, keys):
        if not isinstance(value, dict) or set(value) != set(keys):
            raise ValueError('运动数据字段不完整')

    def number(value, limit):
        return type(value) in (int, float) and math.isfinite(value) and abs(value) <= limit

    def vector(value, length, limit):
        if not isinstance(value, list) or len(value) != length or not all(number(v, limit) for v in value):
            raise ValueError('无效运动坐标')

    fields(motion, ('components', 'frames'))
    components, frames = motion['components'], motion['frames']
    if not isinstance(components, list) or not 2 <= len(components) <= 8 or not isinstance(frames, list) or not 2 <= len(frames) <= 120:
        raise ValueError('无效运动零件或帧数')
    names, count = set(), 0
    for component in components:
        fields(component, ('name', 'triangles'))
        name, mesh = component['name'], component['triangles']
        if not isinstance(name, str) or not name.strip() or len(name) > 64 or any(ord(c) < 32 for c in name) or name in names:
            raise ValueError('无效运动零件名称')
        names.add(name)
        if not isinstance(mesh, list) or len(mesh) < 36 or len(mesh) % 9:
            raise ValueError('不完整的运动网格')
        count += len(mesh) // 9
        if count > 60000 or not all(number(v, 100000) for v in mesh):
            raise ValueError('运动网格无效或超出资源上限')
        if any(max(mesh[axis::3]) - min(mesh[axis::3]) <= 1e-9 for axis in range(3)):
            raise ValueError('运动网格没有实体范围')
    previous_time = -1
    for index, frame in enumerate(frames):
        fields(frame, ('time', 'placements'))
        time, placements = frame['time'], frame['placements']
        if not number(time, 60) or time <= previous_time or (index == 0 and time != 0):
            raise ValueError('运动帧时间无效')
        previous_time = time
        if not isinstance(placements, list) or len(placements) != len(names):
            raise ValueError('运动帧缺失零件')
        placed = set()
        for placement in placements:
            fields(placement, ('name', 'position', 'quaternion'))
            name = placement['name']
            if not isinstance(name, str) or name not in names or name in placed:
                raise ValueError('运动零件归属不匹配')
            placed.add(name)
            vector(placement['position'], 3, 100000)
            vector(placement['quaternion'], 4, 1.000001)
            if abs(math.sqrt(sum(v*v for v in placement['quaternion'])) - 1) > 1e-5:
                raise ValueError('运动旋转不是单位四元数')
