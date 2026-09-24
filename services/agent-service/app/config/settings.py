"""由环境变量驱动的 Agent Service 集中配置。"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable

_load_dotenv: Callable[..., Any] | None
try:
    from dotenv import load_dotenv as _load_dotenv
except ImportError:  # pragma: no cover - 仅在缺少可选依赖时触发
    _load_dotenv = None


def _load_project_env() -> None:
    """加载仓库根目录的 .env，且不覆盖已有进程环境变量。"""

    if _load_dotenv is None:
        return
    project_root = Path(__file__).resolve().parents[4]
    _load_dotenv(project_root / ".env", override=False)


def _csv_env(name: str, default: str) -> list[str]:
    """把逗号分隔的环境变量解析为字符串列表。"""

    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def allow_degraded_storage() -> bool:
    """Return whether local/in-memory fallbacks are allowed for this process."""

    explicit = os.getenv("ALLOW_DEGRADED_STORAGE")
    if explicit is not None:
        return explicit.strip().lower() in {"1", "true", "yes", "on"}
    return os.getenv("APP_ENV", "development").strip().lower() not in {"prod", "production"}


_load_project_env()


@dataclass(frozen=True)
class Settings:
    """Agent Service 运行时配置。"""

    rag_service_base_url: str = field(default_factory=lambda: os.getenv("RAG_SERVICE_BASE_URL", "").rstrip("/"))
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development").strip().lower())
    allow_degraded_storage: bool = field(default_factory=allow_degraded_storage)
    cad_service_base_url: str = field(default_factory=lambda: (os.getenv("MCP_CAD_URL") or os.getenv("CAD_SERVICE_BASE_URL") or "").rstrip("/"))
    model_service_base_url: str = field(default_factory=lambda: os.getenv("MODEL_SERVICE_BASE_URL", "").rstrip("/"))
    factory_api_base_url: str = field(default_factory=lambda: os.getenv("FACTORY_API_BASE_URL", "http://127.0.0.1:4529").rstrip("/"))
    agent_service_base_url: str = field(default_factory=lambda: os.getenv("AGENT_SERVICE_BASE_URL", "http://127.0.0.1:8010").rstrip("/"))
    agent_timeout_seconds: float = field(default_factory=lambda: float(os.getenv("AGENT_TIMEOUT_SECONDS", "45")))
    agent_max_retries: int = field(default_factory=lambda: int(os.getenv("AGENT_MAX_RETRIES", "1")))
    trace_max_records: int = field(default_factory=lambda: max(100, int(os.getenv("TRACE_MAX_RECORDS", "5000"))))
    pending_task_store_path: str = field(default_factory=lambda: os.getenv("PENDING_TASK_STORE_PATH", "runtime_pending_tasks.sqlite3"))
    cors_origins: list[str] = field(default_factory=lambda: _csv_env(
        "AGENT_CORS_ORIGINS",
        os.getenv("CORS_ORIGINS", "http://127.0.0.1:8001,http://localhost:8001"),
    ))

    @classmethod
    def from_env(cls) -> "Settings":
        """兼容旧调用方的环境变量构造入口。"""

        return cls()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """返回进程内缓存的配置对象。"""

    return Settings.from_env()
