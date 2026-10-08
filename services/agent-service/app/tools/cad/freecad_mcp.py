"""FreeCAD MCP 唯一建模工具：结构化参数生成可信脚本，不运行模型提供的代码。"""
from contextlib import contextmanager
from contextvars import ContextVar
import json
import math
import os
from pathlib import Path
import re
import threading


class FreeCADModelError(ValueError):
    """可向用户展示的受控建模错误。"""


_scope = ContextVar('freecad_tool_scope', default=None)
_execution_lock = threading.Lock()
_FILES = {'model.stl': 'stl', 'model.step': 'step', 'model.FCStd': 'fcstd'}


def validate_spec(spec):
    if not isinstance(spec, dict) or set(spec) not in ({'units', 'operations'}, {'units', 'parts'}) or spec.get('units') != 'mm':
        raise FreeCADModelError('请明确毫米单位和 operations 参数；不接受代码或额外字段。')
    if 'parts' in spec:
        parts = spec['parts']
        if not isinstance(parts, list) or not 2 <= len(parts) <= 8:
            raise FreeCADModelError('静态装配需要 2 至 8 个明确命名的零件。')
        normalized, names = [], set()
        for part in parts:
            if not isinstance(part, dict) or set(part) != {'name', 'operations'}:
                raise FreeCADModelError('装配零件仅接受名称与完整 operations。')
            name = part['name']
            if not isinstance(name, str) or not name.strip() or len(name) > 64 or name in names:
                raise FreeCADModelError('装配零件名称必须非空、唯一且不超过 64 字符。')
            names.add(name)
            normalized.append({'name': name, 'operations': validate_spec({'units': 'mm', 'operations': part['operations']})['operations']})
        if sum(len(p['operations']) for p in normalized) > 24:
            raise FreeCADModelError('单次装配总操作数不能超过 24。')
        return {'units': 'mm', 'parts': normalized}
    operations = spec.get('operations')
    if not isinstance(operations, list) or not 1 <= len(operations) <= 24:
        raise FreeCADModelError('请提供 1 至 24 个明确的建模操作。')

    def number(value, positive=False):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise FreeCADModelError('尺寸和位置必须为有限数值。')
        # 这是执行资源上限，不是工业零件合格阈值。
        if abs(value) > 10000 or (positive and value <= 0):
            raise FreeCADModelError('尺寸必须大于零；当前单次建模坐标及尺寸范围为 ±10000 mm。')
        if not math.isfinite(value):
            raise FreeCADModelError('尺寸和位置必须为有限数值。')
        return float(value)

    result = []
    for index, operation in enumerate(operations):
        if not isinstance(operation, dict):
            raise FreeCADModelError('每一步必须是结构化建模参数。')
        kind = operation.get('type')
        if not isinstance(kind, str) or kind not in {'cylinder', 'box', 'tetrahedron', 'sphere', 'cone', 'gear', 'thread', 'loft', 'fillet', 'chamfer'}:
            raise FreeCADModelError('不支持此几何操作；请使用已开放的形体或特征，不能忽略要求。')
        if kind in {'fillet', 'chamfer'}:
            dimension = 'radius' if kind == 'fillet' else 'distance'
            if index == 0 or set(operation) != {'type', dimension, 'edges'}:
                raise FreeCADModelError('圆角/倒角需要已有实体、明确尺寸与边选择。')
            edges = operation['edges']
            if edges != 'all' and (not isinstance(edges, list) or not 1 <= len(edges) <= 128 or
                    any(type(e) is not int or not 1 <= e <= 10000 for e in edges) or len(set(edges)) != len(edges)):
                raise FreeCADModelError('边必须为 all 或唯一的正整数边编号列表（从 1 开始）。')
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
            raise FreeCADModelError('尺寸、位置、轴向必须完整；正四面体需明确边长，不能包含额外字段。')
        if not isinstance(operation['mode'], str) or operation['mode'] not in {'add', 'cut'} or (index == 0 and operation['mode'] != 'add'):
            raise FreeCADModelError('首步必须创建实体，后续操作只支持添加或切除。')
        position = operation['position']
        if not isinstance(position, list) or len(position) != 3:
            raise FreeCADModelError('位置必须明确为 [x, y, z]。')
        current = {**operation, 'position': [number(v) for v in position]}
        for key in dimensions:
            zero_allowed = key in {'top_diameter', 'bore_diameter'}
            current[key] = number(operation[key], positive=not zero_allowed)
            if current[key] < 0:
                raise FreeCADModelError('顶径与孔径不能为负；无孔时请明确填写 0。')
        if kind in {'cylinder', 'cone', 'gear', 'thread'} and (not isinstance(operation['axis'], str) or operation['axis'] not in {'x', 'y', 'z'}):
            raise FreeCADModelError('圆柱轴向只支持 x、y、z。')
        if kind == 'cone' and current['bottom_diameter'] <= current['top_diameter']:
            raise FreeCADModelError('圆锥/圆台的底径必须大于顶径；尖顶明确填写 0。')
        if kind == 'gear':
            teeth = operation['teeth']
            angle = number(operation['pressure_angle'], positive=True)
            if type(teeth) is not int or not 8 <= teeth <= 120 or not 10 <= angle <= 35:
                raise FreeCADModelError('当前直齿轮资源范围为 8–120 齿、压力角 10–35 度。')
            root_diameter = current['module'] * (teeth - 2.5)
            if current['module'] * (teeth + 2) > 10000 or current['bore_diameter'] >= root_diameter:
                raise FreeCADModelError('齿轮外径超出资源上限，或孔径不小于齿根直径。')
            current['pressure_angle'] = angle
        if kind == 'thread':
            angle = number(operation['flank_angle'], positive=True)
            if not isinstance(operation['hand'], str) or operation['hand'] not in {'right', 'left'} or not 20 <= angle <= 90:
                raise FreeCADModelError('请明确 left/right 旋向与 20–90 度牙型角。')
            if current['depth'] >= current['major_diameter'] / 2 or current['length'] / current['pitch'] > 40 or current['length'] < current['pitch']:
                raise FreeCADModelError('牙深必须小于半径；单次支持 1–40 圈外螺纹。')
            if 2 * current['depth'] * math.tan(math.radians(angle / 2)) >= current['pitch']:
                raise FreeCADModelError('牙型底宽必须小于螺距，不能形成重叠牙型。')
            current['flank_angle'] = angle
        if kind == 'loft':
            sections = operation['sections']
            if not isinstance(sections, list) or not 2 <= len(sections) <= 12:
                raise FreeCADModelError('曲面放样需要 2–12 个完整圆形截面。')
            normalized_sections, previous_z = [], None
            for section in sections:
                if not isinstance(section, dict) or set(section) != {'z', 'diameter', 'center'} or not isinstance(section['center'], list) or len(section['center']) != 2:
                    raise FreeCADModelError('每个截面必须明确 z、diameter、center=[x,y]。')
                z = number(section['z'])
                if previous_z is not None and z <= previous_z:
                    raise FreeCADModelError('放样截面的高度必须严格递增。')
                normalized_sections.append({'z': z, 'diameter': number(section['diameter'], positive=True), 'center': [number(v) for v in section['center']]})
                previous_z = z
            current['sections'] = normalized_sections
        result.append(current)
    return {'units': 'mm', 'operations': result}


def artifact_path(run_id, name):
    if not isinstance(run_id, str) or not re.fullmatch(r'FC-[a-f0-9]{64}', run_id) or name not in {*_FILES, 'manifest.json'}:
        raise FreeCADModelError('无效的建模文件标识。')
    root = Path(os.getenv('FREECAD_ARTIFACT_ROOT') or Path(__file__).resolve().parents[5] / '.runtime' / 'cad-models').resolve()
    target = (root / run_id / name).resolve()
    if not target.is_relative_to(root) or target.parent != root / run_id:
        raise FreeCADModelError('建模文件必须位于本任务目录。')
    return target


@contextmanager
def freecad_tool_scope(client, run_id):
    artifact_path(run_id, 'manifest.json')
    token = _scope.set({'client': client, 'run_id': run_id, 'executed': False})
    try:
        yield
    finally:
        _scope.reset(token)


def _program(spec, directory, run_id):
    """所有可执行语句来自固定模板，用户输入只作为已校验的 JSON 数值。"""
    return f'''import FreeCAD as App
import Part, Mesh, json, math
from pathlib import Path
spec = json.loads({json.dumps(spec, allow_nan=False)!r})
out = Path({str(directory)!r})
# 底层 XML-RPC 可能隐式重发；执行端原子认领，禁止再次构造或覆盖同一任务。
try:
    with (out / ".execution-claimed").open("x", encoding="utf-8") as claim:
        claim.write({run_id!r})
except FileExistsError:
    raise RuntimeError("INDUSTRY_CAD_EXECUTION_ALREADY_CLAIMED")
doc = App.newDocument("CAD_{run_id[3:19]}")
try:
    def build(operations):
      shape = None
      for op in operations:
        if op["type"] in ("fillet", "chamfer"):
            if op["edges"] == "all":
                edges = shape.Edges
            else:
                if any(i > len(shape.Edges) for i in op["edges"]):
                    raise ValueError("所选边编号不存在，不能替换为其他边")
                edges = [shape.Edges[i-1] for i in op["edges"]]
            before = shape.Volume
            shape = shape.makeFillet(op["radius"], edges) if op["type"] == "fillet" else shape.makeChamfer(op["distance"], edges)
            if shape.isNull() or not shape.isValid() or len(shape.Solids) != 1 or shape.Volume <= 0 or shape.Volume >= before:
                raise ValueError("圆角/倒角未形成有效修改，不能忽略特征")
            continue
        pos = App.Vector(*op["position"])
        if op["type"] == "cylinder":
            axis = {{"x": (1,0,0), "y": (0,1,0), "z": (0,0,1)}}[op["axis"]]
            part = Part.makeCylinder(op["diameter"] / 2, op["length"], pos, App.Vector(*axis))
        elif op["type"] == "box":
            part = Part.makeBox(op["length"], op["width"], op["height"], pos)
        elif op["type"] == "sphere":
            part = Part.makeSphere(op["diameter"] / 2, pos)
        elif op["type"] == "cone":
            axis = {{"x": (1,0,0), "y": (0,1,0), "z": (0,0,1)}}[op["axis"]]
            part = Part.makeCone(op["bottom_diameter"] / 2, op["top_diameter"] / 2, op["height"], pos, App.Vector(*axis))
        elif op["type"] == "gear":
            # 使用 FreeCAD 内置渐开线齿形，而不是用三角齿代替齿轮。
            from fcgear import involute, fcgear
            builder = fcgear.FCWireBuilder()
            # 无变位外直齿轮：采用内置标准齿顶/齿根系数，见技能中的范围说明。
            involute.CreateExternalGear(builder, op["module"], op["teeth"], op["pressure_angle"],
                split=True, addCoeff=1.0, dedCoeff=1.25, filletCoeff=0.38, shiftCoeff=0.0)
            wire = Part.Wire([edge.toShape() for edge in builder.wire])
            part = Part.Face(wire).extrude(App.Vector(0,0,op["width"]))
            if op["bore_diameter"]:
                part = part.cut(Part.makeCylinder(op["bore_diameter"]/2, op["width"]))
            part.rotate(App.Vector(0,0,0), App.Vector(0,1,0) if op["axis"] == "x" else App.Vector(1,0,0), 90 if op["axis"] == "x" else (-90 if op["axis"] == "y" else 0))
            part.translate(pos)
        elif op["type"] == "thread":
            # 明确的三角牙型螺旋扫掠；不宣称为 ISO 标准螺纹或已通过配合验收。
            r = op["major_diameter"]/2
            root = r-op["depth"]
            half = op["depth"]*math.tan(math.radians(op["flank_angle"]/2))
            epsilon = min(1e-5, op["depth"]*1e-4)
            profile = Part.makePolygon([App.Vector(root,0,0), App.Vector(r+epsilon,0,half), App.Vector(r+epsilon,0,-half), App.Vector(root,0,0)])
            helix = Part.makeHelix(op["pitch"], op["length"], root, 0, op["hand"] == "left")
            groove = Part.Wire(helix.Edges).makePipeShell([Part.Wire(profile.Edges)], True, True)
            part = Part.makeCylinder(r, op["length"]).cut(groove).removeSplitter()
            if not math.pi*root*root*op["length"] < part.Volume < math.pi*r*r*op["length"]:
                raise ValueError("外螺纹几何未保留完整芯部或螺旋槽未生效")
            part.rotate(App.Vector(0,0,0), App.Vector(0,1,0) if op["axis"] == "x" else App.Vector(1,0,0), 90 if op["axis"] == "x" else (-90 if op["axis"] == "y" else 0))
            part.translate(pos)
        elif op["type"] == "loft":
            wires = [Part.Wire([Part.makeCircle(s["diameter"]/2, App.Vector(s["center"][0],s["center"][1],s["z"]))]) for s in op["sections"]]
            part = Part.makeLoft(wires, True, False)
            part.translate(pos)
        elif op["type"] == "tetrahedron":
            a = op["edge_length"]
            ox, oy, oz = op["position"]
            vertices = [App.Vector(ox+x, oy+y, oz+z) for x,y,z in [
                (0,0,0), (a,0,0), (a/2, math.sqrt(3)*a/2,0),
                (a/2, math.sqrt(3)*a/6,math.sqrt(2/3)*a)]]
            faces = [Part.Face(Part.makePolygon([vertices[i] for i in indices + (indices[0],)]))
                for indices in [(0,2,1), (0,1,3), (1,2,3), (2,0,3)]]
            part = Part.makeSolid(Part.makeShell(faces))
            if len(part.Faces) != 4 or len(part.Edges) != 6 or any(abs(e.Length-a) > max(1e-6,a*1e-7) for e in part.Edges):
                raise ValueError("正四面体必须具有四个面和六条等长边")
            if any(abs(f.Area-math.sqrt(3)*a*a/4) > max(1e-6,a*a*1e-7) for f in part.Faces):
                raise ValueError("正四面体的四个面必须是等边三角形")
            if abs(part.Volume-a**3/(6*math.sqrt(2))) > max(1e-6,a**3*1e-7):
                raise ValueError("正四面体体积校验失败")
        if shape is None:
            shape = part
        elif op["mode"] == "cut":
            before = shape.Volume
            shape = shape.cut(part).removeSplitter()
            if shape.Volume >= before - 1e-9:
                raise ValueError("切除特征未接触实体，请核对位置与轴向")
        else:
            shape = shape.fuse(part).removeSplitter()
        if shape.isNull() or not shape.isValid() or len(shape.Solids) != 1 or shape.Volume <= 0:
            raise ValueError("操作未形成一个有效实体，请核对尺寸和位置")
      return shape
    groups = spec.get("parts") or [{{"name": "Model", "operations": spec["operations"]}}]
    shapes = [build(group["operations"]) for group in groups]
    # 静态装配保留各零件归属和实体，不把多个独立零件伪装为单一零件。
    if "parts" in spec:
        for i, first in enumerate(shapes):
            for second in shapes[i+1:]:
                if first.common(second).Volume > max(1e-7, min(first.Volume, second.Volume)*1e-9):
                    raise ValueError("静态装配存在实体干涉，请修改明确位置；不会自动移动零件")
    objects = []
    for i, (group, geometry) in enumerate(zip(groups, shapes)):
        obj = doc.addObject("PartDesign::Feature", "Model" if len(groups)==1 else "Component%d" % (i+1))
        obj.Label = group["name"]
        obj.Shape = geometry
        objects.append(obj)
    shape = shapes[0] if len(shapes)==1 else Part.makeCompound(shapes)
    expected_solids = len(shapes)
    doc.recompute()
    Part.export(objects, str(out / "model.step"))
    restored = Part.read(str(out / "model.step"))
    if not restored.isValid() or len(restored.Solids) != expected_solids or abs(restored.Volume - shape.Volume) > max(1e-6, shape.Volume * 1e-7):
        raise ValueError("STEP 回读实体校验失败")
    exact = shape.optimalBoundingBox(False, False)
    roundtrip_exact = restored.optimalBoundingBox(False, False)
    bounds = [exact.XLength, exact.YLength, exact.ZLength]
    check_bounds = [roundtrip_exact.XLength, roundtrip_exact.YLength, roundtrip_exact.ZLength]
    if any(abs(a-b) > max(1e-6, abs(a)*1e-7) for a,b in zip(bounds, check_bounds)):
        raise ValueError("STEP 回读尺寸校验失败")
    Mesh.export(objects, str(out / "model.stl"))
    doc.saveAs(str(out / "model.FCStd"))
    evidence = {{"run_id": {run_id!r}, "valid": True, "solid_count": expected_solids, "volume_mm3": shape.Volume,
        "bounds_mm": bounds, "step_roundtrip": True, "units": "mm", "spec": spec}}
    if "parts" in spec:
        evidence.update(model_kind="assembly", component_count=len(groups), interference_checked=True,
            components=[{{"name": group["name"], "solid_count": 1, "volume_mm3": geometry.Volume}} for group,geometry in zip(groups, shapes)])
    if "operations" in spec and len(spec["operations"]) == 1 and spec["operations"][0]["type"] == "tetrahedron":
        evidence.update(face_count=len(shape.Faces), edge_count=len(shape.Edges),
            edge_lengths_mm=[e.Length for e in shape.Edges], face_areas_mm2=[f.Area for f in shape.Faces])
    (out / "manifest.json").write_text(json.dumps(evidence, ensure_ascii=False), encoding="utf-8")
    print("INDUSTRY_CAD_RESULT:" + json.dumps(evidence, ensure_ascii=False))
finally:
    App.closeDocument(doc.Name)
'''


def freecad_mcp(spec):
    normalized = validate_spec(spec)
    context = _scope.get()
    if context is None:
        raise FreeCADModelError('FreeCAD 工具缺少服务端任务上下文。')
    if context['executed']:
        raise FreeCADModelError('同一建模命令不能重复执行。')
    if not _execution_lock.acquire(blocking=False):
        raise FreeCADModelError('FreeCAD 正在处理其他实体，请稍后新建任务。')
    try:
        context['executed'] = True
        run_id = context['run_id']
        manifest = artifact_path(run_id, 'manifest.json')
        try:
            manifest.parent.mkdir(parents=True, exist_ok=False)
        except FileExistsError:
            raise FreeCADModelError('此命令已有执行目录，禁止重复执行；请查询原任务。') from None
        arguments = {'code': _program(normalized, manifest.parent, run_id), 'include_screenshot': False, 'timeout': 90.0}
        try:
            result = context['client'].call_tool('execute_code', arguments, timeout=100)
        except Exception as error:
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'error': 'MCP 执行未返回明确结果。'}]
            raise
        texts = '\n'.join(v.get('text', '') for v in result.get('content', []) if isinstance(v, dict) and v.get('type') == 'text') if isinstance(result, dict) else ''
        claimed = 'INDUSTRY_CAD_EXECUTION_ALREADY_CLAIMED' in texts
        if 'gui dispatch timed out' in texts.lower() or 'still running' in texts.lower() or (claimed and not manifest.is_file()):
            from app.clients.freecad import FreeCADConnectionError
            error = FreeCADConnectionError('outcome_unknown',
                'FreeCAD GUI 执行超时，任务可能仍在运行；请核对原任务，不会自动重放。', 504)
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]
            raise error
        # 重发被执行标记拒绝后只能读取原任务的完整证据，不重新执行。
        if not isinstance(result, dict) or ((result.get('isError') or 'Failed to execute code' in texts) and not claimed) or not manifest.is_file():
            error = FreeCADModelError('FreeCAD 未生成经过校验的实体。请检查建模参数和本地 RPC 服务。')
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]
            raise error
        try:
            evidence = json.loads(manifest.read_text(encoding='utf-8'))

            def positive_number(value):
                return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > 0

            # 业务校验不能依赖 assert，Python 优化模式下也必须执行。
            if evidence['run_id'] != run_id or evidence['spec'] != normalized or evidence['units'] != 'mm':
                raise ValueError('实体证据归属或单位不匹配')
            expected_solids = len(normalized['parts']) if 'parts' in normalized else 1
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
            for name in _FILES:
                path = artifact_path(run_id, name)
                if not path.is_file() or not 0 < path.stat().st_size <= 100 * 1024 * 1024:
                    raise ValueError('导出文件无效')
        except (ValueError, KeyError, TypeError, OSError):
            error = FreeCADModelError('FreeCAD 未生成完整、有效且属于本任务的实体文件。')
            error.calls = [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]
            raise error from None
        return {'status': 'completed', 'answer': 'FreeCAD 实体及 STEP 回读校验通过，可旋转预览并下载设计文件。',
            'validation': {k: v for k, v in evidence.items() if k not in {'spec', 'run_id'}},
            'artifacts': [{'name': name, 'format': extension, 'url': f'/api/cad/freecad/runs/{run_id}/artifacts/{name}'} for name, extension in _FILES.items()],
            'calls': [{'tool': 'execute_code', 'arguments': arguments, 'result': result}]}
    finally:
        _execution_lock.release()
