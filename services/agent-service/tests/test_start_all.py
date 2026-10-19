import json
import io
import os
import subprocess
import sys
import threading
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from scripts import start_all
from scripts.start_all import service_port


def test_start_all_can_identify_service_ports_for_reuse():
    assert service_port("agent-service", ["python", "-m", "uvicorn", "--port", "8010"]) == 8010
    assert service_port("monitor-web", ["python", "monitor_web_server.py"], monitor_port=8001) == 8001
    assert service_port("unknown", ["python", "worker.py"]) is None


@pytest.mark.parametrize('configured', [None, '', '   '])
def test_startup_and_children_use_project_cad_python_when_unconfigured(monkeypatch, tmp_path, configured):
    project_python = tmp_path / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    project_python.parent.mkdir(parents=True)
    project_python.touch()
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.delenv('CADGEN_PYTHON', raising=False)
    if configured is not None:
        (tmp_path / '.env').write_text(f'CADGEN_PYTHON="{configured}"\n', encoding='utf-8')

    assert start_all._default_env()['CADGEN_PYTHON'] == str(project_python)
    assert start_all._env_for_service(tmp_path / 'services/agent-service')['CADGEN_PYTHON'] == str(project_python)


@pytest.mark.parametrize('source', ['file', 'process'])
def test_explicit_cad_python_takes_precedence_over_project_venv(monkeypatch, tmp_path, source):
    project_python = tmp_path / '.venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    project_python.parent.mkdir(parents=True)
    project_python.touch()
    configured_python = str(tmp_path / 'selected' / 'python')
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.delenv('CADGEN_PYTHON', raising=False)
    (tmp_path / '.env').write_text(f'CADGEN_PYTHON={configured_python}\n', encoding='utf-8')
    if source == 'process':
        configured_python = str(tmp_path / 'explicit' / 'python')
        monkeypatch.setenv('CADGEN_PYTHON', configured_python)

    assert start_all._default_env()['CADGEN_PYTHON'] == configured_python
    assert start_all._env_for_service(tmp_path / 'services/agent-service')['CADGEN_PYTHON'] == configured_python


def test_startup_keeps_current_python_without_project_venv(monkeypatch, tmp_path):
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.delenv('CADGEN_PYTHON', raising=False)

    assert start_all._default_env()['CADGEN_PYTHON'] == sys.executable
    assert start_all._env_for_service(tmp_path / 'services/agent-service')['CADGEN_PYTHON'] == sys.executable


@contextmanager
def startup_health_server(statuses):
    """仅使用随机回环端口模拟启动过程，不访问模型和业务服务。"""
    calls = []

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            calls.append(self.path)
            status = statuses[min(len(calls) - 1, len(statuses) - 1)]
            body = json.dumps({"ready": False}).encode()
            self.send_response(status)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_port, calls
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def startup_waiter():
    waiter = getattr(start_all, "_wait_for_service_startup", None)
    assert callable(waiter), "启动器必须按健康接口等待，不能固定等待 0.8 秒"
    return waiter


def test_startup_waits_for_http_health_instead_of_open_port():
    # 端口已开放但应用仍在初始化时，不能提前放行监控。
    with startup_health_server([503, 503, 200]) as (port, calls):
        startup_waiter()("agent-service", None, port, timeout_seconds=3, poll_seconds=0.01)
        assert calls == ["/health", "/health", "/health"]


def test_startup_health_failure_is_bounded():
    with startup_health_server([503]) as (port, calls):
        started = time.monotonic()
        with pytest.raises(TimeoutError, match="agent-service"):
            startup_waiter()("agent-service", None, port, timeout_seconds=0.1, poll_seconds=0.01)
        assert calls
        assert time.monotonic() - started < 1


def test_startup_does_not_wait_for_exited_child():
    # 真实子进程提前退出时立即停止等待，不掩盖启动失败。
    process = subprocess.Popen([sys.executable, "-c", "raise SystemExit(7)"])
    process.wait(timeout=5)
    with pytest.raises(RuntimeError, match="agent-service"):
        startup_waiter()("agent-service", process, 9, timeout_seconds=3, poll_seconds=0.01)


def test_utf8_service_logs_keep_draining_on_a_gbk_windows_locale(monkeypatch, tmp_path):
    """中文及非文本日志不能杀死读取线程，使真实子进程堵在输出管道。"""
    real_popen, real_thread = subprocess.Popen, threading.Thread
    processes, readers = [], []
    sink = io.BytesIO()
    gbk_output = io.TextIOWrapper(sink, encoding='gbk')
    child = (
        "import sys; "
        "sys.stdout.buffer.write(b'\\xff\\xfe\\n'); sys.stdout.buffer.flush(); "
        "sys.stdout.buffer.write(('诊断复核已完成：' + 'x' * 131072 + '\\n').encode('utf-8')); "
        "sys.stdout.buffer.write(b'OUTPUT-DRAINED\\n'); sys.stdout.buffer.flush()"
    )

    def spawn(_command, **kwargs):
        process = real_popen([sys.executable, '-c', child], **{**kwargs, 'cwd': tmp_path})
        processes.append(process)
        return process

    def reader(*args, **kwargs):
        thread = real_thread(*args, **kwargs)
        readers.append(thread)
        return thread

    deadline = time.monotonic() + 5
    def exited(children):
        code = children[0][1].poll()
        return (children[0][0], code) if code is not None else ('blocked-log-output', 98) if time.monotonic() > deadline else None

    monkeypatch.setattr(subprocess, '_text_encoding', lambda: 'gbk')
    monkeypatch.setattr(start_all.sys, 'stdout', gbk_output)
    monkeypatch.setattr(subprocess, 'Popen', spawn)
    monkeypatch.setattr(threading, 'Thread', reader)
    monkeypatch.setattr(start_all, '_default_env', lambda: {'APP_ENV': 'development', 'MONITOR_WEB_PORT': '8001',
                                                          'BACKEND_INTERNAL_TOKEN': 'isolated-test'})
    monkeypatch.setattr(start_all, '_env_for_service', lambda _: {**os.environ, 'PYTHONIOENCODING': 'utf-8'})
    monkeypatch.setattr(start_all, '_check_text_to_cad', lambda _: {'ready': False, 'reason': 'isolated-test'})
    monkeypatch.setattr(start_all, '_port_in_use', lambda *_: False)
    monkeypatch.setattr(start_all, '_wait_for_service_startup', lambda *_: None)
    monkeypatch.setattr(start_all, 'unexpected_service_exit', exited)
    try:
        assert start_all.main() == 0
        for thread in readers:
            thread.join(timeout=2)
        gbk_output.flush()
        output = sink.getvalue().decode('gbk')
        assert '诊断复核已完成：' in output
        assert 'OUTPUT-DRAINED' in output
    finally:
        for process in processes:
            if process.poll() is None:
                process.kill()
            process.wait(timeout=5)
