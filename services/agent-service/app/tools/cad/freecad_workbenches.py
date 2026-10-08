"""原生装配与 BIM 的白名单参数及可信 FreeCAD 内核。"""
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


KERNEL_SOURCE = r'''
import FreeCAD as App
import Part
import json, math
from pathlib import Path


def _wb_require_solid(obj):
    shape = obj.Shape
    if shape.isNull() or not shape.isValid() or not shape.Solids or shape.Volume <= 0:
        raise ValueError("工作台未生成有效实体: " + obj.Label)


def _wb_simulation_api():
    # 无GUI验证进程仍加载同一原生模块；仅补充其条件导入遗漏的QtCore。
    import importlib.util, sys
    if "CommandCreateSimulation" not in sys.modules:
        spec = importlib.util.find_spec("CommandCreateSimulation")
        if spec is None:
            raise ValueError("当前FreeCAD缺少原生装配运动模块")
        module = importlib.util.module_from_spec(spec)
        if not App.GuiUp:
            from PySide import QtCore
            module.QtCore = QtCore
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
    return sys.modules["CommandCreateSimulation"]


def _wb_world_objects(doc, objects):
    # 导出快照位于文档根，Shape包含装配求解后的全局Placement。
    snapshots = []
    for obj in objects:
        shape = obj.Shape.copy()
        shape.Placement = obj.getGlobalPlacement().multiply(obj.Placement.inverse()).multiply(shape.Placement)
        snapshot = doc.addObject("PartDesign::Feature", "SolvedComponent")
        snapshot.Label = obj.IndustryPartName + "（导出快照）"
        snapshot.addProperty("App::PropertyString", "IndustryPartName", "IndustryCAD")
        snapshot.IndustryPartName = obj.IndustryPartName
        snapshot.setEditorMode("IndustryPartName", 1)
        snapshot.addProperty("App::PropertyLinkGlobal", "IndustrySourceObject", "IndustryCAD")
        snapshot.IndustrySourceObject = obj
        snapshot.setEditorMode("IndustrySourceObject", 1)
        snapshot.Shape = shape
        _wb_require_solid(snapshot)
        if obj.ViewObject:
            obj.ViewObject.Visibility = False
        snapshots.append(snapshot)
    doc.recompute()
    return snapshots


def finalize_workbenches(doc, objects, spec):
    # STEP/STL与TechDraw仍引用首帧快照；可编辑FCStd显示真正受关节驱动的组件。
    if "assembly" not in spec:
        return
    for snapshot in objects:
        source = getattr(snapshot, "IndustrySourceObject", None)
        if source is None or source.Document != doc or snapshot.Document != doc:
            raise ValueError("装配导出快照缺少本任务的原生组件引用")
        if snapshot.ViewObject:
            snapshot.ViewObject.Visibility = False
        if source.ViewObject:
            source.ViewObject.Visibility = True


def constrain_assembly(doc, objects, config, out):
    import Assembly, JointObject, UtilsAssembly
    for obj in objects:
        if "IndustryPartName" not in obj.PropertiesList:
            obj.addProperty("App::PropertyString", "IndustryPartName", "IndustryCAD")
            obj.IndustryPartName = obj.Label
        obj.setEditorMode("IndustryPartName", 1)
    assembly = doc.addObject("Assembly::AssemblyObject", "Assembly")
    assembly.Type = "Assembly"
    components = {obj.IndustryPartName: obj for obj in objects}
    if len(components) != len(objects):
        raise ValueError("装配零件名称不唯一")
    for obj in objects:
        _wb_require_solid(obj)
        assembly.addObject(obj)
    group = UtilsAssembly.getJointGroup(assembly)
    ground = group.newObject("App::FeaturePython", "GroundedJoint")
    grounded = components[config["grounded"]]
    fixed_placement = App.Placement(grounded.Placement)
    JointObject.GroundedJoint(ground, grounded)
    if App.GuiUp:
        JointObject.ViewProviderGroundedJoint(ground.ViewObject)
    native_joints = {}
    for item in config["joints"]:
        joint = group.newObject("App::FeaturePython", "Joint")
        JointObject.Joint(joint, {"fixed": 0, "revolute": 1, "slider": 3}[item["type"]])
        if App.GuiUp:
            JointObject.ViewProviderJoint(joint.ViewObject)
        joint.Label = item["name"]
        for number in (1, 2):
            connector = item["connector" + str(number)]
            offset = App.Placement(App.Vector(*connector["position"]),
                App.Rotation(App.Vector(0, 0, 1), App.Vector(*connector["axis"])))
            setattr(joint, "Offset" + str(number), offset)
        joint.Proxy.setJointConnectors(joint, [[components[item["part1"]], ["", ""]],
                                             [components[item["part2"]], ["", ""]]])
        native_joints[item["name"]] = joint
    doc.recompute()
    status = assembly.solve()
    if status != 0:
        raise ValueError("原生装配求解失败，状态码: " + str(status))
    if not grounded.Placement.isSame(fixed_placement, 1e-7):
        raise ValueError("求解改变了固定基体位置")
    motion_frames = 0
    if "motion" in config:
        motion = config["motion"]
        api = _wb_simulation_api()
        simulation = UtilsAssembly.getSimulationGroup(assembly).newObject("App::FeaturePython", "Simulation")
        api.Simulation(simulation)
        if App.GuiUp:
            api.ViewProviderSimulation(simulation.ViewObject)
        simulation.aTimeStart = 0
        simulation.bTimeEnd = motion["duration"]
        simulation.cTimeStepOutput = motion["duration"] / (motion["frames"] - 1)
        target = native_joints[motion["joint"]]
        angular = target.JointType == "Revolute"
        start = math.radians(motion["start"]) if angular else motion["start"]
        end = math.radians(motion["end"]) if angular else motion["end"]
        formula = "(%r)+(%r)*time" % (start, (end - start) / motion["duration"])
        driver = assembly.newObject("App::FeaturePython", "Motion")
        api.Motion(driver, "Angular" if angular else "Linear", target, formula)
        if App.GuiUp:
            api.ViewProviderMotion(driver.ViewObject)
        simulation.Group = [driver]
        doc.recompute()
        status = assembly.generateSimulation(simulation)
        if status != 0:
            raise ValueError("原生装配运动求解失败，状态码: " + str(status))
        if assembly.numberOfFrames() != motion["frames"] + 1:
            raise ValueError("原生运动帧数与请求不符，拒绝生成推测动画")
        meshes, total_triangles = [], 0
        for obj in objects:
            local = obj.Shape.copy()
            local.Placement = obj.Placement.inverse().multiply(local.Placement)
            vertices, facets = local.tessellate(.25)
            total_triangles += len(facets)
            if not facets or total_triangles > 60000:
                raise ValueError("运动网格超过60000三角形资源上限或为空")
            triangles = [float(component) for face in facets for index in face for component in vertices[index]]
            if any(not math.isfinite(v) or abs(v) > 100000 for v in triangles):
                raise ValueError("运动网格坐标无效")
            meshes.append({"name": obj.IndustryPartName, "triangles": triangles})
        frames = []
        for index in range(1, assembly.numberOfFrames()):
            assembly.updateForFrame(index)
            if not grounded.Placement.isSame(fixed_placement, 1e-7):
                raise ValueError("运动帧改变了固定基体位置")
            placements = []
            for obj in objects:
                plc = obj.getGlobalPlacement()
                position, quaternion = list(plc.Base), list(plc.Rotation.Q)
                if any(not math.isfinite(v) or abs(v) > 100000 for v in position + quaternion):
                    raise ValueError("原生运动产生无效Placement")
                placements.append({"name": obj.IndustryPartName, "position": position, "quaternion": quaternion})
            frames.append({"time": (index - 1) * motion["duration"] / (motion["frames"] - 1),
                           "placements": placements})
        if frames[0]["placements"] == frames[-1]["placements"]:
            raise ValueError("运动驱动未改变任何零件Placement")
        payload = json.dumps({"components": meshes, "frames": frames}, ensure_ascii=False, allow_nan=False)
        if len(payload.encode("utf-8")) > 32 * 1024 * 1024:
            raise ValueError("运动文件超过32MiB资源上限")
        (Path(out) / "motion.json").write_text(payload, encoding="utf-8")
        motion_frames = len(frames)
        # 主模型和STEP始终对应首个真实运动帧。
        assembly.updateForFrame(1)
    proof = {"model_kind": "assembly", "assembly": {"verified": True, "solver_status": status,
        "grounded": config["grounded"], "joint_count": len(native_joints), "motion_frames": motion_frames,
        "motion_interference_checked": False,
        "joints": [{key: item[key] for key in ("name", "type", "part1", "part2")} for item in config["joints"]]}}
    return _wb_world_objects(doc, objects), proof


def build_bim(doc, config):
    import Arch, Draft
    objects, walls = [], {}
    for item in config["walls"]:
        baseline = Draft.make_wire([App.Vector(*item["start"]), App.Vector(*item["end"])], closed=False)
        wall = Arch.makeWall(baseobj=baseline, width=item["thickness"], height=item["height"], align="Center")
        wall.Offset = 0
        wall.Label = item["name"]
        walls[item["name"]] = (wall, item)
        objects.append(wall)
    for item in config["slabs"]:
        x, y, z = item["position"]
        length, width = item["length"], item["width"]
        base = Draft.make_wire([App.Vector(x, y, z), App.Vector(x + length, y, z),
            App.Vector(x + length, y + width, z), App.Vector(x, y + width, z)], closed=True, face=True)
        slab = Arch.makeStructure(base, height=item["thickness"], name=item["name"])
        slab.IfcType = "Slab"
        slab.Normal = App.Vector(0, 0, -1)
        objects.append(slab)
    doc.recompute()
    volume_before = sum(wall.Shape.Volume for wall, _ in walls.values())
    expected_removed = 0
    for item in config["openings"]:
        wall, wall_config = walls[item["wall"]]
        start, end = App.Vector(*wall_config["start"]), App.Vector(*wall_config["end"])
        direction = end - start
        direction.normalize()
        normal = App.Vector(-direction.y, direction.x, 0)
        position = start + direction * item["offset"] + normal * (wall_config["thickness"] / 2)
        position.z += item["sill"]
        rotation = App.Rotation(App.Vector(0, 0, 1), math.degrees(math.atan2(direction.y, direction.x))).multiply(
            App.Rotation(App.Vector(1, 0, 0), 90))
        profile = Draft.make_wire([App.Vector(0, 0, 0), App.Vector(item["width"], 0, 0),
            App.Vector(item["width"], item["height"], 0), App.Vector(0, item["height"], 0)], closed=True)
        profile.Placement = App.Placement(position, rotation)
        opening = Arch.makeWindow(baseobj=profile, width=item["width"], height=item["height"], parts=[], name=item["name"])
        opening.IfcType = "Opening Element"
        opening.Hosts = [wall]
        opening.HoleDepth = wall_config["thickness"] + 2
        expected_removed += item["width"] * item["height"] * wall_config["thickness"]
        doc.recompute()
    doc.recompute()
    for obj in objects:
        _wb_require_solid(obj)
    removed = volume_before - sum(wall.Shape.Volume for wall, _ in walls.values())
    if abs(removed - expected_removed) > max(1e-5, expected_removed * 1e-7):
        raise ValueError("BIM宿主墙的真实开口体积不符合指定尺寸")
    return objects, {"model_kind": "bim", "bim": {"verified": True, "walls": len(config["walls"]),
        "slabs": len(config["slabs"]), "openings": len(config["openings"]), "opening_volume_removed": removed}}
'''
