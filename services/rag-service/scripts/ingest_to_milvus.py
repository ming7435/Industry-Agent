"""Run the multi-format offline ingestion pipeline into Milvus.

Pipeline:
Supported files -> StructuredDocument -> CleanedBlock -> IndustrialChunk ->
VectorRecord -> typed Milvus collections + MySQL manifest + Whoosh BM25 index.
"""

from __future__ import annotations

import argparse
import logging
import shutil
import sys
from collections.abc import Iterable, Sequence
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.chunk import ChunkerConfig, build_chunks
from app.embedding import EmbeddingConfig, SiliconFlowEmbeddingClient, embed_chunks
from app.ingestion import (
    DocumentSource,
    QwenVLClient,
    SUPPORTED_EXTENSIONS,
    parse_document,
)
from app.milvus import MilvusConfig, MilvusVectorWriter
from app.mysql import MySQLConfig, MySQLRagWriter, MySQLWriteError
from app.storage import ObjectStorageClient, ObjectStorageConfig
from app.whoosh import build_index, delete_documents, index_dir_for_collection
from config.settings import settings


# 默认读取项目 data/ 目录（递归扫描其分类子目录：alarms / cases / manuals / sop / cad 等）。
# 标准离线管道按项目数据类型分 Milvus collection，避免仅依赖不完整 metadata 过滤。
DEFAULT_DATA_DIR = Path(settings.rag_data_dir)
LOGGER = logging.getLogger("rag_offline_ingest")
COLLECTION_BY_DATA_TYPE = {
    "alarms": "industry_rag_alarm_codes",
    "cases": "industry_rag_alarm_solutions",
    "manuals": "industry_rag_manuals",
    "sop": "industry_rag_sop",
    "cad": "industry_rag_drawings",
}


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


def _prepare_whoosh_indexes(
    whoosh_index_dir: str | Path | None,
    target_collections: Sequence[str],
    *,
    remove_obsolete: bool = False,
) -> None:
    """Reset generated BM25 indexes for collections built by this data tree."""

    if not whoosh_index_dir:
        return
    root = Path(whoosh_index_dir)
    root.mkdir(parents=True, exist_ok=True)
    target_names = set(target_collections)
    for child in root.iterdir():
        if not child.is_dir() or child.name not in target_names:
            continue
        shutil.rmtree(child)
        LOGGER.info("Removed stale Whoosh index: %s", child)
    for child in root.iterdir():
        if not remove_obsolete or not child.is_dir() or child.name in target_names:
            continue
        if child.name.startswith("industry_rag_"):
            shutil.rmtree(child)
            LOGGER.info("Removed obsolete Whoosh index: %s", child)


def ingest_directory(
    data_dir: Path = DEFAULT_DATA_DIR,
    *,
    milvus_uri: str = settings.milvus_uri,
    milvus_database: str = settings.milvus_database,
    whoosh_index_dir: str | Path | None = settings.whoosh_index_dir,
    extensions: Sequence[str] | None = None,
    build_whoosh: bool = True,
    object_storage_enabled: bool = False,
    object_storage_config: ObjectStorageConfig | None = None,
    cad_metadata_enabled: bool = True,
    project_id: str | None = None,
    tenant_id: str | None = None,
    version_label: str | None = None,
    mysql_enabled: bool = True,
    mysql_config: MySQLConfig | None = None,
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
    if build_whoosh:
        _prepare_whoosh_indexes(whoosh_index_dir, target_collections)

    image_describer = None
    if any(path.suffix.lower() in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp", ".jp2"} for path in paths):
        image_describer = QwenVLClient.from_env()
        LOGGER.info("Visual image parser enabled with Qwen-VL model=%s", image_describer.config.model)

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
    embed_client = SiliconFlowEmbeddingClient(model=embed_config.model_name)
    writers: dict[str, MilvusVectorWriter] = {}

    def writer_for(collection_name: str) -> MilvusVectorWriter:
        writer = writers.get(collection_name)
        if writer is not None:
            return writer
        writer = MilvusVectorWriter(
            MilvusConfig(
                uri=milvus_uri,
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
            mysql_writer.initialize(include_cad_metadata=cad_metadata_enabled)
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
    recreate_whoosh_collections = set(target_collections)

    try:
        for path in paths:
            target_collection = collection_name_for_document(path, data_root=data_dir)
            writer = writer_for(target_collection)
            LOGGER.info("Parsing: %s", path)
            LOGGER.info("Target collection: %s", target_collection)
            document_id: str | None = None
            previous_chunk_ids: set[str] = set()
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
                    previous_chunk_ids = mysql_writer.begin_document(
                        document_id,
                        source_name=path.name,
                        source_path=str(path),
                        source_format=source_format,
                        content_hash=content_hash,
                        file_size=source.size,
                        metadata=initial_metadata,
                    )

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

                document = parse_document(
                    path,
                    image_describer=image_describer,
                    source_root=data_dir,
                )
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

                if mysql_writer is not None and cad_metadata_enabled:
                    mysql_writer.replace_cad_document(document)

                chunks = build_chunks(document, config=chunk_config)
                records = embed_chunks(chunks, embed_client, config=embed_config)
                source_format = document.source_format
                format_counts[source_format] = format_counts.get(source_format, 0) + 1
                total_chunks += len(chunks)
                total_records += len(records)

                inserted = 0
                if records:
                    # Calling this for every document also validates an existing
                    # collection's vector dimension when the process is resumed
                    # or the embedding model has changed.
                    writer.recreate_collection(dimension=len(records[0].vector))
                    created_collections.add(target_collection)
                    inserted = writer.insert_records(records)
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
                if mysql_writer is not None and previous_chunk_ids:
                    current_chunk_ids = {record.chunk_id for record in records}
                    stale_ids = previous_chunk_ids - current_chunk_ids
                    if stale_ids:
                        writer.delete_records(stale_ids)
                        if build_whoosh and whoosh_index_dir:
                            delete_documents(
                                stale_ids,
                                index_dir_for_collection(whoosh_index_dir, target_collection),
                            )
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
            except Exception as exc:
                failed_files += 1
                if mysql_writer is not None and document_id:
                    try:
                        mysql_writer.mark_failed(document_id, str(exc))
                    except MySQLWriteError as status_error:
                        LOGGER.error("Unable to mark MySQL failure state for %s: %s", path.name, status_error)
                LOGGER.exception("Failed: %s -> %s", path, exc)
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
        "online_collections": ",".join(target_collections),
    }
    result.update({f"files_{key}": value for key, value in format_counts.items()})
    return result


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ingest industrial documents into Milvus.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--milvus-uri", default=settings.milvus_uri)
    parser.add_argument("--milvus-database", default=settings.milvus_database)
    parser.add_argument("--whoosh-index-dir", default=settings.whoosh_index_dir)
    parser.add_argument(
        "--extensions",
        default=None,
        help="Comma-separated extension filter, e.g. 'dxf' or 'dxf,dwg'. Defaults to all supported formats.",
    )
    parser.add_argument(
        "--object-storage",
        action="store_true",
        help="Upload original source files to MinIO/S3-compatible object storage.",
    )
    parser.add_argument(
        "--cad-metadata",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Persist structured DXF/DWG drawing metadata to MySQL.",
    )
    parser.add_argument("--project-id", default=None, help="Project identifier copied to CAD and vector metadata.")
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
    result = ingest_directory(
        args.data_dir,
        milvus_uri=args.milvus_uri,
        milvus_database=args.milvus_database,
        whoosh_index_dir=args.whoosh_index_dir,
        extensions=extensions,
        build_whoosh=True,
        object_storage_enabled=args.object_storage,
        cad_metadata_enabled=args.cad_metadata,
        project_id=args.project_id,
        tenant_id=args.tenant_id,
        version_label=args.version_label,
        mysql_enabled=True,
    )
    LOGGER.info("Ingestion complete: %s", result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
