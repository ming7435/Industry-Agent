"""Bounded headless execution of server-authored cadgen programs.

This internal client accepts trusted templates. Public tools accept validated
specifications, never Python. Calls own their child process and never retry.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys
import signal
import tempfile
import threading


class TextToCadConnectionError(RuntimeError):
    def __init__(self, code, message, status=503):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status


class TextToCadClient:
    provider = 'text-to-cad'
    _tools = [{'name': 'execute_code', 'description': 'Execute a server-authored cadgen model'},
              {'name': 'get_rpc_status', 'description': 'Compatibility name for the headless runtime probe'}]

    def __init__(self, command=None, timeout=240):
        self.command = command or [os.getenv('CADGEN_PYTHON') or sys.executable]
        if isinstance(self.command, (str, Path)):
            self.command = [str(self.command)]
        self.timeout = timeout
        self._lock = threading.Lock()

    def _run(self, source, timeout, *, dispatched):
        with tempfile.TemporaryDirectory(prefix='industry-cad-') as temporary:
            script = Path(temporary) / 'model.py'
            script.write_text(source, encoding='utf-8')
            with (Path(temporary) / 'stdout').open('w+b') as stdout, (Path(temporary) / 'stderr').open('w+b') as stderr:
                try:
                    process = subprocess.Popen([*self.command, '-I', '-X', 'utf8', '-u', str(script)],
                        stdin=subprocess.DEVNULL, stdout=stdout, stderr=stderr,
                        env={**os.environ, 'PYTHONIOENCODING': 'utf-8',
                             'CADGEN_CACHE_DIR': os.getenv('CADGEN_CACHE_DIR') or str(Path(__file__).resolve().parents[4] / '.runtime' / 'text-to-cad-cache'),
                             'CADGEN_DAEMON': '0',
                             'CADGEN_COMPONENT_WORKERS': os.getenv('CADGEN_COMPONENT_WORKERS') or '1',
                             'CADGEN_TELEMETRY': '0', 'CADGEN_UPDATE_CHECK': '0'},
                        creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
                        start_new_session=os.name != 'nt')
                except (OSError, ValueError):
                    raise TextToCadConnectionError('unavailable',
                        '无法启动 text-to-cad Python，请检查 CADGEN_PYTHON 和项目依赖。') from None
                try:
                    process.wait(timeout=max(0.05, timeout))
                except subprocess.TimeoutExpired:
                    self._kill_owned_process_tree(process)
                    process.wait(timeout=5)
                    if dispatched:
                        raise TextToCadConnectionError('outcome_unknown',
                            'text-to-cad 执行超时，原任务可能已有产物；请查询原任务，不会自动重放。', 504) from None
                    raise TextToCadConnectionError('unavailable', 'text-to-cad 运行时检查超时。') from None
                output = []
                for stream in (stdout, stderr):
                    size = stream.seek(0, 2)
                    stream.seek(max(0, size - 2 * 1024 * 1024))
                    output.append(stream.read().decode('utf-8', errors='replace'))
                return process.returncode, '\n'.join(output).strip()

    @staticmethod
    def _kill_owned_process_tree(process):
        # Document exports and cadgen may spawn children. Reap this call's tree
        # before closing its inherited output handles; never target by image name.
        try:
            if os.name == 'nt':
                subprocess.run(['taskkill', '/PID', str(process.pid), '/T', '/F'],
                    stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL, timeout=10,
                    creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            else:
                os.killpg(process.pid, signal.SIGKILL)
        except (OSError, subprocess.TimeoutExpired):
            pass
        if process.poll() is None:
            process.kill()

    def list_tools(self):
        status = self.status()
        if not status['connected']:
            raise TextToCadConnectionError(status['error_code'], status['error'])
        return [dict(tool) for tool in self._tools]

    def call_tool(self, name, arguments, timeout=None):
        if name not in {'execute_code', 'get_rpc_status'}:
            raise TextToCadConnectionError('unsupported_tool', '不允许执行此 CAD 工具。', 400)
        if name == 'get_rpc_status':
            value = self.status()
            return {'isError': not value['connected'], 'content': [{'type': 'text', 'text': json.dumps(value)}]}
        if not isinstance(arguments, dict) or not isinstance(arguments.get('code'), str):
            raise TextToCadConnectionError('invalid_program', '缺少服务端 CAD 程序。', 400)
        with self._lock:
            code, output = self._run(arguments['code'], min(timeout or self.timeout, self.timeout), dispatched=True)
        return {'isError': code != 0, 'content': [{'type': 'text', 'text': output}],
                'provider': self.provider, 'exit_code': code}

    def status(self):
        probe = '''import json, subprocess
from importlib.metadata import version
from cadgen import build123d as bd
from cadgen._internal.node_runtime import cad_node_executable
if version('cadgen') != '0.7.10':
    raise RuntimeError('Expected cadgen 0.7.10')
node_version = subprocess.check_output([cad_node_executable(), '--version'], text=True, timeout=5).strip()
if not node_version.startswith('v') or int(node_version[1:].split('.')[0]) < 20:
    raise RuntimeError('text-to-cad requires Node.js 20 or newer')
shape = bd.Solid.make_box(1, 1, 1)
if not shape.is_valid or abs(shape.volume - 1) > 1e-9:
    raise RuntimeError("CAD kernel geometry probe failed")
print("CADGEN_STATUS=" + json.dumps({"version": version("cadgen"), "build123d": version("build123d"), "kernel": "OpenCascade", "node_version": node_version}))
'''
        try:
            with self._lock:
                code, output = self._run(probe, min(self.timeout, 60), dispatched=False)
            if code:
                raise TextToCadConnectionError('runtime_unavailable',
                    'text-to-cad 内核不可用，请安装项目 CAD 依赖并运行运行时检查。')
            line = next((line for line in output.splitlines() if line.startswith('CADGEN_STATUS=')), '')
            evidence = json.loads(line.removeprefix('CADGEN_STATUS='))
            return {'provider': self.provider, 'connected': True, 'tools': self._tools,
                    'runtime': evidence, 'engine': 'cadgen', 'headless': True}
        except (TextToCadConnectionError, ValueError) as error:
            return {'provider': self.provider, 'connected': False, 'tools': [],
                    'error': getattr(error, 'message', 'text-to-cad 运行时未返回有效检查结果。'),
                    'error_code': getattr(error, 'code', 'protocol_error')}

    def close(self):
        """All child processes are owned and reaped within their individual call."""
