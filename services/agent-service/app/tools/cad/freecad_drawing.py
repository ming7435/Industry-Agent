"""TechDraw 工程图的严格参数与固定可信内核，不接受脚本或文件路径。"""
import math


def validate_drawing(value):
    """校验工程图选项；法向规范化不改变用户指定的剖切平面。"""
    if not isinstance(value, dict) or set(value) != {"projection", "scale", "section"}:
        raise ValueError("工程图需要完整 projection、scale、section，不能包含额外字段。")
    if not isinstance(value["projection"], str) or value["projection"] not in {"first_angle", "third_angle"}:
        raise ValueError("工程图投影仅支持 first_angle 或 third_angle。")

    def number(raw):
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            raise ValueError("工程图比例、原点和法向必须为有限数值。")
        try:
            result = float(raw)
        except (OverflowError, ValueError):
            raise ValueError("工程图参数超出有限数值范围。") from None
        if not math.isfinite(result):
            raise ValueError("工程图比例、原点和法向必须为有限数值。")
        return result

    scale = number(value["scale"])
    if scale <= 0:
        raise ValueError("工程图比例必须大于零。")
    section = value["section"]
    if section is not None:
        if not isinstance(section, dict) or set(section) != {"origin", "normal"}:
            raise ValueError("剖视图需要完整 origin 和 normal。")
        vectors = {}
        for name in ("origin", "normal"):
            raw = section[name]
            if not isinstance(raw, list) or len(raw) != 3:
                raise ValueError("剖切原点和法向必须为三维数值列表。")
            vectors[name] = [number(component) for component in raw]
        if any(abs(component) > 10000 for component in vectors["origin"]):
            raise ValueError("剖切原点超出单次建模 ±10000 mm 资源范围。")
        magnitude = max(abs(component) for component in vectors["normal"])
        if magnitude == 0:
            raise ValueError("剖切平面法向不能为零向量。")
        normalized = [component / magnitude for component in vectors["normal"]]
        length = math.hypot(*normalized)
        section = {"origin": vectors["origin"], "normal": [component / length for component in normalized]}
    return {"projection": value["projection"], "scale": scale, "section": section}


KERNEL_SOURCE = r'''
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
    # Qt 的 PDF 导出器把矢量图形放在页面 Contents 流内，可能使用 Flate 压缩。
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


def make_drawing(doc, objects, config, out):
    import FreeCAD as App
    import FreeCADGui as Gui
    import TechDraw
    import TechDrawGui
    import Part
    import math
    import time
    from pathlib import Path
    from PySide import QtCore

    if not App.GuiUp:
        raise ValueError("完整工程图 SVG/PDF 导出需要运行中的 FreeCAD GUI。")
    if not objects or any(not hasattr(obj, "Shape") or obj.Shape.isNull() for obj in objects):
        raise ValueError("工程图必须引用本任务中的有效实体。")
    if any(obj.Document != doc for obj in objects):
        raise ValueError("工程图视图来源必须属于当前任务文档。")
    source_bounds = Part.makeCompound([obj.Shape for obj in objects]).BoundBox
    largest_projection = max(source_bounds.XLength, source_bounds.YLength, source_bounds.ZLength) * config["scale"]
    # 在设置内核 Scale 属性之前挡住溢出或必然超版的投影，避免巨大比例触发 OCC 计算。
    if not math.isfinite(largest_projection) or largest_projection > 390:
        raise ValueError("指定比例的视图超出 A3 图纸可用区域；请明确提供更小的 scale。")
    if largest_projection <= 1e-8:
        raise ValueError("指定比例的投影视图过小，无法生成有效二维范围。")
    template_path = Path(App.getResourceDir()) / "Mod/TechDraw/Templates/ISO/A3_Landscape_blank.svg"
    if not template_path.is_file():
        raise ValueError("本地 TechDraw 缺少 A3 横向图纸模板。")
    page = doc.addObject("TechDraw::DrawPage", "Drawing")
    template = doc.addObject("TechDraw::DrawSVGTemplate", "DrawingTemplate")
    template.Template = str(template_path)
    page.Template = template
    page.Scale = config["scale"]
    page.ProjectionType = "Third angle" if config["projection"] == "third_angle" else "First angle"

    def create_view(name, direction, horizontal):
        view = doc.addObject("TechDraw::DrawViewPart", "Drawing" + name)
        view.Label = name
        page.addView(view)
        view.Source = objects
        view.Direction = App.Vector(*direction)
        view.XDirection = App.Vector(*horizontal)
        view.ScaleType = "Custom"
        view.Scale = config["scale"]
        view.Caption = name
        return view

    views = {
        "Front": create_view("Front", (0, -1, 0), (1, 0, 0)),
        "Top": create_view("Top", (0, 0, 1), (1, 0, 0)),
        "Right": create_view("Right", (1, 0, 0), (0, 1, 0)),
        "Isometric": create_view("Isometric", (1, -1, 1), (1, 1, 0)),
    }

    def process_events(milliseconds):
        loop = QtCore.QEventLoop()
        timer = QtCore.QTimer()
        timer.setSingleShot(True)
        timer.timeout.connect(loop.quit)
        timer.start(milliseconds)
        loop.exec_()

    def await_views():
        # HLR 和剖面计算在后台线程；必须释放 Qt 事件循环接收结果。
        deadline = time.monotonic() + 20.0
        stable = None
        stable_since = time.monotonic()
        while time.monotonic() < deadline:
            process_events(50)
            counts = tuple(len(view.getVisibleEdges()) for view in views.values())
            states = [view.State for view in views.values()]
            if any("Invalid" in state for state in states):
                raise ValueError("TechDraw 投影或剖视图计算失败。")
            if all(counts) and all("Up-to-date" in state for state in states):
                if counts == stable and time.monotonic() - stable_since >= 0.3:
                    return
                if counts != stable:
                    stable, stable_since = counts, time.monotonic()
            else:
                stable = None
        raise ValueError("TechDraw 投影尚未完成或没有可见边，未导出空白图纸。")

    doc.recompute()
    await_views()
    section_faces = 0
    if config["section"] is not None:
        origin = App.Vector(*config["section"]["origin"])
        normal = App.Vector(*config["section"]["normal"])
        shape = Part.makeCompound([obj.Shape for obj in objects])
        box = shape.BoundBox
        size = max(box.DiagonalLength * 4, 1.0)
        # 用真实实体与平面求交证明剖面穿过材料，不以剖视对象存在冒充切面。
        plane = Part.makePlane(size, size, App.Vector(-size / 2, -size / 2, 0))
        plane.Placement = App.Placement(origin, App.Rotation(App.Vector(0, 0, 1), normal))
        cut = shape.common(plane)
        section_faces = len(cut.Faces)
        if section_faces == 0 or cut.Area <= 1e-9:
            raise ValueError("指定剖切平面未穿过实体材料，不能生成有效剖视图。")
        section = doc.addObject("TechDraw::DrawViewSection", "DrawingSection")
        page.addView(section)
        section.Source = objects
        section.BaseView = views["Front"]
        horizontal = App.Vector(0, 0, 1).cross(normal)
        if horizontal.Length < 1e-9:
            horizontal = App.Vector(1, 0, 0)
        section.XDirection = horizontal
        section.SectionNormal = normal
        section.Direction = normal
        section.SectionOrigin = origin
        section.ScaleType = "Custom"
        section.Scale = config["scale"]
        section.SectionSymbol = "A"
        section.Caption = "Section A-A"
        section.CutSurfaceDisplay = "PatHatch"
        views["Section"] = section
        doc.recompute()
        await_views()

    dimensions = {}
    for name, view in views.items():
        bounds = Part.makeCompound(view.getVisibleEdges(True)).BoundBox
        width, height = bounds.XLength, bounds.YLength
        if not all(math.isfinite(number) and number > 1e-8 for number in (width, height)):
            raise ValueError("投影视图没有有效二维范围。")
        dimensions[name] = (width, height)

    # 图纸坐标原点在左下。视图按实际投影范围排版，保持正交对齐与原始比例。
    main_width = max(dimensions["Front"][0], dimensions["Top"][0])
    side_width = max(dimensions["Right"][0], dimensions["Isometric"][0])
    front_height = max(dimensions["Front"][1], dimensions["Right"][1])
    top_height = max(dimensions["Top"][1], dimensions["Isometric"][1])
    # 斜剖切线与 A-A 标记伸出正视轮廓；保留固定纸面间距，缩小时也不压住相邻标题。
    gap = 44.0 if "Section" in views else 24.0
    total_width = main_width + side_width + gap
    total_height = front_height + top_height + gap
    if "Section" in views:
        total_width += gap + dimensions["Section"][0]
        total_height = max(total_height, dimensions["Section"][1])
    if total_width > 390 or total_height > 257:
        raise ValueError("指定比例的视图超出 A3 图纸可用区域；请明确提供更小的 scale。")
    x0 = (420 - total_width) / 2
    y0 = (297 - (front_height + top_height + gap)) / 2
    third = config["projection"] == "third_angle"
    main_x = x0 + main_width / 2 if third else x0 + side_width + gap + main_width / 2
    side_x = x0 + main_width + gap + side_width / 2 if third else x0 + side_width / 2
    front_y = y0 + front_height / 2 if third else y0 + top_height + gap + front_height / 2
    top_y = y0 + front_height + gap + top_height / 2 if third else y0 + top_height / 2
    positions = {"Front": (main_x, front_y), "Top": (main_x, top_y),
                 "Right": (side_x, front_y), "Isometric": (side_x, top_y)}
    if "Section" in views:
        positions["Section"] = (x0 + main_width + side_width + 2 * gap + dimensions["Section"][0] / 2, 148.5)
    for name, view in views.items():
        view.X, view.Y = positions[name]
    doc.recompute()
    page.ViewObject.show()
    Gui.updateGui()
    await_views()
    TechDrawGui.exportPageAsSvg(page, str(out / "drawing.svg"))
    TechDrawGui.exportPageAsPdf(page, str(out / "drawing.pdf"))
    exports = _verify_drawing_exports(out)
    records = []
    for name, view in views.items():
        direction = view.Direction
        record = {"name": name, "type": view.TypeId,
                  "visible_edges": len(view.getVisibleEdges()),
                  "position_mm": list(positions[name]), "bounds_mm": list(dimensions[name]),
                  "direction": [direction.x, direction.y, direction.z], "scale": view.getScale()}
        if name == "Section":
            record.update({"cut_faces": section_faces, "origin": config["section"]["origin"],
                           "normal": config["section"]["normal"]})
        records.append(record)
    return {"drawing": {"verified": True, "projection": config["projection"],
                        "scale": config["scale"], "paper": "A3", "views": records,
                        "section": config["section"] is not None, **exports}}
'''
