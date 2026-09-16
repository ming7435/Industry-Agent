"""单进程 A2A 传输层，可替换为 HTTP 或消息队列。"""

from __future__ import annotations

from typing import Any, Callable, Dict, Type, TypeVar
from uuid import uuid4

from pydantic import BaseModel

from .models import A2ARequest, A2AResponse


RequestT = TypeVar("RequestT", bound=A2ARequest)
ResponseT = TypeVar("ResponseT", bound=A2AResponse)


class A2AError(RuntimeError):
    pass


class A2AClient:
    def __init__(self) -> None:
        self._handlers: Dict[str, Callable[[A2ARequest], Any]] = {}

    def register(self, agent_name: str, handler: Callable[[A2ARequest], Any]) -> None:
        self._handlers[agent_name] = handler

    def request(self, request: RequestT, response_type: Type[ResponseT]) -> ResponseT:
        handler = self._handlers.get(request.to_agent)
        if handler is None:
            raise A2AError("未注册目标 Agent：%s" % request.to_agent)
        try:
            result = handler(request)
            payload = result.model_dump(mode="json") if isinstance(result, BaseModel) else dict(result or {})
            return response_type(**payload)
        except Exception as error:
            raise A2AError("调用 %s Agent 失败：%s" % (request.to_agent, error)) from error

    @staticmethod
    def new_request_id() -> str:
        return "A2A-" + uuid4().hex[:12].upper()
