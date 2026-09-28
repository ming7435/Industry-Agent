"""Agent Service 的 FastAPI 入口。"""

from __future__ import annotations

from typing import Any, Callable, Dict, Mapping
from pathlib import Path

_load_dotenv: Callable[..., Any] | None
try:
    from dotenv import load_dotenv as _load_dotenv
except ImportError:  # pragma: no cover - 仅在库模式缺少可选依赖时触发
    _load_dotenv = None

import hmac
import os

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.schemas.agent import ApprovalRequest, AbnormalEventRequest, RejectionRequest, UserQuestionRequest
from app.api.schemas.closure import ClosureTaskRequest, QualityCloseRequest, QualityReinspectionRequest
from app.api.schemas.memory import ExperienceSearchRequest
from app.api.schemas.quality import PartQualityRequest, QualityAppealRequest, QualityCheckRequest
from app.api.schemas.rag import RAGIngestRequest
from app.api.schemas.workorder import RepairFeedbackRequest, WorkOrderActionRequest, WorkOrderCreateRequest
from app.graph import AgentOrchestrator, build_orchestrator
from app.harness.runs import build_run_records
from app.runtime.event_store import EventResultStore
from app.tools.report.generate_report_file import get_report_file_path
from app.clients.backend import BackendServiceError


def _load_project_env() -> None:
    """构造编排器前加载仓库环境变量。

    Agent Service 经常从仓库根目录使用 ``--app-dir`` 启动，但 ``uvicorn`` 不会自动加载 ``.env``。
    如果缺少这一步，重启后即使项目配置了远程 RAG 服务，也会静默丢失 ``RAG_SERVICE_BASE_URL`` 并回退到演示索引。
    """

    if _load_dotenv is None:
        return
    project_root = Path(__file__).resolve().parents[4]
    _load_dotenv(project_root / ".env", override=False)


_load_project_env()


def require_write_auth(request: Request) -> str:
    """验证写操作令牌；未配置令牌时保持本地开发兼容。"""

    expected = os.getenv("AGENT_API_TOKEN", "").strip()
    if not expected:
        return "local-development"
    authorization = request.headers.get("Authorization", "")
    bearer = authorization[7:].strip() if authorization.lower().startswith("bearer ") else ""
    supplied = request.headers.get("X-API-Key", "").strip() or bearer
    if not supplied or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="写操作需要有效的 API 令牌")
    return "api-token"


def serialize_api_response(value: Any) -> Dict[str, Any]:
    """将内部模型统一转换为 FastAPI 可返回的字典。"""

    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


def compact_question_response(value: Any) -> Dict[str, Any]:
    """保留证据，同时限制工作台问答响应的大小。"""

    payload = dict(value or {})
    result = {
        key: payload[key]
        for key in (
            "task_id",
            "trace_id",
            "entry",
            "user_text",
            "context",
            "route",
            "route_result",
            "status",
            "errors",
            "evidence_status",
            "stop_reason",
        )
        if key in payload
    }
    diagnosis = payload.get("diagnosis")
    if isinstance(diagnosis, dict):
        result["diagnosis"] = {
            key: diagnosis[key]
            for key in (
                "status",
                "summary",
                "diagnosis",
                "confidence",
                "evidence",
                "recommendation",
                "alarm_definition",
                "validation_errors",
                "stop_reason",
            )
            if key in diagnosis
        }
    knowledge = payload.get("knowledge")
    if isinstance(knowledge, dict):
        result["knowledge"] = {
            key: knowledge[key]
            for key in (
                "query",
                "filters",
                "status",
                "summary",
                "answer",
                "confidence",
                "possible_causes",
                "recommended_checks",
                "documents",
                "sources",
                "total",
                "backend_status",
                "degraded",
                "warning",
                "retrieval_scope",
                "retrieval_fallback",
                "retrieval_fallback_reason",
                "validation_findings",
                "stop_reason",
            )
            if key in knowledge
        }
    return result


_TRACE_SUMMARY_FIELDS = (
    "timestamp", "type", "name", "node", "agent", "event", "task_id", "trace_id",
    "tool_name", "tool", "mcp_server", "latency", "latency_ms", "execution_time",
    "elapsed_ms", "error", "allowed", "step", "skill", "keys",
)


def compact_trace_summary(records: Any) -> list[Dict[str, Any]]:
    """返回精简的轨迹索引；完整数据仍可通过 trace_id 查询。"""

    if not isinstance(records, list):
        return []
    return [
        {key: item[key] for key in _TRACE_SUMMARY_FIELDS if key in item}
        for item in records
        if isinstance(item, Mapping)
    ]


def create_app(orchestrator: AgentOrchestrator | None = None) -> FastAPI:
    app = FastAPI(title="Industrial Maintenance Agent Service", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:8001", "http://localhost:8001"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    runtime = orchestrator or build_orchestrator()
    event_results = EventResultStore()

    def closure_call(callable_: Callable[..., Dict[str, Any]], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """把质检闭环的业务拒绝转换成可读的 HTTP 状态。"""

        try:
            return callable_(*args, **kwargs)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        except (ValueError, BackendServiceError) as error:
            status_code = getattr(error, "status_code", None) or 409
            if status_code < 400 or status_code >= 600:
                status_code = 409
            raise HTTPException(status_code=status_code, detail=str(error)) from error

    @app.get("/health")
    def health() -> Dict[str, Any]:
        """检查 Runtime 容器是否已就绪。"""

        return {"status": "ok", "service": "agent-service", "runtime": "ready"}

    @app.post("/api/agent/question", deprecated=True, dependencies=[Depends(require_write_auth)])
    @app.post("/api/v1/agent/question", dependencies=[Depends(require_write_auth)])
    def question(request: UserQuestionRequest) -> Dict[str, Any]:
        return runtime.run_user(request.user_text, request.context)

    @app.post("/api/agent/question/summary", deprecated=True, dependencies=[Depends(require_write_auth)])
    @app.post("/api/v1/agent/question/summary", dependencies=[Depends(require_write_auth)])
    def question_summary(request: UserQuestionRequest) -> Dict[str, Any]:
        return compact_question_response(runtime.run_user(request.user_text, request.context))

    @app.post("/api/agent/event", deprecated=True, dependencies=[Depends(require_write_auth)])
    @app.post("/api/v1/agent/event", dependencies=[Depends(require_write_auth)])
    def abnormal_event(request: AbnormalEventRequest) -> Dict[str, Any]:
        event = dict(request.event or {})
        event_id = str(event.get("event_id") or "")
        return event_results.get_or_create(event_id, lambda: runtime.run_abnormal_event(event))

    @app.get("/api/rag/status", deprecated=True)
    @app.get("/api/v1/rag/status")
    def rag_status() -> Dict[str, Any]:
        return runtime.container.registry.rag_status()

    @app.get("/api/rag/search", deprecated=True)
    @app.get("/api/v1/rag/search")
    def rag_search(query: str, limit: int = 5) -> Dict[str, Any]:
        return runtime.container.registry.search_knowledge(query, limit=limit)

    @app.post("/api/rag/ingest", deprecated=True, dependencies=[Depends(require_write_auth)])
    @app.post("/api/v1/rag/ingest", dependencies=[Depends(require_write_auth)])
    def rag_ingest(request: RAGIngestRequest) -> Dict[str, Any]:
        return runtime.container.registry.ingest_knowledge(request.path, request.collection)

    @app.get("/api/trace", deprecated=True)
    @app.get("/api/v1/trace")
    def trace(trace_id: str | None = None, task_id: str | None = None, limit: int = 100, summary: bool = False) -> Dict[str, Any]:
        records = runtime.container.trace.list(trace_id=trace_id, task_id=task_id, limit=max(1, min(limit, 5000)))
        return {"trace": compact_trace_summary(records) if summary else records}

    @app.get("/api/runs", deprecated=True)
    @app.get("/api/v1/runs")
    def runs(limit: int = 5000) -> Dict[str, Any]:
        """每次故障、独立 RAG 问答或质检运行返回一条记录。"""

        records = runtime.container.trace.list(limit=max(1, min(limit, 5000)))
        items = build_run_records(records)
        return {"runs": items, "count": len(items)}

    @app.get("/api/v1/runtime/approvals")
    def runtime_approvals(status: str = "") -> Dict[str, Any]:
        manager = getattr(runtime.container, "approvals", None)
        if manager is None:
            raise HTTPException(status_code=503, detail="approval manager unavailable")
        items = manager.list(status=status)
        return {"items": items, "count": len(items)}

    @app.get("/api/v1/runtime/approvals/{pending_id}")
    def runtime_approval(pending_id: str) -> Dict[str, Any]:
        manager = getattr(runtime.container, "approvals", None)
        if manager is None:
            raise HTTPException(status_code=503, detail="approval manager unavailable")
        record = manager.get(pending_id)
        if record is None:
            raise HTTPException(status_code=404, detail="pending task not found")
        return record

    @app.post("/api/v1/runtime/approvals/{pending_id}/approve", dependencies=[Depends(require_write_auth)])
    def approve_runtime_task(pending_id: str, request: ApprovalRequest, actor: str = Depends(require_write_auth)) -> Dict[str, Any]:
        manager = getattr(runtime.container, "approvals", None)
        if manager is None:
            raise HTTPException(status_code=503, detail="approval manager unavailable")
        try:
            approved_by = actor if actor != "local-development" else request.approved_by
            return manager.approve(pending_id, approved_by=approved_by, note=request.note)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @app.post("/api/v1/runtime/approvals/{pending_id}/reject", dependencies=[Depends(require_write_auth)])
    def reject_runtime_task(pending_id: str, request: RejectionRequest, actor: str = Depends(require_write_auth)) -> Dict[str, Any]:
        manager = getattr(runtime.container, "approvals", None)
        if manager is None:
            raise HTTPException(status_code=503, detail="approval manager unavailable")
        try:
            rejected_by = actor if actor != "local-development" else request.rejected_by
            return manager.reject(pending_id, rejected_by=rejected_by, reason=request.reason)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @app.get("/api/memory/recent")
    def memory_recent(limit: int = 20) -> Dict[str, Any]:
        result = runtime.container.operations.execute_memory("recent", {"limit": max(1, min(limit, 100))}, from_agent="router")
        return {"items": result.get("items", []), "count": result.get("count", 0), "backend": result.get("backend", "")}

    @app.get("/api/memory/search")
    def memory_search(
        device_id: str = "",
        device_model: str = "",
        alarm_code: str = "",
        fault_type: str = "",
        component: str = "",
        part_no: str = "",
        query: str = "",
        limit: int = 20,
    ) -> Dict[str, Any]:
        result = runtime.container.operations.execute_memory("search", {
            "device_id": device_id,
            "device_model": device_model,
            "alarm_code": alarm_code,
            "fault_type": fault_type,
            "component": component,
            "part_no": part_no,
            "query": query,
            "limit": max(1, min(limit, 100)),
        }, from_agent="router")
        return result

    @app.get("/api/workorders")
    def workorders() -> Dict[str, Any]:
        result = runtime.container.operations.execute_workorder("query", {}, from_agent="router")
        return {"items": result.get("items", []), "count": len(result.get("items", [])), "backend": "workorder-agent"}

    @app.post("/api/workorders", dependencies=[Depends(require_write_auth)])
    def workorder_create(request: WorkOrderCreateRequest) -> Dict[str, Any]:
        return runtime.container.operations.execute_workorder("create", request.model_dump(mode="json"), from_agent="router")

    @app.get("/api/workorders/{workorder_id}")
    def workorder(workorder_id: str) -> Dict[str, Any]:
        return runtime.container.operations.execute_workorder("query", {"workorder_id": workorder_id}, from_agent="router")

    @app.delete("/api/workorders/{workorder_id}", dependencies=[Depends(require_write_auth)])
    def delete_workorder(workorder_id: str) -> Dict[str, Any]:
        result = runtime.container.registry.execute("delete_workorder", {"workorder_id": workorder_id}, context={"agent": "router", "step": "delete_workorder"})
        if not result.get("deleted"):
            raise HTTPException(status_code=404, detail="工单不存在：%s" % workorder_id)
        return result

    @app.get("/api/reports")
    def reports(workorder_id: str = "") -> Dict[str, Any]:
        """通过 Runtime 向报告工作台提供已持久化的报告。"""

        return runtime.container.registry.list_reports(workorder_id=workorder_id)

    def _load_report(report_id: str) -> tuple[str, Dict[str, Any]]:
        """从当前配置的报告存储读取报告，并兼容历史外层编号。"""

        registry = runtime.container.registry
        result = registry.mcp.call("mes", "get_report", {"report_id": report_id}) if registry.backend_base_url else registry.report_store.get(report_id)
        if isinstance(result, dict) and "report" in result:
            if result.get("found", result.get("success", bool(result.get("report")))):
                return report_id, dict(result.get("report") or {})
        if result and not (isinstance(result, dict) and "report" in result):
            return report_id, dict(result)
        # 历史版本曾把报告包在 {report_id: 外层编号, report: {...}} 中，
        # 页面显示的是内层编号。通过列表回查一次，避免迁移或删除历史数据。
        list_reports = getattr(registry, "list_reports", None)
        listing = list_reports() if callable(list_reports) else {}
        for item in listing.get("items") or []:
            if not isinstance(item, Mapping):
                continue
            nested = item.get("report") if isinstance(item.get("report"), Mapping) else item
            if str(nested.get("report_id") or "") == str(report_id) or str(item.get("report_id") or "") == str(report_id):
                return str(item.get("report_id") or nested.get("report_id") or report_id), dict(nested)
        raise HTTPException(status_code=404, detail="report not found")

    @app.get("/api/reports/{report_id}")
    def report(report_id: str) -> Dict[str, Any]:
        storage_id, report_value = _load_report(report_id)
        return {"success": True, "found": True, "report_id": storage_id, "report": report_value}

    @app.post("/api/reports/{report_id}/pdf", dependencies=[Depends(require_write_auth)])
    def generate_report_pdf(report_id: str) -> Dict[str, Any]:
        """根据已持久化报告生成真实 PDF 文件。"""

        _, report_value = _load_report(report_id)
        result = runtime.container.registry.generate_report_file(
            report=report_value,
            format="pdf",
            path=str(get_report_file_path(report_id, "pdf")),
        )
        if not result.get("success"):
            raise HTTPException(status_code=503, detail=result.get("error") or "PDF 生成失败")
        return {**result, "open_url": f"/api/reports/{report_id}/pdf", "download_url": f"/api/reports/{report_id}/pdf"}

    @app.get("/api/reports/{report_id}/pdf")
    def open_report_pdf(report_id: str, download: bool = False) -> FileResponse:
        """打开已生成的 PDF；传入 download=1 时强制浏览器下载。"""

        path = get_report_file_path(report_id, "pdf")
        if not path.is_file():
            raise HTTPException(status_code=404, detail="PDF 尚未生成，请先点击生成 PDF")
        filename = path.name
        disposition = "attachment" if download else "inline"
        return FileResponse(
            path,
            media_type="application/pdf",
            headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
        )

    @app.get("/api/cad/resolve")
    def resolve_cad(component: str = "", part_no: str = "", device_id: str = "") -> Dict[str, Any]:
        """返回维修图纸查看器使用的权威 CAD 元数据。"""

        query = part_no or component
        if not query:
            raise HTTPException(status_code=400, detail="component 或 part_no 不能为空")
        part = runtime.container.registry.execute("query_part", {"query": query, "component": component, "part_no": part_no, "device_id": device_id})
        relation = runtime.container.registry.execute("query_relation", {"query": query, "component": component, "part_no": part_no, "device_id": device_id})
        drawing = runtime.container.registry.execute("query_drawing", {"query": query, "component": component, "part_no": part_no, "device_id": device_id})
        parts = list(part.get("parts") or part.get("components") or [])
        requested_id = str(component or part_no or "").strip().casefold()
        if requested_id and ("-" in requested_id or requested_id.isalnum()):
            parts = [item for item in parts if str(item.get("component_id") or item.get("part_no") or "").strip().casefold() in {requested_id, str(part_no or "").strip().casefold()}]
        if not parts:
            raise HTTPException(status_code=404, detail="CAD 未找到部件：%s" % query)
        return {"success": True, "source": part.get("source") or "document-cad-service", "part": parts[0], "parts": parts, "relations": relation.get("relations") or relation.get("assembly_relations") or [], "locations": relation.get("locations") or [], "drawings": drawing.get("drawings") or []}

    @app.delete("/api/reports/{report_id}", dependencies=[Depends(require_write_auth)])
    def delete_report(report_id: str) -> Dict[str, Any]:
        storage_id, _ = _load_report(report_id)
        result = runtime.container.registry.delete_report(report_id=storage_id)
        if not result.get("deleted"):
            raise HTTPException(status_code=404, detail="report not found")
        for pdf_id in {str(report_id), str(storage_id)}:
            pdf_path = get_report_file_path(pdf_id, "pdf")
            if pdf_path.is_file():
                pdf_path.unlink()
        return result

    @app.post("/api/workorders/{workorder_id}/action", dependencies=[Depends(require_write_auth)])
    def workorder_action(workorder_id: str, request: WorkOrderActionRequest) -> Dict[str, Any]:
        payload = request.model_dump(mode="json")
        payload["workorder_id"] = workorder_id
        payload["repair_feedback"] = payload.get("repair_feedback") or payload.get("feedback") or ""
        return runtime.container.operations.execute_workorder(request.action, payload, from_agent="router")

    @app.post("/api/v1/workorders/{workorder_id}/feedback", dependencies=[Depends(require_write_auth)])
    def submit_feedback_v1(workorder_id: str, request: RepairFeedbackRequest) -> Dict[str, Any]:
        feedback = request.model_dump(mode="json")
        return runtime.container.operations.execute_workorder("submit_feedback", {"workorder_id": workorder_id, "repair_feedback": feedback}, from_agent="router")

    @app.post("/api/v1/workorders/{workorder_id}/complete", dependencies=[Depends(require_write_auth)])
    def complete_workorder_v1(workorder_id: str, request: RepairFeedbackRequest) -> Dict[str, Any]:
        feedback = request.model_dump(mode="json")
        return runtime.container.operations.execute_workorder(
            "mark_repair_completed",
            {
                "workorder_id": workorder_id,
                "repair_feedback": feedback,
                "repair_verification": feedback.get("verification") or {},
            },
            from_agent="router",
        )

    @app.post("/api/v1/quality/checks", dependencies=[Depends(require_write_auth)])
    def create_quality_check(request: QualityCheckRequest) -> Dict[str, Any]:
        return runtime.container.closure_service.create_quality_check(request.model_dump(mode="json"))

    @app.get("/api/v1/quality/checks")
    def list_quality_checks(target_id: str = "", status: str = "") -> Dict[str, Any]:
        items = runtime.container.closure_service.list_quality_checks(target_id=target_id, status=status)
        return {"items": items, "count": len(items), "backend": runtime.container.closure_service.backend}

    @app.get("/api/v1/closure/status")
    def closure_status() -> Dict[str, Any]:
        backend = runtime.container.closure_service.backend
        return {"backend": backend, "persistent": backend == "mysql"}

    @app.post("/api/v1/quality/checks/{check_id}/appeal", dependencies=[Depends(require_write_auth)])
    def appeal_quality_check(check_id: str, request: QualityAppealRequest) -> Dict[str, Any]:
        return runtime.container.closure_service.submit_appeal(check_id, request.model_dump(mode="json"))

    @app.post("/api/v1/closure-tasks", dependencies=[Depends(require_write_auth)])
    def create_closure_task(request: ClosureTaskRequest) -> Dict[str, Any]:
        return closure_call(runtime.container.closure_service.create_closure_task, request.model_dump(mode="json"))

    @app.get("/api/v1/closure-tasks")
    def list_closure_tasks(status: str = "") -> Dict[str, Any]:
        items = runtime.container.closure_service.list_closure_tasks(status=status)
        return {"items": items, "count": len(items), "backend": runtime.container.closure_service.backend}

    @app.post("/api/v1/closure-tasks/{task_id}/complete", dependencies=[Depends(require_write_auth)])
    def complete_closure_task(task_id: str, note: str = "") -> Dict[str, Any]:
        return closure_call(runtime.container.closure_service.complete_closure_task, task_id, note=note)

    @app.post("/api/v1/quality/checks/{check_id}/reinspect", dependencies=[Depends(require_write_auth)])
    def reinspect_quality_check(check_id: str, request: QualityReinspectionRequest) -> Dict[str, Any]:
        return closure_call(runtime.container.closure_service.record_reinspection, check_id, request.model_dump(mode="json"), operator=request.operator)

    @app.post("/api/v1/quality/checks/{check_id}/release", dependencies=[Depends(require_write_auth)])
    def release_quality_check(check_id: str, operator: str = "") -> Dict[str, Any]:
        return closure_call(runtime.container.closure_service.release_quality_check, check_id, operator=operator)

    @app.post("/api/v1/quality/checks/{check_id}/close", dependencies=[Depends(require_write_auth)])
    def close_quality_check(check_id: str, request: QualityCloseRequest) -> Dict[str, Any]:
        return closure_call(runtime.container.closure_service.close_quality_check, check_id, operator=request.operator, note=request.note)

    @app.get("/api/v1/audit-logs")
    def audit_logs(object_id: str = "", action: str = "") -> Dict[str, Any]:
        items = runtime.container.closure_service.audit_logs(object_id=object_id, action=action)
        return {"items": items, "count": len(items), "backend": runtime.container.closure_service.backend}

    @app.post("/api/quality/parts/{part_id}", dependencies=[Depends(require_write_auth)])
    def part_quality(part_id: str, request: PartQualityRequest) -> Dict[str, Any]:
        """通过 Orchestrator 的 A2A 入口检测生产零件质量。"""

        quality_result = runtime.container.operations.inspect_part(part_id, request.model_dump(mode="json"))
        return serialize_api_response(quality_result)

    @app.post("/api/experience/search", dependencies=[Depends(require_write_auth)])
    def experience_search(request: ExperienceSearchRequest) -> Dict[str, Any]:
        return runtime.container.operations.execute_memory("search", request.model_dump(mode="json"), from_agent="router")

    return app


app = create_app()
