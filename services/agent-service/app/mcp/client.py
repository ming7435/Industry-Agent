"""外部系统 MCP 客户端适配层。"""

from __future__ import annotations

from typing import Any, Callable, Dict, Mapping
import json
import os
from urllib.request import Request, urlopen


class McpClient:
    """统一 MCP 调用边界；当前使用本地处理器模拟 PLC/MES/CAD。"""

    def __init__(self, handlers: Mapping[str, Callable[..., Dict[str, Any]]] | None = None, base_urls: Mapping[str, str] | None = None) -> None:
        self.handlers = dict(handlers or {})
        self.base_urls = {key: value.rstrip("/") for key, value in dict(base_urls or {}).items() if value}

    def call(self, server: str, operation: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        base_url = self.base_urls.get(server) or os.getenv("MCP_%s_URL" % server.upper(), "").rstrip("/")
        if base_url:
            request = Request(
                base_url + "/tools/call",
                data=json.dumps({"tool": operation, "arguments": dict(arguments)}, ensure_ascii=False).encode("utf-8"),
                method="POST",
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            with urlopen(request, timeout=float(os.getenv("MCP_TIMEOUT_SECONDS", "15"))) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("MCP 返回格式错误：%s.%s" % (server, operation))
            return payload
        handler = self.handlers.get(operation)
        if handler is None:
            raise ValueError("MCP 未注册操作：%s.%s" % (server, operation))
        return handler(**dict(arguments))
