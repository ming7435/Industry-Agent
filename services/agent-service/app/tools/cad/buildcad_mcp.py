"""唯一 BuildCAD 工具入口；凭据和连接不允许由模型参数传入。"""
from contextlib import contextmanager
from contextvars import ContextVar
import ast
import base64
import json
import re
from urllib.parse import urlsplit

from jsonschema import Draft202012Validator
from referencing import Registry
from referencing.exceptions import NoSuchResource


class BuildCADInputError(ValueError):
    """仅承载本地受控校验文案，允许节点直接展示。"""


def _no_external_schema(uri):
    raise NoSuchResource(ref=uri)

ALLOWED_REMOTE_TOOLS = frozenset({"list_designs", "get_design_code", "render_preview", "save_design"})
ACTION_TOOLS = {
    "preview": frozenset({"list_designs", "get_design_code", "render_preview"}),
    "save": ALLOWED_REMOTE_TOOLS,
    "list_designs": frozenset({"list_designs"}),
    "get_design_code": frozenset({"get_design_code"}),
}
_scope = ContextVar("buildcad_scope", default=None)


@contextmanager
def buildcad_scope(client, definitions, *, action="preview", design_id=""):
    if action not in ACTION_TOOLS:
        raise BuildCADInputError("不支持的 BuildCAD 操作")
    if action in {"save", "get_design_code"} and not design_id.strip():
        raise BuildCADInputError("此操作必须选择一个已有 BuildCAD 设计")
    policy = {"action": action, "design_id": design_id, "designs": None,
        "latest_code": None, "rendered_codes": set(), "save_attempted": False}
    token = _scope.set((client, definitions, policy))
    try:
        yield
    finally:
        _scope.reset(token)


def normalize_buildcad_result(tool_name, result):
    """提取已知结构化字段，同时保留原始 MCP 返回供结果核对。"""
    candidates = [result.get("structuredContent")]
    for item in result.get("content") or []:
        if not isinstance(item, dict) or item.get("type") != "text":
            continue
        text = item.get("text", "")
        try:
            candidates.append(json.loads(text))
        except (ValueError, TypeError):
            if tool_name == "get_design_code" and isinstance(text, str):
                candidates.append(text)
    for candidate in candidates:
        if tool_name == "list_designs":
            rows = candidate.get("designs") if isinstance(candidate, dict) else candidate
            if isinstance(rows, list) and all(isinstance(row, dict) for row in rows):
                return {"designs": [{**row, "design_id": str(row.get("design_id") or row.get("designId") or row.get("id") or "")}
                    for row in rows]}
        elif tool_name == "get_design_code":
            code = candidate.get("code") if isinstance(candidate, dict) else candidate
            if isinstance(code, str):
                return {"code": code}
    return {}


def has_preview_image(result):
    image_mimes = {"image/png", "image/jpeg", "image/webp"}
    for item in result.get("content") or []:
        if not isinstance(item, dict):
            continue
        if item.get("type") == "resource_link" and item.get("mimeType") in image_mimes:
            url = item.get("uri")
            if isinstance(url, str) and url and not re.search(r"[\s\x00-\x1f\x7f]", url):
                try:
                    uri = urlsplit(url)
                    # 与前端可展示的 HTTPS 图片地址保持一致。
                    if (uri.scheme == "https" and uri.hostname and "%" not in uri.hostname
                        and uri.username is None and uri.password is None
                        and (uri.port is None or 0 <= uri.port <= 65535)):
                        return True
                except ValueError:
                    pass
        if item.get("type") not in {"image", "resource"}:
            continue
        value = item.get("resource", {}) if item.get("type") == "resource" else item
        if not isinstance(value, dict):
            continue
        mime = value.get("mimeType")
        if mime not in image_mimes:
            continue
        try:
            data = base64.b64decode(value.get("data") or value.get("blob") or "", validate=True)
        except (ValueError, TypeError):
            continue
        if ((mime == "image/png" and data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) > 24)
            or (mime == "image/jpeg" and data.startswith(b"\xff\xd8\xff") and data.endswith(b"\xff\xd9"))
            or (mime == "image/webp" and data[:4] == b"RIFF" and data[8:12] == b"WEBP" and len(data) > 20)):
            return True
    return False


def _validate_code(code):
    try:
        tree = ast.parse(code)
    except (SyntaxError, TypeError, ValueError):
        raise BuildCADInputError("BuildCAD code 必须是可解析的 llmcad Python 代码") from None
    llmcad = False
    for node in ast.walk(tree):
        modules = [alias.name for alias in node.names] if isinstance(node, ast.Import) else ([node.module or ""] if isinstance(node, ast.ImportFrom) else [])
        if any(module == "llmcad" or module.startswith("llmcad.") for module in modules):
            llmcad = True
        if any(module == "cadquery" or module.startswith("cadquery.") for module in modules):
            raise BuildCADInputError("BuildCAD 使用 llmcad，不支持 CadQuery 代码")
        if ((isinstance(node, ast.Name) and node.id == "show_object")
            or (isinstance(node, ast.Attribute) and node.attr in {"show_object", "Workplane"})):
            raise BuildCADInputError("BuildCAD llmcad 不支持 show_object 或 CadQuery Workplane")
    if not llmcad:
        raise BuildCADInputError("BuildCAD code 必须导入 llmcad")


def buildcad_mcp(tool_name: str, arguments: dict):
    current = _scope.get()
    if current is None:
        raise PermissionError("BuildCAD 工具需要可信 CAD 节点作用域")
    client, definitions, policy = current
    if tool_name not in ALLOWED_REMOTE_TOOLS or tool_name not in definitions:
        raise BuildCADInputError("请求的工具未在 BuildCAD 实际工具列表中")
    if tool_name not in ACTION_TOOLS[policy["action"]]:
        raise BuildCADInputError("当前操作未授权此 BuildCAD 工具；预览不能保存设计")
    try:
        Draft202012Validator(definitions[tool_name]["inputSchema"],
            registry=Registry(retrieve=_no_external_schema)).validate(arguments)
    except Exception:
        raise BuildCADInputError("工具参数不符合 BuildCAD schema，或 schema 含不支持的外部引用") from None
    if tool_name in {"render_preview", "save_design"}:
        _validate_code(arguments.get("code"))
    if tool_name == "get_design_code" and policy["action"] in {"save", "get_design_code"}:
        if arguments.get("designId") != policy["design_id"]:
            raise BuildCADInputError("只能读取用户明确选择的 BuildCAD 设计")
        if policy["action"] == "save" and not any(row["design_id"] == policy["design_id"] for row in policy["designs"] or []):
            raise BuildCADInputError("选择的设计不在当前账号的实际设计列表中")
    if tool_name == "save_design":
        if arguments.get("designId") != policy["design_id"]:
            raise BuildCADInputError("只能保存用户明确选择的 BuildCAD 设计")
        if policy["latest_code"] is None or not any(row["design_id"] == policy["design_id"] for row in policy["designs"] or []):
            raise BuildCADInputError("保存前必须核对当前账号设计并读取最新代码")
        if arguments.get("code") not in policy["rendered_codes"]:
            raise BuildCADInputError("保存代码必须与本次已成功生成图片的预览代码完全一致")
        if policy["save_attempted"]:
            raise BuildCADInputError("本次运行已提交保存，禁止重复写入")
        policy["save_attempted"] = True
    result = client.call_tool(tool_name, arguments)
    if isinstance(result, dict) and not result.get("isError"):
        normalized = normalize_buildcad_result(tool_name, result)
        if tool_name == "list_designs":
            policy["designs"] = normalized.get("designs")
        elif tool_name == "get_design_code":
            policy["latest_code"] = normalized.get("code")
        elif tool_name == "render_preview" and has_preview_image(result):
            policy["rendered_codes"].add(arguments["code"])
    return result
