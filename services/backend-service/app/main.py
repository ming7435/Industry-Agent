"""后端业务服务和 MCP 工具端点。"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .workorder import BackendBusinessService
from .workorder.repository import BusinessStoreError


class ToolCall(BaseModel):
    tool: str
    arguments: dict[str, Any] = Field(default_factory=dict)


app = FastAPI(title="Industry Agent Backend Service", version="1.0.0")
_service: BackendBusinessService | None = None
_startup_error: str = ""
BUSINESS_TOOLS = {
    "create_workorder", "get_workorder", "query_workorder", "list_workorders", "delete_workorder", "update_workorder",
    "assign_workorder", "submit_repair_feedback", "mark_repair_completed", "close_workorder",
    "reopen_workorder", "get_workorder_template", "submit_workorder_draft", "get_production_status",
    "query_technicians", "query_technician_skills", "query_technician_workload", "query_shift",
    "query_team_availability", "query_spare_part", "query_inventory", "query_stock",
    "query_part_availability", "persist_report", "get_report", "list_reports", "delete_report", "save_experience",
    "search_experience", "create_quality_check", "list_quality_checks", "get_quality_check",
    "submit_quality_appeal", "create_closure_task", "list_closure_tasks", "complete_closure_task",
    "reinspect_quality_check", "release_quality_check", "close_quality_check",
    "list_audit_logs",
}
QMS_TOOLS = {
    "get_production_part", "get_part_specification", "inspect_part_dimensions",
    "inspect_part_appearance", "inspect_part_material", "inspect_part_function", "inspect_part_process",
}


def get_service() -> BackendBusinessService:
    global _service, _startup_error
    if _service is None:
        try:
            _service = BackendBusinessService()
        except Exception as error:  # 就绪检查报告该错误，但不影响存活检查
            _startup_error = str(error)
            raise
    return _service


@app.get("/health")
def health() -> dict[str, Any]:
    try:
        service = get_service()
        return {"status": "ok", "service": "backend-service", "ready": True, "dependencies": {"mysql": getattr(service.repository, "__class__", type(service.repository)).__name__}}
    except Exception as error:
        return JSONResponse(status_code=503, content={"status": "unavailable", "service": "backend-service", "ready": False, "dependencies": {"mysql": "unavailable"}, "error": str(error)})


@app.post("/tools/call")
def call_tool(request: ToolCall) -> dict[str, Any]:
    try:
        service = get_service()
        arguments = dict(request.arguments)
        tool = request.tool
        if tool in BUSINESS_TOOLS:
            result = getattr(service, tool)(**arguments)
        elif tool in QMS_TOOLS:
            result = service.qms(tool, **arguments)
        else:
            raise HTTPException(status_code=404, detail="未注册 Backend 工具：%s" % tool)
        return dict(result or {})
    except HTTPException:
        raise
    except (KeyError, ValueError, BusinessStoreError) as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/api/workorders/{workorder_id}")
def get_workorder(workorder_id: str) -> dict[str, Any]:
    return call_tool(ToolCall(tool="get_workorder", arguments={"workorder_id": workorder_id}))


@app.get("/api/workorders")
def list_workorders() -> dict[str, Any]:
    return call_tool(ToolCall(tool="list_workorders", arguments={}))


@app.delete("/api/workorders/{workorder_id}")
def delete_workorder(workorder_id: str) -> dict[str, Any]:
    result = call_tool(ToolCall(tool="delete_workorder", arguments={"workorder_id": workorder_id}))
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="工单不存在：%s" % workorder_id)
    return result


@app.get("/api/reports")
def list_reports() -> dict[str, Any]:
    return call_tool(ToolCall(tool="list_reports", arguments={}))


@app.get("/api/reports/{report_id}")
def get_report(report_id: str) -> dict[str, Any]:
    result = call_tool(ToolCall(tool="get_report", arguments={"report_id": report_id}))
    if not result.get("found"):
        raise HTTPException(status_code=404, detail="报告不存在：%s" % report_id)
    return result


@app.delete("/api/reports/{report_id}")
def delete_report(report_id: str) -> dict[str, Any]:
    result = call_tool(ToolCall(tool="delete_report", arguments={"report_id": report_id}))
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="报告不存在：%s" % report_id)
    return result
