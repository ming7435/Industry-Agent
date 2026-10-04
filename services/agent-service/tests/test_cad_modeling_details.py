"""生产建模的实际输入、实体、导入及长文本边界回归。"""

import base64
import io
import json
import re
import xml.etree.ElementTree as ET
from math import cos, sin, pi

import fitz
import pytest

from app.agents.cad.modeling_analysis import analyze_design, explicit_cylinder, MissingDesignInformation, UnconfirmedDesignParameters
from app.agents.cad.modeling_engine import CADKernel, CADKernelError
from app.agents.cad.modeling_schemas import DesignRequest, ModelSpec
from app.agents.cad.modeling_service import CADModelingService, CADDesignConflict
from test_cad_modeling_api import client, finished, request_spec


def test_explicit_dimensions_convert_units_without_model():
    spec, context = analyze_design(DesignRequest(prompt="直径3cm、长度5cm的圆柱"))
    assert spec.operations[0].diameter == 30
    assert spec.operations[0].length == 50
    assert context["model_called"] is False


@pytest.mark.parametrize("prompt", ["六方销轴，直径30mm、长度50mm", "椭圆柱，直径30mm、长度50mm", "圆柱，直径30mm，直径20mm，长度50mm", "圆柱，直径30mm、长度50mm、带偏心特征"])
def test_local_parser_never_silently_drops_extra_features(prompt):
    assert explicit_cylinder(prompt) is None


class IsolatedModel:
    available = True

    def __init__(self, value, synthetic=False):
        self.value, self.synthetic, self.messages = value, synthetic, None

    def chat(self, messages):
        self.messages = messages
        return {"choices": [{"message": {"content": json.dumps(self.value)}}], "model_metadata": {"synthetic": self.synthetic}}


def test_model_response_is_validated_not_executed():
    model = IsolatedModel({"spec": request_spec()["spec"]})
    with pytest.raises(UnconfirmedDesignParameters) as error:
        analyze_design(DesignRequest(prompt="按明确参数建立带孔销轴"), model)
    assert len(error.value.spec.operations) == 2
    assert error.value.metadata["model_called"] is True
    assert model.messages[-1]["role"] == "user"
    bad = IsolatedModel({"spec": {"units": "mm", "operations": [{"type": "exec", "code": "read secret"}]}})
    with pytest.raises(MissingDesignInformation):
        analyze_design(DesignRequest(prompt="需求"), bad)
    with pytest.raises(MissingDesignInformation):
        analyze_design(DesignRequest(prompt="需求"), IsolatedModel({"spec": request_spec()["spec"]}, synthetic=True))


def test_step_import_uses_original_geometry(client):
    first = finished(client, client.post("/api/cad/designs", json=request_spec()).json()["design_id"])
    step = client.get(next(item["url"] for item in first["artifacts"] if item["format"] == "step")).content
    response = client.post("/api/cad/designs/import", json={"name": "导入销轴", "filename": "pin.step", "content_base64": base64.b64encode(step).decode()})
    assert response.status_code == 202
    imported = finished(client, response.json()["design_id"])
    assert imported["status"] == "ready", imported
    assert imported["geometry"]["volume_mm3"] == pytest.approx(first["geometry"]["volume_mm3"])
    assert imported["geometry"]["bounds_mm"] == pytest.approx(first["geometry"]["bounds_mm"])
    assert imported["analysis"]["source"] == "uploaded_geometry"


def test_dxf_requires_units_and_depth_then_imports_real_outline(client):
    import ezdxf
    drawing = ezdxf.new("R2010")
    drawing.modelspace().add_lwpolyline([(0, 0), (2, 0), (2, 3), (0, 3)], close=True)
    stream = io.StringIO(); drawing.write(stream)
    payload = {"filename": "block.dxf", "content_base64": base64.b64encode(stream.getvalue().encode()).decode()}
    first = finished(client, client.post("/api/cad/designs/import", json=payload).json()["design_id"])
    assert first["status"] == "needs_input"
    payload.update(dxf_depth=1, dxf_units="cm")
    result = finished(client, client.post("/api/cad/designs/import", json=payload).json()["design_id"])
    assert result["status"] == "ready", result
    assert result["geometry"]["volume_mm3"] == pytest.approx(6000)
    assert result["geometry"]["bounds_mm"] == pytest.approx([20, 30, 10])


def test_long_technical_requirements_and_polygon_are_not_lost_from_pdf(client):
    requirements = "需检查加工后的尺寸与表面质量。" * 180
    points = [[round(10 * cos(i * 2 * pi / 128), 5), round(10 * sin(i * 2 * pi / 128), 5)] for i in range(128)]
    payload = {"name": "多边形柱", "technical_requirements": requirements, "spec": {"units": "mm", "operations": [{"type": "extrude", "points": points, "depth": 5}]}}
    result = finished(client, client.post("/api/cad/designs", json=payload).json()["design_id"])
    assert result["status"] == "ready", result
    response = client.get(next(item["url"] for item in result["artifacts"] if item["format"] == "pdf"))
    with fitz.open(stream=response.content, filetype="pdf") as document:
        # 页眉页脚会打断跨页句子；对实际可见正文区域核对完整内容。
        text = "".join("".join(page.get_text(clip=fitz.Rect(30, 70, 812, 538)).split()) for page in list(document)[1:])
        assert text.count("需检查加工后的尺寸与表面质量") == 180
        assert "9.98795" in text
        assert len(document) > 2


@pytest.mark.parametrize("operations", [
    [{"type": "cylinder", "diameter": 20, "length": 10}, {"type": "cylinder", "diameter": 2, "length": 2, "position": [100, 0, 0], "mode": "cut"}],
    [{"type": "box", "length": 10, "width": 10, "height": 10}, {"type": "box", "length": 10, "width": 10, "height": 10, "position": [100, 0, 0]}],
])
def test_invalid_features_and_disconnected_bodies_are_not_downloadable(client, operations):
    result = finished(client, client.post("/api/cad/designs", json={"spec": {"units": "mm", "operations": operations}}).json()["design_id"])
    assert result["status"] == "failed"
    assert result["artifacts"] == []
    assert client.get(f'/api/cad/designs/{result["design_id"]}/artifacts/step').status_code == 404


def test_real_worker_timeout_leaves_no_success(tmp_path):
    spec = ModelSpec.model_validate(request_spec()["spec"]).model_dump(mode="json")
    with pytest.raises(CADKernelError, match="超时"):
        CADKernel(timeout=0.001).build(spec, tmp_path / "out")


def test_changed_file_cannot_be_confirmed_or_downloaded(client):
    result = finished(client, client.post("/api/cad/designs", json=request_spec()).json()["design_id"])
    service = client.app.state.cad_modeling_service
    path, _ = service.artifact(result["design_id"], "step")
    path.write_bytes(b"changed")
    assert client.get(f'/api/cad/designs/{result["design_id"]}/artifacts/step').status_code == 409
    assert client.post(f'/api/cad/designs/{result["design_id"]}/confirm', json={"digest": result["digest"]}).status_code == 409


def test_restarted_job_is_interrupted_and_idempotency_persists(tmp_path):
    folder = tmp_path / "CAD-0123456789ABCDEF0123"; folder.mkdir()
    value = {"design_id": folder.name, "status": "modeling", "idempotency_key": "key", "input_digest": "before"}
    (folder / "record.json").write_text(json.dumps(value))
    service = CADModelingService(tmp_path)
    try:
        assert service.get(folder.name)["status"] == "interrupted"
        with pytest.raises(CADDesignConflict):
            service.submit(DesignRequest(**request_spec()), "key")
    finally:
        service.close()


@pytest.mark.parametrize("spec,bounds,volume", [
    ({"units": "inch", "operations": [{"type": "cylinder", "diameter": 1, "length": 2, "axis": "x"}]}, [50.8, 25.4, 25.4], pi * 12.7 ** 2 * 50.8),
    ({"units": "mm", "operations": [{"type": "revolve", "points": [[0, 0], [5, 0], [5, 10], [0, 10]]}]}, [10, 10, 10], pi * 25 * 10),
    ({"units": "mm", "operations": [{"type": "cylinder", "diameter": 30, "length": 20}, {"type": "cylinder", "diameter": 20, "length": 30, "position": [0, 0, 20]}]}, [30, 30, 50], pi * 225 * 20 + pi * 100 * 30),
    ({"units": "mm", "operations": [{"type": "box", "length": 10, "width": 10, "height": 10}, {"type": "fillet", "size": 1, "edges": "all"}]}, [10, 10, 10], None),
    ({"units": "mm", "operations": [{"type": "cylinder", "diameter": 20, "length": 10}, {"type": "chamfer", "size": 1, "edges": "%Circle"}]}, [20, 20, 10], None),
])
def test_supported_features_use_real_kernel_and_keep_dimensions(tmp_path, spec, bounds, volume):
    typed = ModelSpec.model_validate(spec).model_dump(mode="json")
    result = CADKernel().build(typed, tmp_path / "geometry")
    assert result["geometry"]["valid"] and result["geometry"]["step_roundtrip_valid"]
    assert result["geometry"]["bounds_mm"] == pytest.approx(bounds, abs=1e-5)
    if volume is not None:
        assert result["geometry"]["volume_mm3"] == pytest.approx(volume)
    else:
        # 倒角/圆角真正改变体积，而不是只返回未处理的原实体。
        original = CADKernel().build(ModelSpec.model_validate({**spec, "operations": spec["operations"][:1]}).model_dump(mode="json"), tmp_path / "original")
        assert 0 < result["geometry"]["volume_mm3"] < original["geometry"]["volume_mm3"]


def test_svg_stroke_does_not_hide_small_part_geometry(tmp_path):
    spec = ModelSpec.model_validate({"units": "mm", "operations": [{"type": "cylinder", "diameter": 6, "length": 10}]}).model_dump(mode="json")
    CADKernel().build(spec, tmp_path / "small")
    for name in ("front", "top", "side"):
        svg = ET.parse(tmp_path / "small" / (name + ".svg")).getroot()
        group = svg.find("{http://www.w3.org/2000/svg}g")
        scale = float(re.search(r"scale\(([^,]+)", group.attrib["transform"])[1])
        # 校验真实导出投影的屏幕线宽，防止把实心圆柱画成粗环。
        assert 0 < abs(scale * float(group.attrib["stroke-width"])) <= 2
