"""一键启动本地演示所需的后端服务。"""

from __future__ import annotations

import os
import signal
import socket
import subprocess
import sys
import secrets
import threading
import time
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
_LOCAL_INTERNAL_TOKEN = secrets.token_urlsafe(32)


def _read_env_file(path: Path) -> dict[str, str]:
    """读取简单的 KEY=VALUE 文件，不修改当前进程环境。"""

    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            values[key] = value
    return values


def _load_env_file(path: Path) -> None:
    """兼容旧调用方：将文件值加载到进程环境但不覆盖显式变量。"""

    for key, value in _read_env_file(path).items():
        if key not in os.environ:
            os.environ[key] = value


def _merge_env(
    explicit: dict[str, str],
    root: dict[str, str],
    service: dict[str, str],
) -> dict[str, str]:
    """按进程环境 > 服务覆盖 > 根配置合并配置。"""

    merged = dict(root)
    merged.update(service)
    merged.update(explicit)
    return merged


def _default_env() -> dict[str, str]:
    """生成子进程环境，并补齐本地联调默认地址。"""

    env = _merge_env(
        dict(os.environ),
        _read_env_file(PROJECT_ROOT / ".env"),
        {},
    )
    defaults = {
        "RAG_SERVICE_BASE_URL": "http://127.0.0.1:8020",
        "BACKEND_SERVICE_BASE_URL": "http://127.0.0.1:8030",
        "MODEL_SERVICE_BASE_URL": "http://127.0.0.1:8040",
        "MCP_MES_URL": "http://127.0.0.1:8030",
        "MCP_INVENTORY_URL": "http://127.0.0.1:8030",
        "MCP_QMS_URL": "http://127.0.0.1:8030",
        "BACKEND_STORAGE": "mysql",
        "WORKORDER_BACKEND": "mysql",
        "REDIS_URL": "redis://127.0.0.1:6379/0",
        # 本地运行使用已配置的远程提供方；CI/Docker 冒烟测试会在 Compose
        # 环境中显式设置 MODEL_PROVIDER=fake。
        "MODEL_PROVIDER": "remote",
        # 对话统一走 DeepSeek 官方接口；SiliconFlow 仅作为可选的向量化/重排提供方。
        "MODEL_CHAT_PROVIDER": "deepseek",
        "APP_ENV": "development",
        "ALLOW_DEGRADED_STORAGE": "false",
        "RAG_ALLOW_LOCAL_FALLBACK": "true",
        "RAG_UPSERT_WHOOSH_ENABLED": "true",
        "RAG_UPSERT_MILVUS_ENABLED": "true",
        "MCP_CAD_URL": "http://127.0.0.1:8050",
        "CAD_SERVICE_BASE_URL": "http://127.0.0.1:8050",
        "AGENT_SERVICE_BASE_URL": "http://127.0.0.1:8010",
        "MONITOR_WEB_HOST": "127.0.0.1",
        "MONITOR_WEB_PORT": "8001",
        "FACTORY_API_BASE_URL": "http://127.0.0.1:4529",
    }
    for key, value in defaults.items():
        if not env.get(key):
            env[key] = value
    return env


def _env_for_service(service_root: Path) -> dict[str, str]:
    """为子进程生成环境；所有服务统一读取仓库根目录 ``.env``。

    ``service_root`` 保留在函数签名中，是为了兼容已有启动调用方；服务目录
    下的旧 ``.env`` 不再参与合并，避免同一个变量在不同服务中出现两套值。
    """

    env = _merge_env(
        dict(os.environ),
        _read_env_file(PROJECT_ROOT / ".env"),
        {},
    )
    env.update({key: value for key, value in _default_env().items() if key not in env})
    if not env.get("BACKEND_INTERNAL_TOKEN", "").strip() and env.get("APP_ENV", "development").lower() == "development":
        # 本地六个子进程共享一次性内部身份；不写配置文件、不输出令牌。生产仍要求显式配置。
        env["BACKEND_INTERNAL_TOKEN"] = _LOCAL_INTERNAL_TOKEN
    paths = [str(PROJECT_ROOT), *[value for value in env.get("PYTHONPATH", "").split(os.pathsep) if value]]
    env["PYTHONPATH"] = os.pathsep.join(dict.fromkeys(paths))
    return env


def service_port(name: str, command: list[str], monitor_port: int = 8001) -> int | None:
    """返回受管理服务占用的 TCP 端口（如果命令声明了端口）。"""

    if name == "monitor-web":
        return int(monitor_port)
    try:
        index = command.index("--port")
        return int(command[index + 1])
    except (ValueError, IndexError):
        return None


def _port_in_use(host: str, port: int) -> bool:
    """生成子进程前检测本地服务是否已经运行。"""

    try:
        with socket.create_connection((host, port), timeout=0.25):
            return True
    except OSError:
        return False


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
    python = sys.executable
    services = [
        (
            "model-service",
            [
                python,
                "-m",
                "uvicorn",
                "app.main:app",
                "--app-dir",
                "services/model-service",
                "--host",
                "127.0.0.1",
                "--port",
                "8040",
            ],
            PROJECT_ROOT,
            # 模型凭据统一维护在 RAG 集成环境文件中；同时将该文件加载到
            # 共享模型网关的子进程环境中。
            PROJECT_ROOT / "services" / "rag-service",
        ),
        (
            "backend-service",
            [python, "-m", "uvicorn", "app.main:app", "--app-dir", "services/backend-service", "--host", "127.0.0.1", "--port", "8030"],
            PROJECT_ROOT,
            PROJECT_ROOT / "services" / "backend-service",
        ),
        (
            "rag-service",
            [python, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8020"],
            PROJECT_ROOT / "services" / "rag-service",
            PROJECT_ROOT / "services" / "rag-service",
        ),
        (
            "cad-service",
            [python, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8050"],
            PROJECT_ROOT / "services" / "document-cad-service",
            PROJECT_ROOT / "services" / "document-cad-service",
        ),
        (
            "agent-service",
            [python, "-m", "uvicorn", "app.api.server:app", "--app-dir", "services/agent-service", "--host", "127.0.0.1", "--port", "8010"],
            PROJECT_ROOT,
            PROJECT_ROOT / "services" / "agent-service",
        ),
        (
            "monitor-web",
            [python, "services/agent-service/monitor_web_server.py"],
            PROJECT_ROOT,
            PROJECT_ROOT,
        ),
    ]

    launch_env = _default_env()
    monitor_port = int(launch_env["MONITOR_WEB_PORT"])
    if not launch_env.get("BACKEND_INTERNAL_TOKEN", "").strip() and launch_env["APP_ENV"].lower() == "development":
        # 一次性身份无法证明旧服务的身份一致，必须在启动任何子进程前拒绝混用。
        occupied = [name for name, command, _, _ in services if (port := service_port(name, command, monitor_port)) is not None and _port_in_use("127.0.0.1", port)]
        if occupied:
            raise RuntimeError("已有服务的内部身份无法核对，请先统一停止本地应用再重新启动；不会停止工厂或基础设施。")

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
        for name, command, cwd, env_root in services:
            port = service_port(name, command, monitor_port=monitor_port)
            if port is not None and _port_in_use("127.0.0.1", port):
                print(f"{name} 已在 127.0.0.1:{port} 运行，复用现有服务。")
                continue
            print(f"启动 {name} ...")
            process = subprocess.Popen(
                command,
                cwd=cwd,
                env=_env_for_service(env_root),
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
