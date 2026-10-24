"""Prepare the local OpenSandbox server used by expert skill trials.

The server runs on the host so it can use Docker Desktop without exposing the
Docker socket to the agent-service container. Its generated config and key stay
in ignored local files.
"""

from __future__ import annotations

import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"
CONFIG_FILE = ROOT / ".runtime" / "skill-sandbox" / "server.toml"
CONTAINER_CONFIG_FILE = ROOT / ".runtime" / "skill-sandbox" / "server-container.toml"
IMAGE = "industry-skill-runner:0.1"
PORT = 18080


def server_environment(base: dict[str, str] | None = None) -> dict[str, str]:
    """Keep the server's localhost proxy calls out of Windows system proxies."""
    env = dict(os.environ if base is None else base)
    bypass = [value.strip() for value in (env.get("NO_PROXY") or env.get("no_proxy") or "").split(",") if value.strip()]
    for host in ("127.0.0.1", "localhost"):
        if host not in bypass:
            bypass.append(host)
    env["NO_PROXY"] = ",".join(bypass)
    env["no_proxy"] = env["NO_PROXY"]
    return env


def _env_value(name: str) -> str:
    if value := os.environ.get(name, "").strip():
        return value
    if not ENV_FILE.exists():
        return ""
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() == name:
            return value.strip().strip('"').strip("'")
    return ""


def _ensure_api_key() -> str:
    if key := _env_value("SKILL_SANDBOX_API_KEY"):
        return key
    if not ENV_FILE.exists():
        raise RuntimeError("缺少根目录 .env，无法保存沙箱服务密钥。")
    key = secrets.token_urlsafe(32)
    content = ENV_FILE.read_text(encoding="utf-8")
    line = f"SKILL_SANDBOX_API_KEY={key}"
    if re.search(r"(?m)^SKILL_SANDBOX_API_KEY=.*$", content):
        content = re.sub(r"(?m)^SKILL_SANDBOX_API_KEY=.*$", line, content, count=1)
    else:
        content += ("" if content.endswith("\n") else "\n") + line + "\n"
    ENV_FILE.write_text(content, encoding="utf-8")
    return key


def _replace_setting(content: str, section: str, setting: str, value: str) -> str:
    header = re.search(rf"(?m)^\[{re.escape(section)}\][ \t]*$", content)
    if header is None:
        raise RuntimeError(f"OpenSandbox 配置缺少 [{section}]。")
    next_section = re.search(r"(?m)^\[", content[header.end():])
    end = header.end() + next_section.start() if next_section else len(content)
    block = content[header.end():end]
    pattern = rf"(?m)^[ \t]*#?[ \t]*{re.escape(setting)}[ \t]*=.*$"
    replacement = f"{setting} = {value}"
    if re.search(pattern, block):
        block = re.sub(pattern, replacement, block, count=1)
    else:
        block = "\n" + replacement + block
    return content[:header.end()] + block + content[end:]


def ensure_configuration() -> Path:
    """Create a loopback-only, authenticated server config for local runs."""
    uvx = shutil.which("uvx")
    if not uvx:
        raise RuntimeError("未找到 uvx，无法启动 OpenSandbox Server。")
    key = _ensure_api_key()
    if not os.environ.get("SKILL_SANDBOX_API_KEY", "").strip():
        os.environ["SKILL_SANDBOX_API_KEY"] = key
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not CONFIG_FILE.exists():
        subprocess.run(
            [uvx, "opensandbox-server", "init-config", str(CONFIG_FILE), "--example", "docker"],
            cwd=ROOT,
            check=True,
        )
    content = CONFIG_FILE.read_text(encoding="utf-8")
    content = _replace_setting(content, "server", "host", '"127.0.0.1"')
    content = _replace_setting(content, "server", "port", str(PORT))
    content = _replace_setting(content, "server", "api_key", '"' + key + '"')
    # Docker Desktop's host process cannot route to a Linux bridge container IP.
    content = _replace_setting(content, "proxy", "resolve_internal", "false")
    content = _replace_setting(content, "docker", "publish_host", '"127.0.0.1"')
    CONFIG_FILE.write_text(content, encoding="utf-8")
    container_content = _replace_setting(content, "server", "host", '"0.0.0.0"')
    container_content = _replace_setting(container_content, "proxy", "resolve_internal", "true")
    container_content = _replace_setting(container_content, "docker", "host_ip", '"host.docker.internal"')
    container_content = _replace_setting(container_content, "store", "path", '"/data/opensandbox.db"')
    CONTAINER_CONFIG_FILE.write_text(container_content, encoding="utf-8")
    return CONFIG_FILE


def main(argv: list[str] | None = None) -> int:
    arguments = list(sys.argv[1:] if argv is None else argv)
    if arguments not in (["prepare"], ["build"], ["status"], ["smoke"], ["serve"]):
        print("用法: python scripts/skill_sandbox_environment.py prepare|build|status|smoke|serve", file=sys.stderr)
        return 2
    action = arguments[0]
    if action == "status":
        print(f"配置: {'已生成' if CONFIG_FILE.exists() else '缺失'}")
        subprocess.run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"], check=False)
        return 0
    if action == "serve":
        ensure_configuration()
        return subprocess.call(
            [shutil.which("uvx") or "uvx", "opensandbox-server", "--config", str(CONFIG_FILE)],
            cwd=ROOT,
            env=server_environment(),
        )
    if action == "smoke":
        sys.path.insert(0, str(ROOT / "services" / "agent-service"))
        from app.clients.skill_sandbox import SkillSandbox, SkillSandboxConfig

        trial = SkillSandbox(SkillSandboxConfig(
            enabled=True,
            domain=_env_value("SKILL_SANDBOX_DOMAIN") or f"127.0.0.1:{PORT}",
            protocol=_env_value("SKILL_SANDBOX_PROTOCOL") or "http",
            api_key=_env_value("SKILL_SANDBOX_API_KEY"),
            image=_env_value("SKILL_SANDBOX_IMAGE") or IMAGE,
            use_server_proxy=True,
        ))
        result = trial.run({"mode": "environment_smoke"})
        if result.get("ok") is not False or result.get("message") != "当前模式不支持沙箱试运行。":
            raise RuntimeError(f"沙箱冒烟测试返回异常: {result!r}")
        print("沙箱冒烟测试通过：一次性容器完成输入、执行、结果读取与销毁。")
        return 0
    if action == "build":
        subprocess.run(
            ["docker", "build", "-f", "infra/docker/Dockerfile.skill-runner", "-t", IMAGE, "."],
            cwd=ROOT,
            check=True,
        )
    ensure_configuration()
    print("OpenSandbox 本地配置已准备；API Key 保存在 .env，未输出到终端。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
