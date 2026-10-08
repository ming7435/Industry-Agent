"""单折弯钣金的严格参数及固定 FreeCAD/SheetMetal 内核。"""
import math


def validate_sheet_metal(value):
    """尺寸为 mm，折弯角为 deg，K 因子固定采用 ANSI 定义。

    base_length、flange_length 是各自的直段长度，不包含圆弧段。
    """
    fields = {'width', 'base_length', 'flange_length', 'thickness',
              'bend_radius', 'bend_angle', 'k_factor'}
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError('单折弯钣金必须明确宽、底边直段、翼边直段、厚度、内弯半径、折弯角及 ANSI K 因子。')
    result = {}
    for key in fields:
        number = value[key]
        if isinstance(number, bool) or not isinstance(number, (int, float)):
            raise ValueError('钣金尺寸、角度与 K 因子必须是有限数值。')
        if abs(number) > 10000 or not math.isfinite(number):
            raise ValueError('钣金参数必须有限，单次尺寸资源上限为 10000 mm。')
        result[key] = float(number)
    if any(result[key] < 0.01 for key in fields - {'bend_angle', 'k_factor'}):
        raise ValueError('当前钣金内核的最小尺寸为 0.01 mm。')
    if not 0 < result['bend_angle'] < 180 or not 0 <= result['k_factor'] <= 1:
        raise ValueError('折弯角必须大于 0 且小于 180 度，ANSI K 因子必须为 0 至 1。')
    if result['thickness'] >= min(result[key] for key in ('width', 'base_length', 'flange_length')):
        raise ValueError('板厚必须小于板宽、底边直段和翼边直段。')
    if result['base_length'] + result['flange_length'] + math.pi * (
            result['bend_radius'] + result['thickness']) > 10000:
        raise ValueError('展开长度超出当前单次建模资源范围。')
    return result


KERNEL_SOURCE = r'''
def build_sheet_metal(doc, config, out):
    import math
    import sys
    from pathlib import Path
    import xml.etree.ElementTree as ET
    try:
        import FreeCAD as App
        addon_path = Path(App.getHomePath()) / 'Mod' / 'SheetMetal'
        if addon_path.is_dir() and str(addon_path) not in sys.path:
            sys.path.insert(0, str(addon_path))
        import SheetMetalCmd
        import SheetMetalUnfoldCmd
        import SheetMetalNewUnfolder
        import networkx
    except ImportError as error:
        raise RuntimeError('SheetMetal 钣金或 NetworkX 展开依赖未安装，不能生成替代平板。') from error
    import Part
    import Import
    import importSVG

    package = Path(SheetMetalCmd.__file__).with_name('package.xml')
    metadata = ET.parse(package).getroot()
    version = next((item.text for item in metadata.iter()
                    if item.tag.rsplit('}', 1)[-1] == 'version'), None)
    if not version or not SheetMetalUnfoldCmd.NewUnfolderAvailable:
        raise RuntimeError('SheetMetal 插件版本或新版展开算法不可验证。')

    width = config['width']
    length = config['base_length']
    flange = config['flange_length']
    thickness = config['thickness']
    radius = config['bend_radius']
    angle = config['bend_angle']
    kfactor = config['k_factor']

    def near(actual, expected):
        return math.isfinite(actual) and math.isclose(actual, expected, rel_tol=1e-6, abs_tol=1e-6)

    def check_solid(shape, label):
        if shape.isNull() or not shape.isValid() or len(shape.Solids) != 1 or shape.Volume <= 0:
            raise RuntimeError(label + '未形成有效单实体。')

    base = doc.addObject('Part::Box', 'SheetMetalBase')
    base.Label = 'SheetMetal base (straight segment)'
    base.Length, base.Width, base.Height = width, length, thickness
    doc.recompute()
    sides = [('Face' + str(index + 1)) for index, face in enumerate(base.Shape.Faces)
             if near(face.CenterOfMass.y, length) and near(face.Area, width * thickness)]
    if len(sides) != 1:
        raise RuntimeError('无法唯一定位钣金折弯薄侧面。')
    bent = doc.addObject('Part::FeaturePython', 'SheetMetalBend')
    bent.Label = 'SheetMetal bend'
    SheetMetalCmd.SMBendWall(bent, base, sides)
    bent.radius, bent.length, bent.angle = radius, flange, angle
    bent.kfactor, bent.invert, bent.unfold = kfactor, False, False
    bent.BendType, bent.LengthSpec = 'Material Outside', 'Leg'
    bent.gap1, bent.gap2 = 0, 0
    bent.extend1, bent.extend2 = 0, 0
    bent.AutoMiter, bent.Perforate = False, False
    doc.recompute()
    check_solid(bent.Shape, 'SheetMetal 折弯')
    cylinders = [face for face in bent.Shape.Faces if isinstance(face.Surface, Part.Cylinder)]
    if len(cylinders) != 2 or not all(near(actual, expected) for actual, expected in
            zip(sorted(face.Surface.Radius for face in cylinders), [radius, radius + thickness])):
        raise RuntimeError('钣金实体缺少具有指定内外半径的真实圆柱折弯面。')
    theta = math.radians(angle)
    expected_bent_volume = width * thickness * (length + flange + theta * (radius + thickness / 2))
    if not near(bent.Shape.Volume, expected_bent_volume):
        raise RuntimeError('钣金折弯实体的体积不符合指定直段、角度、半径和厚度。')
    roots = [('Face' + str(index + 1)) for index, face in enumerate(bent.Shape.Faces)
             if isinstance(face.Surface, Part.Plane) and near(face.CenterOfMass.z, thickness)
             and near(face.CenterOfMass.y, length / 2) and near(face.Area, width * length)]
    if len(roots) != 1:
        raise RuntimeError('无法唯一定位钣金展开参考平面。')
    unfolded = doc.addObject('Part::FeaturePython', 'SheetMetalUnfold')
    unfolded.Label = 'SheetMetal unfold (ANSI)'
    SheetMetalUnfoldCmd.SMUnfold(unfolded, bent, roots)
    unfolded.KFactor, unfolded.KFactorStandard = kfactor, 'ansi'
    unfolded.MaterialSheet = '_manual'
    unfolded.GenerateSketch = False
    unfolded.GenerateBendCuts = False
    unfolded.ManualRecompute = False
    # 直接选择新版算法，不受用户此前的旧版展开偏好影响。
    unfolded.Shape, _ = unfolded.Proxy.newUnfolder(unfolded, bent, roots[0])
    check_solid(unfolded.Shape, 'SheetMetal 展开')
    calculator = SheetMetalNewUnfolder.BendAllowanceCalculator.from_single_value(kfactor, 'ansi')
    selected, shape, bend_lines, normal, bend_info = SheetMetalNewUnfolder.getUnfold(calculator, bent, roots[0])
    check_solid(shape, 'SheetMetal 展开复核')
    if len(bend_info) != 1 or len(bend_lines.Edges) != 1:
        raise RuntimeError('单折弯展开未得到一条真实折弯中心线。')
    profile, internal, holes = SheetMetalNewUnfolder.SketchExtraction.extract_manually(shape, normal)
    if internal or holes:
        raise RuntimeError('当前单折弯规格意外产生内部轮廓或孔。')
    transform = SheetMetalNewUnfolder.SketchExtraction.move_to_origin(profile, selected)
    flat_profile = profile.transformed(transform)
    flat_bends = bend_lines.transformed(transform)
    flat_face = Part.Face(flat_profile)
    flat_shape = shape.transformed(transform)
    expected_length = length + flange + theta * (radius + kfactor * thickness)
    expected_area = width * expected_length
    bounds = flat_shape.BoundBox
    actual_sides = sorted([bounds.XLength, bounds.YLength])
    if not near(flat_face.Area, expected_area) or not near(shape.Volume, expected_area * thickness):
        raise RuntimeError('真实展开面积或体积与 ANSI K 因子的折弯补偿不一致。')
    if not near(bounds.ZLength, thickness) or not all(near(a, b) for a, b in
            zip(actual_sides, sorted([width, expected_length]))):
        raise RuntimeError('真实展开尺寸与指定宽度、直段及折弯补偿不一致。')
    outline = doc.addObject('Part::Feature', 'SheetMetalUnfoldOutline')
    outline.Label = 'Unfold outline (mm)'
    outline.Shape = flat_profile
    bend_drawing = doc.addObject('Part::Feature', 'SheetMetalUnfoldBendLine')
    bend_drawing.Label = 'Bend centerline'
    bend_drawing.Shape = flat_bends
    out = Path(out)
    # 调用原生 DXF 导出器，避免 legacy 导出器自动下载任何依赖。
    Import.writeDXFObject([outline, bend_drawing], str(out / 'unfold.dxf'), 14, False)
    importSVG.export([outline, bend_drawing], str(out / 'unfold.svg'))
    for name in ('unfold.svg', 'unfold.dxf'):
        artifact = out / name
        if not artifact.is_file() or artifact.stat().st_size < 100:
            raise RuntimeError('钣金展开导出未形成有效文件：' + name)
    if App.GuiUp:
        base.ViewObject.Visibility = False
        for item in (unfolded, outline, bend_drawing):
            item.ViewObject.Visibility = False
        bent.ViewObject.Visibility = True
    proof = {'sheet_metal': {
        'verified': True, 'plugin_version': version, 'networkx_version': networkx.__version__,
        'bend_count': len(bend_info), 'cylindrical_face_count': len(cylinders),
        'k_factor': kfactor, 'k_factor_standard': 'ansi', 'bend_angle_deg': angle,
        'inner_bend_radius_mm': radius, 'thickness_mm': thickness,
        'unfold_area_mm2': flat_face.Area, 'unfold_volume_mm3': shape.Volume,
        'unfold_width_mm': width, 'unfold_length_mm': expected_length,
        'unfold_bounds_mm': [bounds.XLength, bounds.YLength, bounds.ZLength],
        'bent_volume_mm3': bent.Shape.Volume,
        'bend_line_length_mm': bend_lines.Edges[0].Length,
        'unfold_object': unfolded.Name,
        'files': ['unfold.svg', 'unfold.dxf'],
    }}
    # 公共导出器只接收折弯件；展开实体仍保存在可编辑 FCStd 文档。
    return [bent], proof
'''
