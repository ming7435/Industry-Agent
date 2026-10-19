"""工程图严格参数与实际矢量文件证据；几何投影见 test_text_to_cad_features。"""
from copy import deepcopy
import importlib
import importlib.util


def _module():
    name = "app.tools.cad.cad_drawing"
    assert importlib.util.find_spec(name) is not None, "工程图模块尚未实现"
    return importlib.import_module(name)



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
    from app.tools.cad.text_to_cad_features import _verify_drawing_exports
    return _verify_drawing_exports(directory)


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
