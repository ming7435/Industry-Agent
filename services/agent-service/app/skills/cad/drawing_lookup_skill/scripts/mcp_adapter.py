#!/usr/bin/env python3
"""Portable MCP adapter for this Skill's externally hosted tools.

This adapter is invoked only when run.py receives --tool-script explicitly.
Generation replaces ROUTES with the Skill's approved tool/server/operation map.
"""
from __future__ import annotations

import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROUTES = {"fetch_engineering_record": ["cad", "fetch_engineering_record"], "query_bom": ["cad", "query_bom"], "query_drawing": ["cad", "query_drawing"], "query_part": ["cad", "query_part"], "query_relation": ["cad", "query_relation"]}


def main() -> int:
    try:
        request = json.load(sys.stdin)
        tool = request.get("tool")
        arguments = request.get("arguments")
        if tool not in ROUTES or not isinstance(arguments, dict):
            raise ValueError("工具未获当前技能授权，或需要自定义本地适配器")
        server, operation = ROUTES[tool]
        base = {
            "mes": os.getenv("SKILL_MCP_MES_URL") or os.getenv("BACKEND_SERVICE_BASE_URL"),
            "inventory": os.getenv("SKILL_MCP_INVENTORY_URL") or os.getenv("BACKEND_SERVICE_BASE_URL"),
            "qms": os.getenv("SKILL_MCP_QMS_URL") or os.getenv("BACKEND_SERVICE_BASE_URL"),
            "cad": os.getenv("SKILL_MCP_CAD_URL") or os.getenv("CAD_SERVICE_BASE_URL"),
            "plc": os.getenv("SKILL_MCP_PLC_URL"),
            "knowledge": os.getenv("SKILL_MCP_KNOWLEDGE_URL"),
            "local": os.getenv("SKILL_MCP_LOCAL_URL"),
        }.get(server)
        if not base:
            raise ValueError("未配置对应 MCP 服务地址：" + server)
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        backend = (os.getenv("BACKEND_SERVICE_BASE_URL") or "").rstrip("/")
        token = (os.getenv("BACKEND_INTERNAL_TOKEN")
                 if server in {"mes", "inventory", "qms"} and base.rstrip("/") == backend and backend
                 else os.getenv("SKILL_MCP_TOKEN"))
        if token:
            headers["Authorization"] = "Bearer " + token
        body = json.dumps({"tool": operation, "arguments": arguments}, ensure_ascii=False).encode("utf-8")
        call = Request(base.rstrip("/") + "/tools/call", data=body, headers=headers, method="POST")
        with urlopen(call, timeout=30) as response:
            result = json.load(response)
        if not isinstance(result, dict):
            raise ValueError("MCP 服务没有返回 JSON 对象")
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except (ValueError, KeyError, TypeError, HTTPError, URLError, TimeoutError) as error:
        # The caller intentionally receives a stable error, never response bodies or tokens.
        print("MCP 工具调用失败：" + type(error).__name__, file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
