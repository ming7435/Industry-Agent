"""专家技能试运行的 OpenSandbox 宿主侧客户端。

只在显式启用 ``SKILL_SANDBOX_ENABLED`` 时生效，且只接管专家中心的
``diagnosis`` / ``instruction_preview`` 试运行。调用方保留原有进程内路径，
沙箱不可用时默认**失败关闭**，不会静默退回共享工具环境。
"""

from __future__ import annotations

from dataclasses import dataclass
import json
import os
from datetime import timedelta
from typing import Any, Mapping
from urllib.parse import urlsplit


SUPPORTED_MODES = frozenset({"diagnosis", "instruction_preview"})
_SANDBOX_WORKDIR = "/work"
_INPUT_PATH = _SANDBOX_WORKDIR + "/input.json"
_RESULT_PATH = _SANDBOX_WORKDIR + "/result.json"


class SkillSandboxError(RuntimeError):
    """可展示的沙箱试运行错误；不包含堆栈或宿主路径。"""


def _flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _hosts(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class SkillSandboxConfig:
    enabled: bool = False
    domain: str = "127.0.0.1:8080"
    protocol: str = "http"
    api_key: str = ""
    image: str = "industry-skill-runner:0.1"
    model_base_url: str = "http://host.docker.internal:8040"
    allowed_hosts: tuple[str, ...] = ()
    timeout_seconds: int = 180
    ready_timeout_seconds: int = 300
    cpu: str = "1"
    memory: str = "1Gi"
    fallback: bool = False

    @classmethod
    def from_env(cls) -> "SkillSandboxConfig":
        model_base_url = os.getenv(
            "SKILL_SANDBOX_MODEL_BASE_URL", "http://host.docker.internal:8040"
        ).rstrip("/")
        allowed = _hosts(os.getenv("SKILL_SANDBOX_ALLOWED_HOSTS", ""))
        if not allowed:
            host = urlsplit(model_base_url).hostname or "host.docker.internal"
            allowed = (host,)
        try:
            timeout = max(30, int(os.getenv("SKILL_SANDBOX_TIMEOUT_SECONDS", "180")))
        except ValueError:
            timeout = 180
        try:
            ready_timeout = max(30, int(os.getenv("SKILL_SANDBOX_READY_TIMEOUT_SECONDS", "300")))
        except ValueError:
            ready_timeout = 300
        return cls(
            enabled=_flag("SKILL_SANDBOX_ENABLED", False),
            domain=os.getenv("SKILL_SANDBOX_DOMAIN", "127.0.0.1:8080").strip(),
            protocol=os.getenv("SKILL_SANDBOX_PROTOCOL", "http").strip().lower(),
            api_key=os.getenv("SKILL_SANDBOX_API_KEY", "").strip(),
            image=os.getenv("SKILL_SANDBOX_IMAGE", "industry-skill-runner:0.1").strip(),
            model_base_url=model_base_url,
            allowed_hosts=allowed,
            timeout_seconds=timeout,
            ready_timeout_seconds=ready_timeout,
            cpu=os.getenv("SKILL_SANDBOX_CPU", "1").strip(),
            memory=os.getenv("SKILL_SANDBOX_MEMORY", "1Gi").strip(),
            fallback=_flag("SKILL_SANDBOX_FALLBACK", False),
        )


class SkillSandbox:
    def __init__(self, config: SkillSandboxConfig | None = None) -> None:
        self.config = config or SkillSandboxConfig.from_env()

    @classmethod
    def from_env(cls) -> "SkillSandbox":
        return cls(SkillSandboxConfig.from_env())

    @property
    def enabled(self) -> bool:
        return bool(self.config.enabled)

    @property
    def fallback(self) -> bool:
        return bool(self.config.fallback)

    def supports(self, mode: str) -> bool:
        return self.enabled and str(mode) in SUPPORTED_MODES

    def run(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        """创建一次性沙箱、执行 runner、读回结果并销毁。"""

        if not self.enabled:
            raise SkillSandboxError("沙箱试运行未启用。")

        sdk = self._sdk()
        sandbox = self._create(sdk)
        try:
            models = self._models()
            entry = models["WriteEntry"]
            body = json.dumps(dict(payload), ensure_ascii=False, default=str)
            sandbox.files.write_files(
                [entry(path=_INPUT_PATH, data=body, mode=0o644)]
            )

            command = (
                "mkdir -p %s && python -m app.skills.sandbox_runner "
                "--input %s --output %s"
                % (_SANDBOX_WORKDIR, _INPUT_PATH, _RESULT_PATH)
            )
            opts = None
            if models.get("RunCommandOpts") is not None:
                opts = models["RunCommandOpts"](
                    timeout=timedelta(seconds=self.config.timeout_seconds)
                )
            try:
                sandbox.commands.run(command, opts=opts)
            except TypeError:
                sandbox.commands.run(command)

            content = sandbox.files.read_file(_RESULT_PATH)
            if isinstance(content, bytes):
                content = content.decode("utf-8", errors="replace")
            result = json.loads(str(content))
            if not isinstance(result, dict):
                raise SkillSandboxError("沙箱返回结果格式错误。")
            return result
        except SkillSandboxError:
            raise
        except Exception:
            raise SkillSandboxError("沙箱试运行执行失败，请检查沙箱服务和镜像。") from None
        finally:
            self._destroy(sandbox)

    def _sdk(self) -> Any:
        try:
            import opensandbox  # type: ignore
        except ImportError:
            raise SkillSandboxError(
                "未安装 opensandbox SDK，请先安装后再启用沙箱试运行。"
            ) from None
        return opensandbox

    @staticmethod
    def _models() -> dict[str, Any]:
        try:
            from opensandbox.models.sandboxes import (  # type: ignore
                NetworkPolicy,
                NetworkRule,
                SandboxImageSpec,
            )
        except ImportError:
            from opensandbox.models import (  # type: ignore
                NetworkPolicy,
                NetworkRule,
                SandboxImageSpec,
            )
        try:
            from opensandbox.models import WriteEntry  # type: ignore
        except ImportError:
            from opensandbox.models.sandboxes import WriteEntry  # type: ignore
        try:
            from opensandbox.models.execd import RunCommandOpts  # type: ignore
        except ImportError:
            RunCommandOpts = None  # type: ignore
        return {
            "NetworkPolicy": NetworkPolicy,
            "NetworkRule": NetworkRule,
            "SandboxImageSpec": SandboxImageSpec,
            "WriteEntry": WriteEntry,
            "RunCommandOpts": RunCommandOpts,
        }

    def _create(self, sdk: Any) -> Any:
        models = self._models()
        try:
            from opensandbox.config.connection_sync import ConnectionConfigSync  # type: ignore
        except ImportError:
            raise SkillSandboxError("当前 opensandbox SDK 缺少同步连接配置。") from None

        factory = getattr(sdk, "SandboxSync", None)
        if factory is None:
            raise SkillSandboxError("当前 opensandbox SDK 不支持同步沙箱客户端。")

        policy = models["NetworkPolicy"](
            defaultAction="deny",
            egress=[
                models["NetworkRule"](action="allow", target=host)
                for host in self.config.allowed_hosts
            ],
        )
        connection = ConnectionConfigSync(
            api_key=self.config.api_key or None,
            domain=self.config.domain,
            protocol=self.config.protocol,
            # 首次创建可能要拉取 execd/egress 镜像；HTTP 截止时间必须覆盖
            # 沙箱就绪预算，不能用 SDK 默认的 30 秒。
            request_timeout=timedelta(seconds=max(60, self.config.ready_timeout_seconds + 60)),
        )
        kwargs: dict[str, Any] = {
            "image": models["SandboxImageSpec"](self.config.image),
            "timeout": timedelta(seconds=self.config.timeout_seconds),
            "ready_timeout": timedelta(seconds=self.config.ready_timeout_seconds),
            "env": {
                "MODEL_SERVICE_BASE_URL": self.config.model_base_url,
                "MODEL_CHAT_MODEL": os.getenv("MODEL_CHAT_MODEL", "deepseek-chat"),
                "PYTHONUNBUFFERED": "1",
            },
            "network_policy": policy,
            "connection_config": connection,
        }
        limits = {"cpu": self.config.cpu, "memory": self.config.memory}
        try:
            return factory.create(**kwargs, resource=limits)
        except TypeError:
            # 兼容不接收 resource 的 SDK 版本；镜像仍受沙箱默认限额约束。
            return factory.create(**kwargs)

    @staticmethod
    def _destroy(sandbox: Any) -> None:
        for name in ("destroy", "kill", "close"):
            method = getattr(sandbox, name, None)
            if callable(method):
                try:
                    method()
                except Exception:
                    pass
                return


__all__ = [
    "SUPPORTED_MODES",
    "SkillSandbox",
    "SkillSandboxConfig",
    "SkillSandboxError",
]
