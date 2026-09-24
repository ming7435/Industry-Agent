"""Run the multi-format offline ingestion pipeline into Milvus.

Pipeline:
Supported files -> StructuredDocument -> CleanedBlock -> IndustrialChunk ->
VectorRecord -> typed Milvus collections + MySQL manifest + Whoosh BM25 index.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import threading
import time
from collections.abc import Iterable, Sequence
from contextlib import contextmanager
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.chunk import ChunkerConfig, IndustrialChunk, build_chunks
from app.embedding import EmbeddingConfig, SiliconFlowEmbeddingClient, VectorRecord, iter_embed_chunks
from app.ingestion import (
    DocumentSource,
    LocalOcrClient,
    SiliconFlowVisionClient,
    SUPPORTED_EXTENSIONS,
    parse_document,
)
from app.ingestion.offline import build_pipeline_signature, run_preflight
from app.ingestion.cache import IngestionCache
from app.milvus import MilvusConfig, MilvusVectorWriter
from app.mysql import MySQLConfig, MySQLRagWriter, MySQLWriteError
from app.storage import ObjectStorageClient, ObjectStorageConfig
from app.whoosh import (
    build_index,
    delete_documents,
    existing_document_ids,
    index_dir_for_collection,
)
from config.settings import load_service_env, settings


# 默认读取项目 data/ 目录（递归扫描 alarms / cases / manuals / sop 等知识目录）。
# 标准离线管道按项目数据类型分 Milvus collection，避免仅依赖不完整 metadata 过滤。
DEFAULT_DATA_DIR = settings.rag_data_path
LOGGER = logging.getLogger("rag_offline_ingest")
COLLECTION_BY_DATA_TYPE = {
    "alarms": "industry_rag_alarm_codes",
    "cases": "industry_rag_alarm_solutions",
    "manuals": "industry_rag_manuals",
    "sop": "industry_rag_sop",
}


@contextmanager
def _stage_progress(source_name: str, stage: str, *, heartbeat_seconds: float = 10.0):
    """Log a heartbeat while a blocking parse/OCR or embedding stage runs."""

    started = time.monotonic()
    stopped = threading.Event()
    LOGGER.info("Stage started: file=%s stage=%s", source_name, stage)

    def report() -> None:
        while not stopped.wait(heartbeat_seconds):
            LOGGER.info(
                "Stage running: file=%s stage=%s elapsed=%.1fs",
                source_name,
                stage,
                time.monotonic() - started,
            )

    reporter = threading.Thread(target=report, name=f"rag-progress-{stage}", daemon=True)
    reporter.start()
    try:
        yield
    except BaseException:
        LOGGER.warning(
            "Stage interrupted: file=%s stage=%s elapsed=%.1fs",
            source_name,
            stage,
            time.monotonic() - started,
        )
        raise
    else:
        LOGGER.info(
            "Stage completed: file=%s stage=%s elapsed=%.1fs",
            source_name,
            stage,
            time.monotonic() - started,
        )
    finally:
        stopped.set()
        reporter.join(timeout=0.2)


def collection_name_for_document(path: Path, *, prefix: str = "industry_rag", data_root: Path | None = None) -> str:
    """Return the typed Milvus collection for a source document.

    The first directory under ``data/`` is authoritative. Unknown folders still
    get a deterministic collection name derived from that folder.
    """

    root = Path(data_root or DEFAULT_DATA_DIR).resolve()
    try:
        relative = path.resolve().relative_to(root)
    except ValueError as exc:
        raise ValueError(f"Source file must be inside data root: {path}") from exc
    if len(relative.parts) < 2:
        raise ValueError(f"Source file must be in a folder below data/: {path}")
    folder = relative.parts[0].lower()
    if folder in COLLECTION_BY_DATA_TYPE:
        return COLLECTION_BY_DATA_TYPE[folder]
    # Unknown folders still get a deterministic collection; the folder, not the
    # filename, is the routing key.
    safe_folder = "".join(char if char.isalnum() or char == "_" else "_" for char in folder).strip("_")
    return f"{prefix}_{safe_folder or 'unknown'}"[:255]


def collection_name_for_pdf(
    pdf_path: Path,
    *,
    prefix: str = "industry_rag",
    data_root: Path | None = None,
) -> str:
    """Backward-compatible alias for the former PDF-only API."""

    return collection_name_for_document(pdf_path, prefix=prefix, data_root=data_root)


def _normalize_extensions(extensions: Iterable[str] | None) -> set[str] | None:
    """Normalize a user supplied extension filter into lowercase suffixes."""

    if extensions is None:
        return None
    normalized = {
        f".{str(item).strip().lower().lstrip('.')}"
        for item in extensions
        if str(item).strip().lstrip(".")
    }
    return normalized or None


def _supported_files(data_dir: Path, extensions: Iterable[str] | None = None) -> list[Path]:
    allowed = _normalize_extensions(extensions) or SUPPORTED_EXTENSIONS
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory does not exist: {data_dir}")
    if not data_dir.is_dir():
        raise NotADirectoryError(f"Data path is not a directory: {data_dir}")
    files = sorted(
        path
        for path in data_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in allowed
    )
    invalid = [path for path in files if len(path.relative_to(data_dir).parts) < 2]
    if invalid:
        raise ValueError(
            "Every source file must be placed in a folder below data/: "
            + ", ".join(str(path) for path in invalid[:5])
        )
    return files


def _enforce_deterministic_options(
    *,
    build_whoosh: bool,
    mysql_enabled: bool,
) -> None:
    """Reject storage switches that would leave the online chain incomplete."""

    if not mysql_enabled:
        raise ValueError("MySQL metadata is required for a complete offline build.")
    if not build_whoosh:
        raise ValueError(
            "Whoosh BM25 indexes must be rebuilt together with Milvus for online retrieval."
        )


def ingest_directory(
    data_dir: Path = DEFAULT_DATA_DIR,
    *,
    milvus_uri: str = settings.milvus_uri,
    milvus_database: str = settings.milvus_database,
    whoosh_index_dir: str | Path | None = settings.whoosh_index_path,
    extensions: Sequence[str] | None = None,
    build_whoosh: bool = True,
    object_storage_enabled: bool = False,
    object_storage_config: ObjectStorageConfig | None = None,
    project_id: str | None = None,
    tenant_id: str | None = None,
    version_label: str | None = None,
    mysql_enabled: bool = True,
    mysql_config: MySQLConfig | None = None,
    rebuild: bool = False,
    fail_fast: bool = False,
    cache_enabled: bool = settings.ingestion_cache_enabled,
    cache_dir: str | Path = settings.ingestion_cache_path,
) -> dict[str, int | str]:
    """Ingest supported files into Milvus and MySQL metadata tables."""

    paths = _supported_files(data_dir, extensions)
    if not paths:
        supported = ", ".join(sorted(_normalize_extensions(extensions) or SUPPORTED_EXTENSIONS))
        raise FileNotFoundError(f"No supported files found in {data_dir}. Supported: {supported}")
    _enforce_deterministic_options(
        build_whoosh=build_whoosh,
        mysql_enabled=mysql_enabled,
    )

    target_collections = sorted({collection_name_for_document(path, data_root=data_dir) for path in paths})
    load_service_env()
    local_ocr_backend = os.getenv("LOCAL_OCR_BACKEND", "").strip()
    image_describer = None
    if local_ocr_backend:
        image_describer = LocalOcrClient()
        LOGGER.info("Visual image parser enabled with local OCR backend=%s", local_ocr_backend)
    elif any(path.suffix.lower() in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp", ".jp2"} for path in paths):
        image_describer = SiliconFlowVisionClient.from_env()
        LOGGER.info("Visual image parser enabled with SiliconFlow model=%s", image_describer.config.model)

    embed_config = EmbeddingConfig(
        model_name=settings.siliconflow_embedding_model,
        batch_size=settings.embedding_batch_size,
        min_characters=settings.embedding_min_characters,
        normalize_embeddings=settings.embedding_normalize,
        expected_dimension=settings.embedding_dim,
    )
    chunk_config = ChunkerConfig(
        max_characters=ChunkerConfig.max_characters,
        overlap_characters=ChunkerConfig.overlap_characters,
    )
    pipeline_signature = build_pipeline_signature(
        chunk_config=chunk_config,
        embedding_config=embed_config,
        ocr_backend=local_ocr_backend,
        context={
            "project_id": project_id,
            "tenant_id": tenant_id,
            "version_label": version_label,
            "object_storage_enabled": object_storage_enabled,
        },
    )
    embed_client = SiliconFlowEmbeddingClient(model=embed_config.model_name)
    ingestion_cache = IngestionCache(cache_dir) if cache_enabled else None
    writers: dict[str, MilvusVectorWriter] = {}

    def writer_for(collection_name: str) -> MilvusVectorWriter:
        writer = writers.get(collection_name)
        if writer is not None:
            return writer
        writer = MilvusVectorWriter(
            MilvusConfig(
                uri=milvus_uri,
                token=settings.milvus_token,
                database=milvus_database,
                collection_name=collection_name,
                vector_field=settings.milvus_vector_field,
                primary_field=settings.milvus_primary_field,
                metric_type=settings.milvus_metric_type,
                index_type=settings.milvus_index_type,
                batch_size=settings.milvus_batch_size,
            )
        )
        writers[collection_name] = writer
        return writer

    mysql_writer: MySQLRagWriter | None = None
    if mysql_enabled:
        try:
            mysql_writer = MySQLRagWriter(mysql_config or MySQLConfig.from_env())
            mysql_writer.initialize()
        except Exception as exc:
            raise RuntimeError(f"MySQL metadata store unavailable: {exc}") from exc
    object_storage: ObjectStorageClient | None = None
    if object_storage_enabled:
        object_storage = ObjectStorageClient(object_storage_config or ObjectStorageConfig.from_env())

    total_chunks = 0
    total_records = 0
    total_inserted = 0
    skipped_files = 0
    uploaded_files = 0
    created_collections: set[str] = set()
    format_counts: dict[str, int] = {}
    failed_files = 0
    # A forced rebuild reprocesses every source but never deletes the active
    # lexical index up front. Each document is replaced idempotently, so an
    # interrupted rebuild leaves the previous searchable records available.
    recreate_whoosh_collections: set[str] = set()
    failed_sources: list[str] = []
    cache_hits = 0
    cache_writes = 0

    try:
        for file_index, path in enumerate(paths, start=1):
            target_collection = collection_name_for_document(path, data_root=data_dir)
            LOGGER.info(
                "File progress: %s/%s file=%s",
                file_index,
                len(paths),
                path.relative_to(data_dir),
            )
            LOGGER.info("Target collection: %s", target_collection)
            document_id: str | None = None
            previous_chunk_ids: set[str] = set()
            writer: MilvusVectorWriter | None = None
            records: list[VectorRecord] = []
            try:
                source = DocumentSource.from_path(path)
                document_id = source.identity(root=data_dir)
                content_hash = source.sha256()
                storage_metadata: dict[str, str | None] = {}
                source_format = path.suffix.lower().lstrip(".") or "unknown"
                initial_metadata = {
                    "document_id": document_id,
                    "content_hash": content_hash,
                    "file_size": source.size,
                    "source_format": source_format,
                    "pipeline_signature": pipeline_signature,
                    **{
                        key: value
                        for key, value in {
                            "project_id": project_id,
                            "tenant_id": tenant_id,
                            "version_label": version_label,
                        }.items()
                        if value is not None
                    },
                }
                if mysql_writer is not None:
                    completed = mysql_writer.find_complete_document(
                        document_id,
                        content_hash,
                        pipeline_signature=pipeline_signature,
                    )
                    if completed is not None and not rebuild:
                        stored_ids = set(completed["chunk_ids"])
                        writer = writer_for(target_collection)
                        milvus_ids = writer.existing_record_ids(stored_ids)
                        whoosh_ids = existing_document_ids(
                            stored_ids,
                            index_dir_for_collection(whoosh_index_dir, target_collection),
                        )
                        if stored_ids == milvus_ids == whoosh_ids:
                            skipped_files += 1
                            total_chunks += completed["chunk_count"]
                            total_records += completed["vector_count"]
                            LOGGER.info(
                                "Skipped verified unchanged document: %s (%s chunks, %s vectors)",
                                path.name,
                                completed["chunk_count"],
                                completed["vector_count"],
                            )
                            continue
                        LOGGER.warning(
                            "Reprocessing inconsistent document %s mysql=%s milvus=%s whoosh=%s",
                            path.name,
                            len(stored_ids),
                            len(milvus_ids),
                            len(whoosh_ids),
                        )
                    previous_chunk_ids = mysql_writer.begin_document(
                        document_id,
                        source_name=path.name,
                        source_path=str(path),
                        source_format=source_format,
                        content_hash=content_hash,
                        file_size=source.size,
                        metadata=initial_metadata,
                    )

                writer = writer or writer_for(target_collection)
                LOGGER.info("Parsing: %s", path)

                if object_storage is not None:
                    stored = object_storage.upload_file(path, root=data_dir)
                    storage_metadata = stored.to_metadata()
                    uploaded_files += 1
                    LOGGER.info("Uploaded source file to object storage: %s", stored.uri)
                    if mysql_writer is not None:
                        mysql_writer.update_document_metadata(
                            document_id,
                            source_name=path.name,
                            source_path=str(path),
                            source_format=source_format,
                            content_hash=content_hash,
                            file_size=source.size,
                            storage=storage_metadata,
                            metadata={**initial_metadata, **storage_metadata},
                        )

                cached = (
                    ingestion_cache.load(
                        document_id,
                        content_hash=content_hash,
                        pipeline_signature=pipeline_signature,
                    )
                    if ingestion_cache is not None and not rebuild
                    else None
                )
                if cached is not None:
                    document = cached.document
                    chunks = cached.chunks
                    cache_hits += 1
                    LOGGER.info("Intermediate cache hit: %s (%s chunks)", path.name, len(chunks))
                else:
                    with _stage_progress(path.name, "parse_ocr"):
                        document = parse_document(
                            path,
                            image_describer=image_describer,
                            source_root=data_dir,
                        )
                    chunks = []
                document_id = str(document.metadata["document_id"])
                document.metadata.update(storage_metadata)
                document.metadata.update(
                    {
                        key: value
                        for key, value in {
                            "project_id": project_id,
                            "tenant_id": tenant_id,
                            "version_label": version_label,
                        }.items()
                        if value is not None
                    }
                )
                document.metadata["data_folder"] = path.relative_to(data_dir).parts[0].lower()
                document.metadata["collection"] = target_collection
                document.metadata["pipeline_signature"] = pipeline_signature
                if cached is None:
                    with _stage_progress(path.name, "clean_chunk"):
                        chunks = build_chunks(document, config=chunk_config)
                    if ingestion_cache is not None:
                        try:
                            ingestion_cache.store(
                                document_id,
                                content_hash=content_hash,
                                pipeline_signature=pipeline_signature,
                                document=document,
                                chunks=chunks,
                            )
                            cache_writes += 1
                            LOGGER.info("Intermediate cache written: %s (%s chunks)", path.name, len(chunks))
                        except OSError as cache_error:
                            LOGGER.warning("Unable to write intermediate cache for %s: %s", path.name, cache_error)
                if mysql_writer is not None:
                    mysql_writer.update_document_metadata(
                        document_id,
                        source_name=document.source_name,
                        source_path=str(document.source_path or path),
                        source_format=document.source_format,
                        content_hash=str(document.metadata["content_hash"]),
                        file_size=int(document.metadata["file_size"]),
                        storage=document.metadata,
                        metadata=document.metadata,
                    )

                with _stage_progress(path.name, "embedding_milvus"):
                    records, inserted = _embed_and_write_records(
                        chunks,
                        embed_client=embed_client,
                        embed_config=embed_config,
                        writer=writer,
                    )
                source_format = document.source_format
                format_counts[source_format] = format_counts.get(source_format, 0) + 1
                total_chunks += len(chunks)
                total_records += len(records)

                if records:
                    created_collections.add(target_collection)
                    total_inserted += inserted
                    if build_whoosh and whoosh_index_dir:
                        target_index_dir = index_dir_for_collection(whoosh_index_dir, target_collection)
                        recreate_whoosh = target_collection in recreate_whoosh_collections
                        build_index(
                            records,
                            target_index_dir,
                            recreate=recreate_whoosh,
                        )
                        recreate_whoosh_collections.discard(target_collection)
                if mysql_writer is not None:
                    mysql_writer.replace_chunks(
                        document_id,
                        records,
                        collection_name=target_collection,
                    )
                    mysql_writer.mark_complete(
                        document_id,
                        chunk_count=len(chunks),
                        vector_count=len(records),
                    )
                if previous_chunk_ids:
                    current_chunk_ids = {record.chunk_id for record in records}
                    stale_ids = previous_chunk_ids - current_chunk_ids
                    if stale_ids:
                        try:
                            writer.delete_records(stale_ids)
                            if build_whoosh and whoosh_index_dir:
                                delete_documents(
                                    stale_ids,
                                    index_dir_for_collection(whoosh_index_dir, target_collection),
                                )
                        except Exception as cleanup_error:
                            LOGGER.error(
                                "Document completed but stale-record cleanup failed for %s: %s",
                                path.name,
                                cleanup_error,
                            )
                if not records:
                    LOGGER.info("Completed without vector records: %s", path.name)
                else:
                    LOGGER.info(
                        "Upserted %s records from %s into %s (%s chunks, %s embedded).",
                        inserted,
                        path.name,
                        target_collection,
                        len(chunks),
                        len(records),
                    )
            except KeyboardInterrupt:
                if records and writer is not None:
                    _compensate_records(
                        records,
                        writer=writer,
                        build_whoosh=build_whoosh,
                        whoosh_index_dir=whoosh_index_dir,
                        target_collection=target_collection,
                        source_name=path.name,
                    )
                if mysql_writer is not None and document_id:
                    try:
                        mysql_writer.mark_failed(document_id, "interrupted by user")
                    except MySQLWriteError as status_error:
                        LOGGER.error("Unable to mark interrupted state for %s: %s", path.name, status_error)
                LOGGER.warning("Ingestion interrupted by user at file %s/%s: %s", file_index, len(paths), path)
                raise
            except Exception as exc:
                failed_files += 1
                failed_sources.append(str(path))
                if records and writer is not None:
                    _compensate_records(
                        records,
                        writer=writer,
                        build_whoosh=build_whoosh,
                        whoosh_index_dir=whoosh_index_dir,
                        target_collection=target_collection,
                        source_name=path.name,
                    )
                if mysql_writer is not None and document_id:
                    try:
                        mysql_writer.mark_failed(document_id, str(exc))
                    except MySQLWriteError as status_error:
                        LOGGER.error("Unable to mark MySQL failure state for %s: %s", path.name, status_error)
                LOGGER.exception("Failed: %s -> %s", path, exc)
                if fail_fast:
                    raise
    finally:
        if mysql_writer is not None:
            mysql_writer.close()

    result: dict[str, int | str] = {
        "files": len(paths),
        "pdf_files": sum(path.suffix.lower() == ".pdf" for path in paths),
        "collections": len(created_collections),
        "chunks": total_chunks,
        "vector_records": total_records,
        "inserted": total_inserted,
        "skipped": skipped_files,
        "uploaded": uploaded_files,
        "failed": failed_files,
        "failed_sources": "|".join(failed_sources),
        "pipeline_signature": pipeline_signature,
        "cache_hits": cache_hits,
        "cache_writes": cache_writes,
        "online_collections": ",".join(target_collections),
    }
    result.update({f"files_{key}": value for key, value in format_counts.items()})
    return result


def _embed_and_write_records(
    chunks: Sequence[IndustrialChunk],
    *,
    embed_client: SiliconFlowEmbeddingClient,
    embed_config: EmbeddingConfig,
    writer: MilvusVectorWriter,
) -> tuple[list[VectorRecord], int]:
    """Embed and upsert bounded batches so a retry can reuse stable chunk IDs."""

    records: list[VectorRecord] = []
    pending: list[VectorRecord] = []
    inserted = 0
    collection_ready = False
    try:
        for record in iter_embed_chunks(chunks, embed_client, config=embed_config):
            if not collection_ready:
                writer.recreate_collection(dimension=len(record.vector))
                collection_ready = True
            records.append(record)
            pending.append(record)
            if len(records) % embed_config.batch_size == 0:
                LOGGER.info(
                    "Embedding progress: embedded=%s source_chunks=%s",
                    len(records),
                    len(chunks),
                )
            if len(pending) < settings.milvus_batch_size:
                continue
            inserted += writer.insert_records(pending)
            LOGGER.info("Milvus batch upserted: %s records", len(pending))
            pending = []
        if pending:
            inserted += writer.insert_records(pending)
            LOGGER.info("Milvus final batch upserted: %s records", len(pending))
    except BaseException:
        if records:
            try:
                writer.delete_records(record.chunk_id for record in records)
            except Exception as rollback_error:
                LOGGER.error("Unable to roll back partial Milvus batch: %s", rollback_error)
        raise
    LOGGER.info("Embedding completed: embedded=%s source_chunks=%s", len(records), len(chunks))
    return records, inserted


def _compensate_records(
    records: Sequence[VectorRecord],
    *,
    writer: MilvusVectorWriter,
    build_whoosh: bool,
    whoosh_index_dir: str | Path | None,
    target_collection: str,
    source_name: str,
) -> None:
    """Best-effort removal of a document version that did not complete."""

    new_ids = {record.chunk_id for record in records}
    try:
        writer.delete_records(new_ids)
        if build_whoosh and whoosh_index_dir:
            delete_documents(
                new_ids,
                index_dir_for_collection(whoosh_index_dir, target_collection),
            )
        LOGGER.info("Compensated incomplete records: file=%s records=%s", source_name, len(new_ids))
    except Exception as rollback_error:
        LOGGER.error("Unable to compensate failed writes for %s: %s", source_name, rollback_error)


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ingest industrial documents into Milvus.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--milvus-uri", default=settings.milvus_uri)
    parser.add_argument("--milvus-database", default=settings.milvus_database)
    parser.add_argument("--whoosh-index-dir", type=Path, default=settings.whoosh_index_path)
    parser.add_argument(
        "--preflight",
        action="store_true",
        help="Run read-only configuration and dependency checks without ingesting data.",
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Force reprocessing without deleting active indexes before success.",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop on the first failed source instead of processing the remaining files.",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Disable the local parsed/chunked intermediate cache for this run.",
    )
    parser.add_argument(
        "--no-network-probe",
        action="store_true",
        help="Skip Milvus/MySQL TCP checks during --preflight.",
    )
    parser.add_argument(
        "--extensions",
        default=None,
        help="Comma-separated extension filter. Defaults to all supported formats.",
    )
    parser.add_argument(
        "--object-storage",
        action="store_true",
        help="Upload original source files to MinIO/S3-compatible object storage.",
    )
    parser.add_argument("--project-id", default=None, help="Project identifier copied to vector metadata.")
    parser.add_argument("--tenant-id", default=None, help="Tenant identifier used for retrieval filtering.")
    parser.add_argument("--version-label", default=None, help="Human-readable drawing version label.")
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Console logging level.",
    )
    return parser


def main() -> int:
    load_service_env()
    args = build_argument_parser().parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    extensions = (
        [item.strip() for item in args.extensions.split(",") if item.strip()]
        if args.extensions
        else None
    )
    data_dir = settings.resolve_service_path(args.data_dir)
    whoosh_index_dir = settings.resolve_service_path(args.whoosh_index_dir)
    if args.preflight:
        paths = _supported_files(data_dir, extensions)
        collections = sorted(
            {collection_name_for_document(path, data_root=data_dir) for path in paths}
        )
        report = run_preflight(
            data_dir=data_dir,
            whoosh_index_dir=whoosh_index_dir,
            files=paths,
            collections=collections,
            milvus_uri=args.milvus_uri,
            mysql_host=settings.mysql_host,
            mysql_port=settings.mysql_port,
            mysql_user=settings.mysql_user,
            mysql_password=settings.mysql_password,
            mysql_database=settings.mysql_database,
            milvus_database=args.milvus_database,
            milvus_token=settings.milvus_token,
            embedding_api_key=settings.siliconflow_api_key,
            ocr_backend=os.getenv("LOCAL_OCR_BACKEND", ""),
            cache_dir=settings.ingestion_cache_path,
            embedding_client=(
                None
                if args.no_network_probe
                else SiliconFlowEmbeddingClient(model=settings.siliconflow_embedding_model)
            ),
            expected_embedding_dimension=settings.embedding_dim,
            probe_network=not args.no_network_probe,
        )
        print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
        return 0 if report.ready else 2
    result = ingest_directory(
        data_dir,
        milvus_uri=args.milvus_uri,
        milvus_database=args.milvus_database,
        whoosh_index_dir=whoosh_index_dir,
        extensions=extensions,
        build_whoosh=True,
        object_storage_enabled=args.object_storage,
        project_id=args.project_id,
        tenant_id=args.tenant_id,
        version_label=args.version_label,
        mysql_enabled=True,
        rebuild=args.rebuild,
        fail_fast=args.fail_fast,
        cache_enabled=not args.no_cache and settings.ingestion_cache_enabled,
        cache_dir=settings.ingestion_cache_path,
    )
    LOGGER.info("Ingestion complete: %s", result)
    return 1 if int(result["failed"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
