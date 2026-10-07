"""BuildCAD OAuth 与 Streamable HTTP 客户端；授权信息只存 Redis。"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import threading
import time
from contextlib import contextmanager
from typing import Any
from urllib.parse import urlencode, urlsplit

import httpx


class BuildCADError(RuntimeError):
    """对外只提供稳定错误码和受控文案，不携带供应商错误正文。"""

    def __init__(self, code: str, message: str, status: int = 502):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


class BuildCADStore:
    """OAuth 状态使用 Redis GETDEL 原子消费，刷新令牌不随访问令牌过期。"""

    def __init__(self):
        import redis

        try:
            self.client = redis.Redis.from_url(
                os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0"),
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
        except Exception:
            raise BuildCADError("storage_unavailable", "BuildCAD 授权存储不可用，请检查 Redis。", 503) from None
        self.prefix = "industry:buildcad:"

    def get(self, key: str) -> Any:
        try:
            value = self.client.get(self.prefix + key)
            return json.loads(value) if value else None
        except Exception:
            raise BuildCADError("storage_unavailable", "BuildCAD 授权存储不可用，请检查 Redis。", 503) from None

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        try:
            options = {"ex": ttl} if ttl is not None else {}
            self.client.set(self.prefix + key, json.dumps(value, ensure_ascii=False), **options)
        except Exception:
            raise BuildCADError("storage_unavailable", "BuildCAD 授权存储不可用，请检查 Redis。", 503) from None

    def pop(self, key: str) -> Any:
        try:
            value = self.client.getdel(self.prefix + key)
            return json.loads(value) if value else None
        except Exception:
            raise BuildCADError("storage_unavailable", "BuildCAD 授权存储不可用，请检查 Redis。", 503) from None

    @contextmanager
    def token_lock(self):
        """刷新、重新授权与断开共享互斥，防止多个服务实例覆盖轮换令牌。"""
        try:
            lease = self.client.lock(self.prefix + "token-lock", timeout=120, blocking_timeout=65)
            acquired = lease.acquire()
        except Exception:
            raise BuildCADError("storage_unavailable", "BuildCAD 授权存储不可用，请检查 Redis。", 503) from None
        if not acquired:
            raise BuildCADError("authorization_busy", "BuildCAD 授权正在更新，请稍后重试。", 503)
        failed = False
        try:
            yield
        except BaseException:
            failed = True
            raise
        finally:
            try:
                lease.release()
            except Exception:
                # 释放锁的故障不能覆盖已经明确的远程执行结果未知异常。
                if not failed:
                    raise BuildCADError("storage_unavailable", "BuildCAD 授权存储不可用，请检查 Redis。", 503) from None


class BuildCADClient:
    origin = "https://buildcad.ai"
    endpoint = "https://buildcad.ai/api/mcp"
    transport_name = "streamableHttp"
    timeout_seconds = 60.0
    supported_protocols = ("2025-06-18", "2025-03-26", "2024-11-05")
    allowed_tools = frozenset({"list_designs", "get_design_code", "render_preview", "save_design"})
    max_tool_pages = 20
    max_response_bytes = 32 * 1024 * 1024
    max_server_instructions_chars = 24000
    _fallback_token_lock = threading.RLock()

    def __init__(self, store=None, transport=None):
        self.store = store if store is not None else BuildCADStore()
        self._owns_http = not isinstance(transport, httpx.Client)
        self.http = transport if isinstance(transport, httpx.Client) else httpx.Client(
            transport=transport, timeout=self.timeout_seconds, follow_redirects=False, trust_env=False
        )
        self._lock = threading.RLock()
        self._metadata = None
        self._request_id = 0
        self._reset_session()

    def close(self) -> None:
        if self._owns_http:
            self.http.close()

    def _token_lock(self):
        # 正式 Redis 使用分布式锁；注入的进程内存储保留原有简洁契约。
        factory = getattr(self.store, "token_lock", None)
        return factory() if callable(factory) else self._fallback_token_lock

    def _reset_session(self) -> None:
        self._initialized = False
        self._session_id = None
        self._protocol = None
        self._credential_marker = None
        self.server_instructions = ""

    def _unconfirmed_tool_call(self) -> BuildCADError:
        self._reset_session()
        return BuildCADError("outcome_unknown", "BuildCAD 工具已提交，但未收到可信执行回执；请先检查设计状态，避免重复执行。", 502)

    @staticmethod
    def _authorization_required() -> BuildCADError:
        return BuildCADError("authorization_required", "请登录 BuildCAD 并完成连接授权。", 401)

    def status(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "connected": False, "endpoint": self.endpoint, "transport": self.transport_name
        }
        try:
            # 只读握手和工具发现成功后，才允许显示已连接。
            result["tools"] = self.list_tools()
            result["connected"] = True
        except BuildCADError as error:
            result["error"] = {"code": error.code, "message": error.message}
        return result

    def _trusted_endpoint(self, value: Any) -> str:
        if not isinstance(value, str):
            raise BuildCADError("invalid_oauth_metadata", "BuildCAD 授权元数据不完整。")
        parsed = urlsplit(value)
        if parsed.scheme != "https" or parsed.netloc != "buildcad.ai" or parsed.fragment:
            raise BuildCADError("invalid_oauth_metadata", "BuildCAD 授权端点与官方来源不一致。")
        return value

    def _discover_oauth(self) -> dict[str, Any]:
        if self._metadata is not None:
            return self._metadata
        # 官方 401 暂无发现头，且带 /api/mcp 的元数据路径不可用。
        resource = self._json_request("GET", self.origin + "/.well-known/oauth-protected-resource")
        metadata = self._json_request("GET", self.origin + "/.well-known/oauth-authorization-server")
        if resource.get("resource") != self.origin or self.origin not in resource.get("authorization_servers", []):
            raise BuildCADError("invalid_oauth_metadata", "BuildCAD 受保护资源信息不匹配。")
        if metadata.get("issuer") != self.origin or "S256" not in metadata.get("code_challenge_methods_supported", []):
            raise BuildCADError("invalid_oauth_metadata", "BuildCAD 未提供支持的 PKCE 授权方式。")
        if "none" not in metadata.get("token_endpoint_auth_methods_supported", []):
            raise BuildCADError("invalid_oauth_metadata", "BuildCAD 未提供公开客户端授权方式。")
        for key in ("authorization_endpoint", "token_endpoint", "registration_endpoint"):
            self._trusted_endpoint(metadata.get(key))
        self._metadata = {**metadata, "resource": resource["resource"]}
        return self._metadata

    @staticmethod
    def _validate_redirect_uri(redirect_uri: str) -> None:
        try:
            parsed = urlsplit(redirect_uri)
            valid_scheme = parsed.scheme == "https" or (
                parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1", "::1"}
            )
            valid = valid_scheme and bool(parsed.hostname) and not parsed.username and not parsed.password and not parsed.fragment
        except (ValueError, TypeError):
            valid = False
        if not valid:
            raise BuildCADError("invalid_redirect_uri", "授权回调必须是 HTTPS 地址或本机回环地址。", 400)

    def begin_auth(self, redirect_uri: str, browser_nonce: str) -> dict[str, str]:
        self._validate_redirect_uri(redirect_uri)
        if not isinstance(browser_nonce, str) or not browser_nonce or len(browser_nonce) > 1024:
            raise BuildCADError("invalid_oauth_state", "浏览器授权状态无效，请重新发起连接。", 400)
        with self._lock:
            metadata = self._discover_oauth()
            registration = self.store.get("client")
            if not isinstance(registration, dict) or registration.get("redirect_uri") != redirect_uri:
                registered = self._json_request("POST", metadata["registration_endpoint"], json={
                    "client_name": "Industry Agent BuildCAD",
                    "redirect_uris": [redirect_uri],
                    "grant_types": ["authorization_code", "refresh_token"],
                    "response_types": ["code"],
                    "token_endpoint_auth_method": "none",
                })
                client_id = registered.get("client_id")
                if not isinstance(client_id, str) or not client_id or registered.get("token_endpoint_auth_method", "none") != "none":
                    raise BuildCADError("invalid_oauth_response", "BuildCAD 客户端注册响应不完整。")
                registration = {"client_id": client_id, "redirect_uri": redirect_uri}
                self.store.set("client", registration)
            state = secrets.token_urlsafe(32)
            verifier = secrets.token_urlsafe(64)
            challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest()).rstrip(b"=").decode("ascii")
            self.store.set("oauth:" + state, {
                "verifier": verifier,
                "browser_nonce": browser_nonce,
                "redirect_uri": redirect_uri,
                "client_id": registration["client_id"],
                "token_endpoint": metadata["token_endpoint"],
                "expires_at": time.time() + 600,
            }, ttl=600)
            scopes = [scope for scope in ("openid", "profile", "email", "offline_access") if scope in metadata.get("scopes_supported", [])]
            query = urlencode({
                "response_type": "code", "client_id": registration["client_id"],
                "redirect_uri": redirect_uri, "scope": " ".join(scopes),
                "state": state, "code_challenge": challenge, "code_challenge_method": "S256",
                "resource": metadata["resource"],
            })
            separator = "&" if "?" in metadata["authorization_endpoint"] else "?"
            return {"authorization_url": metadata["authorization_endpoint"] + separator + query, "state": state}

    def complete_auth(self, code: str, state: str, browser_nonce: str, redirect_uri: str) -> dict[str, bool]:
        with self._lock:
            if not isinstance(state, str) or not state or len(state) > 1024:
                raise BuildCADError("invalid_oauth_state", "授权状态已过期或无效，请重新连接。", 400)
            # 先消费再验证，禁止同一回调重复换取令牌。
            pending = self.store.pop("oauth:" + state)
            if (
                not isinstance(pending, dict)
                or pending.get("expires_at", 0) <= time.time()
                or not isinstance(browser_nonce, str)
                or not hmac.compare_digest(pending.get("browser_nonce", "").encode(), browser_nonce.encode())
                or pending.get("redirect_uri") != redirect_uri
                or not isinstance(code, str) or not code or len(code) > 8192
            ):
                raise BuildCADError("invalid_oauth_state", "授权状态已过期或与当前浏览器不匹配。", 400)
            endpoint = self._trusted_endpoint(pending["token_endpoint"])
            with self._token_lock():
                response = self._json_request("POST", endpoint, data={
                    "grant_type": "authorization_code", "code": code,
                    "client_id": pending["client_id"], "redirect_uri": redirect_uri,
                    "code_verifier": pending["verifier"], "resource": self.origin,
                })
                self._save_token(response, pending["client_id"], endpoint)
            self._reset_session()
            # 完成授权不等于已经验证 MCP 服务可用。
            return {"authorized": True}

    def _save_token(self, response: dict[str, Any], client_id: str, endpoint: str, previous_refresh: str | None = None) -> dict[str, Any]:
        access = response.get("access_token")
        if not isinstance(access, str) or not access or any(ord(char) < 33 or ord(char) > 126 for char in access) or str(response.get("token_type", "")).lower() != "bearer":
            raise BuildCADError("invalid_oauth_response", "BuildCAD 未返回有效访问令牌。")
        token: dict[str, Any] = {"access_token": access, "client_id": client_id, "token_endpoint": endpoint}
        refresh = response.get("refresh_token", previous_refresh)
        if refresh:
            if not isinstance(refresh, str):
                raise BuildCADError("invalid_oauth_response", "BuildCAD 刷新令牌格式无效。")
            token["refresh_token"] = refresh
        if "expires_in" in response:
            try:
                seconds = float(response["expires_in"])
                if not 0 <= seconds < float("inf"):
                    raise ValueError
                token["expires_at"] = time.time() + seconds
            except (TypeError, ValueError, OverflowError):
                raise BuildCADError("invalid_oauth_response", "BuildCAD 令牌有效期格式无效。") from None
        self.store.set("token", token)
        return token

    def _access_token(self) -> str:
        token = self.store.get("token")
        if not isinstance(token, dict) or not token.get("access_token"):
            raise self._authorization_required()
        if token.get("expires_at", float("inf")) <= time.time() + 30:
            with self._token_lock():
                # 等待其他实例后必须重新读取，不能再次使用等待前的刷新令牌。
                token = self.store.get("token")
                if not isinstance(token, dict) or not token.get("access_token"):
                    raise self._authorization_required()
                if token.get("expires_at", float("inf")) > time.time() + 30:
                    return token["access_token"]
                if not token.get("refresh_token"):
                    raise self._authorization_required()
                endpoint = self._trusted_endpoint(token.get("token_endpoint"))
                try:
                    response = self._json_request("POST", endpoint, data={
                        "grant_type": "refresh_token", "refresh_token": token["refresh_token"],
                        "client_id": token["client_id"], "resource": self.origin,
                    })
                except BuildCADError as error:
                    if error.code == "authorization_required" or error.status in (400, 401, 403):
                        self._reset_session()
                        raise self._authorization_required() from None
                    raise
                token = self._save_token(response, token["client_id"], endpoint, token["refresh_token"])
                self._reset_session()
        return token["access_token"]

    def disconnect(self) -> None:
        with self._lock:
            with self._token_lock():
                self.store.pop("token")
            self._reset_session()

    @staticmethod
    def _check_http(response: httpx.Response) -> None:
        if response.status_code == 401:
            raise BuildCADClient._authorization_required()
        if not 200 <= response.status_code < 300:
            # 保留状态码用于内部决策，但绝不转发供应商正文或重定向。
            raise BuildCADError("provider_error", "BuildCAD 请求未成功，请稍后检查连接。", response.status_code if response.status_code in (400, 403) else 502)

    def _read_bytes(self, response: httpx.Response) -> bytes:
        chunks = []
        size = 0
        for chunk in response.iter_bytes():
            size += len(chunk)
            if size > self.max_response_bytes:
                raise BuildCADError("invalid_response", "BuildCAD 响应超出允许大小。")
            chunks.append(chunk)
        return b"".join(chunks)

    def _json_request(self, method: str, url: str, **kwargs) -> dict[str, Any]:
        try:
            with self.http.stream(method, url, timeout=self.timeout_seconds, follow_redirects=False, **kwargs) as response:
                self._check_http(response)
                value = json.loads(self._read_bytes(response))
        except httpx.TimeoutException:
            raise BuildCADError("outcome_unknown", "BuildCAD 请求超时，结果尚不确定，请检查后再操作。", 504) from None
        except httpx.RequestError:
            raise BuildCADError("provider_unavailable", "暂时无法连接 BuildCAD。", 502) from None
        except (ValueError, UnicodeError):
            raise BuildCADError("invalid_response", "BuildCAD 返回了无效响应。") from None
        if not isinstance(value, dict):
            raise BuildCADError("invalid_response", "BuildCAD 返回了无效响应。")
        return value

    def _next_id(self) -> int:
        self._request_id += 1
        return self._request_id

    def _rpc_result(self, value: Any, request_id: int) -> dict[str, Any]:
        if not isinstance(value, dict) or value.get("jsonrpc") != "2.0" or value.get("id") != request_id:
            raise BuildCADError("invalid_response", "BuildCAD 协议响应与请求不匹配。")
        if "error" in value:
            error = value["error"]
            if "result" in value or not isinstance(error, dict) or type(error.get("code")) is not int or not isinstance(error.get("message"), str):
                raise BuildCADError("invalid_response", "BuildCAD 协议错误回执格式无效。")
            raise BuildCADError("provider_error", "BuildCAD 未能执行该协议请求。")
        if not isinstance(value.get("result"), dict):
            raise BuildCADError("invalid_response", "BuildCAD 协议响应缺少结果。")
        return value["result"]

    def _sse_result(self, response: httpx.Response, request_id: int) -> dict[str, Any]:
        data: list[str] = []
        size = 0
        started = time.monotonic()
        for line in response.iter_lines():
            size += len(line.encode("utf-8"))
            if time.monotonic() - started > self.timeout_seconds:
                raise httpx.ReadTimeout("事件流超时")
            if size > self.max_response_bytes:
                raise BuildCADError("invalid_response", "BuildCAD 事件流超出允许大小。")
            if line == "":
                if data:
                    value = json.loads("\n".join(data))
                    data = []
                    if isinstance(value, dict) and value.get("id") == request_id:
                        return self._rpc_result(value, request_id)
            elif line.startswith("data:"):
                data.append(line[5:].lstrip(" "))
        raise BuildCADError("invalid_response", "BuildCAD 事件流未返回对应请求结果。")

    def _rpc(self, method: str, access: str, params: dict[str, Any] | None = None, notification: bool = False) -> dict[str, Any]:
        payload: dict[str, Any] = {"jsonrpc": "2.0", "method": method}
        if not notification:
            payload["id"] = self._next_id()
        if params is not None:
            payload["params"] = params
        headers = {"Authorization": "Bearer " + access, "Accept": "application/json, text/event-stream", "Content-Type": "application/json"}
        if self._session_id:
            headers["Mcp-Session-Id"] = self._session_id
        if self._protocol:
            headers["MCP-Protocol-Version"] = self._protocol
        try:
            with self.http.stream("POST", self.endpoint, json=payload, headers=headers, timeout=self.timeout_seconds, follow_redirects=False) as response:
                if method == "tools/call" and response.status_code >= 500:
                    # 代理或服务故障可能发生在写入之后，不能据此认定设计未保存。
                    raise self._unconfirmed_tool_call()
                if response.status_code in (401, 404):
                    # 会话失效后，仅下次独立操作重新握手，不重放本次工具调用。
                    self._reset_session()
                self._check_http(response)
                if notification:
                    return {}
                if method == "initialize":
                    session_id = response.headers.get("mcp-session-id")
                    if session_id and (len(session_id) > 1024 or any(ord(char) < 33 or ord(char) > 126 for char in session_id)):
                        raise BuildCADError("invalid_response", "BuildCAD 会话标识无效。")
                    self._session_id = session_id
                content_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
                if content_type == "text/event-stream":
                    return self._sse_result(response, payload["id"])
                if content_type != "application/json":
                    raise BuildCADError("invalid_response", "BuildCAD 返回了不支持的响应格式。")
                return self._rpc_result(json.loads(self._read_bytes(response)), payload["id"])
        except httpx.TimeoutException:
            self._reset_session()
            raise BuildCADError("outcome_unknown", "BuildCAD 请求超时，结果尚不确定；请先检查设计状态，避免重复执行。", 504) from None
        except httpx.RequestError:
            self._reset_session()
            if method == "tools/call":
                raise BuildCADError("outcome_unknown", "BuildCAD 工具连接中断，执行结果尚不确定，请先检查设计状态。", 502) from None
            raise BuildCADError("provider_unavailable", "暂时无法连接 BuildCAD。", 502) from None
        except BuildCADError as error:
            if method == "tools/call" and error.code == "invalid_response":
                raise self._unconfirmed_tool_call() from None
            raise
        except (ValueError, UnicodeError):
            if method == "tools/call":
                raise self._unconfirmed_tool_call() from None
            raise BuildCADError("invalid_response", "BuildCAD 返回了无效协议响应。") from None

    def _ensure_session(self) -> str:
        access = self._access_token()
        marker = hashlib.sha256(access.encode()).hexdigest()
        if marker != self._credential_marker:
            self._reset_session()
        if not self._initialized:
            result = self._rpc("initialize", access, {
                "protocolVersion": self.supported_protocols[0], "capabilities": {},
                "clientInfo": {"name": "industry-agent-buildcad", "version": "1.0.0"},
            })
            protocol = result.get("protocolVersion")
            if protocol not in self.supported_protocols:
                self._reset_session()
                raise BuildCADError("unsupported_protocol", "BuildCAD 返回了暂不支持的 MCP 协议版本。")
            self._protocol = protocol
            self._rpc("notifications/initialized", access, notification=True)
            instructions = result.get("instructions")
            # 仅供可信节点读取服务的建模说明，不加入公开状态或持久化凭据。
            self.server_instructions = instructions[:self.max_server_instructions_chars] if isinstance(instructions, str) else ""
            self._initialized = True
            self._credential_marker = marker
        return access

    def list_tools(self) -> list[dict[str, Any]]:
        with self._lock:
            access = self._ensure_session()
            tools: list[dict[str, Any]] = []
            cursor = None
            seen = set()
            for _ in range(self.max_tool_pages):
                result = self._rpc("tools/list", access, {"cursor": cursor} if cursor else {})
                page = result.get("tools")
                if not isinstance(page, list) or any(not isinstance(tool, dict) or not isinstance(tool.get("name"), str) or not isinstance(tool.get("inputSchema"), dict) for tool in page):
                    raise BuildCADError("invalid_response", "BuildCAD 工具列表格式无效。")
                tools.extend(page)
                cursor = result.get("nextCursor")
                if cursor is None:
                    return tools
                if not isinstance(cursor, str) or not cursor or cursor in seen:
                    raise BuildCADError("invalid_response", "BuildCAD 工具分页游标无效或重复。")
                seen.add(cursor)
            raise BuildCADError("invalid_response", "BuildCAD 工具列表超过允许分页数。")

    def call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        if name not in self.allowed_tools:
            raise BuildCADError("unsupported_tool", "该 BuildCAD 工具不在已启用范围内。", 400)
        if not isinstance(arguments, dict):
            raise BuildCADError("invalid_arguments", "BuildCAD 工具参数必须是对象。", 400)
        with self._lock:
            access = self._ensure_session()
            # 不推测参数字段，不重试可能产生设计写入的调用。
            return self._rpc("tools/call", access, {"name": name, "arguments": arguments})


__all__ = ["BuildCADClient", "BuildCADError", "BuildCADStore"]
