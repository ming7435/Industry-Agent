"""Restart-safe report storage with a development memory fallback."""

from __future__ import annotations

import os
import json
import sqlite3
from pathlib import Path
from collections.abc import Iterator, MutableMapping
from threading import Lock
from typing import Any

from app.config.settings import allow_degraded_storage
class DurableReportStore(MutableMapping[str, dict[str, Any]]):
    """Mapping-compatible report store backed by the shared JSON SQLite store."""

    namespace = "reports"

    def __init__(self, path: str) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        with self._connect() as connection:
            connection.execute(
                "CREATE TABLE IF NOT EXISTS reports ("
                "report_id TEXT PRIMARY KEY, payload TEXT NOT NULL, "
                "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
            )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.path), timeout=30, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        return connection

    def __getitem__(self, key: str) -> dict[str, Any]:
        with self._lock, self._connect() as connection:
            row = connection.execute("SELECT payload FROM reports WHERE report_id = ?", (str(key),)).fetchone()
        if row is None:
            raise KeyError(key)
        return dict(json.loads(row["payload"]))

    def __setitem__(self, key: str, value: dict[str, Any]) -> None:
        with self._lock, self._connect() as connection:
            connection.execute(
                "INSERT INTO reports(report_id, payload) VALUES (?, ?) "
                "ON CONFLICT(report_id) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP",
                (str(key), json.dumps(dict(value), ensure_ascii=False, default=str)),
            )

    def __delitem__(self, key: str) -> None:
        with self._lock, self._connect() as connection:
            cursor = connection.execute("DELETE FROM reports WHERE report_id = ?", (str(key),))
            if cursor.rowcount == 0:
                raise KeyError(key)

    def __iter__(self) -> Iterator[str]:
        with self._lock, self._connect() as connection:
            rows = connection.execute("SELECT report_id FROM reports ORDER BY report_id").fetchall()
        return iter([str(row["report_id"]) for row in rows])

    def __len__(self) -> int:
        with self._lock, self._connect() as connection:
            row = connection.execute("SELECT COUNT(*) AS count FROM reports").fetchone()
        return int(row["count"] if row else 0)


def build_report_store(path: str | None = None) -> MutableMapping[str, dict[str, Any]]:
    configured = str(path or os.getenv("REPORT_STORE_PATH", "")).strip()
    if configured:
        return DurableReportStore(configured)
    if not allow_degraded_storage():
        raise RuntimeError("生产模式要求配置 REPORT_STORE_PATH")
    return {}


__all__ = ["DurableReportStore", "build_report_store"]
