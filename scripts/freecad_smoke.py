"""验证已安装的 MCP 服务及真实 FreeCAD STEP/STL 导出。

先启动 FreeCAD，再使用 .runtime/freecad-mcp-venv/Scripts/python.exe 运行。
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import uuid


ROOT = Path(__file__).resolve().parents[1]


def parse_execution_result(result: dict) -> dict:
    text = "\n".join(item.get("text", "") for item in result.get("content", [])
                     if item.get("type") == "text")
    if result.get("isError") or "Failed to execute code:" in text:
        raise RuntimeError(text)
    marker = "FREECAD_SMOKE_JSON="
    if "Code executed successfully:" not in text or marker not in text:
        raise RuntimeError("FreeCAD returned no geometry evidence: " + text)
    return json.loads(text.split(marker, 1)[1].splitlines()[0])


async def verify(output_dir: Path, list_only: bool = False) -> dict:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    output_dir.mkdir(parents=True, exist_ok=True)
    params = StdioServerParameters(
        command=str(ROOT / ".runtime/freecad-mcp-venv/Scripts/freecad-mcp.exe"),
        args=["--host", "127.0.0.1", "--only-text-feedback"],
    )
    async with stdio_client(params) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            initialization = await session.initialize()
            tools = await session.list_tools()
            tool_data = tools.model_dump(by_alias=True, mode="json")
            (output_dir / "mcp-tools.json").write_text(json.dumps(tool_data, indent=2), encoding="utf-8")
            report = {"verified_at": datetime.now(timezone.utc).isoformat(),
                      "initialize": initialization.model_dump(by_alias=True, mode="json"),
                      "tools": [tool.name for tool in tools.tools]}
            if list_only:
                return report
            status = await session.call_tool("get_rpc_status", {})
            report["rpc_status"] = status.model_dump(by_alias=True, mode="json")
            code = f'''
import FreeCAD, Part, Mesh, MeshPart, json, math
from pathlib import Path
target = Path({str(output_dir)!r})
doc = FreeCAD.newDocument({"McpSmoke_" + uuid.uuid4().hex[:12]!r})
body = doc.addObject("PartDesign::Body", "Body")
feature = body.newObject("PartDesign::Feature", "DrilledBlock")
feature.Shape = Part.makeBox(20, 15, 10).cut(Part.makeCylinder(3, 10, FreeCAD.Vector(10, 7.5, 0)))
doc.recompute()
shape = feature.Shape
assert shape.isValid() and len(shape.Solids) == 1, "Invalid FreeCAD solid"
assert abs(shape.Volume - (3000 - 90 * math.pi)) < 1e-6, "Unexpected solid volume"
stl = target / "drilled-block.stl"
step = target / "drilled-block.step"
fcstd = target / "drilled-block.FCStd"
mesh = MeshPart.meshFromShape(Shape=shape, LinearDeflection=0.1, AngularDeflection=0.5, Relative=False)
mesh.write(str(stl))
Part.export([feature], str(step))
doc.saveAs(str(fcstd))
reloaded = Part.read(str(step))
reloaded_mesh = Mesh.Mesh(str(stl))
assert reloaded.isValid() and len(reloaded.Solids) == 1, "STEP roundtrip lost solid"
assert abs(reloaded.Volume - shape.Volume) < 1e-6, "STEP volume changed"
assert reloaded_mesh.CountFacets > 0, "STL has no triangles"
print("FREECAD_SMOKE_JSON=" + json.dumps({{
    "valid": shape.isValid(), "solids": len(shape.Solids), "volume": shape.Volume,
    "step_roundtrip_volume": reloaded.Volume, "stl_facets": reloaded_mesh.CountFacets,
    "bounds_mm": [shape.BoundBox.XLength, shape.BoundBox.YLength, shape.BoundBox.ZLength],
    "freecad_version": FreeCAD.Version(), "document": doc.Name
}}))
FreeCAD.closeDocument(doc.Name)
'''
            result = await session.call_tool("execute_code", {
                "code": code, "include_screenshot": False, "timeout": 120,
            })
            wire_result = result.model_dump(by_alias=True, mode="json")
            report["execute_code"] = wire_result
            geometry = parse_execution_result(wire_result)
            if not geometry["valid"] or geometry["solids"] != 1:
                raise RuntimeError("FreeCAD did not create one valid solid")
            if not math.isclose(geometry["volume"], 3000 - 90 * math.pi, abs_tol=1e-6):
                raise RuntimeError("Unexpected model volume")
            if geometry["stl_facets"] <= 0:
                raise RuntimeError("No STL geometry")
            report["geometry"] = geometry
            report["artifacts"] = {}
            for name in ("drilled-block.stl", "drilled-block.step", "drilled-block.FCStd"):
                path = output_dir / name
                data = path.read_bytes()
                if len(data) < 100:
                    raise RuntimeError("Missing or empty export: " + str(path))
                if path.suffix == ".step" and not data.startswith(b"ISO-10303-21;"):
                    raise RuntimeError("STEP header is invalid")
                report["artifacts"][name] = {"path": str(path), "bytes": len(data),
                    "sha256": hashlib.sha256(data).hexdigest()}
            (output_dir / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
            return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--list-only", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=ROOT / ".runtime/verification" /
                        ("freecad-" + datetime.now().strftime("%Y%m%d-%H%M%S")))
    args = parser.parse_args()
    print(json.dumps(asyncio.run(verify(args.output_dir.resolve(), args.list_only)), indent=2))


if __name__ == "__main__":
    main()
