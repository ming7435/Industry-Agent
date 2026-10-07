"""工程文档 CAD 服务。

生产环境可将 catalog 替换为 PLM、BOM 数据库和 DWG/DXF 解析流水线的仓储实现；
Agent 只通过 MCP 风格的结构化工具访问本服务。
"""

from __future__ import annotations

from typing import Any, Callable, Dict, Mapping

from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, Field

from .repository import CADRepositoryError, get_repository
from shared.local_drawings import device_reference_drawings


class ToolCall(BaseModel):
    tool: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


app = FastAPI(title="Document CAD Service", version="1.0.0")


@app.get("/health")
@app.get("/ready")
def health(response: Response) -> Dict[str, Any]:
    references = len(device_reference_drawings())
    try:
        repository = get_repository()
        synthetic = repository.backend == "demo-catalog"
        response.status_code = 503 if synthetic else 200
        return {"status": "degraded" if synthetic else "ok", "service": "document-cad-service", "records": repository.count(), "reference_drawings": references, "backend": repository.backend, "ready": not synthetic, "synthetic": synthetic, "degraded": synthetic}
    except CADRepositoryError as error:
        response.status_code = 503
        return {"status": "unavailable", "service": "document-cad-service", "records": 0, "reference_drawings": references, "backend": "unavailable", "ready": False, "synthetic": False, "degraded": True, "error": str(error)}


@app.post("/tools/call")
def call_tool(request: ToolCall) -> Dict[str, Any]:
    handlers: Dict[str, Callable[..., Dict[str, Any]]] = {
        "query_drawing": query_drawing,
        "query_bom": query_bom,
        "query_part": query_part,
        "query_relation": query_relation,
        "fetch_engineering_record": fetch_engineering_record,
    }
    handler = handlers.get(request.tool)
    if handler is None:
        raise HTTPException(status_code=404, detail="未注册 CAD 工具：%s" % request.tool)
    return handler(**request.arguments)


def query_part(query: str = "", component: str = "", part_no: str = "", device_id: str = "", device_model: str = "", drawing_id: str = "", version: str = "", include_history: bool = False, tenant_id: str = "", project_id: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no, device_id=device_id, device_model=device_model, drawing_id=drawing_id, version=version, include_history=include_history, component_id=component, part_no=part_no, tenant_id=tenant_id, project_id=project_id)
    return {"query": query or component or part_no, "parts": matched, **_response_meta()}


def query_bom(query: str = "", component: str = "", part_no: str = "", device_id: str = "", device_model: str = "", drawing_id: str = "", version: str = "", include_history: bool = False, tenant_id: str = "", project_id: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no, device_id=device_id, device_model=device_model, drawing_id=drawing_id, version=version, include_history=include_history, component_id=component, part_no=part_no, tenant_id=tenant_id, project_id=project_id)
    return {"query": query or component or part_no, "bom_items": [_bom(item) for item in matched], "engineering_status": "ready" if any(item.get("bom_items") for item in matched) else "insufficient_engineering_data", **_response_meta()}


def query_drawing(query: str = "", component: str = "", part_no: str = "", device_id: str = "", device_model: str = "", drawing_id: str = "", version: str = "", include_history: bool = False, tenant_id: str = "", project_id: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no, device_id=device_id, device_model=device_model, drawing_id=drawing_id, version=version, include_history=include_history, component_id=component, part_no=part_no, tenant_id=tenant_id, project_id=project_id)
    drawings = [_drawing(item) for item in matched] if matched else _reference_drawings(
        device_id=device_id, device_model=device_model, drawing_id=drawing_id, version=version,
        tenant_id=tenant_id, project_id=project_id, component=component, part_no=part_no)
    return {"query": query or component or part_no, "drawings": drawings,
            "engineering_status": "ready" if matched else "reference_only" if drawings else "insufficient_engineering_data", **_response_meta()}


def query_relation(query: str = "", component: str = "", component_id: str = "", part_no: str = "", device_id: str = "", device_model: str = "", drawing_id: str = "", version: str = "", include_history: bool = False, tenant_id: str = "", project_id: str = "", **_: Any) -> Dict[str, Any]:
    matched = _match(component_id or query or component or part_no, device_id=device_id, device_model=device_model, drawing_id=drawing_id, version=version, include_history=include_history, component_id=component_id or component, part_no=part_no, tenant_id=tenant_id, project_id=project_id)
    relations = [relation for item in matched for relation in (item.get("part_relations") or [])]
    return {"query": query or component_id or component or part_no, "relations": relations, "assembly_relations": relations, "locations": [_location(item) for item in matched if item.get("installation_location") or item.get("position")], **_response_meta()}


def fetch_engineering_record(query: str = "", component: str = "", part_no: str = "", **arguments: Any) -> Dict[str, Any]:
    matched = _match(query or component or part_no, component_id=component, part_no=part_no, **arguments)
    relations = [relation for item in matched for relation in (item.get("part_relations") or [])]
    drawings = [_drawing(item) for item in matched] if matched else _reference_drawings(component=component, part_no=part_no, **arguments)
    return {"query": query or component or part_no, "device_id": arguments.get("device_id", ""), "components": matched, "drawings": drawings, "bom_items": [_bom(item) for item in matched], "assembly_relations": relations, "part_relations": relations, "locations": [_location(item) for item in matched if item.get("installation_location") or item.get("position")],
            "engineering_status": "ready" if matched else "reference_only" if drawings else "insufficient_engineering_data", **_response_meta()}


def _reference_drawings(device_id: str = '', device_model: str = '', **filters: Any) -> list[Dict[str, Any]]:
    # The public engineering tool must not enumerate all devices for an unscoped request.
    if not str(device_id or '').strip() and not str(device_model or '').strip():
        return []
    return device_reference_drawings(device_id=device_id, device_model=device_model, **filters)


def _match(query: str, **filters: Any) -> list[Dict[str, Any]]:
    try:
        repository = get_repository()
        structured = {
            key: filters.get(key, "")
            for key in ("device_id", "device_model", "drawing_id", "version", "include_history", "tenant_id", "project_id", "component_id", "part_no")
        }
        values = repository.search(query, filters=structured)
        for key in ("device_id", "device_model", "drawing_id", "tenant_id", "project_id", "component_id", "part_no"):
            expected = str(filters.get(key) or "").strip()
            if expected:
                values = [item for item in values if str(item.get(key) or (item.get("drawing_ref") if key == "drawing_id" else "")) == expected]
        version = str(filters.get("version") or "").strip()
        if version:
            values = [item for item in values if version in {str(item.get("version_id") or ""), str(item.get("version_label") or "")}]
        elif not filters.get("include_history"):
            values = [item for item in values if item.get("current", True) is True]
        return values
    except CADRepositoryError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


def _bom(item: Mapping[str, Any]) -> Dict[str, Any]:
    if not item.get("bom_items"):
        return {"component_id": item.get("component_id", ""), "part_no": item.get("part_no", ""), "part_identity_status": item.get("part_identity_status", "unknown"), "name": item.get("name", ""), "quantity": item.get("quantity", 0), "material": item.get("material", ""), "drawing_ref": item.get("drawing_ref", ""), "status": "insufficient_engineering_data"}
    if item.get("bom_items"):
        return {"component_id": item["component_id"], "part_no": item["part_no"], "name": item["name"], "quantity": item["quantity"], "material": item["material"], "drawing_ref": item["drawing_ref"], "items": list(item["bom_items"])}
    return {"component_id": item["component_id"], "part_no": item["part_no"], "name": item["name"], "quantity": item["quantity"], "material": item["material"], "drawing_ref": item["drawing_ref"]}


def _drawing(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"drawing_id": item.get("drawing_ref", ""), "drawing_name": item.get("drawing_name") or "%s 工程图" % item.get("name", "部件"), "component_id": item.get("component_id", ""), "version_id": item.get("version_id", ""), "version_label": item.get("version_label", ""), "current": bool(item.get("current", True)), "source_format": item.get("source_format") or "unknown", "object_ref": item.get("object_ref") or "", "source": "document-cad-service",
            **{key: item[key] for key in ('drawing_url', 'model_url', 'viewer_url', 'mesh_id', 'mesh_name',
                                         'default_view', 'drawing_type', 'evidence_scope', 'engineering_status',
                                         'source_kind', 'source_path') if key in item}}


def _response_meta() -> Dict[str, Any]:
    repository = get_repository()
    synthetic = getattr(repository, "backend", "") == "demo-catalog"
    return {"source": "document-cad-service", "backend": getattr(repository, "backend", "unknown"), "synthetic": synthetic, "degraded": synthetic}


def _relation(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item.get("component_id", ""), "part_no": item.get("part_no", ""), "relation": item.get("assembly_relation", ""), "location": item.get("installation_location") or item.get("position") or "", "drawing_ref": item.get("drawing_ref", "")}


def _location(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item.get("component_id", ""), "part_no": item.get("part_no", ""), "location": item.get("installation_location") or item.get("position") or "", "drawing_ref": item.get("drawing_ref", "")}
