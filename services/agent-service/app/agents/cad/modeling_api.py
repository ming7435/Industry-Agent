"""CAD 建模接口：本地 FreeCAD 运行；历史 BuildCAD 路由保留但不挂载。"""
from __future__ import annotations

from contextlib import contextmanager
from hashlib import sha256
import json
import os
import re
import secrets
from threading import BoundedSemaphore, Lock
import time
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.clients.buildcad import BuildCADClient, BuildCADError
from app.clients.model import ModelServiceClient
from app.tools.registry import ToolRegistry
from shared.temporary_cache import RedisJsonCache
from .agent import CADAgent


PREFIX = "/api/cad/buildcad"
COOKIE = "buildcad_oauth"
RUN_TTL_SECONDS = 86400
RUN_DEADLINE_SECONDS = 300
_FREECAD_STORE_LOCK = Lock()


def get_freecad_run_record(request: Request, run_id: str):
    """只读服务端建模版本，供质检绑定；不触发模型或 CAD 工具调用。"""
    if not re.fullmatch(r'FC-[a-f0-9]{64}', run_id):
        raise HTTPException(404, '建模版本不存在或已过期')
    try:
        with _FREECAD_STORE_LOCK:
            if getattr(request.app.state, 'freecad_run_store', None) is None:
                request.app.state.freecad_run_store = FreeCADRunStore()
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


class RunRequest(StrictRequest):
    prompt: str = Field(min_length=1, max_length=10000)
    command_id: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_.:-]+$")
    action: Literal["preview", "save", "list_designs", "get_design_code"] = "preview"
    design_id: str = Field(default="", max_length=1024)

    @model_validator(mode="after")
    def selected_design(self):
        self.design_id = self.design_id.strip()
        if self.action in {"save", "get_design_code"} and not self.design_id:
            raise ValueError("此操作必须选择一个已有 BuildCAD 设计")
        return self

    @field_validator("prompt")
    @classmethod
    def nonempty_prompt(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("请输入建模需求")
        return value


class AuthStart(StrictRequest):
    redirect_uri: str = Field(min_length=1, max_length=2048)


class AuthComplete(AuthStart):
    code: str = Field(min_length=1, max_length=8192)
    state: str = Field(min_length=1, max_length=1024)


class BuildCADRunStore:
    """NX 认领和结果共用一个 Redis 键，24 小时内不重放同一命令。"""
    def __init__(self):
        self.cache = RedisJsonCache(prefix="industry:buildcad:runs", ttl_seconds=RUN_TTL_SECONDS)

    def get(self, run_id):
        return self.cache.get(run_id)

    def create(self, run_id, record):
        return bool(self.cache.client.set(self.cache.prefix + run_id,
            json.dumps(record, ensure_ascii=False, allow_nan=False), nx=True, ex=RUN_TTL_SECONDS))

    def set(self, run_id, record):
        self.cache.set(run_id, record)


def _storage_error():
    return HTTPException(503, detail="BuildCAD 运行存储不可用，请检查 Redis；请求不会自动重新执行。")


def _validate_redirect(redirect_uri):
    # 只使用服务端的 Monitor 监听配置；Host、Origin 和转发头不能扩大回调范围。
    host = os.getenv("MONITOR_WEB_HOST", "127.0.0.1").strip()
    try:
        port = int(os.getenv("MONITOR_WEB_PORT", "8001"))
        if not 0 < port < 65536:
            raise ValueError
    except ValueError:
        raise HTTPException(503, detail="Monitor 回调地址配置无效。") from None
    hosts = {"127.0.0.1", "localhost", "[::1]"}
    if host and host not in {"0.0.0.0", "::", "[::]"}:
        hosts.add(f"[{host}]" if ":" in host and not host.startswith("[") else host)
    suffix = "" if port == 80 else f":{port}"
    allowed = {f"http://{name}{suffix}/?view=cad" for name in hosts}
    if redirect_uri not in allowed:
        raise HTTPException(400, detail="BuildCAD 授权回调必须指向已配置的 Monitor CAD 页面。")


def _public_record(record):
    keys = ("run_id", "status", "answer", "calls", "error", "error_code", "error_tool", "error_stage",
        "prompt", "action", "design_id", "designs", "code", "execution", "created_at", "updated_at")
    value = {key: record[key] for key in keys if key in record}
    if value.get("status") == "running" and time.time() - record.get("created_at", 0) > RUN_DEADLINE_SECONDS:
        value.update(status="outcome_unknown", error="此运行长时间未返回结果。请先在 BuildCAD 核对设计，不会自动重新提交。")
    return value


def build_modeling_router(require_auth, trace=None):
    router = APIRouter(prefix=PREFIX, tags=["BuildCAD"], dependencies=[Depends(require_auth)])
    store_lock = _FREECAD_STORE_LOCK
    slots = BoundedSemaphore(2)

    def store(request):
        try:
            with store_lock:
                if getattr(request.app.state, "buildcad_run_store", None) is None:
                    request.app.state.buildcad_run_store = BuildCADRunStore()
                return request.app.state.buildcad_run_store
        except Exception:
            raise _storage_error() from None

    def read(storage, run_id):
        try:
            return storage.get(run_id)
        except Exception:
            raise _storage_error() from None

    @contextmanager
    def client_scope(request):
        client = None
        try:
            client = getattr(request.app.state, "buildcad_client_factory", BuildCADClient)()
            yield client
        except BuildCADError as error:
            raise HTTPException(error.status, detail=error.message) from None
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(502, detail="BuildCAD 连接操作失败，请检查连接后重试。") from None
        finally:
            if client is not None:
                try:
                    client.close()
                except Exception:
                    pass

    def execute_run(storage, record, prompt, client_factory, model_factory):
        client = None
        try:
            client = client_factory()
            agent = CADAgent(ToolRegistry(trace=trace))
            if trace is not None:
                agent.runtime_trace = trace
            action = record["action"]
            model = model_factory() if action in {"preview", "save"} else None
            result = agent.run_buildcad(prompt, run_id=record["run_id"], client=client, model=model,
                action=action, design_id=record["design_id"])
            record = {**record, **result, "updated_at": time.time()}
        except Exception as error:
            record = {**record, "status": "outcome_unknown" if getattr(error, "code", "") == "outcome_unknown" else "failed",
                "error": error.message if isinstance(error, BuildCADError) else "CAD 节点执行失败，请检查服务；已有设计请先在 BuildCAD 核对。",
                "updated_at": time.time()}
        finally:
            try:
                storage.set(record["run_id"], record)
            except Exception:
                # 已经执行的远端操作不能因结果存储失败而重试。原运行记录会转为待核对。
                if trace is not None:
                    trace.record(event="buildcad_storage_failed", agent="cad", task_id=record["run_id"], error="BuildCAD 执行结果写入 Redis 失败；禁止自动重放。")
            finally:
                try:
                    if client is not None:
                        client.close()
                except Exception:
                    pass
                finally:
                    slots.release()

    @router.get("/status")
    def status(request: Request):
        with client_scope(request) as client:
            value = client.status()
        error = value.get("error")
        if isinstance(error, dict):
            if error.get("code") == "storage_unavailable":
                raise _storage_error()
            value = {**value, "error": error.get("message", "BuildCAD 连接未完成。"), "error_code": error.get("code", "")}
        return {**value, "connected": value.get("connected") is True and isinstance(value.get("tools"), list), "tools": value.get("tools") or []}

    @router.post("/auth/start")
    def auth_start(body: AuthStart, request: Request, response: Response):
        _validate_redirect(body.redirect_uri)
        nonce = secrets.token_urlsafe(32)
        with client_scope(request) as client:
            value = client.begin_auth(body.redirect_uri, nonce)
        response.set_cookie(COOKIE, nonce, max_age=600, httponly=True, samesite="lax", path=PREFIX)
        return {"authorization_url": value["authorization_url"], "state": value["state"]}

    @router.post("/auth/complete")
    def auth_complete(body: AuthComplete, request: Request):
        try:
            _validate_redirect(body.redirect_uri)
            nonce = request.cookies.get(COOKIE)
            if not nonce:
                raise HTTPException(400, detail="浏览器授权状态已失效，请重新连接 BuildCAD。")
            with client_scope(request) as client:
                client.complete_auth(body.code, body.state, nonce, body.redirect_uri)
            response = JSONResponse({"authorized": True})
        except HTTPException as error:
            response = JSONResponse({"detail": error.detail}, status_code=error.status_code)
        response.delete_cookie(COOKIE, path=PREFIX, httponly=True, samesite="lax")
        return response

    @router.post("/auth/disconnect")
    def disconnect(body: StrictRequest, request: Request, response: Response):
        with client_scope(request) as client:
            client.disconnect()
        response.delete_cookie(COOKIE, path=PREFIX, httponly=True, samesite="lax")
        return {"connected": False}

    @router.post("/runs", status_code=202)
    def create_run(body: RunRequest, request: Request, background_tasks: BackgroundTasks):
        storage = store(request)
        run_id = "BC-" + sha256(body.command_id.encode()).hexdigest()
        digest = sha256(json.dumps([body.action, body.design_id, body.prompt],
            ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()

        def existing(record):
            if record.get("input_digest") != digest:
                raise HTTPException(409, detail="同一命令身份已用于其他需求，请使用新命令。")
            return _public_record(record)

        previous = read(storage, run_id)
        if previous is not None:
            return existing(previous)
        if not slots.acquire(blocking=False):
            previous = read(storage, run_id)
            if previous is not None:
                return existing(previous)
            raise HTTPException(429, detail="当前已有两个 BuildCAD 运行，请稍后再提交。")
        handed_off = False
        try:
            now = time.time()
            record = {"run_id": run_id, "input_digest": digest, "prompt": body.prompt, "action": body.action,
                "design_id": body.design_id, "status": "running", "answer": "", "calls": [], "created_at": now, "updated_at": now}
            try:
                created = storage.create(run_id, record)
            except Exception:
                raise _storage_error() from None
            if not created:
                previous = read(storage, run_id)
                if previous is None:
                    raise _storage_error()
                return existing(previous)
            background_tasks.add_task(execute_run, storage, record, body.prompt,
                getattr(request.app.state, "buildcad_client_factory", BuildCADClient),
                getattr(request.app.state, "buildcad_model_factory", ModelServiceClient))
            handed_off = True
            return _public_record(record)
        finally:
            if not handed_off:
                slots.release()

    @router.get("/runs/{run_id}")
    def get_run(run_id: str, request: Request):
        if not re.fullmatch(r"BC-[a-f0-9]{64}", run_id):
            raise HTTPException(404, detail="BuildCAD 临时运行记录不存在或已过期。")
        record = read(store(request), run_id)
        if record is None:
            raise HTTPException(404, detail="BuildCAD 临时运行记录不存在或已过期。")
        return _public_record(record)

    return router


FREECAD_PREFIX = "/api/cad/freecad"


class FreeCADRunRequest(StrictRequest):
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
        from app.tools.cad.freecad_mcp import validate_spec
        return validate_spec(value)


class FreeCADRunStore(BuildCADRunStore):
    """临时记录和 NX 认领使用独立 Redis 命名空间。"""
    def __init__(self):
        self.cache = RedisJsonCache(prefix="industry:freecad:runs", ttl_seconds=RUN_TTL_SECONDS)


def _freecad_public_record(record):
    keys = ("run_id", "prompt", "status", "answer", "calls", "artifacts", "validation", "spec",
        "error", "error_code", "error_stage", "error_tool", "execution", "created_at", "updated_at", "part_name", "part_number")
    value = {key: record[key] for key in keys if key in record}
    if value.get("status") == "running" and time.time() - record.get("created_at", 0) > RUN_DEADLINE_SECONDS:
        value.update(status="outcome_unknown", error="此运行长时间未返回结果，请检查本地 FreeCAD；不会自动重新执行。")
    return value


def build_freecad_router(require_auth, trace=None):
    """本地运行无需 OAuth，仍沿用服务认证、幂等认领及固定文件下载。"""
    from app.clients.freecad import FreeCADClient, FreeCADConnectionError
    from app.tools.cad.freecad_mcp import artifact_path, ARTIFACT_TYPES

    router = APIRouter(prefix=FREECAD_PREFIX, tags=["FreeCAD"], dependencies=[Depends(require_auth)])
    store_lock = Lock()
    slots = BoundedSemaphore(2)

    def storage_error():
        return HTTPException(503, detail="FreeCAD 临时运行存储不可用，请检查 Redis；请求不会自动重新执行。")

    def store(request):
        try:
            with store_lock:
                if getattr(request.app.state, "freecad_run_store", None) is None:
                    request.app.state.freecad_run_store = FreeCADRunStore()
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
        return get_freecad_run_record(request, run_id)

    def execute_run(storage, record, client_factory, model_factory):
        client = None
        try:
            client = client_factory()
            agent = CADAgent(ToolRegistry(trace=trace))
            if trace is not None:
                agent.runtime_trace = trace
            result = agent.run_freecad(record["prompt"], run_id=record["run_id"], client=client,
                model=model_factory(), spec=record.get("spec"))
            record = {**record, **result, "updated_at": time.time()}
        except Exception as error:
            code = getattr(error, "code", "freecad_run_failed") if isinstance(error, FreeCADConnectionError) else "freecad_run_failed"
            record = {**record, "status": "outcome_unknown" if code == "outcome_unknown" else "failed",
                "error_code": code, "error": str(error) if isinstance(error, FreeCADConnectionError) else "CAD 节点执行失败，请检查本地 FreeCAD 和模型服务。",
                "updated_at": time.time()}
        finally:
            try:
                storage.set(record["run_id"], record)
            except Exception:
                if trace is not None:
                    trace.record(event="freecad_storage_failed", agent="cad", task_id=record["run_id"], error="FreeCAD 结果写入 Redis 失败；禁止自动重放。")
            finally:
                close(client)
                slots.release()

    @router.get("/status")
    def status(request: Request):
        client = None
        try:
            client = getattr(request.app.state, "freecad_client_factory", FreeCADClient)()
            value = client.status()
            error = value.get("error")
            if isinstance(error, dict):
                value = {**value, "error": error.get("message", "本地 FreeCAD 尚未连接。"), "error_code": error.get("code", "")}
            return {**value, "connected": value.get("connected") is True, "tools": value.get("tools") or [],
                "part_identity_supported": True}
        except FreeCADConnectionError as error:
            return {"connected": False, "tools": [], "error": str(error), "error_code": getattr(error, "code", "connection_failed")}
        except Exception:
            raise HTTPException(502, detail="无法读取本地 FreeCAD 状态，请检查本地服务。") from None
        finally:
            close(client)

    @router.post("/runs", status_code=202)
    def create_run(body: FreeCADRunRequest, request: Request, background_tasks: BackgroundTasks):
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
            return _freecad_public_record(record)

        previous = read(storage, run_id)
        if previous is not None:
            return existing(previous)
        if not slots.acquire(blocking=False):
            previous = read(storage, run_id)
            if previous is not None:
                return existing(previous)
            raise HTTPException(429, detail="当前已有两个 FreeCAD 运行，请稍后再提交。")
        handed_off = False
        try:
            now = time.time()
            record = {"run_id": run_id, "input_digest": digest, "prompt": body.prompt, "spec": body.spec,
                "part_name": body.part_name, "part_number": body.part_number,
                "status": "running", "answer": "", "calls": [], "artifacts": [], "created_at": now, "updated_at": now}
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
                getattr(request.app.state, "freecad_client_factory", FreeCADClient),
                getattr(request.app.state, "freecad_model_factory", ModelServiceClient))
            handed_off = True
            return _freecad_public_record(record)
        finally:
            if not handed_off:
                slots.release()

    @router.get("/runs/{run_id}")
    def get_run(run_id: str, request: Request):
        return _freecad_public_record(lookup(request, run_id))

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
            path = artifact_path(run_id, name)
            if not path.is_file():
                raise ValueError("模型文件不存在")
        except (ValueError, OSError):
            raise HTTPException(404, detail="模型文件不存在。") from None
        media_type = ARTIFACT_TYPES[name]
        return FileResponse(path, media_type=media_type, filename=name,
            content_disposition_type="inline" if name.endswith((".svg", ".pdf")) else "attachment",
            headers={"X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox"})

    return router
