"""Agent Service 的 FastAPI 入口。"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.graph import AgentOrchestrator, build_orchestrator


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


class WorkOrderActionRequest(BaseModel):
    action: str = Field(default="update", pattern="^(update|close)$")
    status: str = "in_progress"
    assignee: str = ""


class ExperienceSearchRequest(BaseModel):
    device_id: str = ""
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
        return {"items": runtime.nodes.short_memory.recent(limit=max(1, min(limit, 100))), "backend": runtime.nodes.short_memory.backend}

    @app.get("/api/memory/search")
    def memory_search(device_id: str = "", limit: int = 20) -> Dict[str, Any]:
        return {"items": runtime.nodes.long_memory.search(device_id=device_id, limit=max(1, min(limit, 100))), "backend": runtime.nodes.long_memory.backend}

    @app.get("/api/workorders")
    def workorders() -> Dict[str, Any]:
        return {"items": runtime.nodes.workorder_service.list()}

    @app.post("/api/workorders")
    def workorder_create(request: WorkOrderCreateRequest) -> Dict[str, Any]:
        return runtime.nodes.workorder_service.create(
            device_id=request.device_id,
            title=request.title,
            plan_id=request.plan_id,
            steps=request.steps,
            assignee=request.assignee,
        )

    @app.get("/api/workorders/{workorder_id}")
    def workorder(workorder_id: str) -> Dict[str, Any]:
        return runtime.nodes.workorder_service.get(workorder_id)

    @app.post("/api/workorders/{workorder_id}/action")
    def workorder_action(workorder_id: str, request: WorkOrderActionRequest) -> Dict[str, Any]:
        if request.action == "close":
            return runtime.nodes.workorder_service.close(workorder_id)
        return runtime.nodes.workorder_service.update(
            workorder_id,
            status=request.status,
            assignee=request.assignee,
        )

    @app.post("/api/workorders/{workorder_id}/quality")
    def workorder_quality(workorder_id: str) -> Dict[str, Any]:
        return runtime.nodes.quality_workorder(workorder_id)

    @app.post("/api/experience/search")
    def experience_search(request: ExperienceSearchRequest) -> Dict[str, Any]:
        return runtime.nodes.experience_module.search(request.device_id, request.limit)

    return app


app = create_app()
