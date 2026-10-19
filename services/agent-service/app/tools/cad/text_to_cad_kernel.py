"""Trusted build123d geometry used by interactive and durable model programs."""
import json
import math
from pathlib import Path
from cadgen import build123d as bd
from .text_to_cad_features import build_sheet_metal, make_drawing
from .text_to_cad_assembly import build_bim, constrain_assembly


def _solid(shape, description='模型'):
    if shape is None or not shape.is_valid or len(shape.solids()) != 1 or not math.isfinite(shape.volume) or shape.volume <= 0:
        raise ValueError(description + '必须形成一个有效、正体积实体')
    return shape.solids()[0]


def _volume(shape):
    if shape is None:
        return 0.0
    if isinstance(shape, (list, tuple, bd.ShapeList)):
        return sum(_volume(item) for item in shape)
    return shape.volume


def _orient(shape, op):
    if op.get('axis') == 'x':
        shape = shape.rotate(bd.Axis.Y, 90)
    elif op.get('axis') == 'y':
        shape = shape.rotate(bd.Axis.X, -90)
    return shape.translate(tuple(op['position']))


def _gear(op):
    """Involute flanks interpolated with splines; exact circular tips/root lands."""
    teeth, module = op['teeth'], op['module']
    pitch = module * teeth / 2
    base = pitch * math.cos(math.radians(op['pressure_angle']))
    root, tip = pitch - 1.25 * module, pitch + module
    start = max(root, base)
    involute = lambda radius: math.sqrt(max(0, (radius/base)**2-1)) - math.acos(min(1, base/radius))
    half = math.pi / (2*teeth) + involute(pitch)
    polar = lambda radius, angle: bd.Vector(radius*math.cos(angle), radius*math.sin(angle), 0)
    edges = []
    for tooth in range(teeth):
        center = tooth * 2 * math.pi / teeth
        radii = [start + (tip-start)*index/24 for index in range(25)]
        left = [polar(radius, center-half+involute(radius)) for radius in radii]
        right = [polar(radius, center+half-involute(radius)) for radius in reversed(radii)]
        left_root = polar(root, center-half+involute(start))
        right_root = polar(root, center+half-involute(start))
        if root < base:
            edges.append(bd.Edge.make_line(left_root, left[0]))
        edges.append(bd.Edge.make_spline(left))
        edges.append(bd.Edge.make_three_point_arc(left[-1], polar(tip, center), right[0]))
        edges.append(bd.Edge.make_spline(right))
        if root < base:
            edges.append(bd.Edge.make_line(right[-1], right_root))
        next_left = polar(root, center + 2*math.pi/teeth - half + involute(start))
        mid = center + math.pi/teeth
        edges.append(bd.Edge.make_three_point_arc(right_root, polar(root, mid), next_left))
    wire = bd.Wire(edges)
    profile = bd.Face(wire)
    root_vertices = [vertex for vertex in profile.vertices()
                     if math.isclose(math.hypot(vertex.X, vertex.Y), root, rel_tol=1e-9, abs_tol=1e-7)]
    if len(root_vertices) != 2 * teeth:
        raise ValueError('渐开线齿轮齿根拓扑不完整')
    profile = profile.fillet_2d(.38 * module, root_vertices)
    if not profile.is_valid:
        raise ValueError('渐开线齿轮齿根圆角失败')
    shape = bd.Solid.extrude(profile, (0, 0, op['width']))
    if op['bore_diameter']:
        shape = shape.cut(bd.Solid.make_cylinder(op['bore_diameter']/2, op['width']))
    return _solid(shape, '渐开线齿轮')


def _thread(op):
    radius, length, pitch = op['major_diameter']/2, op['length'], op['pitch']
    root = radius-op['depth']
    half = op['depth']*math.tan(math.radians(op['flank_angle']/2))
    epsilon = min(1e-5, op['depth']*1e-4)
    profile = bd.Wire.make_polygon([(root,0,0), (radius+epsilon,0,half), (radius+epsilon,0,-half)], close=True)
    path = bd.Edge.make_helix(pitch, pitch, root, lefthand=op['hand']=='left')
    groove = bd.Solid.sweep(profile, path, make_solid=True, is_frenet=True)
    shape = bd.Solid.make_cylinder(radius, length)
    for turn in range(-1, int(math.ceil(length/pitch))+1):
        shape = _solid(shape.cut(groove.translate((0,0,turn*pitch))), '外螺纹')
    if not math.pi*root**2*length < shape.volume < math.pi*radius**2*length:
        raise ValueError('外螺纹未保留芯部或螺旋槽未生效')
    if any(not math.isclose(actual, expected, rel_tol=1e-6, abs_tol=1e-6)
           for actual, expected in zip(shape.bounding_box(optimal=True).size, (2*radius,2*radius,length))):
        raise ValueError('外螺纹大径或长度不符合要求')
    return shape


def build_operations(operations):
    shape = None
    for op in operations:
        kind = op['type']
        if kind in ('fillet', 'chamfer'):
            edges = list(shape.edges())
            if op['edges'] != 'all':
                if any(index > len(edges) for index in op['edges']):
                    raise ValueError('所选边编号不存在')
                edges = [edges[index-1] for index in op['edges']]
            previous = shape
            shape = (shape.fillet(op['radius'], edges) if kind == 'fillet'
                     else shape.chamfer(op['distance'], None, edges))
            shape = _solid(shape, '圆角/倒角')
            if _volume(previous.cut(shape)) + _volume(shape.cut(previous)) <= max(1e-9, previous.volume*1e-12):
                raise ValueError('圆角/倒角未实际改变实体')
            continue
        if kind == 'box':
            part = bd.Solid.make_box(op['length'], op['width'], op['height'])
        elif kind == 'cylinder':
            part = bd.Solid.make_cylinder(op['diameter']/2, op['length'])
        elif kind == 'sphere':
            part = bd.Solid.make_sphere(op['diameter']/2)
        elif kind == 'cone':
            part = bd.Solid.make_cone(op['bottom_diameter']/2, op['top_diameter']/2, op['height'])
        elif kind == 'gear':
            part = _gear(op)
        elif kind == 'thread':
            part = _thread(op)
        elif kind == 'loft':
            wires = [bd.Wire.make_circle(section['diameter']/2, bd.Plane(origin=(*section['center'],section['z'])))
                     for section in op['sections']]
            part = bd.Solid.make_loft(wires, ruled=False)
        elif kind == 'tetrahedron':
            a = op['edge_length']
            vertices = [(0,0,0), (a,0,0), (a/2,math.sqrt(3)*a/2,0), (a/2,math.sqrt(3)*a/6,math.sqrt(2/3)*a)]
            faces = [bd.Face(bd.Wire.make_polygon([vertices[i] for i in indices], close=True))
                     for indices in [(0,2,1), (0,1,3), (1,2,3), (2,0,3)]]
            part = bd.Solid(bd.Shell(faces))
            if not math.isclose(part.volume, a**3/(6*math.sqrt(2)), rel_tol=1e-7):
                raise ValueError('正四面体体积校验失败')
        else:
            raise ValueError('不支持的几何操作')
        part = _orient(part, op)
        if shape is None:
            shape = part
        else:
            previous = shape
            shape = shape.fuse(part) if op['mode'] == 'add' else shape.cut(part)
            shape = _solid(shape)
            if op['mode'] == 'cut' and previous.volume-shape.volume <= max(1e-9,previous.volume*1e-12):
                raise ValueError('切除未实际改变实体')
        shape = _solid(shape)
    return shape


def build_spec(spec, out):
    extra = {}
    if 'bim' in spec:
        shapes, extra = build_bim(spec['bim'])
    elif 'sheet_metal' in spec:
        shapes, extra = build_sheet_metal(spec['sheet_metal'], out)
    elif 'parts' in spec:
        shapes = [build_operations(part['operations']) for part in spec['parts']]
        for index, shape in enumerate(shapes):
            shape.label = 'Component' + str(index+1)
        if 'assembly' in spec:
            shapes, extra = constrain_assembly(shapes, [part['name'] for part in spec['parts']], spec['assembly'], out)
        for index, shape in enumerate(shapes):
            for other in shapes[index+1:]:
                if _volume(shape.intersect(other)) > max(1e-7,min(shape.volume,other.volume)*1e-9):
                    raise ValueError('装配存在实体干涉，请修改明确位置')
    else:
        shape = build_operations(spec['operations'])
        shape.label = 'Model'
        shapes = [shape]
    for shape in shapes:
        _solid(shape)
    if 'drawing' in spec:
        extra.update(make_drawing(shapes, spec['drawing'], out))
    return shapes, extra


def geometry_evidence(shapes, spec, extra):
    shape = shapes[0] if len(shapes)==1 else bd.Compound(children=shapes)
    evidence = {'valid': True, 'solid_count': len(shape.solids()), 'volume_mm3': shape.volume,
                'bounds_mm': list(shape.bounding_box(optimal=True).size), 'units': 'mm',
                'product_names': [item.label for item in shapes], **extra}
    if 'parts' in spec or 'bim' in spec:
        names = [part['name'] for part in spec['parts']] if 'parts' in spec else [item.label for item in shapes]
        evidence.update(model_kind='assembly' if 'parts' in spec else 'bim', component_count=len(shapes),
                        interference_checked='parts' in spec,
                        components=[{'name': name, 'solid_count': len(item.solids()), 'volume_mm3': item.volume}
                                    for name,item in zip(names,shapes)])
    if spec.get('operations') and len(spec['operations'])==1 and spec['operations'][0]['type']=='tetrahedron':
        evidence.update(face_count=len(shape.faces()), edge_count=len(shape.edges()),
                        edge_lengths_mm=[edge.length for edge in shape.edges()],
                        face_areas_mm2=[face.area for face in shape.faces()])
    return evidence


# HOST_ONLY_SOURCE_COMPILER
from .text_to_cad_source import model_program
