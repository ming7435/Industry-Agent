"""工程文档 CAD 服务。

生产环境可将 catalog 替换为 PLM、BOM 数据库和 DWG/DXF 解析流水线的仓储实现；
Agent 只通过 MCP 风格的结构化工具访问本服务。
"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    tool: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


CATALOG = [
    {"component_id": "SPINDLE-ASSY", "part_no": "SP-ASSY-TC820-001", "name": "主轴电机组件", "position": "Z轴上方主轴箱", "assembly_relation": "上级为主轴箱总成，下接主轴轴承、温度传感器与冷却回路", "drawing_ref": "DWG-TC820-SPINDLE-001", "quantity": 1, "material": "装配件"},
    {"component_id": "COOLING-PUMP", "part_no": "CP-TC820-015", "name": "冷却泵", "position": "机床后侧冷却单元", "assembly_relation": "向主轴冷却回路供液，连接冷却箱、过滤器和主轴夹套", "drawing_ref": "DWG-TC820-COOLING-002", "quantity": 1, "material": "外购件"},
    {"component_id": "TEMP-PT100", "part_no": "TS-PT100-008", "name": "主轴温度传感器", "position": "主轴电机壳体测温孔", "assembly_relation": "采集主轴温度，信号接入PLC模拟量模块", "drawing_ref": "DWG-TC820-SENSOR-003", "quantity": 1, "material": "传感器"},
    {"component_id": "VIB-SENSOR", "part_no": "VS-RMS-004", "name": "主轴振动传感器", "position": "主轴箱体右侧安装座", "assembly_relation": "采集主轴振动RMS，关联刀具、夹具和主轴轴承", "drawing_ref": "DWG-TC820-SENSOR-004", "quantity": 1, "material": "传感器"},
]

app = FastAPI(title="Document CAD Service", version="1.0.0")


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok", "service": "document-cad-service", "records": len(CATALOG)}


@app.post("/tools/call")
def call_tool(request: ToolCall) -> Dict[str, Any]:
    handler = {"query_drawing": query_drawing, "query_bom": query_bom, "query_part": query_part, "query_relation": query_relation, "fetch_engineering_record": fetch_engineering_record}.get(request.tool)
    if handler is None:
        raise HTTPException(status_code=404, detail="未注册 CAD 工具：%s" % request.tool)
    return handler(**request.arguments)


def query_part(query: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no)
    return {"query": query or component or part_no, "parts": matched, "source": "document-cad-service"}


def query_bom(query: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no)
    return {"query": query or component or part_no, "bom_items": [_bom(item) for item in matched], "source": "document-cad-service"}


def query_drawing(query: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no)
    return {"query": query or component or part_no, "drawings": [_drawing(item) for item in matched], "source": "document-cad-service"}


def query_relation(query: str = "", component: str = "", component_id: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(component_id or query or component or part_no)
    relations = [_relation(item) for item in matched]
    return {"query": query or component_id or component or part_no, "relations": relations, "assembly_relations": relations, "locations": [_location(item) for item in matched], "source": "document-cad-service"}


def fetch_engineering_record(query: str = "", component: str = "", part_no: str = "", **arguments: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no)
    return {"query": query or component or part_no, "device_id": arguments.get("device_id", ""), "components": matched, "drawings": [_drawing(item) for item in matched], "bom_items": [_bom(item) for item in matched], "assembly_relations": [_relation(item) for item in matched], "locations": [_location(item) for item in matched], "source": "document-cad-service"}


def _match(query: str) -> list[Dict[str, Any]]:
    text = str(query or "").lower().strip()
    if not text:
        return [dict(item) for item in CATALOG[:2]]
    for item in CATALOG:
        exact_values = (item.get("component_id"), item.get("part_no"), item.get("name"), item.get("drawing_ref"))
        if text in {str(value or "").lower().strip() for value in exact_values}:
            return [dict(item)]
    aliases = {"温度": ("TEMP-PT100", "SPINDLE-ASSY", "COOLING-PUMP"), "过热": ("TEMP-PT100", "SPINDLE-ASSY", "COOLING-PUMP"), "冷却": ("COOLING-PUMP", "SPINDLE-ASSY"), "主轴": ("SPINDLE-ASSY", "TEMP-PT100", "VIB-SENSOR", "COOLING-PUMP"), "振动": ("VIB-SENSOR", "SPINDLE-ASSY")}
    ids: list[str] = []
    for token, component_ids in aliases.items():
        if token in text:
            ids.extend(item_id for item_id in component_ids if item_id not in ids)
    for item in CATALOG:
        haystack = " ".join(str(item.get(key, "")) for key in ("component_id", "part_no", "name", "position", "drawing_ref")).lower()
        if any(term and term in haystack for term in text.replace("/", " ").replace("-", " ").split()):
            if item["component_id"] not in ids:
                ids.append(item["component_id"])
    by_id = {item["component_id"]: item for item in CATALOG}
    return [dict(by_id[item_id]) for item_id in ids if item_id in by_id]


def _bom(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item["component_id"], "part_no": item["part_no"], "name": item["name"], "quantity": item["quantity"], "material": item["material"], "drawing_ref": item["drawing_ref"]}


def _drawing(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"drawing_id": item["drawing_ref"], "component_id": item["component_id"], "title": "%s 工程图" % item["name"], "format": "DXF/DWG", "sheet": "A3", "source": "document-cad-service"}


def _relation(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item["component_id"], "part_no": item["part_no"], "relation": item["assembly_relation"], "location": item["position"], "drawing_ref": item["drawing_ref"]}


def _location(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item["component_id"], "part_no": item["part_no"], "location": item["position"], "drawing_ref": item["drawing_ref"]}
