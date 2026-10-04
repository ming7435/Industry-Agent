"""隔离 CAD 工作进程；只解释经校验的几何操作，不执行输入代码。"""

from __future__ import annotations

import contextlib
import json
from pathlib import Path
import sys


def build(payload):
    import cadquery as cq

    folder = Path(payload["output_dir"])
    folder.mkdir(parents=True, exist_ok=True)
    spec = payload.get("spec") or {}
    source = payload.get("import_path")
    factor = {"mm": 1, "cm": 10, "inch": 25.4}[spec.get("units", "mm")]
    shape = None

    def single_root(workplane):
        objects = workplane.vals()
        if len(objects) != 1:
            raise ValueError("导入图纸包含多个根对象，当前要求完整的单一零件实体")
        return objects[0]

    if source:
        suffix = Path(source).suffix.lower()
        if suffix in {".step", ".stp"}:
            shape = single_root(cq.importers.importStep(source))
        elif suffix == ".dxf":
            # DXF 二维轮廓只有在深度与单位明确时才可建立三维实体。
            factor = {"mm": 1, "cm": 10, "inch": 25.4}[payload["dxf_units"]]
            shape = single_root(cq.importers.importDXF(source).wires().toPending().extrude(payload["dxf_depth"]))
            shape = shape.scale(factor)
            factor = {"mm": 1, "cm": 10, "inch": 25.4}[spec.get("units", "mm")]
        else:
            raise ValueError("此文件不能作为 CAD 实体直接导入")
    steps = []
    for index, operation in enumerate(spec.get("operations") or []):
        kind = operation["type"]
        if kind in {"fillet", "chamfer"}:
            if shape is None:
                raise ValueError("倒角或圆角前必须存在实体")
            wp = cq.Workplane("XY").add(shape)
            edges = wp.edges() if operation["edges"] == "all" else wp.edges(operation["edges"])
            shape = getattr(edges, kind)(operation["size"] * factor).val()
        else:
            wp = cq.Workplane("XY")
            if kind == "cylinder":
                tool = wp.circle(operation["diameter"] * factor / 2).extrude(operation["length"] * factor).val()
                if operation["axis"] == "x":
                    tool = tool.rotate((0, 0, 0), (0, 1, 0), 90)
                elif operation["axis"] == "y":
                    tool = tool.rotate((0, 0, 0), (1, 0, 0), -90)
            elif kind == "box":
                tool = wp.box(operation["length"] * factor, operation["width"] * factor, operation["height"] * factor, centered=(True, True, False)).val()
            elif kind == "extrude":
                points = [(x * factor, y * factor) for x, y in operation["points"]]
                tool = wp.polyline(points).close().extrude(operation["depth"] * factor).val()
            elif kind == "revolve":
                points = [(x * factor, y * factor) for x, y in operation["points"]]
                tool = cq.Workplane("XZ").polyline(points).close().revolve(operation["angle"], (0, 0), (0, 1)).val()
            else:
                raise ValueError("未支持的建模操作")
            tool = tool.translate(tuple(value * factor for value in operation["position"]))
            if shape is None:
                if operation["mode"] != "add":
                    raise ValueError("不能从切除开始建立零件")
                shape = tool
            else:
                old_volume = shape.Volume()
                shape = shape.cut(tool) if operation["mode"] == "cut" else shape.fuse(tool)
                if operation["mode"] == "cut" and abs(shape.Volume() - old_volume) < 1e-8:
                    raise ValueError("切除操作未与实体相交，不能声称该特征已完成")
            shape = shape.clean()
        if not shape.isValid() or shape.Volume() <= 0:
            raise ValueError("操作产生了无效或空实体")
        steps.append({"index": index + 1, "operation": operation, "volume_mm3": shape.Volume()})
    if shape is None or not shape.isValid() or shape.Volume() <= 0:
        raise ValueError("没有生成有效实体")
    solids = shape.Solids()
    if len(solids) != 1:
        raise ValueError("当前零件建模要求一个连续实体；请分别提交多体或装配模型")
    if len(shape.Faces()) > 4000:
        raise ValueError("模型复杂度超过当前工作进程资源限制")
    box = shape.BoundingBox()
    cq.exporters.export(shape, str(folder / "model.step"))
    restored = single_root(cq.importers.importStep(str(folder / "model.step")))
    restored_box = restored.BoundingBox()
    roundtrip = (restored.isValid() and len(restored.Solids()) == 1
        and abs(restored.Volume() - shape.Volume()) <= max(1e-6, shape.Volume() * 1e-8)
        and all(abs(getattr(restored_box, axis) - getattr(box, axis)) <= max(1e-6, abs(getattr(box, axis)) * 1e-8)
            for axis in ("xmin", "xmax", "ymin", "ymax", "zmin", "zmax")))
    if not roundtrip:
        raise ValueError("STEP 文件重新导入校验失败")
    cq.exporters.export(shape, str(folder / "model.stl"), tolerance=0.05, angularTolerance=0.1)
    views = {"front": (0, -1, 0), "top": (0, 0, 1), "side": (1, 0, 0)}
    for name, direction in views.items():
        cq.exporters.export(shape, str(folder / (name + ".svg")), exportType="SVG", opt={
            "width": 600, "height": 400, "marginLeft": 35, "marginTop": 35,
            "projectionDir": direction, "showAxes": False, "showHidden": True,
            # 使用内核按视图缩放计算的默认线宽，避免小零件轮廓被粗线遮盖。
            "strokeColor": (22, 58, 68), "hiddenColor": (150, 165, 170),
        })
    section = cq.Workplane("XY").add(shape).section(height=box.zmin + box.zlen / 2)
    cq.exporters.export(section, str(folder / "section.dxf"), exportType="DXF")
    (folder / "model_spec.json").write_text(json.dumps({"name": payload.get("name", ""), "spec": spec, "imported": bool(source), "geometry_units": "mm"}, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"geometry": {"valid": True, "solid_count": 1, "volume_mm3": shape.Volume(),
        "bounds_mm": [box.xlen, box.ylen, box.zlen], "center_mm": [box.center.x, box.center.y, box.center.z],
        "step_roundtrip_valid": True, "units": "mm", "engine": "CadQuery " + cq.__version__}, "operations": steps}


def main():
    try:
        with contextlib.redirect_stdout(sys.stderr):
            if "--health" in sys.argv:
                import cadquery as cq
                value = {"ready": True, "engine": "CadQuery " + cq.__version__}
            else:
                value = build(json.load(sys.stdin))
        print(json.dumps(value, ensure_ascii=False))
    except Exception as error:
        # 不返回原生解析器路径、环境变量或模型供应商详细错误。
        print(json.dumps({"error": "CAD 实体生成或文件校验失败", "error_type": type(error).__name__}, ensure_ascii=False))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
