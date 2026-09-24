"""Configuration fingerprints and read-only checks for offline ingestion."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import socket
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from app.chunk import ChunkerConfig
from app.embedding import EmbeddingConfig

PARSER_PIPELINE_VERSION = 1


@dataclass(frozen=True)
class PreflightReport:
    """Read-only readiness report produced before an ingestion run."""

    ready: bool
    data_dir: str
    whoosh_index_dir: str
    files: int
    collections: tuple[str, ...]
    checks: dict[str, bool]
    errors: tuple[str, ...]

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-serializable representation."""

        payload = asdict(self)
        payload["collections"] = list(self.collections)
        payload["errors"] = list(self.errors)
        return payload


def build_pipeline_signature(
    *,
    chunk_config: ChunkerConfig,
    embedding_config: EmbeddingConfig,
    ocr_backend: str,
    context: dict[str, Any] | None = None,
) -> str:
    """Fingerprint every option that changes generated chunks or vectors."""

    payload = {
        "schema": 1,
        "parser_pipeline_version": PARSER_PIPELINE_VERSION,
        "chunk": asdict(chunk_config),
        "embedding": asdict(embedding_config),
        "ocr_backend": ocr_backend.strip().lower(),
        "context": context or {},
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def run_preflight(
    *,
    data_dir: Path,
    whoosh_index_dir: Path,
    files: list[Path],
    collections: list[str],
    milvus_uri: str,
    mysql_host: str,
    mysql_port: int,
    mysql_user: str = "",
    mysql_password: str = "",
    mysql_database: str = "",
    milvus_database: str = "",
    milvus_token: str = "",
    embedding_api_key: str,
    ocr_backend: str,
    cache_dir: Path | None = None,
    embedding_client: Any | None = None,
    expected_embedding_dimension: int | None = None,
    probe_network: bool = True,
) -> PreflightReport:
    """Validate paths, optional OCR dependency, credentials, and TCP endpoints."""

    checks: dict[str, bool] = {
        "data_dir": data_dir.is_dir(),
        "source_files": bool(files),
        "embedding_api_key": bool(embedding_api_key.strip()),
    }
    errors: list[str] = []
    try:
        whoosh_index_dir.mkdir(parents=True, exist_ok=True)
        checks["whoosh_index_dir"] = whoosh_index_dir.is_dir()
    except OSError as exc:
        checks["whoosh_index_dir"] = False
        errors.append(f"Whoosh index directory is not writable: {exc}")
    if cache_dir is not None:
        try:
            cache_dir.mkdir(parents=True, exist_ok=True)
            checks["ingestion_cache_dir"] = cache_dir.is_dir()
        except OSError as exc:
            checks["ingestion_cache_dir"] = False
            errors.append(f"Ingestion cache directory is not writable: {exc}")

    normalized_ocr = ocr_backend.strip().lower()
    if normalized_ocr in {"rapidocr", "rapidocr_onnxruntime"}:
        checks["ocr_backend"] = importlib.util.find_spec("rapidocr_onnxruntime") is not None
    elif normalized_ocr == "paddleocr":
        checks["ocr_backend"] = importlib.util.find_spec("paddleocr") is not None
    else:
        checks["ocr_backend"] = not normalized_ocr or normalized_ocr == "command"

    if probe_network:
        parsed = urlparse(milvus_uri if "://" in milvus_uri else f"http://{milvus_uri}")
        checks["milvus_tcp"] = _tcp_open(parsed.hostname or "127.0.0.1", parsed.port or 19530)
        checks["mysql_tcp"] = _tcp_open(mysql_host, mysql_port)
        checks["mysql_auth"] = _probe_mysql(
            host=mysql_host,
            port=mysql_port,
            user=mysql_user,
            password=mysql_password,
            database=mysql_database,
        )
        checks["milvus_auth"] = _probe_milvus(milvus_uri, milvus_database, milvus_token)
        if embedding_client is not None:
            checks["embedding_dimension"] = _probe_embedding(
                embedding_client,
                expected_embedding_dimension,
            )

    messages = {
        "data_dir": f"Data directory does not exist: {data_dir}",
        "source_files": f"No supported source files found below: {data_dir}",
        "embedding_api_key": "SILICONFLOW_API_KEY is not configured.",
        "whoosh_index_dir": f"Whoosh index directory is unavailable: {whoosh_index_dir}",
        "ingestion_cache_dir": f"Ingestion cache directory is unavailable: {cache_dir}",
        "ocr_backend": f"OCR backend is unavailable or unsupported: {ocr_backend or '<empty>'}",
        "milvus_tcp": f"Milvus TCP endpoint is unavailable: {milvus_uri}",
        "mysql_tcp": f"MySQL TCP endpoint is unavailable: {mysql_host}:{mysql_port}",
        "mysql_auth": f"MySQL authentication/database check failed: {mysql_host}:{mysql_port}/{mysql_database}",
        "milvus_auth": f"Milvus authentication/database check failed: {milvus_uri}/{milvus_database}",
        "embedding_dimension": f"Embedding probe failed or did not return dimension {expected_embedding_dimension}.",
    }
    errors.extend(messages[name] for name, passed in checks.items() if not passed and name in messages)
    return PreflightReport(
        ready=all(checks.values()),
        data_dir=str(data_dir),
        whoosh_index_dir=str(whoosh_index_dir),
        files=len(files),
        collections=tuple(collections),
        checks=checks,
        errors=tuple(dict.fromkeys(errors)),
    )


def _tcp_open(host: str, port: int, timeout: float = 0.75) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _probe_mysql(
    *,
    host: str,
    port: int,
    user: str,
    password: str,
    database: str,
) -> bool:
    try:
        import pymysql

        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            connect_timeout=2,
            read_timeout=2,
            write_timeout=2,
        )
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                return cursor.fetchone() == (1,)
        finally:
            connection.close()
    except Exception:
        return False


def _probe_milvus(uri: str, database: str, token: str = "") -> bool:
    try:
        from pymilvus import MilvusClient

        connection_args = {"uri": uri, "db_name": database}
        if token:
            connection_args["token"] = token
        client = MilvusClient(**connection_args)
        client.list_collections()
        return True
    except Exception:
        return False


def _probe_embedding(client: Any, expected_dimension: int | None) -> bool:
    try:
        vectors = client.embed_texts(["industrial maintenance preflight"])
        if len(vectors) != 1 or not vectors[0]:
            return False
        return expected_dimension is None or len(vectors[0]) == expected_dimension
    except Exception:
        return False


__all__ = ["PreflightReport", "build_pipeline_signature", "run_preflight"]
