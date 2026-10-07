"""Agent Service 的 FastAPI 入口。"""

from __future__ import annotations

from typing import Any, Callable, Dict, Mapping
from pathlib import Path
from uuid import uuid4

_load_dotenv: Callable[..., Any] | None
try:
    from dotenv import load_dotenv as _load_dotenv
except ImportError:  # pragma: no cover - 仅在库模式缺少可选依赖时触发
    _load_dotenv = None

import hmac
from hashlib import sha256
import json
import os
from urllib.error import HTTPError

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from app.api.schemas.agent import ApprovalRequest, AbnormalEventRequest, RejectionRequest, UserQuestionRequest
from app.api.schemas.closure import ClosureTaskRequest, QualityCloseRequest, QualityReinspectionRequest
from app.api.schemas.memory import ExperienceSearchRequest
from app.api.schemas.quality import PartQualityRequest, QualityAppealRequest, QualityAppealResolutionRequest, QualityCheckRequest
from app.api.schemas.rag import RAGIngestRequest
from app.api.schemas.workorder import RepairFeedbackRequest, WorkOrderActionRequest, WorkOrderCreateRequest
from app.graph import AgentOrchestrator, build_orchestrator
from app.harness.runs import build_run_records
from app.runtime.event_store import EventResultConflict, EventResultStore, scoped_event_key
from app.runtime.durable_store import PendingResultError
from app.tools.report.generate_report_file import get_report_file_path
from app.tools.query_contracts import QueryArgumentError
from app.clients.backend import BackendServiceError
from app.clients.backend import BackendServiceClient
from app.api.team_auth import team_actor, require_assignee, human_action
from app.api.maintenance_plans import list_saved_maintenance_plans


class MaintenancePlanDeleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    plan_ids: list[str] = Field(min_length=1, max_length=100)


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
    """验证写操作令牌；仅开发环境允许未配置令牌。"""

    expected = os.getenv("AGENT_API_TOKEN", "").strip()
    if not expected:
        if os.getenv("APP_ENV", "development").strip().lower() in {"prod", "production"}:
            raise HTTPException(status_code=503, detail="写操作身份验证未配置")
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
    'agent_run_id', 'tool_call_id', 'step_run_id', 'run_type', 'event_id', 'trace_record_id',
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


def event_result_key(event: Mapping[str, Any]) -> str:
    """提交和回查使用完全相同的租户、设备、事件、修订作用域。"""

    try:
        return scoped_event_key(event)
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail="event_revision 必须是正整数") from error


def compact_event_result(value: Mapping[str, Any]) -> Dict[str, Any]:
    """回查保留业务结果，不复制完整轨迹和递归 Runtime 上下文。"""

    fields = ("task_id", "trace_id", "entry", "event", "route", "route_result", "diagnosis",
              "knowledge", "cad", "maintenance_plan", "workorder", "report", "status", "errors",
              "evidence_status", "stop_reason", "goal_event")
    result = {key: value[key] for key in fields if key in value}
    runtime_result = value.get("runtime_result")
    if isinstance(runtime_result, Mapping):
        result["runtime_result"] = {key: runtime_result[key] for key in
                                    ("status", "stop_reason", "iterations", "evidence_score") if key in runtime_result}
    return result


def create_app(orchestrator: AgentOrchestrator | None = None) -> FastAPI:
    app = FastAPI(title="Industrial Maintenance Agent Service", version="1.0.0")

    @app.middleware("http")
    async def authenticate_api_reads(request: Request, call_next: Callable[..., Any]) -> Any:
        """为所有业务读取入口施加与写入相同的服务令牌边界。"""

        if request.method == "GET" and request.url.path.startswith("/api/"):
            try:
                require_write_auth(request)
            except HTTPException as error:
                return JSONResponse(status_code=error.status_code, content={"detail": error.detail})
        return await call_next(request)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:8001", "http://localhost:8001"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    runtime = orchestrator or build_orchestrator()
    event_results = EventResultStore()
    runtime.container.event_results = event_results
    app.add_event_handler("shutdown", event_results.close)

    def closure_call(callable_: Callable[..., Dict[str, Any]], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """把质检闭环的业务拒绝转换成可读的 HTTP 状态。"""

        try:
            return callable_(*args, **kwargs)
        except HTTPError as error:
            detail = error.read().decode('utf-8',errors='replace')[:500]
            try:
                detail = json.loads(detail).get('detail') or detail
            except (ValueError, AttributeError):
                pass
            raise HTTPException(error.code if error.code in {404,409,422} else 502, detail=detail or '后端业务操作未完成') from None
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
    def question(body: UserQuestionRequest, request: Request) -> Dict[str, Any]:
        return guarded_question(body, request)

    @app.post("/api/agent/question/summary", deprecated=True, dependencies=[Depends(require_write_auth)])
    @app.post("/api/v1/agent/question/summary", dependencies=[Depends(require_write_auth)])
    def question_summary(body: UserQuestionRequest, request: Request) -> Dict[str, Any]:
        return compact_question_response(guarded_question(body, request))

    def guarded_question(body: UserQuestionRequest, request: Request) -> Dict[str, Any]:
        # 与实际 Router 使用同一意图解析；人工工单不经可由 context 注入的 A2A 路径。
        forbidden = {'user_text', 'required_capabilities', 'runtime_resume', 'target_input'}
        if forbidden.intersection(body.context):
            raise HTTPException(422, '问答上下文不能覆盖任务正文、运行计划或内部动作')
        if body.mode == "knowledge":
            # 只读范围由顶层执行入口固定，不能被 Router 或后续重规划升级。
            return runtime.run_knowledge(body.user_text, body.context)
        from app.agents.router.agent import RouterAgent
        route = RouterAgent().run({'user_text': body.user_text, 'context': body.context})
        from app.runtime.coordinator import RuntimeInputParser
        capabilities = RuntimeInputParser().parse({**body.context, 'user_text': body.user_text}).required_capabilities
        protected = any(c.startswith('workorder_') for c in capabilities)
        if route.target_agent == 'workorder' or protected:
            actor = team_actor(request)
            if route.intent != 'workorder_query' and capabilities != ('workorder_query',):
                raise HTTPException(403, '请在工单系统中接单、提交维修反馈和确认；问答不执行工单变更')
            order_id = str(route.target_input.get('workorder_id') or '')
            if order_id and actor.get('role') != 'supervisor':
                require_assignee(order_id, actor)
            result = runtime.container.operations.execute_workorder('query', {'workorder_id': order_id}, from_agent='router')
            if not order_id:
                result['items'] = [o for o in result.get('items', []) if actor.get('role') == 'supervisor' or o.get('assignee') == actor['user_id']]
                result['count'] = len(result['items'])
            return result
        return runtime.run_user(body.user_text, body.context)

    @app.post("/api/agent/event", deprecated=True, dependencies=[Depends(require_write_auth)])
    @app.post("/api/v1/agent/event", dependencies=[Depends(require_write_auth)])
    def abnormal_event(request: AbnormalEventRequest) -> Dict[str, Any]:
        event = dict(request.event or {})
        event_id = str(event.get("event_id") or "")
        event_key = event_result_key(event)
        if event_id:
            if event_results.has_unmigrated_legacy_result(event_id, event_key):
                raise HTTPException(status_code=409, detail="旧版事件结果需先核对归属和工单，不能自动重放")
        fingerprint = sha256(json.dumps(event, ensure_ascii=False, sort_keys=True, default=str).encode("utf-8")).hexdigest()
        try:
            return event_results.get_or_create(event_key, lambda: runtime.run_abnormal_event(event), fingerprint=fingerprint)
        except EventResultConflict as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        except PendingResultError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        except TimeoutError as error:
            raise HTTPException(status_code=504, detail="事件处理超时，结果未知，需要对账") from error

    @app.get("/api/v1/agent/event/{event_id}/result")
    def abnormal_event_result(event_id: str, device_id: str = Query(min_length=1),
                              event_revision: int = Query(ge=1), tenant_id: str = "") -> Any:
        """只读取既有结果；查不到不等于执行失败，禁止自动重放异常。"""

        key = event_result_key({"event_id": event_id, "device_id": device_id,
                                "event_revision": event_revision, "tenant_id": tenant_id})
        result = event_results.get_result(key)
        if result is None:
            try:
                stage = event_results.get_stage(key)
            except Exception:
                # 临时缓存故障不能冒充业务完成；最终结果查询仍然可用。
                stage = None
            if stage is not None:
                return {"status": "in_progress", "result": compact_event_result(stage)}
            return JSONResponse(status_code=202, content={"status": "pending_or_unknown",
                                "event_id": event_id, "device_id": device_id, "event_revision": event_revision})
        return {"status": "available", "result": compact_event_result(result)}

    @app.get("/api/rag/status", deprecated=True)
    @app.get("/api/v1/rag/status")
    def rag_status() -> Dict[str, Any]:
        return runtime.container.registry.rag_status()

    @app.get("/api/rag/search", deprecated=True)
    @app.get("/api/v1/rag/search")
    def rag_search(query: str, limit: int = 5) -> Dict[str, Any]:
        try:
            return runtime.container.registry.search_knowledge(query, limit=limit)
        except QueryArgumentError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error

    @app.post("/api/rag/ingest", deprecated=True, dependencies=[Depends(require_write_auth)])
    @app.post("/api/v1/rag/ingest", dependencies=[Depends(require_write_auth)])
    def rag_ingest(request: RAGIngestRequest) -> Dict[str, Any]:
        return runtime.container.registry.ingest_knowledge(request.path, request.collection)

    @app.get("/api/trace", deprecated=True)
    @app.get("/api/v1/trace")
    def trace(trace_id: str | None = None, task_id: str | None = None, limit: int = 100, summary: bool = False) -> Dict[str, Any]:
        records = runtime.container.trace.list(trace_id=trace_id, task_id=task_id, limit=max(1, min(limit, 5000)))
        return {"trace": compact_trace_summary(records) if summary else records,
                'storage_warning':getattr(runtime.container.trace,'storage_error','')}

    @app.get("/api/runs", deprecated=True)
    @app.get("/api/v1/runs")
    def runs(limit: int = 5000) -> Dict[str, Any]:
        """每次故障、独立 RAG 问答或质检运行返回一条记录。"""

        recorder = runtime.container.trace
        query = getattr(recorder, 'list_run_index', recorder.list)
        records = query(limit=max(1, min(limit, 5000)))
        items = build_run_records(records)
        return {"runs": items, "count": len(items), 'storage_warning': getattr(recorder, 'storage_error', '')}

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

    @app.get("/api/maintenance/plans")
    def maintenance_plans(device_id: str = "", limit: int = 100) -> Dict[str, Any]:
        """展示既有维修方案；个人工单授权仍由工单读取接口检查。"""
        results, history = event_results.list_plan_results()
        deleted = event_results.deleted_plan_ids()
        return {**list_saved_maintenance_plans(results, device_id, max(1, min(limit, 500)), deleted), "history": history, "deleted_plan_ids": deleted}

    def remove_maintenance_plans(ids, request):
        actor = team_actor(request)
        try:
            removed = event_results.delete_plans(ids, actor["user_id"])
        except KeyError:
            raise HTTPException(404, "维修方案不存在，未删除任何方案") from None
        except ValueError as error:
            raise HTTPException(422, str(error)) from None
        return {"deleted_plan_ids": removed, "count": len(removed), "mode": "soft-delete", "message": "方案已从列表移除，关联工单和审计记录保留"}

    @app.delete("/api/maintenance/plans/{plan_id}", dependencies=[Depends(require_write_auth)])
    def delete_maintenance_plan(plan_id: str, request: Request):
        return remove_maintenance_plans([plan_id], request)

    @app.post("/api/maintenance/plans/delete", dependencies=[Depends(require_write_auth)])
    def delete_maintenance_plans(body: MaintenancePlanDeleteRequest, request: Request):
        return remove_maintenance_plans(body.plan_ids, request)

    @app.get("/api/workorders")
    def workorders(request: Request) -> Dict[str, Any]:
        actor = team_actor(request)
        result = runtime.container.operations.execute_workorder("query", {}, from_agent="router")
        items = [o for o in result.get('items', []) if actor['role'] == 'supervisor' or o.get('assignee') == actor['user_id']]
        return {'items': items, 'count': len(items), 'backend': 'workorder-agent'}

    @app.post("/api/workorders", dependencies=[Depends(require_write_auth)])
    def workorder_create(body: WorkOrderCreateRequest, request: Request) -> Dict[str, Any]:
        team_actor(request)
        raise HTTPException(403, '工单由系统根据已验证的诊断和维修方案自动派发，人工入口不创建或指定负责人')

    @app.get("/api/workorders/{workorder_id}")
    def workorder(workorder_id: str, request: Request) -> Dict[str, Any]:
        actor = team_actor(request)
        if actor['role'] != 'supervisor':
            require_assignee(workorder_id, actor)
        return runtime.container.operations.execute_workorder("query", {"workorder_id": workorder_id}, from_agent="router")

    @app.delete("/api/workorders/{workorder_id}", dependencies=[Depends(require_write_auth)])
    def delete_workorder(workorder_id: str, request: Request) -> Dict[str, Any]:
        require_assignee(workorder_id, team_actor(request))
        try:
            result = runtime.container.registry.execute("delete_workorder", {"workorder_id": workorder_id}, context={"agent": "router", "step": "delete_workorder"})
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:500]
            raise HTTPException(status_code=error.code if error.code in {404, 409} else 502, detail=detail or "工单删除请求失败") from error
        except Exception as error:
            raise HTTPException(status_code=502, detail="工单删除服务不可用：%s" % error) from error
        if not result.get("deleted"):
            raise HTTPException(status_code=404, detail="工单不存在：%s" % workorder_id)
        return result

    @app.get("/api/reports")
    def reports(workorder_id: str = "") -> Dict[str, Any]:
        """通过 Runtime 向报告工作台提供已持久化的报告。"""

        try:
            return runtime.container.registry.list_reports(workorder_id=workorder_id)
        except Exception:
            raise HTTPException(502,'报告存储暂不可用，历史报告未删除，请检查 Backend/MySQL') from None

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
        arguments = {'report':report_value,'format':'pdf','path':str(get_report_file_path(report_id,'pdf'))}
        harness = getattr(runtime.container,'harnesses',{}).get('report')
        if harness is not None:
            from app.agents.report.agent import REPORT_FILE_AUTHORITY
            source = report_value.get('sections') or {}
            trace_id = str(report_value.get('trace_id') or (source.get('quality') or {}).get('trace_id') or '')
            if not trace_id:
                trace_id = next((str(ref.get('id') or ref.get('reference') or '') for ref in report_value.get('source_refs',[]) if ref.get('type')=='trace'), '')
            result = harness.execute_once({'_file_authority':REPORT_FILE_AUTHORITY,'arguments':arguments,
                'task_id':'TASK-PDF-' + uuid4().hex[:12],'trace_id':trace_id,
                'runtime_context':{'run_type':'quality' if report_value.get('report_type')=='quality_report' else 'fault'}})
        else:
            result = runtime.container.registry.generate_report_file(**arguments)
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
        try:
            part = runtime.container.registry.execute("query_part", {"query": query, "component": component, "part_no": part_no, "device_id": device_id})
            relation = runtime.container.registry.execute("query_relation", {"query": query, "component": component, "part_no": part_no, "device_id": device_id})
            drawing = runtime.container.registry.execute("query_drawing", {"query": query, "component": component, "part_no": part_no, "device_id": device_id})
        except Exception as error:
            raise HTTPException(status_code=503, detail="CAD 服务不可用，未返回未经验证的演示图纸：%s" % error) from error
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
    def workorder_action(workorder_id: str, body: WorkOrderActionRequest, request: Request) -> Dict[str, Any]:
        payload = body.model_dump(mode="json")
        payload["workorder_id"] = workorder_id
        payload["repair_feedback"] = payload.get("repair_feedback") or payload.get("feedback") or ""
        return closure_call(human_action, workorder_id, body.action, payload, request, runtime.container.operations)

    @app.post("/api/v1/workorders/{workorder_id}/feedback", dependencies=[Depends(require_write_auth)])
    def submit_feedback_v1(workorder_id: str, body: RepairFeedbackRequest, request: Request) -> Dict[str, Any]:
        return closure_call(human_action, workorder_id, 'submit_feedback', body.model_dump(mode='json'), request)

    @app.post("/api/v1/workorders/{workorder_id}/complete", dependencies=[Depends(require_write_auth)])
    def complete_workorder_v1(workorder_id: str, body: RepairFeedbackRequest, request: Request) -> Dict[str, Any]:
        return closure_call(human_action, workorder_id, 'mark_repair_completed', body.model_dump(mode='json'), request, runtime.container.operations)

    @app.post("/api/v1/quality/checks", dependencies=[Depends(require_write_auth)])
    def create_quality_check(request: QualityCheckRequest) -> Dict[str, Any]:
        return runtime.container.closure_service.create_quality_check(request.model_dump(mode="json"))

    def quality_mutation(operation, arguments, fallback):
        harness = getattr(runtime.container, 'harnesses', {}).get('quality')
        operations = getattr(runtime.container, 'operations', None)
        if harness is not None and hasattr(operations, 'execute_quality_action'):
            # execute_once 不包重试：Backend 工具失败/超时后先对账。
            return closure_call(operations.execute_quality_action, harness, operation, arguments)
        return fallback()

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
        return quality_mutation('submit_quality_appeal', {'check_id':check_id, **request.model_dump(mode='json')}, lambda: runtime.container.closure_service.submit_appeal(check_id, request.model_dump(mode='json')))

    @app.post("/api/v1/quality/checks/{check_id}/appeal/resolve", dependencies=[Depends(require_write_auth)])
    def resolve_quality_appeal(check_id: str, request: QualityAppealResolutionRequest) -> Dict[str, Any]:
        return quality_mutation('resolve_quality_appeal', {'check_id':check_id, **request.model_dump(mode='json')}, lambda: closure_call(
            runtime.container.closure_service.resolve_appeal,
            check_id,
            request.appeal_id,
            request.decision,
            request.reason,
            request.operator,
        ))

    @app.post("/api/v1/closure-tasks", dependencies=[Depends(require_write_auth)])
    def create_closure_task(request: ClosureTaskRequest) -> Dict[str, Any]:
        return quality_mutation('create_closure_task', request.model_dump(mode='json'), lambda: closure_call(runtime.container.closure_service.create_closure_task, request.model_dump(mode='json')))

    @app.get("/api/v1/closure-tasks")
    def list_closure_tasks(status: str = "") -> Dict[str, Any]:
        items = runtime.container.closure_service.list_closure_tasks(status=status)
        return {"items": items, "count": len(items), "backend": runtime.container.closure_service.backend}

    @app.post("/api/v1/closure-tasks/{task_id}/complete", dependencies=[Depends(require_write_auth)])
    def complete_closure_task(task_id: str, note: str = "") -> Dict[str, Any]:
        return quality_mutation('complete_closure_task', {'task_id':task_id, 'note':note}, lambda: closure_call(runtime.container.closure_service.complete_closure_task, task_id, note=note))

    @app.post("/api/v1/quality/checks/{check_id}/reinspect", dependencies=[Depends(require_write_auth)])
    def reinspect_quality_check(check_id: str, request: QualityReinspectionRequest) -> Dict[str, Any]:
        return quality_mutation('reinspect_quality_check', {'check_id':check_id, **request.model_dump(mode='json')}, lambda: closure_call(runtime.container.closure_service.record_reinspection, check_id, request.model_dump(mode='json'), operator=request.operator))

    @app.post("/api/v1/quality/checks/{check_id}/release", dependencies=[Depends(require_write_auth)])
    def release_quality_check(check_id: str, operator: str = "") -> Dict[str, Any]:
        return quality_mutation('release_quality_check', {'check_id':check_id, 'operator':operator}, lambda: closure_call(runtime.container.closure_service.release_quality_check, check_id, operator=operator))

    @app.post("/api/v1/quality/checks/{check_id}/close", dependencies=[Depends(require_write_auth)])
    def close_quality_check(check_id: str, request: QualityCloseRequest) -> Dict[str, Any]:
        return quality_mutation('close_quality_check', {'check_id':check_id, **request.model_dump(mode='json')}, lambda: closure_call(runtime.container.closure_service.close_quality_check, check_id, operator=request.operator, note=request.note))

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

    # 生产建模只增加 CAD 专用路由，不替换维修定位或其他服务接口。
    from app.agents.cad.modeling_api import build_modeling_router
    from app.api.business_returns import build_business_return_router

    app.include_router(build_business_return_router(runtime, event_results, require_write_auth))
    app.include_router(build_modeling_router(require_write_auth, trace=getattr(runtime.container, "trace", None)))
    return app


app = create_app()
