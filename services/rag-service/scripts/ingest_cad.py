"""DXF-only ingestion entrypoint.

Pipeline for CAD drawings:
    DXF -> ezdxf parse -> CAD semantic blocks -> industrial chunks ->
    BGE-M3 vectors -> single Milvus collection
                    -> MinIO/S3 original file upload
                    -> MySQL drawing/version/layer/entity/annotation/relation rows
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
for candidate in (str(PROJECT_ROOT), str(SCRIPTS_ROOT)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

from app.config import load_service_env  # noqa: E402
from app.milvus import MilvusConfig, MilvusVectorWriter  # noqa: E402
from app.mysql import MySQLConfig  # noqa: E402
from app.storage import ObjectStorageClient, ObjectStorageConfig  # noqa: E402

from ingest_to_milvus import ingest_directory  # noqa: E402


LOGGER = logging.getLogger("rag_cad_ingest")
DEFAULT_DATA_DIR = PROJECT_ROOT / "data" / "SHUJU"
DEFAULT_EXTENSIONS = ("dxf", "dwg")
DEFAULT_COLLECTION = "cad_semantic_chunks"


def _env(name: str, fallback: str) -> str:
    value = os.getenv(name)
    return value.strip() if value and value.strip() else fallback


def reset_mysql_database(config: MySQLConfig) -> str:
    """Drop and recreate the configured MySQL database."""

    try:
        import pymysql
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise RuntimeError("MySQL reset requires PyMySQL. Install it with 'pip install pymysql'.") from exc

    connection = pymysql.connect(
        host=config.host,
        port=config.port,
        user=config.user,
        password=config.password,
        charset=config.charset,
        connect_timeout=config.connect_timeout,
        autocommit=True,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS `{config.database}`")
            cursor.execute(
                f"CREATE DATABASE `{config.database}` "
                f"CHARACTER SET {config.charset} COLLATE utf8mb4_unicode_ci"
            )
    finally:
        connection.close()
    LOGGER.warning("Reset MySQL database '%s'.", config.database)
    return config.database


def reset_milvus_collections(milvus_uri: str) -> list[str]:
    """Drop every existing Milvus collection so only the CAD one remains."""

    writer = MilvusVectorWriter(MilvusConfig(uri=milvus_uri, collection_name="__cad_reset__"))
    dropped = writer.drop_all_collections()
    if dropped:
        LOGGER.warning("Dropped %s Milvus collections: %s", len(dropped), dropped)
    return dropped


def ensure_object_bucket() -> str:
    """Create the MinIO/S3 bucket when it does not exist yet."""

    client = ObjectStorageClient(ObjectStorageConfig.from_env())
    client.ensure_bucket()
    LOGGER.info("Object storage bucket ready: %s", client.config.bucket)
    return client.config.bucket


def run_ingestion(
    data_dir: Path = DEFAULT_DATA_DIR,
    *,
    collection_name: str = DEFAULT_COLLECTION,
    milvus_uri: str = "http://127.0.0.1:19530",
    extensions: tuple[str, ...] = DEFAULT_EXTENSIONS,
    embedding_model: str = "BAAI/bge-m3",
    embedding_model_path: str | None = None,
    embedding_batch_size: int = 8,
    project_id: str | None = None,
    tenant_id: str | None = None,
    version_label: str | None = None,
    reset_mysql: bool = False,
    reset_milvus: bool = True,
    upload_originals: bool = True,
) -> dict[str, Any]:
    """Run the CAD-only ingestion pipeline end to end."""

    mysql_config = MySQLConfig.from_env()
    if reset_mysql:
        reset_mysql_database(mysql_config)
    if reset_milvus:
        reset_milvus_collections(milvus_uri)
    if upload_originals:
        ensure_object_bucket()

    result = ingest_directory(
        data_dir,
        collection_name=collection_name,
        milvus_uri=milvus_uri,
        extensions=list(extensions),
        embedding_model=embedding_model,
        embedding_model_path=embedding_model_path,
        embedding_batch_size=embedding_batch_size,
        object_storage_enabled=upload_originals,
        object_storage_config=ObjectStorageConfig.from_env() if upload_originals else None,
        cad_metadata_enabled=True,
        mysql_enabled=True,
        mysql_config=mysql_config,
        project_id=project_id,
        tenant_id=tenant_id,
        version_label=version_label,
        continue_on_error=False,
    )
    result["mysql_database"] = mysql_config.database
    result["milvus_collection"] = collection_name
    result["extensions"] = ",".join(extensions)
    return result


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ingest DXF/DWG drawings into MySQL, MinIO, and Milvus.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--collection", default=None, help="Milvus collection for CAD semantic chunks.")
    parser.add_argument("--milvus-uri", default=None)
    parser.add_argument(
        "--extensions",
        default=",".join(DEFAULT_EXTENSIONS),
        help="Comma-separated CAD extensions to ingest, e.g. 'dxf' or 'dxf,dwg'.",
    )
    parser.add_argument("--embedding-model", default="BAAI/bge-m3")
    parser.add_argument(
        "--embedding-model-path",
        default=None,
        help="Local sentence-transformers directory (defaults to EMBEDDING_MODEL_PATH).",
    )
    parser.add_argument("--embedding-batch-size", type=int, default=8)
    parser.add_argument("--project-id", default=None)
    parser.add_argument("--tenant-id", default=None)
    parser.add_argument("--version-label", default=None)
    parser.add_argument(
        "--reset-mysql",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Drop and recreate the MySQL database before ingestion.",
    )
    parser.add_argument(
        "--reset-milvus",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Drop every existing Milvus collection so only the CAD collection remains.",
    )
    parser.add_argument(
        "--upload-originals",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Upload original DXF files to MinIO/S3.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
    )
    return parser


def main() -> int:
    args = build_argument_parser().parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    load_service_env()
    extensions = tuple(item.strip() for item in args.extensions.split(",") if item.strip())
    collection_name = args.collection or _env("MILVUS_COLLECTION", DEFAULT_COLLECTION)
    milvus_uri = args.milvus_uri or _env("MILVUS_URI", "http://127.0.0.1:19530")
    embedding_model_path = args.embedding_model_path or os.getenv("EMBEDDING_MODEL_PATH") or None

    result = run_ingestion(
        args.data_dir,
        collection_name=collection_name,
        milvus_uri=milvus_uri,
        extensions=extensions,
        embedding_model=args.embedding_model,
        embedding_model_path=embedding_model_path,
        embedding_batch_size=args.embedding_batch_size,
        project_id=args.project_id,
        tenant_id=args.tenant_id,
        version_label=args.version_label,
        reset_mysql=args.reset_mysql,
        reset_milvus=args.reset_milvus,
        upload_originals=args.upload_originals,
    )
    LOGGER.info("CAD ingestion complete: %s", result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
