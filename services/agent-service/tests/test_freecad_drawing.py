"""工程图参数、实际文件证据与独立 FreeCAD GUI 验收。"""
from copy import deepcopy
import importlib
import importlib.util
import json
from pathlib import Path
import sys


def _module():
    name = "app.tools.cad.freecad_drawing"
    assert importlib.util.find_spec(name) is not None, "工程图模块尚未实现"
    return importlib.import_module(name)


def _probe(output_directory):
    """由 FreeCAD 自带 Python 单独运行，不连接或改动共享 RPC。"""
    root = Path(__file__).resolve().parents[3]
    sys.path[:0] = [str(root / ".runtime/freecad/bin"),
                    str(root / ".runtime/freecad/lib"),
                    str(root / "services/agent-service")]
    import FreeCAD as App
    import FreeCADGui as Gui
    import Part
    Gui.showMainWindow()
    Gui.getMainWindow().hide()
    module_spec = importlib.util.spec_from_file_location(
        "freecad_drawing_probe", root / "services/agent-service/app/tools/cad/freecad_drawing.py")
    module = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(module)
    kernel = {}
    exec(module.KERNEL_SOURCE, kernel)
    output_directory.mkdir(parents=True, exist_ok=True)
    results = []
    cases = [
        ("third_section", "third_angle", 1, {"origin": [30, 20, 10], "normal": [1, 0, 0]}),
        ("first_no_section", "first_angle", 0.5, None),
        ("oblique_section", "third_angle", 0.5, {"origin": [30, 20, 10], "normal": [1, 1, 1]}),
        ("parallel_section", "third_angle", 0.5, {"origin": [30, 20, 10], "normal": [0, -1, 0]}),
    ]
    for name, projection, scale, section in cases:
        directory = output_directory / name
        directory.mkdir()
        doc = App.newDocument("DrawingProbe_" + name)
        try:
            model = doc.addObject("Part::Feature", "DrilledBlock")
            model.Shape = Part.makeBox(60, 40, 20).cut(
                Part.makeCylinder(6, 20, App.Vector(30, 20, 0)))
            doc.recompute()
            config = module.validate_drawing({"projection": projection, "scale": scale, "section": section})
            proof = kernel["make_drawing"](doc, [model], config, directory)
            assert proof["drawing"]["verified"] is True
            views = proof["drawing"]["views"]
            assert {v["name"] for v in views} == {"Front", "Top", "Right", "Isometric"} | ({"Section"} if section else set())
            assert all(v["visible_edges"] > 0 for v in views)
            mapped = {view["name"]: view for view in views}
            front, top, right = mapped["Front"], mapped["Top"], mapped["Right"]
            assert (top["position_mm"][1] > front["position_mm"][1]) == (projection == "third_angle")
            assert (right["position_mm"][0] > front["position_mm"][0]) == (projection == "third_angle")
            assert front["position_mm"][0] == top["position_mm"][0]
            assert front["position_mm"][1] == right["position_mm"][1]
            assert front["direction"] == [0.0, -1.0, 0.0]
            assert front["bounds_mm"] == [60.0 * scale, 20.0 * scale]
            assert section is None or mapped["Section"]["cut_faces"] > 0
            if section:
                actual_section = doc.getObject("DrawingSection")
                assert abs(actual_section.XDirection.dot(actual_section.SectionNormal)) < 1e-9, "剖视水平轴不得平行剖面法向"
            doc.saveAs(str(directory / "drawing.FCStd"))
            doc_name = doc.Name
            App.closeDocument(doc_name)
            doc = App.openDocument(str(directory / "drawing.FCStd"))
            assert len(doc.findObjects("TechDraw::DrawPage")) == 1
            assert len(doc.findObjects("TechDraw::DrawViewPart")) == len(views)
            results.append({"case": name, "proof": proof, "reopened": True})
        finally:
            App.closeDocument(doc.Name)
    for name, config, source in [
        ("outside_section", {"projection": "third_angle", "scale": 1,
                             "section": {"origin": [500, 500, 500], "normal": [1, 0, 0]}}, True),
        ("oversized_scale", {"projection": "third_angle", "scale": 20, "section": None}, True),
        ("overflow_scale", {"projection": "third_angle", "scale": 1e308, "section": None}, True),
        ("missing_source", {"projection": "third_angle", "scale": 1, "section": None}, False),
    ]:
        directory = output_directory / name
        directory.mkdir()
        doc = App.newDocument("DrawingProbe_" + name)
        try:
            model = doc.addObject("Part::Feature", "Block")
            model.Shape = Part.makeBox(60, 40, 20)
            doc.recompute()
            try:
                kernel["make_drawing"](doc, [model] if source else [],
                                       module.validate_drawing(config), directory)
            except ValueError as exc:
                assert not (directory / "drawing.svg").exists()
                assert not (directory / "drawing.pdf").exists()
                results.append({"case": name, "rejected": True, "reason": str(exc)})
            else:
                raise AssertionError("无效工程图请求不能导出文件：" + name)
        finally:
            App.closeDocument(doc.Name)
    (output_directory / "evidence.json").write_text(
        json.dumps({"version": App.Version(), "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    Gui.getMainWindow().close()


if __name__ == "__main__" and len(sys.argv) == 3 and sys.argv[1] == "--freecad-probe":
    import os
    import traceback
    status = 0
    try:
        _probe(Path(sys.argv[2]))
    except BaseException:
        traceback.print_exc()
        status = 1
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
        os._exit(status)


import pytest


CONFIG = {"projection": "third_angle", "scale": 1, "section": None}
GRAPHICAL_PDF = (b"%PDF-1.4\n1 0 obj <</Type /Page /Contents 2 0 R>> endobj\n"
                 b"2 0 obj <</Length 23>>\nstream\n0 0 m 30 0 l 30 20 l S\nendstream\nendobj\n%%EOF\n")


def test_drawing_preserves_explicit_projection_and_scale_without_mutating_input():
    value = {"projection": "first_angle", "scale": 0.25,
             "section": {"origin": [10, -20, 30], "normal": [0, 3, 4]}}
    original = deepcopy(value)
    assert _module().validate_drawing(value) == {
        "projection": "first_angle", "scale": 0.25,
        "section": {"origin": [10.0, -20.0, 30.0], "normal": [0.0, 0.6, 0.8]},
    }
    assert value == original


@pytest.mark.parametrize("value", [
    None, True, [], {},
    {"projection": "third_angle", "scale": 1},
    {**CONFIG, "path": "other.svg"},
    {**CONFIG, "code": "import os"},
    {**CONFIG, "projection": []},
    {**CONFIG, "projection": "perspective"},
    *[{**CONFIG, "scale": n} for n in [True, 0, -1, float("nan"), float("inf"), "1"]],
    {**CONFIG, "section": {}},
    {**CONFIG, "section": {"origin": [0, 0, 0], "normal": [0, 0, 0]}},
    {**CONFIG, "section": {"origin": [0, 0], "normal": [1, 0, 0]}},
    {**CONFIG, "section": {"origin": [0, 0, 0], "normal": [1, 0, 0], "code": "x"}},
    {**CONFIG, "section": {"origin": [10001, 0, 0], "normal": [1, 0, 0]}},
    {**CONFIG, "section": {"origin": [True, 0, 0], "normal": [1, 0, 0]}},
    {**CONFIG, "section": {"origin": [0, 0, 0], "normal": [float("inf"), 0, 0]}},
    {**CONFIG, "section": {"origin": [0, 0, 0], "normal": "[1,0,0]"}},
])
def test_invalid_drawing_parameters_never_reach_kernel(value):
    with pytest.raises(ValueError):
        _module().validate_drawing(value)


def test_normalization_accepts_small_and_large_nonzero_direction_vectors():
    for normal in ([0, 1e-200, 0], [0, 1e200, 0]):
        value = {**CONFIG, "section": {"origin": [0, 0, 0], "normal": normal}}
        assert _module().validate_drawing(value)["section"]["normal"] == [0.0, 1.0, 0.0]


def _verify_files(directory):
    kernel = {}
    exec(_module().KERNEL_SOURCE, kernel)
    return kernel["_verify_drawing_exports"](directory)


def test_export_validation_requires_graphical_svg_and_complete_pdf(tmp_path):
    (tmp_path / "drawing.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L30 0L30 20Z"/></svg>', encoding="utf-8")
    (tmp_path / "drawing.pdf").write_bytes(GRAPHICAL_PDF)
    evidence = _verify_files(tmp_path)
    assert evidence["svg_geometry_elements"] == 1
    assert evidence["pdf_graphics_streams"] == 1


def test_pdf_binary_stream_trailing_carriage_return_is_not_stripped(tmp_path):
    import zlib
    compressed = next(data for count in range(256)
                      if (data := zlib.compress(b"0 0 m 30 0 l 30 20 l S\n" + b"\t" * count)).endswith(b"\r"))
    (tmp_path / "drawing.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L30 0L30 20Z"/></svg>', encoding="utf-8")
    pdf = (b"%PDF-1.4\n1 0 obj <</Type /Page /Contents 2 0 R>> endobj\n"
           b"2 0 obj <</Length 3 0 R /Filter /FlateDecode>>\nstream\n" + compressed
           + b"\nendstream\nendobj\n3 0 obj\n" + str(len(compressed)).encode()
           + b"\nendobj\n%%EOF\n")
    (tmp_path / "drawing.pdf").write_bytes(pdf)
    assert _verify_files(tmp_path)["pdf_graphics_streams"] == 1


@pytest.mark.parametrize("svg,pdf", [
    (None, b"%PDF-1.4\n%%EOF"),
    ('<svg xmlns="http://www.w3.org/2000/svg"/>', b"%PDF-1.4\n%%EOF"),
    ('<svg xmlns="http://www.w3.org/2000/svg"><path d=""/></svg>', b"%PDF-1.4\n%%EOF"),
    ('<svg xmlns="http://www.w3.org/2000/svg"><defs><path d="M0 0L1 1"/></defs></svg>', b"%PDF-1.4\n%%EOF"),
    ('<svg xmlns="http://www.w3.org/2000/svg"><rect width="420" height="297"/></svg>', GRAPHICAL_PDF),
    ('<html><path d="M0 0L1 1"/></html>', b"%PDF-1.4\n%%EOF"),
    ('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>', None),
    ('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>', b"not a pdf"),
    ('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>', b"%PDF-1.4\ntruncated"),
    ('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>', b"%PDF-1.4\n1 0 obj <</Type /Page>> endobj\n%%EOF"),
])
def test_missing_empty_or_malformed_exports_cannot_produce_verified_evidence(tmp_path, svg, pdf):
    if svg is not None:
        (tmp_path / "drawing.svg").write_text(svg, encoding="utf-8")
    if pdf is not None:
        (tmp_path / "drawing.pdf").write_bytes(pdf)
    with pytest.raises((ValueError, OSError)):
        _verify_files(tmp_path)
