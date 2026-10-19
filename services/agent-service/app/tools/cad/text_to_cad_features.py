"""Headless sheet-metal construction and measured vector engineering drawings.

This source is embedded in downloadable model.py files. Keep imports independent
of the application so those files can be rebuilt with the pinned CAD runtime.
"""
import math
from pathlib import Path
from importlib.metadata import version
import xml.etree.ElementTree as ET

def _feature_near(actual, expected):
    return math.isfinite(actual) and math.isclose(actual, expected, rel_tol=1e-6, abs_tol=1e-6)


def _feature_solid(shape, label):
    if not shape.is_valid or len(shape.solids()) != 1 or not math.isfinite(shape.volume) or shape.volume <= 0:
        raise ValueError(label + '未形成有效单实体。')
    return shape


def _write_development(flat, bend_line, out):
    """Export the actual planar outline and its neutral-layer bend centreline."""
    bounds = flat.bounding_box()
    upper = max(flat.faces(), key=lambda face: face.center().Z)
    segments = [(edge.position_at(0), edge.position_at(1), 'OUTLINE') for edge in upper.outer_wire().edges()]
    segments.append((bend_line.position_at(0), bend_line.position_at(1), 'BEND'))
    width, length = bounds.size.X, bounds.size.Y
    namespace = 'http://www.w3.org/2000/svg'
    ET.register_namespace('', namespace)
    svg = ET.Element('{%s}svg' % namespace, width=f'{width:.9g}mm', height=f'{length:.9g}mm',
                     viewBox=f'0 0 {width:.9g} {length:.9g}')
    for start, end, layer in segments:
        attrs = dict(x1=f'{start.X:.9g}', y1=f'{length-start.Y:.9g}',
                     x2=f'{end.X:.9g}', y2=f'{length-end.Y:.9g}', stroke='#111827',
                     **{'stroke-width': '0.2', 'data-layer': layer})
        if layer == 'BEND':
            attrs['stroke-dasharray'] = '2 1'
        ET.SubElement(svg, '{%s}line' % namespace, attrs)
    ET.ElementTree(svg).write(out / 'unfold.svg', encoding='utf-8', xml_declaration=True)
    dxf = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1027', '9', '$INSUNITS', '70', '4',
           '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES']
    for start, end, layer in segments:
        dxf.extend(['0', 'LINE', '8', layer, '10', f'{start.X:.12g}', '20', f'{start.Y:.12g}', '30', '0',
                    '11', f'{end.X:.12g}', '21', f'{end.Y:.12g}', '31', '0'])
    dxf.extend(['0', 'ENDSEC', '0', 'EOF', ''])
    (out / 'unfold.dxf').write_text('\n'.join(dxf), encoding='ascii')


def build_sheet_metal(config, out):
    """Extrude the exact annular bend profile, then develop its ANSI neutral layer."""
    from cadgen import build123d as bd
    out = Path(out)
    width, base, flange, thickness, radius, angle, kfactor = (
        config[name] for name in ('width', 'base_length', 'flange_length', 'thickness',
                                 'bend_radius', 'bend_angle', 'k_factor'))
    theta = math.radians(angle)
    outer = radius + thickness
    centre_z = outer

    def arc_point(r, a):
        return (0, base + r * math.sin(a), centre_z - r * math.cos(a))

    def end_point(r):
        point = arc_point(r, theta)
        return (0, point[1] + flange * math.cos(theta), point[2] + flange * math.sin(theta))

    first, last = (0, 0, 0), (0, 0, thickness)
    edges = [bd.Edge.make_line(first, arc_point(outer, 0)),
             bd.Edge.make_three_point_arc(arc_point(outer, 0), arc_point(outer, theta/2), arc_point(outer, theta)),
             bd.Edge.make_line(arc_point(outer, theta), end_point(outer)),
             bd.Edge.make_line(end_point(outer), end_point(radius)),
             bd.Edge.make_line(end_point(radius), arc_point(radius, theta)),
             bd.Edge.make_three_point_arc(arc_point(radius, theta), arc_point(radius, theta/2), arc_point(radius, 0)),
             bd.Edge.make_line(arc_point(radius, 0), last), bd.Edge.make_line(last, first)]
    profile = bd.Face(bd.Wire(edges))
    bent = _feature_solid(bd.Solid.extrude(profile, (width, 0, 0)), '钣金折弯')
    bent.label = 'SheetMetalBend'
    cylinders = [face for face in bent.faces() if face.geom_type == bd.GeomType.CYLINDER]
    actual_radii = sorted(face.radius for face in cylinders)
    expected_bent = width * thickness * (base + flange + theta * (radius + thickness/2))
    if (len(cylinders) != 2 or any(not _feature_near(a, b) for a, b in zip(actual_radii, [radius, outer]))
            or not _feature_near(bent.volume, expected_bent)):
        raise ValueError('折弯实体的圆柱面、内外半径或体积不符合指定参数。')
    allowance = theta * (radius + kfactor * thickness)
    developed_length = base + flange + allowance
    flat = _feature_solid(bd.Solid.make_box(width, developed_length, thickness), '钣金展开')
    flat.label = 'AnsiNeutralLayerDevelopment'
    flat_bounds = flat.bounding_box()
    flat_face = max(flat.faces(), key=lambda face: face.center().Z)
    if not _feature_near(flat_face.area, width * developed_length) or not _feature_near(flat.volume, flat_face.area * thickness):
        raise ValueError('展开几何与 ANSI 中性层补偿不一致。')
    bend_line = bd.Edge.make_line((0, base + allowance/2, 0), (width, base + allowance/2, 0))
    _write_development(flat, bend_line, out)
    return [bent], {'sheet_metal': {
        'verified': True, 'provider': 'text-to-cad', 'plugin_version': version('cadgen'),
        'bend_count': 1, 'cylindrical_face_count': len(cylinders), 'k_factor': kfactor,
        'k_factor_standard': 'ansi', 'bend_angle_deg': angle, 'inner_bend_radius_mm': actual_radii[0],
        'thickness_mm': flat_bounds.size.Z, 'unfold_area_mm2': flat_face.area,
        'unfold_volume_mm3': flat.volume, 'unfold_width_mm': flat_bounds.size.X,
        'unfold_length_mm': flat_bounds.size.Y, 'unfold_bounds_mm': list(flat_bounds.size),
        'bent_volume_mm3': bent.volume, 'bend_line_length_mm': bend_line.length,
        'unfold_object': flat.label, 'files': ['unfold.svg', 'unfold.dxf'],
    }}


def _drawing_paths(edges, scale):
    paths = []
    count = 0
    for edge in edges:
        points = edge.positions(deflection=max(1e-6, 0.02 / scale))
        if len(points) < 2:
            continue
        path = [(point.X * scale, point.Y * scale) for point in points]
        if not all(math.isfinite(value) for point in path for value in point):
            raise ValueError('工程图投影产生非有限坐标。')
        count += len(path)
        if count > 200000:
            raise ValueError('工程图曲线超出单次矢量采样资源范围。')
        paths.append(path)
    return paths


def _drawing_view(shape, name, direction, up, scale, centre):
    from cadgen import build123d as bd
    direction_vector = bd.Vector(direction).normalized()
    visible, hidden = shape.project_to_viewport(centre + direction_vector * 100000,
                                               viewport_up=up, look_at=centre)
    if not visible:
        raise ValueError('工程投影没有实际可见边。')
    bounds = bd.Compound(visible).bounding_box()
    width, height = bounds.size.X * scale, bounds.size.Y * scale
    if not all(math.isfinite(v) and v > 1e-8 for v in (width, height)):
        raise ValueError('工程投影没有有效二维范围。')
    return {'name': name, 'type': 'build123d::HLRView', 'direction': list(direction_vector), 'scale': scale,
            'visible_edges': len(visible), 'hidden_edges': len(hidden), 'bounds_mm': [width, height],
            '_centre': [(bounds.min.X + bounds.max.X) * scale/2, (bounds.min.Y + bounds.max.Y) * scale/2],
            '_visible': _drawing_paths(visible, scale), '_hidden': _drawing_paths(hidden, scale)}


def _write_drawing_pdf(path, paths, labels):
    """Write the measured paths as a one-page A3 vector PDF, without a GUI."""
    unit = 72 / 25.4
    content = ['q', '0.12 0.16 0.23 RG', '1 J', '1 j']
    for points, hidden in paths:
        content.extend(['[3 2] 0 d' if hidden else '[] 0 d', '0.4 w' if hidden else '0.7 w'])
        content.append(f'{points[0][0]*unit:.6f} {points[0][1]*unit:.6f} m')
        content.extend(f'{x*unit:.6f} {y*unit:.6f} l' for x, y in points[1:])
        content.append('S')
    for label, x, y in labels:
        content.append(f'BT /F1 9 Tf {x*unit:.6f} {y*unit:.6f} Td ({label}) Tj ET')
    content.append('Q')
    stream = ('\n'.join(content) + '\n').encode('ascii')
    bodies = [b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
              (f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {420*unit:.6f} {297*unit:.6f}] '
               '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>').encode('ascii'),
              f'<< /Length {len(stream)} >>\nstream\n'.encode('ascii') + stream + b'endstream',
              b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
    data = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets = [0]
    for index, body in enumerate(bodies, 1):
        offsets.append(len(data))
        data.extend(f'{index} 0 obj\n'.encode('ascii') + body + b'\nendobj\n')
    start = len(data)
    data.extend(f'xref\n0 {len(offsets)}\n0000000000 65535 f \n'.encode('ascii'))
    for offset in offsets[1:]:
        data.extend(f'{offset:010} 00000 n \n'.encode('ascii'))
    data.extend(f'trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{start}\n%%EOF\n'.encode('ascii'))
    path.write_bytes(data)
    return len(data)


def _verify_drawing_exports(out):
    import re
    import xml.etree.ElementTree as ET
    import zlib
    svg = out / "drawing.svg"
    pdf = out / "drawing.pdf"
    try:
        root = ET.parse(svg).getroot()
    except (ET.ParseError, OSError) as exc:
        raise ValueError("工程图 SVG 导出缺失或不是完整 XML。") from exc
    if root.tag != "{http://www.w3.org/2000/svg}svg":
        raise ValueError("工程图导出不是有效 SVG。")

    def count_geometry(element):
        tag = element.tag.rsplit("}", 1)[-1]
        if tag in ("defs", "clipPath", "mask", "symbol"):
            return 0
        graphical = ((tag == "path" and bool(element.get("d", "").strip()))
                     or (tag in ("polyline", "polygon") and bool(element.get("points", "").strip()))
                     or (tag in ("circle", "ellipse", "line")))
        return int(graphical) + sum(count_geometry(child) for child in element)

    elements = count_geometry(root)
    if elements == 0:
        raise ValueError("工程图 SVG 没有实际投影图形，不能返回空白页面。")
    content = pdf.read_bytes()
    if not content.startswith(b"%PDF-") or b"%%EOF" not in content[-1024:]:
        raise ValueError("工程图 PDF 缺失、损坏或导出尚未完成。")
    # PDF 矢量图形位于页面 Contents 流内；兼容历史文件的 Flate 压缩。
    # 只检查页面引用的流，避免把字体或元数据流误认为图形。
    object_bodies = {match.group(1): match.group(2) for match in
                     re.finditer(rb"(\d+)\s+0\s+obj\b(.*?)endobj", content, re.S)}
    graphic_streams = 0
    for reference in re.findall(rb"/Contents\s+(\d+)\s+0\s+R", content):
        body = object_bodies.get(reference, b"")
        stream = re.search(rb"stream\r?\n", body)
        if stream is None:
            continue
        header = body[:stream.start()]
        length = re.search(rb"/Length\s+(\d+)(\s+0\s+R)?", header)
        if length is None:
            continue
        raw_length = object_bodies.get(length.group(1), b"").strip() if length.group(2) else length.group(1)
        if not raw_length.isdigit():
            raise ValueError("工程图 PDF 图形流长度无效。")
        size = int(raw_length)
        data = body[stream.end():stream.end() + size]
        if len(data) != size:
            raise ValueError("工程图 PDF 图形流尚未完整写入。")
        if b"/FlateDecode" in header:
            try:
                data = zlib.decompress(data)
            except zlib.error as exc:
                raise ValueError("工程图 PDF 图形数据损坏。") from exc
        if re.search(rb"\s(?:l|c|re)\s", data) and re.search(rb"\s(?:S|s|f|F|f\*|B|B\*|b|b\*)(?:\s|$)", data):
            graphic_streams += 1
    if graphic_streams == 0:
        raise ValueError("工程图 PDF 没有页面矢量图形，不能返回空白页面。")
    return {"svg_geometry_elements": elements, "pdf_bytes": len(content), "pdf_graphics_streams": graphic_streams}



def make_drawing(shapes, config, out):
    """Perform OpenCascade hidden-line projection and lay out the measured views."""
    from cadgen import build123d as bd
    if not shapes or any(not shape.is_valid or not shape.solids() for shape in shapes):
        raise ValueError('工程图必须引用本次任务中的有效实体。')
    shape, out = bd.Compound(shapes), Path(out)
    bounds, scale = shape.bounding_box(), config['scale']
    largest = max(bounds.size) * scale
    if not math.isfinite(largest) or largest > 390:
        raise ValueError('指定比例的视图超出 A3 图纸可用区域；请明确提供更小的 scale。')
    if largest <= 1e-8:
        raise ValueError('指定比例的投影视图过小。')
    centre = (bounds.min + bounds.max) * 0.5
    definitions = [('Front', (0, -1, 0), (0, 0, 1)), ('Top', (0, 0, 1), (0, 1, 0)),
                   ('Right', (1, 0, 0), (0, 0, 1)), ('Isometric', (1, -1, 1), (0, 0, 1))]
    views = {name: _drawing_view(shape, name, direction, up, scale, centre) for name, direction, up in definitions}
    if config.get('section'):
        section = config['section']
        normal = bd.Vector(section['normal']).normalized()
        horizontal = bd.Vector(0, 0, 1).cross(normal)
        if horizontal.length < 1e-9:
            horizontal = bd.Vector(1, 0, 0)
        plane = bd.Plane(origin=section['origin'], x_dir=horizontal, z_dir=normal)
        cut = bd.section(shape, section_by=plane)
        faces = cut.faces()
        cut_area = sum(face.area for face in faces)
        if not faces or cut_area <= 1e-9:
            raise ValueError('指定剖切平面未穿过实体材料。')
        section_view = _drawing_view(cut, 'Section', normal, plane.y_dir, scale, bd.Vector(section['origin']))
        section_view.update(cut_faces=len(faces), cut_area_mm2=cut_area, origin=section['origin'], normal=section['normal'])
        views['Section'] = section_view
    widths = {name: view['bounds_mm'][0] for name, view in views.items()}
    heights = {name: view['bounds_mm'][1] for name, view in views.items()}
    main_width, side_width = max(widths['Front'], widths['Top']), max(widths['Right'], widths['Isometric'])
    front_height, top_height = max(heights['Front'], heights['Right']), max(heights['Top'], heights['Isometric'])
    gap = 44.0 if 'Section' in views else 24.0
    total_width, total_height = main_width + side_width + gap, front_height + top_height + gap
    if 'Section' in views:
        total_width += gap + widths['Section']
        total_height = max(total_height, heights['Section'])
    if total_width > 390 or total_height > 257:
        raise ValueError('指定比例的视图超出 A3 图纸可用区域；请明确提供更小的 scale。')
    x0, y0 = (420-total_width)/2, (297-front_height-top_height-gap)/2
    third = config['projection'] == 'third_angle'
    main_x = x0 + main_width/2 if third else x0 + side_width + gap + main_width/2
    side_x = x0 + main_width + gap + side_width/2 if third else x0 + side_width/2
    front_y = y0 + front_height/2 if third else y0 + top_height + gap + front_height/2
    top_y = y0 + front_height + gap + top_height/2 if third else y0 + top_height/2
    positions = {'Front': (main_x, front_y), 'Top': (main_x, top_y), 'Right': (side_x, front_y), 'Isometric': (side_x, top_y)}
    if 'Section' in views:
        positions['Section'] = (x0 + main_width + side_width + 2*gap + widths['Section']/2, 148.5)
    paths, labels = [], []
    for name, view in views.items():
        position = positions[name]
        view['position_mm'] = list(position)
        dx, dy = position[0]-view['_centre'][0], position[1]-view['_centre'][1]
        for hidden, key in ((False, '_visible'), (True, '_hidden')):
            paths.extend(([(x+dx, y+dy) for x, y in points], hidden) for points in view[key])
        labels.append(('Section A-A' if name == 'Section' else name, position[0]-7, position[1]-heights[name]/2-6))
    namespace = 'http://www.w3.org/2000/svg'
    ET.register_namespace('', namespace)
    svg = ET.Element('{%s}svg' % namespace, width='420mm', height='297mm', viewBox='0 0 420 297')
    for points, hidden in paths:
        attrs = dict(points=' '.join(f'{x:.7f},{297-y:.7f}' for x, y in points), fill='none', stroke='#1f2937',
                     **{'stroke-width': '0.14' if hidden else '0.25'})
        if hidden:
            attrs['stroke-dasharray'] = '1.1 0.7'
        ET.SubElement(svg, '{%s}polyline' % namespace, attrs)
    for label, x, y in labels:
        ET.SubElement(svg, '{%s}text' % namespace, x=str(x), y=str(297-y),
                      **{'font-size': '3.2', 'font-family': 'sans-serif'}).text = label
    ET.ElementTree(svg).write(out / 'drawing.svg', encoding='utf-8', xml_declaration=True)
    _write_drawing_pdf(out / 'drawing.pdf', paths, labels)
    exports = _verify_drawing_exports(out)
    return {'drawing': {'verified': True, 'provider': 'text-to-cad', 'projection': config['projection'],
                        'scale': scale, 'paper': 'A3', 'section': bool(config.get('section')),
                        'views': [{key: value for key, value in view.items() if not key.startswith('_')} for view in views.values()],
                        **exports}}
