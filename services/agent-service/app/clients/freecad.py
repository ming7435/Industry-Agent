"""本机 freecad-mcp 标准 stdio 客户端；有界请求，写入超时不重放。"""
import json
import os
from pathlib import Path
import queue
import subprocess
import threading
import time


class FreeCADConnectionError(RuntimeError):
    def __init__(self, code, message, status=503):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status


class FreeCADClient:
    provider = 'freecad'

    def __init__(self, command=None, timeout=100):
        root = Path(__file__).resolve().parents[4]
        executable = os.getenv('FREECAD_MCP_EXECUTABLE') or str(root / '.runtime/freecad-mcp-venv/Scripts/freecad-mcp.exe')
        self.command = command or [executable, '--host', '127.0.0.1', '--only-text-feedback']
        self.timeout = timeout
        self._lock = threading.Lock()

    def _exchange(self, method, params, timeout):
        # 每次会话启动自己的 MCP 子进程，不在请求之间共享管道或隐式重试。
        try:
            process = subprocess.Popen(self.command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL, text=True, encoding='utf-8', errors='replace',
                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'},
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        except (OSError, ValueError):
            raise FreeCADConnectionError('unavailable', '未找到本地 freecad-mcp，请先安装并启动 FreeCAD。') from None
        inbox = queue.Queue(maxsize=128)
        sent_operation = False
        deadline = time.monotonic() + timeout

        def receive():
            try:
                while True:
                    line = process.stdout.readline(4 * 1024 * 1024 + 1)
                    if not line:
                        inbox.put(None, timeout=0.1)
                        break
                    if len(line) > 4 * 1024 * 1024:
                        inbox.put(None, timeout=0.1)
                        break
                    inbox.put(json.loads(line), timeout=0.1)
            except (ValueError, OSError, queue.Full):
                try:
                    inbox.put_nowait(None)
                except queue.Full:
                    pass

        reader = threading.Thread(target=receive, daemon=True)
        reader.start()

        def send(message):
            process.stdin.write(json.dumps({'jsonrpc': '2.0', **message}, ensure_ascii=False) + '\n')
            process.stdin.flush()

        def response(identifier):
            while True:
                wait = deadline - time.monotonic()
                if wait <= 0:
                    raise queue.Empty
                value = inbox.get(timeout=wait)
                if not isinstance(value, dict):
                    raise EOFError
                if value.get('id') != identifier:
                    continue
                if value.get('error') or not isinstance(value.get('result'), dict):
                    raise FreeCADConnectionError('protocol_error', 'FreeCAD MCP 未返回有效协议结果。', 502)
                return value['result']

        try:
            send({'id': 1, 'method': 'initialize', 'params': {'protocolVersion': '2025-03-26',
                'capabilities': {}, 'clientInfo': {'name': 'industry-agent', 'version': '1.0'}}})
            response(1)
            send({'method': 'notifications/initialized'})
            send({'id': 2, 'method': method, 'params': params})
            sent_operation = True
            return response(2)
        except (queue.Empty, EOFError, OSError):
            if sent_operation and method == 'tools/call' and params.get('name') == 'execute_code':
                raise FreeCADConnectionError('outcome_unknown', 'FreeCAD 执行未收到明确结果；请查询原任务，不会自动重放。', 504) from None
            raise FreeCADConnectionError('unavailable', 'FreeCAD MCP 未及时响应，请检查本地 FreeCAD 和 RPC 服务。') from None
        finally:
            if process.poll() is None:
                process.terminate()
            try:
                process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=3)
            for stream in (process.stdin, process.stdout):
                stream.close()
            reader.join(timeout=0.2)

    def list_tools(self):
        with self._lock:
            result = self._exchange('tools/list', {}, min(self.timeout, 15))
        tools = result.get('tools')
        if not isinstance(tools, list) or not any(t.get('name') == 'execute_code' for t in tools if isinstance(t, dict)):
            raise FreeCADConnectionError('protocol_error', '本地 MCP 未提供 execute_code 工具。')
        return tools

    def call_tool(self, name, arguments, timeout=None):
        if name not in {'execute_code', 'get_rpc_status'}:
            raise FreeCADConnectionError('unsupported_tool', '不允许从建模接口执行此 MCP 工具。', 400)
        with self._lock:
            return self._exchange('tools/call', {'name': name, 'arguments': arguments}, min(timeout or self.timeout, 100))

    def status(self):
        try:
            tools = self.list_tools()
            rpc = self.call_tool('get_rpc_status', {}, timeout=10)
            texts = '\n'.join(item.get('text', '') for item in rpc.get('content', []) if isinstance(item, dict))
            try:
                evidence = json.loads(texts)
            except (ValueError, TypeError):
                evidence = {}
            if rpc.get('isError') or evidence.get('success') is not True or evidence.get('rpc_server') != 'running':
                raise FreeCADConnectionError('rpc_unavailable', 'MCP 已启动，但 FreeCAD RPC 尚未就绪。')
            if (evidence.get('gui_dispatch') or {}).get('state') == 'stuck':
                raise FreeCADConnectionError('gui_stuck', 'FreeCAD GUI 任务执行超时且仍在运行；请先核对原任务。')
            return {'provider': 'freecad', 'connected': True, 'tools': tools, 'rpc': rpc}
        except FreeCADConnectionError as error:
            return {'provider': 'freecad', 'connected': False, 'tools': [], 'error': error.message, 'error_code': error.code}

    def close(self):
        # MCP 子进程随单次请求结束，独立 FreeCAD 应用不由 API 请求关闭。
        pass
