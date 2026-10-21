"""本地 Text-to-CAD 建模、幂等运行记录和已验证模型文件下载接口。"""
from __future__ import annotations

from hashlib import sha256
import json
import os
import re
from threading import BoundedSemaphore, Lock
import time

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.clients.model import ModelServiceClient
from app.tools.registry import ToolRegistry
from shared.temporary_cache import RedisJsonCache
from .agent import CADAgent


RUN_TTL_SECONDS = 86400
RUN_DEADLINE_SECONDS = 300
_FREECAD_STORE_LOCK = Lock()


def get_text_to_cad_run_record(request: Request, run_id: str):
    """只读服务端建模版本，供质检绑定；不触发模型或 CAD 工具调用。"""
    if not re.fullmatch(r'FC-[a-f0-9]{64}', run_id):
        raise HTTPException(404, '建模版本不存在或已过期')
    from app.cad_documents import documents_enabled
    # Disabling editing never disables durable reads. Backend-less legacy/offline mode has no document store.
    if documents_enabled() or os.getenv('BACKEND_SERVICE_BASE_URL','').strip():
        from app.cad_documents.publishing import read_published_run
        published = read_published_run(request, run_id)
        if published is not None:
            return published
    try:
        with _FREECAD_STORE_LOCK:
            if getattr(request.app.state, 'freecad_run_store', None) is None:
                request.app.state.freecad_run_store = TextToCadRunStore()
            storage = request.app.state.freecad_run_store
        record = storage.get(run_id)
    except Exception:
        raise HTTPException(503, '建模版本暂无法读取，请检查 Redis；不会重新执行建模') from None
    if record is None:
        raise HTTPException(404, '建模版本不存在或已过期')
    if record.get('run_id') != run_id:
        raise HTTPException(409, '建模记录的设计版本不一致，不能作为检验依据')
    return record


class StrictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


TEXT_TO_CAD_PREFIX = "/api/cad/text-to-cad"
FREECAD_PREFIX = "/api/cad/freecad"  # Historical route and run IDs remain readable.


class TextToCadRunRequest(StrictRequest):
    prompt: str = Field(min_length=1, max_length=10000)
    command_id: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_.:-]+$")
    spec: dict | None = None
    part_name: str = Field(default="", max_length=120)
    part_number: str = Field(default="", max_length=80)

    @field_validator("part_name", "part_number")
    @classmethod
    def single_line_part_identity(cls, value):
        if any(ord(character) < 32 or ord(character) == 127 for character in value):
            raise ValueError("零件名称和编号不能包含换行或控制字符")
        return value.strip()

    @field_validator("prompt")
    @classmethod
    def nonempty_original_prompt(cls, value):
        if not value.strip():
            raise ValueError("请输入建模需求")
        return value

    @field_validator("spec")
    @classmethod
    def validated_spec(cls, value):
        if value is None:
            return None
        from app.tools.cad.text_to_cad import validate_spec
        return validate_spec(value)


class TextToCadRunStore:
    """临时记录和 NX 认领使用独立 Redis 命名空间。"""
    def __init__(self):
        self.cache = RedisJsonCache(prefix="industry:freecad:runs", ttl_seconds=RUN_TTL_SECONDS)

    def get(self, run_id):
        return self.cache.get(run_id)

    def create(self, run_id, record):
        return bool(self.cache.client.set(self.cache.prefix + run_id,
            json.dumps(record, ensure_ascii=False, allow_nan=False), nx=True, ex=RUN_TTL_SECONDS))

    def set(self, run_id, record):
        self.cache.set(run_id, record)


def _text_to_cad_public_record(record):
    keys = ("run_id", "prompt", "status", "answer", "calls", "artifacts", "validation", "spec",
        "error", "error_code", "error_stage", "error_tool", "execution", "created_at", "updated_at", "part_name", "part_number",
        "document_id", "revision", "version", "standard_parameters", "published_at", "provider")
    value = {key: record[key] for key in keys if key in record}
    if value.get("status") == "running" and time.time() - record.get("created_at", 0) > RUN_DEADLINE_SECONDS:
        value.update(status="outcome_unknown", error="此运行长时间未返回结果，请检查本地 Text-to-CAD；不会自动重新执行。")
    return value


def build_text_to_cad_router(require_auth, trace=None, *, recovery=None):
    """本地运行无需 OAuth，仍沿用服务认证、幂等认领及固定文件下载。"""
    from app.clients.text_to_cad import TextToCadClient, TextToCadConnectionError
    from app.tools.cad.text_to_cad import artifact_path, ARTIFACT_TYPES

    router = APIRouter(tags=["Text-to-CAD"], dependencies=[Depends(require_auth)])
    store_lock = Lock()
    slots = BoundedSemaphore(2)

    def storage_error():
        return HTTPException(503, detail="Text-to-CAD 临时运行存储不可用，请检查 Redis；请求不会自动重新执行。")

    def store(request):
        try:
            with store_lock:
                if getattr(request.app.state, "freecad_run_store", None) is None:
                    request.app.state.freecad_run_store = TextToCadRunStore()
                return request.app.state.freecad_run_store
        except Exception:
            raise storage_error() from None

    def read(storage, run_id):
        try:
            return storage.get(run_id)
        except Exception:
            raise storage_error() from None

    def close(client):
        if client is not None:
            try:
                client.close()
            except Exception:
                pass

    def lookup(request, run_id):
        return get_text_to_cad_run_record(request, run_id)

    def execute_run(storage, record, client_factory, model_factory):
        client = None
        attempt = {'type': 'agent', 'agent': 'cad', 'task_id': record['run_id'],
            'trace_id': record['run_id'], 'agent_run_id': record['run_id'], 'run_type': 'cad_modeling'}
        started = time.perf_counter()
        try:
            if trace is not None:
                trace.record(event='agent_started', **attempt)
            client = client_factory()
            agent = CADAgent(ToolRegistry(trace=trace))
            if trace is not None:
                agent.runtime_trace = trace
            result = agent.run_text_to_cad(record["prompt"], run_id=record["run_id"], client=client,
                model=model_factory(), spec=record.get("spec"))
            record = {**record, **result, "updated_at": time.time()}
        except Exception as error:
            code = getattr(error, "code", "text_to_cad_run_failed") if isinstance(error, TextToCadConnectionError) else "text_to_cad_run_failed"
            record = {**record, "status": "outcome_unknown" if code == "outcome_unknown" else "failed",
                "error_code": code, "error": str(error) if isinstance(error, TextToCadConnectionError) else "CAD 节点执行失败，请检查本地 Text-to-CAD 和模型服务。",
                "updated_at": time.time()}
        finally:
            failure_status=record.get('status')
            failure_error=record.get('error') or record.get('answer') or 'CAD 建模未返回有效结果'
            try:
                storage.set(record["run_id"], record)
            except Exception:
                failure_status='outcome_unknown'
                failure_error='CAD 结果写入 Redis 失败；禁止自动重放。'+str(record.get('error') or '')
                if trace is not None:
                    trace.record(event="text_to_cad_storage_failed", agent="cad", task_id=record["run_id"], error="Text-to-CAD 结果写入 Redis 失败；禁止自动重放。")
            finally:
                try:
                    # A lost result or interrupted execution is never an observed success.
                    failed = failure_status in {'failed', 'error', 'outcome_unknown', 'timeout', 'running'}
                    if trace is not None:
                        trace.record(event='agent_error' if failed else 'agent_completed', **attempt,
                            elapsed_ms=round((time.perf_counter() - started) * 1000, 2),
                            output={**_text_to_cad_public_record(record), 'status': failure_status},
                            **({'error': failure_error} if failed else {}))
                    if failure_status in {'failed','error','outcome_unknown','timeout'}:
                        from app.runtime.service_exceptions import record_service_failure
                        record_service_failure(recovery,'cad',{
                            'task_id':record['run_id'],'trace_id':record['run_id'],
                            'recovery_actor_id':record.get('_owner_id',''),'part_id':record.get('part_number',''),
                            'subject_summary':(record.get('part_name') or '零件')+' 建模服务异常'},failure_error,
                            status='outcome_unknown' if failure_status=='outcome_unknown' else 'failed')
                finally:
                    try:
                        release = getattr(trace, 'release_agent_attempt', None)
                        if callable(release):
                            release(attempt)
                    finally:
                        close(client)
                        slots.release()

    @router.get("/status")
    def status(request: Request):
        client = None
        try:
            client = (getattr(request.app.state, "text_to_cad_client_factory", None) or getattr(request.app.state, "freecad_client_factory", TextToCadClient))()
            value = client.status()
            error = value.get("error")
            if isinstance(error, dict):
                value = {**value, "error": error.get("message", "本地 Text-to-CAD 尚未连接。"), "error_code": error.get("code", "")}
            return {**value, "provider": "text-to-cad", "connected": value.get("connected") is True, "tools": value.get("tools") or [],
                "part_identity_supported": True}
        except TextToCadConnectionError as error:
            return {"provider": "text-to-cad", "connected": False, "tools": [], "error": str(error), "error_code": getattr(error, "code", "connection_failed")}
        except Exception:
            raise HTTPException(502, detail="无法读取本地 Text-to-CAD 状态，请检查本地服务。") from None
        finally:
            close(client)

    @router.post("/runs", status_code=202)
    def create_run(body: TextToCadRunRequest, request: Request, background_tasks: BackgroundTasks):
        storage = store(request)
        run_id = "FC-" + sha256(body.command_id.encode()).hexdigest()
        # 未填写标识时保留历史命令摘要；标识变化也必须使用新命令，不能错误复用旧零件。
        identity = [body.prompt, body.spec]
        if body.part_name or body.part_number:
            identity.extend([body.part_name, body.part_number])
        digest = sha256(json.dumps(identity, ensure_ascii=False, sort_keys=True,
            separators=(",", ":"), allow_nan=False).encode()).hexdigest()

        def existing(record):
            if record.get("input_digest") != digest:
                raise HTTPException(409, detail="同一命令身份已用于其他需求，请使用新命令。")
            return _text_to_cad_public_record(record)

        previous = read(storage, run_id)
        if previous is not None:
            return existing(previous)
        if not slots.acquire(blocking=False):
            previous = read(storage, run_id)
            if previous is not None:
                return existing(previous)
            raise HTTPException(429, detail="当前已有两个 Text-to-CAD 运行，请稍后再提交。")
        handed_off = False
        try:
            now = time.time()
            record = {"provider": "text-to-cad", "run_id": run_id, "input_digest": digest, "prompt": body.prompt, "spec": body.spec,
                "part_name": body.part_name, "part_number": body.part_number,
                "status": "running", "answer": "", "calls": [], "artifacts": [], "created_at": now, "updated_at": now}
            from app.api.service_exceptions import optional_actor_id
            record['_owner_id']=optional_actor_id(request)
            try:
                created = storage.create(run_id, record)
            except Exception:
                raise storage_error() from None
            if not created:
                previous = read(storage, run_id)
                if previous is None:
                    raise storage_error()
                return existing(previous)
            background_tasks.add_task(execute_run, storage, record,
                getattr(request.app.state, "text_to_cad_client_factory", None) or getattr(request.app.state, "freecad_client_factory", TextToCadClient),
                getattr(request.app.state, "text_to_cad_model_factory", None) or getattr(request.app.state, "freecad_model_factory", ModelServiceClient))
            handed_off = True
            return _text_to_cad_public_record(record)
        finally:
            if not handed_off:
                slots.release()

    @router.get("/runs/{run_id}")
    def get_run(run_id: str, request: Request):
        return _text_to_cad_public_record(lookup(request, run_id))

    @router.get("/runs/{run_id}/artifacts/{name}")
    def download_artifact(run_id: str, name: str, request: Request):
        if name not in ARTIFACT_TYPES:
            raise HTTPException(404, detail="模型文件不存在。")
        record = lookup(request, run_id)
        if record.get("status") != "completed" or not any(
            item.get("name") == name for item in record.get("artifacts", []) if isinstance(item, dict)
        ):
            raise HTTPException(404, detail="此运行没有可下载的模型文件。")
        try:
            if record.get('document_id'):
                from app.api.freecad_documents import application_for_request
                entry = next(a for a in record['artifacts'] if a['name'] == name)
                path = application_for_request(request).artifacts.entry_path(entry)
            else:
                path = artifact_path(run_id, name)
            if not path.is_file():
                raise ValueError("模型文件不存在")
        except (ValueError, OSError):
            raise HTTPException(404, detail="模型文件不存在。") from None
        media_type = ARTIFACT_TYPES[name]
        return FileResponse(path, media_type=media_type, filename=name,
            content_disposition_type="inline" if name.endswith((".svg", ".pdf")) else "attachment",
            headers={"X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox"})

    public = APIRouter()
    public.include_router(router, prefix=TEXT_TO_CAD_PREFIX)
    public.include_router(router, prefix=FREECAD_PREFIX, include_in_schema=False)
    return public

# Compatibility names preserve integrations and historical identities; execution is Text-to-CAD.
FreeCADRunRequest = TextToCadRunRequest
FreeCADRunStore = TextToCadRunStore
get_freecad_run_record = get_text_to_cad_run_record
build_freecad_router = build_text_to_cad_router
_freecad_public_record = _text_to_cad_public_record
