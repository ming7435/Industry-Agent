"""单进程 A2A 传输层。

协议校验集中在这里，后续替换为 HTTP 或消息队列时仍复用同一套 Request/Response
契约和协作矩阵。
"""

from __future__ import annotations

from time import perf_counter
from typing import Any, Callable, Dict, Type, TypeVar
from uuid import uuid4

from pydantic import BaseModel

from .models import A2ARequest, A2AResponse
from .registry import CORE_A2A_AGENT_TARGETS, is_allowed_a2a_route


RequestT = TypeVar("RequestT", bound=A2ARequest)
ResponseT = TypeVar("ResponseT", bound=A2AResponse)


class A2AError(RuntimeError):
    pass


class A2AClient:
    def __init__(self, trace: Any | None = None) -> None:
        self._handlers: Dict[str, Callable[[A2ARequest], Any]] = {}
        self._trace = trace

    def register(self, agent_name: str, handler: Callable[[A2ARequest], Any]) -> None:
        if agent_name not in CORE_A2A_AGENT_TARGETS:
            raise A2AError("A2A 不允许注册非核心 Agent：%s" % agent_name)
        if not callable(handler):
            raise A2AError("A2A Handler 必须可调用：%s" % agent_name)
        self._handlers[agent_name] = handler

    def request(self, request: RequestT, response_type: Type[ResponseT]) -> ResponseT:
        if request.from_agent not in CORE_A2A_AGENT_TARGETS or request.to_agent not in CORE_A2A_AGENT_TARGETS:
            raise A2AError("A2A 请求包含非核心 Agent：%s -> %s" % (request.from_agent, request.to_agent))
        if not is_allowed_a2a_route(request.from_agent, request.to_agent):
            raise A2AError("A2A 不允许协作路径：%s -> %s" % (request.from_agent, request.to_agent))
        handler = self._handlers.get(request.to_agent)
        if handler is None:
            raise A2AError("未注册目标 Agent：%s" % request.to_agent)
        started = perf_counter()
        self._record("a2a_started", request=request)
        try:
            result = handler(request)
            payload = result.model_dump(mode="json") if isinstance(result, BaseModel) else dict(result or {})
            response = response_type(**payload)
            self._validate_response(request, response)
            self._record("a2a_completed", request=request, response=response, duration_ms=round((perf_counter() - started) * 1000, 3))
            return response
        except Exception as error:
            self._record("a2a_error", request=request, error=str(error), duration_ms=round((perf_counter() - started) * 1000, 3))
            if isinstance(error, A2AError):
                raise
            raise A2AError("调用 %s Agent 失败：%s" % (request.to_agent, error)) from error

    @staticmethod
    def _validate_response(request: A2ARequest, response: ResponseT) -> None:
        if response.request_id != request.request_id:
            raise A2AError("A2A 响应 request_id 不匹配：期望 %s，实际 %s" % (request.request_id, response.request_id))
        if response.reply_to != request.message_id:
            raise A2AError("A2A 响应 reply_to 不匹配：期望 %s，实际 %s" % (request.message_id, response.reply_to))
        if response.task_id != request.task_id:
            raise A2AError("A2A 响应 task_id 不匹配：期望 %s，实际 %s" % (request.task_id, response.task_id))
        if response.trace_id != request.trace_id:
            raise A2AError("A2A 响应 trace_id 不匹配：期望 %s，实际 %s" % (request.trace_id, response.trace_id))
        if response.from_agent != request.to_agent or response.to_agent != request.from_agent:
            raise A2AError("A2A 响应 Agent 方向不匹配：%s -> %s" % (response.from_agent, response.to_agent))

    def _record(self, event: str, request: A2ARequest, response: A2AResponse | None = None, **extra: Any) -> None:
        if self._trace is None:
            return
        payload: Dict[str, Any] = {
            "type": "a2a",
            "name": "%s->%s" % (request.from_agent, request.to_agent),
            "event": event,
            "request_id": request.request_id,
            "message_id": request.message_id,
            "task_id": request.task_id,
            "trace_id": request.trace_id,
            "from_agent": request.from_agent,
            "to_agent": request.to_agent,
        }
        if response is not None:
            payload.update({"response_message_id": response.message_id, "status": response.status, "success": response.success})
        payload.update(extra)
        self._trace.record(**payload)

    @staticmethod
    def new_request_id() -> str:
        return "A2A-" + uuid4().hex[:12].upper()
