"""工程文档 CAD 服务。

生产环境可将 catalog 替换为 PLM、BOM 数据库和 DWG/DXF 解析流水线的仓储实现；
Agent 只通过 MCP 风格的结构化工具访问本服务。
"""

from __future__ import annotations

from typing import Any, Dict, Mapping

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .repository import CADRepositoryError, get_repository


class ToolCall(BaseModel):
    tool: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


app = FastAPI(title="Document CAD Service", version="1.0.0")


@app.get("/health")
def health() -> Dict[str, Any]:
    try:
        repository = get_repository()
        return {"status": "ok", "service": "document-cad-service", "records": repository.count(), "backend": repository.backend}
    except CADRepositoryError as error:
        return {"status": "unavailable", "service": "document-cad-service", "records": 0, "backend": "unavailable", "error": str(error)}


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
    relations = [relation for item in matched for relation in (item.get("part_relations") or [_relation(item)])]
    return {"query": query or component_id or component or part_no, "relations": relations, "assembly_relations": relations, "locations": [_location(item) for item in matched], "source": "document-cad-service"}


def fetch_engineering_record(query: str = "", component: str = "", part_no: str = "", **arguments: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no)
    relations = [relation for item in matched for relation in (item.get("part_relations") or [_relation(item)])]
    return {"query": query or component or part_no, "device_id": arguments.get("device_id", ""), "components": matched, "drawings": [_drawing(item) for item in matched], "bom_items": [_bom(item) for item in matched], "assembly_relations": relations, "part_relations": relations, "locations": [_location(item) for item in matched], "source": "document-cad-service"}


def _match(query: str) -> list[Dict[str, Any]]:
    try:
        return get_repository().search(query)
    except CADRepositoryError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


def _bom(item: Mapping[str, Any]) -> Dict[str, Any]:
    if item.get("bom_items"):
        return {"component_id": item["component_id"], "part_no": item["part_no"], "name": item["name"], "quantity": item["quantity"], "material": item["material"], "drawing_ref": item["drawing_ref"], "items": list(item["bom_items"])}
    return {"component_id": item["component_id"], "part_no": item["part_no"], "name": item["name"], "quantity": item["quantity"], "material": item["material"], "drawing_ref": item["drawing_ref"]}


def _drawing(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"drawing_id": item["drawing_ref"], "component_id": item["component_id"], "title": "%s 工程图" % item["name"], "format": "DXF/DWG", "sheet": "A3", "source": "document-cad-service"}


def _relation(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item["component_id"], "part_no": item["part_no"], "relation": item["assembly_relation"], "location": item["position"], "drawing_ref": item["drawing_ref"]}


def _location(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item["component_id"], "part_no": item["part_no"], "location": item["position"], "drawing_ref": item["drawing_ref"]}
