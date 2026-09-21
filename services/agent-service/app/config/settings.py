"""Centralized environment-backed settings for Agent Service."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional for library-only usage
    load_dotenv = None


def _load_project_env() -> None:
    if load_dotenv is None:
        return
    project_root = Path(__file__).resolve().parents[4]
    load_dotenv(project_root / ".env", override=False)


def _csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


_load_project_env()


@dataclass(frozen=True)
class Settings:
    rag_service_base_url: str = field(default_factory=lambda: os.getenv("RAG_SERVICE_BASE_URL", "").rstrip("/"))
    cad_service_base_url: str = field(default_factory=lambda: (os.getenv("MCP_CAD_URL") or os.getenv("CAD_SERVICE_BASE_URL") or "").rstrip("/"))
    model_service_base_url: str = field(default_factory=lambda: os.getenv("MODEL_SERVICE_BASE_URL", "").rstrip("/"))
    factory_api_base_url: str = field(default_factory=lambda: os.getenv("FACTORY_API_BASE_URL", "http://127.0.0.1:8000").rstrip("/"))
    agent_service_base_url: str = field(default_factory=lambda: os.getenv("AGENT_SERVICE_BASE_URL", "http://127.0.0.1:8010").rstrip("/"))
    agent_timeout_seconds: float = field(default_factory=lambda: float(os.getenv("AGENT_TIMEOUT_SECONDS", "45")))
    agent_max_retries: int = field(default_factory=lambda: int(os.getenv("AGENT_MAX_RETRIES", "1")))
    trace_max_records: int = field(default_factory=lambda: max(100, int(os.getenv("TRACE_MAX_RECORDS", "5000"))))
    cors_origins: list[str] = field(default_factory=lambda: _csv_env(
        "AGENT_CORS_ORIGINS",
        "http://127.0.0.1:8001,http://localhost:8001",
    ))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
