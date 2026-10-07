"""独立审查发现项的失败复现，随后保留为长期回归。"""

import base64
import io
import json
import subprocess

import fitz
from PIL import Image
import pytest

from app.agents.cad.modeling_analysis import analyze_design, MissingDesignInformation
from app.agents.cad.modeling_engine import CADKernel, CADKernelError
from app.agents.cad.schemas import DesignRequest
from test_cad_modeling_api import client, finished, request_spec
from test_cad_modeling_details import IsolatedModel


def test_step_multiple_roots_are_rejected_instead_of_truncated(tmp_path):
    source = tmp_path / "two.step"
    code = '''import cadquery as cq
from OCP.STEPControl import STEPControl_Writer, STEPControl_AsIs
import sys
writer=STEPControl_Writer()
for shape in [cq.Workplane("XY").box(10,10,10).val(), cq.Workplane("XY").box(20,20,20).translate((40,0,0)).val()]:
    writer.Transfer(shape.wrapped, STEPControl_AsIs)
writer.Write(sys.argv[1])
'''
    result = subprocess.run([CADKernel().python_path, "-c", code, str(source)], capture_output=True, timeout=45)
    assert result.returncode == 0
    with pytest.raises(CADKernelError):
        CADKernel().build(None, tmp_path / "result", import_path=str(source))


def test_unverified_model_dimensions_never_enter_building():
    model = IsolatedModel({"spec": {"units": "mm", "operations": [{"type": "box", "length": 10, "width": 20, "height": 30}]}})
    model._post = lambda path, payload: model.chat(payload["messages"])
    with pytest.raises(MissingDesignInformation) as error:
        analyze_design(DesignRequest(prompt="图中没有任何尺寸，请按图建模"), model, image_data="data:image/png;base64,test")
    assert error.value.spec.operations[0].length == 10


def test_image_revision_retains_original_drawing_and_prompts(client):
    client.get("/api/cad/designs")
    captured = []
    class ImageModel:
        available = True
        def _post(self, path, body):
            captured.append(body)
            value = {"missing_information": ["需要长度"]} if len(captured) == 1 else {"spec": request_spec()["spec"]}
            return {"choices": [{"message": {"content": json.dumps(value)}}], "model_metadata": {"synthetic": False}}
    client.app.state.cad_modeling_service.model = ImageModel()
    stream = io.BytesIO(); Image.new("RGB", (30, 30)).save(stream, format="PNG")
    payload = {"filename": "pin.png", "content_base64": base64.b64encode(stream.getvalue()).decode(), "prompt": "销轴图纸，外径30mm，中心孔10mm"}
    first = finished(client, client.post("/api/cad/designs/import", json=payload).json()["design_id"])
    assert first["status"] == "needs_input"
    response = client.post(f'/api/cad/designs/{first["design_id"]}/revisions', json={"prompt": "补充长度50mm"})
    assert response.status_code == 202
    second = finished(client, response.json()["design_id"])
    assert second["status"] == "needs_input"
    assert second["suggested_spec"]["operations"][0]["diameter"] == 30
    content = captured[1]["messages"][-1]["content"]
    assert content[1]["image_url"]["url"].startswith("data:image/png;base64,")
    assert "外径30mm" in content[0]["text"] and "补充长度50mm" in content[0]["text"]
    assert second["request"]["source_sha256"] == first["request"]["source_sha256"]
    third = finished(client, client.post(f'/api/cad/designs/{second["design_id"]}/revisions', json={"spec": second["suggested_spec"]}).json()["design_id"])
    assert third["status"] == "ready"
    assert third["geometry"]["volume_mm3"] == pytest.approx(31415.9265359)


def test_dxf_revision_keeps_outline_and_correct_source_units_in_pdf(client):
    import ezdxf
    drawing = ezdxf.new("R2010"); drawing.modelspace().add_lwpolyline([(0, 0), (2, 0), (2, 3), (0, 3)], close=True)
    stream = io.StringIO(); drawing.write(stream)
    first = finished(client, client.post("/api/cad/designs/import", json={"filename": "plate.dxf", "content_base64": base64.b64encode(stream.getvalue().encode()).decode()}).json()["design_id"])
    response = client.post(f'/api/cad/designs/{first["design_id"]}/revisions', json={"dxf_depth": 1, "dxf_units": "cm"})
    assert response.status_code == 202
    result = finished(client, response.json()["design_id"])
    assert result["status"] == "ready", result
    assert result["geometry"]["volume_mm3"] == pytest.approx(6000)
    with fitz.open(stream=client.get(next(item["url"] for item in result["artifacts"] if item["format"] == "pdf")).content, filetype="pdf") as document:
        text = "".join("".join(page.get_text().split()) for page in document)
        assert "输入单位：cm" in text
        assert "拉伸深度：1.0cm" in text


def test_production_app_shutdown_closes_cad_pool(tmp_path):
    from fastapi.testclient import TestClient
    from types import SimpleNamespace
    from app.api.server import create_app
    app = create_app(SimpleNamespace(container=SimpleNamespace()))
    app.state.cad_modeling_root = tmp_path / "jobs"
    with TestClient(app) as value:
        value.get("/api/cad/designs")
        service = app.state.cad_modeling_service
    try:
        assert service.closed is True
    finally:
        service.close()


def test_native_revision_does_not_silently_ignore_text_geometry_changes(client):
    import ezdxf
    drawing = ezdxf.new("R2010"); drawing.modelspace().add_lwpolyline([(0, 0), (20, 0), (20, 30), (0, 30)], close=True)
    stream = io.StringIO(); drawing.write(stream)
    first = finished(client, client.post("/api/cad/designs/import", json={"filename": "plate.dxf", "content_base64": base64.b64encode(stream.getvalue().encode()).decode(), "dxf_units": "mm", "dxf_depth": 5}).json()["design_id"])
    assert first["status"] == "ready"
    response = client.post(f'/api/cad/designs/{first["design_id"]}/revisions', json={"prompt": "增加一个中心通孔"})
    assert response.status_code == 409
