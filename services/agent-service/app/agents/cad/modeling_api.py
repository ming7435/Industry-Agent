"""BuildCAD 薄接口：授权、Redis 临时运行记录和单个 CAD 建模节点。"""
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
from fastapi.responses import JSONResponse
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
        "action", "design_id", "designs", "code", "execution", "created_at", "updated_at")
    value = {key: record[key] for key in keys if key in record}
    if value.get("status") == "running" and time.time() - record.get("created_at", 0) > RUN_DEADLINE_SECONDS:
        value.update(status="outcome_unknown", error="此运行长时间未返回结果。请先在 BuildCAD 核对设计，不会自动重新提交。")
    return value


def build_modeling_router(require_auth, trace=None):
    router = APIRouter(prefix=PREFIX, tags=["BuildCAD"], dependencies=[Depends(require_auth)])
    store_lock = Lock()
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
            record = {"run_id": run_id, "input_digest": digest, "action": body.action,
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
