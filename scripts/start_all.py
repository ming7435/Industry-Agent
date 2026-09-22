"""一键启动本地演示所需的后端服务。"""

from __future__ import annotations

import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _load_env_file(path: Path) -> None:
    """加载简单的 KEY=VALUE 环境文件，不覆盖已存在的进程环境变量。"""

    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _default_env() -> dict[str, str]:
    """生成子进程环境，并补齐本地联调默认地址。"""

    _load_env_file(PROJECT_ROOT / ".env")
    env = dict(os.environ)
    defaults = {
        "RAG_SERVICE_BASE_URL": "http://127.0.0.1:8020",
        "MCP_CAD_URL": "http://127.0.0.1:8011",
        "CAD_SERVICE_BASE_URL": "http://127.0.0.1:8011",
        "AGENT_SERVICE_BASE_URL": "http://127.0.0.1:8010",
        "MONITOR_WEB_HOST": "127.0.0.1",
        "MONITOR_WEB_PORT": "8001",
        "FACTORY_API_BASE_URL": "http://127.0.0.1:4529",
    }
    for key, value in defaults.items():
        if not env.get(key):
            env[key] = value
    return env


def _stream_logs(name: str, process: subprocess.Popen[str]) -> None:
    """把子进程输出加服务名前缀后转发到当前终端。"""

    assert process.stdout is not None
    for line in process.stdout:
        print(f"[{name}] {line}", end="")


def _terminate(processes: list[tuple[str, subprocess.Popen[str]]]) -> None:
    """按启动顺序反向停止所有仍在运行的子进程。"""

    for name, process in reversed(processes):
        if process.poll() is None:
            print(f"正在停止 {name} ...")
            process.terminate()
    deadline = time.time() + 8
    for name, process in reversed(processes):
        if process.poll() is None:
            remaining = max(0.1, deadline - time.time())
            try:
                process.wait(timeout=remaining)
            except subprocess.TimeoutExpired:
                print(f"强制结束 {name} ...")
                process.kill()


def main() -> int:
    env = _default_env()
    python = sys.executable
    services = [
        (
            "rag-service",
            [python, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8020"],
            PROJECT_ROOT / "services" / "rag-service",
        ),
        (
            "cad-service",
            [python, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8011"],
            PROJECT_ROOT / "services" / "document-cad-service",
        ),
        (
            "agent-service",
            [python, "-m", "uvicorn", "app.api.server:app", "--app-dir", "services/agent-service", "--host", "127.0.0.1", "--port", "8010"],
            PROJECT_ROOT,
        ),
        (
            "monitor-web",
            [python, "services/agent-service/monitor_web_server.py"],
            PROJECT_ROOT,
        ),
    ]

    processes: list[tuple[str, subprocess.Popen[str]]] = []
    original_sigint = signal.getsignal(signal.SIGINT)

    def handle_sigint(signum: int, frame: object) -> None:
        _terminate(processes)
        if callable(original_sigint):
            original_sigint(signum, frame)

    signal.signal(signal.SIGINT, handle_sigint)

    print("启动本地演示服务。模拟工厂需已在 http://127.0.0.1:4529 运行。")
    print("监控工作台：http://127.0.0.1:8001，按 Ctrl+C 统一停止。")
    try:
        for name, command, cwd in services:
            print(f"启动 {name} ...")
            process = subprocess.Popen(
                command,
                cwd=cwd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
            )
            processes.append((name, process))
            threading.Thread(target=_stream_logs, args=(name, process), daemon=True).start()
            time.sleep(0.8)

        while True:
            for name, process in processes:
                return_code = process.poll()
                if return_code is not None:
                    print(f"{name} 已退出，退出码：{return_code}")
                    _terminate(processes)
                    return return_code
            time.sleep(1)
    except KeyboardInterrupt:
        _terminate(processes)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
