"""MySQL connection settings for offline RAG metadata."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass

from config.settings import load_service_env, settings

_IDENTIFIER = re.compile(r"^[A-Za-z0-9_]+$")


@dataclass(frozen=True)
class MySQLConfig:
    """Connection settings of the offline RAG metadata store.

    The dataclass defaults are the historical ones, so the offline writer behaves
    exactly as before. :meth:`from_env` and :meth:`from_settings` are the two
    bridges to the merged service configuration.
    """

    host: str = "127.0.0.1"
    port: int = 3306
    user: str = "root"
    password: str = ""
    database: str = "industry_rag"
    charset: str = "utf8mb4"
    connect_timeout: int = 10

    def __post_init__(self) -> None:
        if not self.host.strip() or not self.user.strip():
            raise ValueError("MySQL host and user must not be empty.")
        if not 1 <= self.port <= 65535:
            raise ValueError("MySQL port must be between 1 and 65535.")
        if not _IDENTIFIER.fullmatch(self.database):
            raise ValueError("MySQL database may contain only letters, numbers, and underscores.")
        if not _IDENTIFIER.fullmatch(self.charset):
            raise ValueError("MySQL charset is invalid.")
        if self.connect_timeout <= 0:
            raise ValueError("MySQL connect_timeout must be greater than zero.")

    @classmethod
    def from_settings(cls) -> "MySQLConfig":
        """Build the configuration from the merged service settings.

        Returns:
            The MySQL configuration held by :mod:`config.settings`.
        """
        return cls(
            host=settings.mysql_host,
            port=settings.mysql_port,
            user=settings.mysql_user,
            password=settings.mysql_password,
            database=settings.mysql_database,
            charset=settings.mysql_charset,
            connect_timeout=settings.mysql_connect_timeout,
        )

    @classmethod
    def from_env(cls) -> "MySQLConfig":
        """Build the configuration from environment variables / ``.env``.

        Returns:
            The MySQL configuration; unset variables fall back to the values of
            :mod:`config.settings`.
        """
        load_service_env()
        return cls(
            host=os.getenv("MYSQL_HOST", cls.host),
            port=int(os.getenv("MYSQL_PORT", str(cls.port))),
            user=os.getenv("MYSQL_USER", cls.user),
            password=os.getenv("MYSQL_PASSWORD", cls.password),
            database=os.getenv("MYSQL_DATABASE", cls.database),
            charset=os.getenv("MYSQL_CHARSET", cls.charset),
            connect_timeout=int(os.getenv("MYSQL_CONNECT_TIMEOUT", str(cls.connect_timeout))),
        )


__all__ = ["MySQLConfig"]
