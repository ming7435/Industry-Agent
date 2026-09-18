"""Run the multi-format offline ingestion pipeline into Milvus.

Pipeline:
Supported files -> StructuredDocument -> CleanedBlock -> IndustrialChunk ->
VectorRecord -> Milvus collection.
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import re
import sys
from collections.abc import Iterable, Sequence
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.chunk import ChunkerConfig, build_chunks
from app.embedding import BGEM3EmbeddingClient, EmbeddingConfig, embed_chunks
from app.ingestion import (
    DocumentSource,
    LocalOcrClient,
    SUPPORTED_EXTENSIONS,
    QwenVLClient,
    VisionError,
    parse_document,
)
from app.milvus import MilvusConfig, MilvusVectorWriter
from app.mysql import MySQLConfig, MySQLRagWriter, MySQLWriteError
from app.storage import ObjectStorageClient, ObjectStorageConfig, ObjectStorageError


# 默认读取项目 data/ 目录（递归扫描其分类子目录：alarms / sop / manuals / cases / index 等）。
# 之后新增数据只需丢进对应的分类子目录，直接运行本脚本即可入库。
DEFAULT_DATA_DIR = Path("data")
DEFAULT_COLLECTION = "industry_rag_chunks"
LOGGER = logging.getLogger("rag_offline_ingest")
COLLECTION_NAME_BY_KEYWORD = {
    "BOM": "industry_rag_bom",
    "SOP": "industry_rag_sop",
    "保养维护": "industry_rag_maintenance",
    "安全规程": "industry_rag_safety_rules",
    "故障诊断": "industry_rag_troubleshooting",
    "报警码": "industry_rag_alarm_codes",
}


def collection_name_for_document(path: Path, *, prefix: str = "industry_rag") -> str:
    """Build a stable Milvus collection name from a document filename."""

    for keyword, collection_name in COLLECTION_NAME_BY_KEYWORD.items():
        if keyword in path.stem:
            return collection_name

    normalized = re.sub(r"[^0-9A-Za-z_]+", "_", path.stem).strip("_").lower()
    normalized = re.sub(r"_+", "_", normalized) or "document"
    if normalized[0].isdigit():
        normalized = f"doc_{normalized}"
    extension = path.suffix.lower().lstrip(".") or "file"
    path_digest = hashlib.sha1(str(path.resolve()).encode("utf-8")).hexdigest()[:10]
    return f"{prefix}_{normalized}_{extension}_{path_digest}"


def collection_name_for_pdf(pdf_path: Path, *, prefix: str = "industry_rag") -> str:
    """Backward-compatible alias for the former PDF-only API."""

    return collection_name_for_document(pdf_path, prefix=prefix)


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
    return sorted(
        path
        for path in data_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in allowed
    )


def ingest_directory(
    data_dir: Path = DEFAULT_DATA_DIR,
    *,
    collection_name: str = DEFAULT_COLLECTION,
    milvus_uri: str = "http://localhost:19530",
    extensions: Sequence[str] | None = None,
    drop_all_collections: bool = False,
    collection_per_document: bool = False,
    collection_per_pdf: bool | None = None,
    use_vision: bool = False,
    use_local_ocr: bool = False,
    embedding_model: str = "BAAI/bge-m3",
    embedding_model_path: str | None = None,
    embedding_batch_size: int = 16,
    chunk_max_characters: int = ChunkerConfig.max_characters,
    chunk_overlap_characters: int = ChunkerConfig.overlap_characters,
    skip_unchanged: bool = False,
    object_storage_enabled: bool = False,
    object_storage_config: ObjectStorageConfig | None = None,
    cad_metadata_enabled: bool = True,
    project_id: str | None = None,
    tenant_id: str | None = None,
    version_label: str | None = None,
    mysql_enabled: bool = True,
    mysql_config: MySQLConfig | None = None,
    continue_on_error: bool = True,
) -> dict[str, int]:
    """Ingest supported files into Milvus and MySQL metadata tables."""

    if collection_per_pdf is not None:
        collection_per_document = collection_per_pdf
    paths = _supported_files(data_dir, extensions)
    if not paths:
        supported = ", ".join(sorted(_normalize_extensions(extensions) or SUPPORTED_EXTENSIONS))
        raise FileNotFoundError(f"No supported files found in {data_dir}. Supported: {supported}")

    image_describer = None
    if use_vision and use_local_ocr:
        raise ValueError("Use either Qwen-VL vision or local OCR, not both.")
    if use_vision:
        try:
            image_describer = QwenVLClient.from_env()
        except VisionError as exc:
            raise RuntimeError(f"Unable to initialize Qwen-VL: {exc}") from exc
    elif use_local_ocr:
        image_describer = LocalOcrClient()

    embed_config = EmbeddingConfig(
        model_name=embedding_model,
        model_path=embedding_model_path,
        batch_size=embedding_batch_size,
    )
    chunk_config = ChunkerConfig(
        max_characters=chunk_max_characters,
        overlap_characters=chunk_overlap_characters,
    )
    embed_client = BGEM3EmbeddingClient(embed_config)
    admin_writer = MilvusVectorWriter(
        MilvusConfig(uri=milvus_uri, collection_name=collection_name)
    )
    if drop_all_collections:
        dropped = admin_writer.drop_all_collections()
        LOGGER.warning("Dropped collections: %s", dropped)

    mysql_writer: MySQLRagWriter | None = None
    if mysql_enabled:
        try:
            mysql_writer = MySQLRagWriter(mysql_config or MySQLConfig.from_env())
            mysql_writer.initialize()
        except Exception as exc:
            LOGGER.warning(
                "MySQL metadata store unavailable, continuing without it: %s", exc
            )
            mysql_writer = None
    elif skip_unchanged:
        LOGGER.warning("skip_unchanged is ignored because MySQL metadata is disabled.")

    object_storage: ObjectStorageClient | None = None
    if object_storage_enabled:
        object_storage = ObjectStorageClient(object_storage_config or ObjectStorageConfig.from_env())

    total_chunks = 0
    total_records = 0
    total_inserted = 0
    total_stale_deleted = 0
    skipped_files = 0
    uploaded_files = 0
    created_collections: set[str] = set()
    format_counts: dict[str, int] = {}
    failed_files = 0

    try:
        for path in paths:
            target_collection = (
                collection_name_for_document(path)
                if collection_per_document
                else collection_name
            )
            writer = MilvusVectorWriter(MilvusConfig(uri=milvus_uri, collection_name=target_collection))
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
                if skip_unchanged and mysql_writer is not None:
                    existing = mysql_writer.find_complete_document(document_id, content_hash)
                    if existing is not None:
                        skipped_files += 1
                        total_chunks += existing["chunk_count"]
                        total_records += existing["vector_count"]
                        LOGGER.info(
                            "Skipped unchanged complete document: %s (%s chunks, %s vectors)",
                            path.name,
                            existing["chunk_count"],
                            existing["vector_count"],
                        )
                        continue

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
                stale_deleted = 0
                if records:
                    # Calling this for every document also validates an existing
                    # collection's vector dimension when the process is resumed
                    # or the embedding model has changed.
                    writer.recreate_collection(dimension=len(records[0].vector))
                    created_collections.add(target_collection)
                    inserted = writer.insert_records(records)
                    total_inserted += inserted
                if previous_chunk_ids and writer.has_collection():
                    current_chunk_ids = {record.chunk_id for record in records}
                    stale_ids = previous_chunk_ids - current_chunk_ids
                    stale_deleted = writer.delete_records(stale_ids)
                    total_stale_deleted += stale_deleted
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
                        "Upserted %s records from %s into %s (%s chunks, %s embedded, %s stale vectors removed).",
                        inserted,
                        path.name,
                        target_collection,
                        len(chunks),
                        len(records),
                        stale_deleted,
                    )
            except Exception as exc:
                failed_files += 1
                if mysql_writer is not None and document_id:
                    try:
                        mysql_writer.mark_failed(document_id, str(exc))
                    except MySQLWriteError as status_error:
                        LOGGER.error("Unable to mark MySQL failure state for %s: %s", path.name, status_error)
                LOGGER.exception("Failed: %s -> %s", path, exc)
                if not continue_on_error:
                    raise
    finally:
        if mysql_writer is not None:
            mysql_writer.close()

    result: dict[str, int] = {
        "files": len(paths),
        "pdf_files": sum(path.suffix.lower() == ".pdf" for path in paths),
        "collections": len(created_collections),
        "chunks": total_chunks,
        "vector_records": total_records,
        "inserted": total_inserted,
        "stale_deleted": total_stale_deleted,
        "skipped": skipped_files,
        "uploaded": uploaded_files,
        "failed": failed_files,
    }
    result.update({f"files_{key}": value for key, value in format_counts.items()})
    return result


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ingest industrial documents into Milvus.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--collection", default=DEFAULT_COLLECTION)
    parser.add_argument("--milvus-uri", default="http://localhost:19530")
    parser.add_argument(
        "--extensions",
        default=None,
        help="Comma-separated extension filter, e.g. 'dxf' or 'dxf,dwg'. Defaults to all supported formats.",
    )
    parser.add_argument(
        "--drop-all-collections",
        action="store_true",
        help="Drop every existing Milvus collection before inserting.",
    )
    parser.add_argument(
        "--collection-per-document",
        "--collection-per-pdf",
        dest="collection_per_document",
        action="store_true",
        help="Create one Milvus collection for each supported document.",
    )
    parser.add_argument(
        "--vision",
        action="store_true",
        help="Use Qwen-VL for image/CAD/page recognition during parsing.",
    )
    parser.add_argument(
        "--local-ocr",
        action="store_true",
        help="Use local OCR for image/scanned-page recognition instead of Qwen-VL.",
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
    parser.add_argument("--embedding-model", default="BAAI/bge-m3")
    parser.add_argument(
        "--embedding-model-path",
        default=None,
        help="Load embeddings from a local sentence-transformers model directory.",
    )
    parser.add_argument("--embedding-batch-size", type=int, default=16)
    parser.add_argument("--chunk-max-characters", type=int, default=ChunkerConfig.max_characters)
    parser.add_argument("--chunk-overlap-characters", type=int, default=ChunkerConfig.overlap_characters)
    parser.add_argument(
        "--skip-unchanged",
        action="store_true",
        help="Skip files whose document_id and content hash are already complete in MySQL.",
    )
    parser.add_argument(
        "--no-mysql",
        action="store_true",
        help="Disable MySQL document/chunk metadata persistence.",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop at the first file that fails to parse, embed, or persist.",
    )
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
        collection_name=args.collection,
        milvus_uri=args.milvus_uri,
        extensions=extensions,
        drop_all_collections=args.drop_all_collections,
        collection_per_document=args.collection_per_document,
        use_vision=args.vision,
        use_local_ocr=args.local_ocr,
        embedding_model=args.embedding_model,
        embedding_model_path=args.embedding_model_path,
        embedding_batch_size=args.embedding_batch_size,
        chunk_max_characters=args.chunk_max_characters,
        chunk_overlap_characters=args.chunk_overlap_characters,
        skip_unchanged=args.skip_unchanged,
        object_storage_enabled=args.object_storage,
        cad_metadata_enabled=args.cad_metadata,
        project_id=args.project_id,
        tenant_id=args.tenant_id,
        version_label=args.version_label,
        mysql_enabled=not args.no_mysql,
        continue_on_error=not args.fail_fast,
    )
    LOGGER.info("Ingestion complete: %s", result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
