"""运行多格式离线入库流水线并写入 Milvus。

流水线：
支持文件 -> StructuredDocument -> CleanedBlock -> IndustrialChunk ->
VectorRecord -> 类型化 Milvus 集合 + MySQL 清单 + Whoosh BM25 索引。
"""

from __future__ import annotations

import argparse
import logging
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
    LocalOcrClient,
    SUPPORTED_EXTENSIONS,
    QwenVLClient,
    VisionError,
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
COLLECTION_BY_KEYWORD = {
    "BOM": "industry_rag_bom",
    "SOP": "industry_rag_sop",
    "保养维护": "industry_rag_maintenance",
    "安全规程": "industry_rag_safety_rules",
    "故障诊断": "industry_rag_troubleshooting",
    "报警码": "industry_rag_alarm_codes",
}


def collection_name_for_document(path: Path, *, prefix: str = "industry_rag", data_root: Path | None = None) -> str:
    """返回源文档对应的类型化 Milvus 集合。

    ``data/`` 下的目录具有最高优先级。对于 BOM/SOP/保养等可能共用目录的手册类语料，文件名关键词作为二级细分规则。
    """

    root = Path(data_root or DEFAULT_DATA_DIR)
    try:
        relative = path.resolve().relative_to(root.resolve())
    except ValueError:
        relative = path
    parts = [part.lower() for part in relative.parts]
    for part in parts[:-1]:
        if part in COLLECTION_BY_DATA_TYPE:
            if part == "manuals":
                for keyword, collection_name in COLLECTION_BY_KEYWORD.items():
                    if keyword.lower() in path.stem.lower():
                        return collection_name
            return COLLECTION_BY_DATA_TYPE[part]
    for keyword, collection_name in COLLECTION_BY_KEYWORD.items():
        if keyword.lower() in path.stem.lower():
            return collection_name
    return settings.milvus_collection or f"{prefix}_chunks"


def collection_name_for_pdf(
    pdf_path: Path,
    *,
    prefix: str = "industry_rag",
    data_root: Path | None = None,
) -> str:
    """兼容旧 PDF 专用 API 的别名。"""

    return collection_name_for_document(pdf_path, prefix=prefix, data_root=data_root)


def _normalize_extensions(extensions: Iterable[str] | None) -> set[str] | None:
    """将用户提供的扩展名过滤器归一化为小写后缀集合。"""

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
    milvus_uri: str = settings.milvus_uri,
    milvus_database: str = settings.milvus_database,
    milvus_collection: str = settings.milvus_collection,
    whoosh_index_dir: str | Path | None = settings.whoosh_index_dir,
    extensions: Sequence[str] | None = None,
    drop_all_collections: bool = False,
    drop_collection: bool = False,
    build_whoosh: bool = True,
    use_vision: bool = False,
    use_local_ocr: bool = False,
    embedding_model: str = "BAAI/bge-m3",
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
    """将受支持文件入库到 Milvus 和 MySQL 元数据表。"""

    paths = _supported_files(data_dir, extensions)
    if not paths:
        supported = ", ".join(sorted(_normalize_extensions(extensions) or SUPPORTED_EXTENSIONS))
        raise FileNotFoundError(f"在 {data_dir} 中未找到受支持文件。支持类型：{supported}")
    if skip_unchanged and (drop_all_collections or drop_collection):
        LOGGER.warning("目标向量存储正在重建，已禁用 skip_unchanged。")
        skip_unchanged = False

    image_describer = None
    if use_vision and use_local_ocr:
        raise ValueError("只能选择 Qwen-VL 视觉识别或本地 OCR，不能同时启用。")
    if use_vision:
        try:
            image_describer = QwenVLClient.from_env()
        except VisionError as exc:
            raise RuntimeError(f"无法初始化 Qwen-VL：{exc}") from exc
    elif use_local_ocr:
        image_describer = LocalOcrClient()

    embed_config = EmbeddingConfig(
        model_name=embedding_model,
        batch_size=embedding_batch_size,
        min_characters=settings.embedding_min_characters,
        normalize_embeddings=settings.embedding_normalize,
        expected_dimension=settings.embedding_dim,
    )
    chunk_config = ChunkerConfig(
        max_characters=chunk_max_characters,
        overlap_characters=chunk_overlap_characters,
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

    if drop_all_collections:
        dropped = writer_for(milvus_collection).drop_all_collections()
        LOGGER.warning("Dropped all Milvus collections: %s", dropped)
    elif drop_collection:
        target_collections = sorted({collection_name_for_document(path, data_root=data_dir) for path in paths})
        for collection_name in target_collections:
            dropped = writer_for(collection_name).drop_collection()
            LOGGER.warning("Dropped Milvus collection %s: %s", collection_name, dropped)

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
    recreate_whoosh_collections = (
        set(collection_name_for_document(path, data_root=data_dir) for path in paths)
        if drop_all_collections or drop_collection
        else set()
    )

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
                    # 每个文档都调用一次，也能在进程恢复或嵌入模型变更时校验已有集合的向量维度。
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
                if previous_chunk_ids and writer.has_collection():
                    current_chunk_ids = {record.chunk_id for record in records}
                    stale_ids = previous_chunk_ids - current_chunk_ids
                    stale_deleted = writer.delete_records(stale_ids)
                    if build_whoosh and whoosh_index_dir:
                        delete_documents(
                            stale_ids,
                            index_dir_for_collection(whoosh_index_dir, target_collection),
                        )
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
    parser.add_argument("--milvus-uri", default=settings.milvus_uri)
    parser.add_argument("--milvus-database", default=settings.milvus_database)
    parser.add_argument("--milvus-collection", default=settings.milvus_collection)
    parser.add_argument("--whoosh-index-dir", default=settings.whoosh_index_dir)
    parser.add_argument(
        "--extensions",
        default=None,
        help="Comma-separated extension filter, e.g. 'dxf' or 'dxf,dwg'. Defaults to all supported formats.",
    )
    parser.add_argument(
        "--drop-all-collections",
        action="store_true",
        help="Drop every existing Milvus collection before inserting. Use only for disposable local stores.",
    )
    parser.add_argument(
        "--drop-collection",
        action="store_true",
        help="Drop the typed Milvus collections touched by --data-dir and recreate their Whoosh sub-indexes on first write.",
    )
    parser.add_argument(
        "--no-whoosh",
        action="store_true",
        help="Skip updating the Whoosh BM25 index during ingestion.",
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
        milvus_uri=args.milvus_uri,
        milvus_database=args.milvus_database,
        milvus_collection=args.milvus_collection,
        whoosh_index_dir=args.whoosh_index_dir,
        extensions=extensions,
        drop_all_collections=args.drop_all_collections,
        drop_collection=args.drop_collection,
        build_whoosh=not args.no_whoosh,
        use_vision=args.vision,
        use_local_ocr=args.local_ocr,
        embedding_model=args.embedding_model,
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
