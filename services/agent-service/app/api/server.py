"""Agent Service 的 FastAPI 入口。"""

from __future__ import annotations

from typing import Any, Callable, Dict
from pathlib import Path

_load_dotenv: Callable[..., Any] | None
try:
    from dotenv import load_dotenv as _load_dotenv
except ImportError:  # pragma: no cover - 仅在库模式缺少可选依赖时触发
    _load_dotenv = None

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api.schemas.agent import ApprovalRequest, AbnormalEventRequest, RejectionRequest, UserQuestionRequest
from app.api.schemas.closure import ClosureTaskRequest
from app.api.schemas.memory import ExperienceSearchRequest
from app.api.schemas.quality import PartQualityRequest, QualityAppealRequest, QualityCheckRequest
from app.api.schemas.rag import RAGIngestRequest
from app.api.schemas.workorder import RepairFeedbackRequest, WorkOrderActionRequest, WorkOrderCreateRequest
from app.graph import AgentOrchestrator, build_orchestrator
from app.runtime.event_store import EventResultStore


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


def serialize_api_response(value: Any) -> Dict[str, Any]:
    """将内部模型统一转换为 FastAPI 可返回的字典。"""

    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


def compact_question_response(value: Any) -> Dict[str, Any]:
    """Keep the workbench Q&A response bounded while preserving evidence."""

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
                "validation_findings",
                "stop_reason",
            )
            if key in knowledge
        }
    return result


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

    @app.get("/health")
    def health() -> Dict[str, Any]:
        """Operational readiness probe for the Runtime container."""

        return {"status": "ok", "service": "agent-service", "runtime": "ready"}

    @app.post("/api/agent/question", deprecated=True)
    @app.post("/api/v1/agent/question")
    def question(request: UserQuestionRequest) -> Dict[str, Any]:
        return runtime.run_user(request.user_text, request.context)

    @app.post("/api/agent/question/summary", deprecated=True)
    @app.post("/api/v1/agent/question/summary")
    def question_summary(request: UserQuestionRequest) -> Dict[str, Any]:
        return compact_question_response(runtime.run_user(request.user_text, request.context))

    @app.post("/api/agent/event", deprecated=True)
    @app.post("/api/v1/agent/event")
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

    @app.post("/api/rag/ingest", deprecated=True)
    @app.post("/api/v1/rag/ingest")
    def rag_ingest(request: RAGIngestRequest) -> Dict[str, Any]:
        return runtime.container.registry.ingest_knowledge(request.path, request.collection)

    @app.get("/api/trace", deprecated=True)
    @app.get("/api/v1/trace")
    def trace(trace_id: str | None = None, task_id: str | None = None, limit: int = 100) -> Dict[str, Any]:
        return {"trace": runtime.container.trace.list(trace_id=trace_id, task_id=task_id, limit=max(1, min(limit, 5000)))}

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

    @app.post("/api/v1/runtime/approvals/{pending_id}/approve")
    def approve_runtime_task(pending_id: str, request: ApprovalRequest) -> Dict[str, Any]:
        manager = getattr(runtime.container, "approvals", None)
        if manager is None:
            raise HTTPException(status_code=503, detail="approval manager unavailable")
        try:
            return manager.approve(pending_id, approved_by=request.approved_by, note=request.note)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @app.post("/api/v1/runtime/approvals/{pending_id}/reject")
    def reject_runtime_task(pending_id: str, request: RejectionRequest) -> Dict[str, Any]:
        manager = getattr(runtime.container, "approvals", None)
        if manager is None:
            raise HTTPException(status_code=503, detail="approval manager unavailable")
        try:
            return manager.reject(pending_id, rejected_by=request.rejected_by, reason=request.reason)
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

    @app.post("/api/workorders")
    def workorder_create(request: WorkOrderCreateRequest) -> Dict[str, Any]:
        return runtime.container.operations.execute_workorder("create", request.model_dump(mode="json"), from_agent="router")

    @app.get("/api/workorders/{workorder_id}")
    def workorder(workorder_id: str) -> Dict[str, Any]:
        return runtime.container.operations.execute_workorder("query", {"workorder_id": workorder_id}, from_agent="router")

    @app.get("/api/reports")
    def reports(workorder_id: str = "") -> Dict[str, Any]:
        """Expose persisted reports to the Report workspace through Runtime."""

        return runtime.container.registry.list_reports(workorder_id=workorder_id)

    @app.get("/api/reports/{report_id}")
    def report(report_id: str) -> Dict[str, Any]:
        registry = runtime.container.registry
        result = registry.mcp.call("mes", "get_report", {"report_id": report_id}) if registry.backend_base_url else registry.report_store.get(report_id)
        if isinstance(result, dict) and "report" in result:
            return result
        if result:
            return {"success": True, "found": True, "report_id": report_id, "report": dict(result)}
        raise HTTPException(status_code=404, detail="report not found")

    @app.post("/api/workorders/{workorder_id}/action")
    def workorder_action(workorder_id: str, request: WorkOrderActionRequest) -> Dict[str, Any]:
        payload = request.model_dump(mode="json")
        payload["workorder_id"] = workorder_id
        payload["repair_feedback"] = payload.get("repair_feedback") or payload.get("feedback") or ""
        return runtime.container.operations.execute_workorder(request.action, payload, from_agent="router")

    @app.post("/api/v1/workorders/{workorder_id}/feedback")
    def submit_feedback_v1(workorder_id: str, request: RepairFeedbackRequest) -> Dict[str, Any]:
        feedback = request.model_dump(mode="json")
        return runtime.container.operations.execute_workorder("submit_feedback", {"workorder_id": workorder_id, "repair_feedback": feedback}, from_agent="router")

    @app.post("/api/v1/workorders/{workorder_id}/complete")
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

    @app.post("/api/v1/quality/checks")
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

    @app.post("/api/v1/quality/checks/{check_id}/appeal")
    def appeal_quality_check(check_id: str, request: QualityAppealRequest) -> Dict[str, Any]:
        return runtime.container.closure_service.submit_appeal(check_id, request.model_dump(mode="json"))

    @app.post("/api/v1/closure-tasks")
    def create_closure_task(request: ClosureTaskRequest) -> Dict[str, Any]:
        return runtime.container.closure_service.create_closure_task(request.model_dump(mode="json"))

    @app.get("/api/v1/closure-tasks")
    def list_closure_tasks(status: str = "") -> Dict[str, Any]:
        items = runtime.container.closure_service.list_closure_tasks(status=status)
        return {"items": items, "count": len(items), "backend": runtime.container.closure_service.backend}

    @app.post("/api/v1/closure-tasks/{task_id}/complete")
    def complete_closure_task(task_id: str, note: str = "") -> Dict[str, Any]:
        return runtime.container.closure_service.complete_closure_task(task_id, note=note)

    @app.get("/api/v1/audit-logs")
    def audit_logs(object_id: str = "", action: str = "") -> Dict[str, Any]:
        items = runtime.container.closure_service.audit_logs(object_id=object_id, action=action)
        return {"items": items, "count": len(items), "backend": runtime.container.closure_service.backend}

    @app.post("/api/quality/parts/{part_id}")
    def part_quality(part_id: str, request: PartQualityRequest) -> Dict[str, Any]:
        """通过 Orchestrator 的 A2A 入口检测生产零件质量。"""

        quality_result = runtime.container.operations.inspect_part(part_id, request.model_dump(mode="json"))
        return serialize_api_response(quality_result)

    @app.post("/api/experience/search")
    def experience_search(request: ExperienceSearchRequest) -> Dict[str, Any]:
        return runtime.container.operations.execute_memory("search", request.model_dump(mode="json"), from_agent="router")

    return app


app = create_app()
