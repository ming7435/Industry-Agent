"""Agent Service 的 FastAPI 入口。"""

from __future__ import annotations

from typing import Any, Dict
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional for library-only usage
    load_dotenv = None

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.graph import AgentOrchestrator, build_orchestrator


def _load_project_env() -> None:
    """Load the repository environment before constructing the orchestrator.

    The Agent service is often launched with ``--app-dir`` from the repository
    root, but ``uvicorn`` does not load ``.env`` by itself. Without this step a
    restart silently drops ``RAG_SERVICE_BASE_URL`` and falls back to the demo
    index even though the project is configured for the remote RAG service.
    """

    if load_dotenv is None:
        return
    project_root = Path(__file__).resolve().parents[4]
    load_dotenv(project_root / ".env", override=False)


_load_project_env()


class UserQuestionRequest(BaseModel):
    user_text: str = Field(min_length=1)
    context: Dict[str, Any] = Field(default_factory=dict)


class AbnormalEventRequest(BaseModel):
    event: Dict[str, Any]


class RAGIngestRequest(BaseModel):
    path: str = Field(min_length=1)
    collection: str = ""


class WorkOrderCreateRequest(BaseModel):
    device_id: str = Field(default="unknown", min_length=1)
    title: str = Field(default="设备维修工单", min_length=1)
    plan_id: str = ""
    steps: list[str] = Field(default_factory=list)
    assignee: str = ""
    repair_target: Dict[str, Any] = Field(default_factory=dict)
    drawing_context: Dict[str, Any] = Field(default_factory=dict)
    alarm_code: str = ""
    diagnosis_context: Dict[str, Any] = Field(default_factory=dict)


class WorkOrderActionRequest(BaseModel):
    action: str = Field(default="update", pattern="^(assign|update|submit_feedback|mark_repair_completed|close|reopen)$")
    status: str = "in_progress"
    assignee: str = ""
    feedback: str = ""
    repair_feedback: Dict[str, Any] | str = Field(default_factory=dict)


class ExperienceSearchRequest(BaseModel):
    device_id: str = ""
    device_model: str = ""
    alarm_code: str = ""
    fault_type: str = ""
    component: str = ""
    part_no: str = ""
    query: str = ""
    limit: int = Field(default=20, ge=1, le=100)


def serialize_api_response(value: Any) -> Dict[str, Any]:
    """将内部模型统一转换为 FastAPI 可返回的字典。"""

    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "to_dict"):
        return value.to_dict()
    return dict(value or {})


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

    @app.post("/api/agent/question")
    def question(request: UserQuestionRequest) -> Dict[str, Any]:
        return runtime.run_user(request.user_text, request.context)

    @app.post("/api/agent/event")
    def abnormal_event(request: AbnormalEventRequest) -> Dict[str, Any]:
        return runtime.run_abnormal_event(request.event)

    @app.get("/api/rag/status")
    def rag_status() -> Dict[str, Any]:
        return runtime.nodes.registry.rag_status()

    @app.get("/api/rag/search")
    def rag_search(query: str, limit: int = 5) -> Dict[str, Any]:
        return runtime.nodes.registry.search_knowledge(query, limit=limit)

    @app.post("/api/rag/ingest")
    def rag_ingest(request: RAGIngestRequest) -> Dict[str, Any]:
        return runtime.nodes.registry.ingest_knowledge(request.path, request.collection)

    @app.get("/api/trace")
    def trace() -> Dict[str, Any]:
        return {"trace": runtime.nodes.trace_records()}

    @app.get("/api/memory/recent")
    def memory_recent(limit: int = 20) -> Dict[str, Any]:
        result = runtime.nodes.execute_memory("recent", {"limit": max(1, min(limit, 100))}, from_agent="router")
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
        result = runtime.nodes.execute_memory("search", {
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
        result = runtime.nodes.execute_workorder("query", {}, from_agent="router")
        return {"items": result.get("items", []), "count": len(result.get("items", [])), "backend": "workorder-agent"}

    @app.post("/api/workorders")
    def workorder_create(request: WorkOrderCreateRequest) -> Dict[str, Any]:
        return runtime.nodes.execute_workorder("create", request.model_dump(mode="json"), from_agent="router")

    @app.get("/api/workorders/{workorder_id}")
    def workorder(workorder_id: str) -> Dict[str, Any]:
        return runtime.nodes.execute_workorder("query", {"workorder_id": workorder_id}, from_agent="router")

    @app.post("/api/workorders/{workorder_id}/action")
    def workorder_action(workorder_id: str, request: WorkOrderActionRequest) -> Dict[str, Any]:
        payload = request.model_dump(mode="json")
        payload["workorder_id"] = workorder_id
        payload["repair_feedback"] = payload.get("repair_feedback") or payload.get("feedback") or ""
        return runtime.nodes.execute_workorder(request.action, payload, from_agent="router")

    @app.post("/api/workorders/{workorder_id}/quality")
    def workorder_quality(workorder_id: str) -> Dict[str, Any]:
        return runtime.nodes.quality_workorder(workorder_id)

    @app.post("/api/experience/search")
    def experience_search(request: ExperienceSearchRequest) -> Dict[str, Any]:
        return runtime.nodes.execute_memory("search", request.model_dump(mode="json"), from_agent="router")

    return app


app = create_app()
