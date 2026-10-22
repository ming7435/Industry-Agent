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


ROUTES = {"close_quality_check": ["mes", "close_quality_check"], "complete_closure_task": ["mes", "complete_closure_task"], "create_closure_task": ["mes", "create_closure_task"], "create_quality_check": ["mes", "create_quality_check"], "get_part_specification": ["qms", "get_part_specification"], "get_production_part": ["qms", "get_production_part"], "inspect_part_appearance": ["qms", "inspect_part_appearance"], "inspect_part_dimensions": ["qms", "inspect_part_dimensions"], "inspect_part_function": ["qms", "inspect_part_function"], "inspect_part_material": ["qms", "inspect_part_material"], "inspect_part_process": ["qms", "inspect_part_process"], "reinspect_quality_check": ["mes", "reinspect_quality_check"], "release_quality_check": ["mes", "release_quality_check"], "resolve_quality_appeal": ["mes", "resolve_quality_appeal"], "submit_quality_appeal": ["mes", "submit_quality_appeal"]}


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
