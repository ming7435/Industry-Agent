"""Run the multi-format offline ingestion pipeline into Milvus, MySQL and Whoosh.

Pipeline::

    supported files -> StructuredDocument -> CleanedBlock -> IndustrialChunk
                    -> VectorRecord -> Milvus collection (+ MySQL metadata)
                    -> Whoosh BM25 index

The three stores written here are exactly the three the online chain reads:

* Milvus  -> dense route (:mod:`app.milvus.retriever`),
* Whoosh  -> BM25 route (:mod:`app.whoosh.retriever`),
* MySQL   -> ingestion bookkeeping (documents, chunks, failures).

Defaults come from :mod:`config.settings`, so a plain ``python
scripts/ingest_to_milvus.py`` writes into the collection the online service reads
(``settings.milvus_collection``).
"""

from __future__ import annotations

import argparse
import hashlib
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.chunk import ChunkerConfig, build_chunks
from app.embedding import EmbeddingConfig, embed_chunks, get_embedder
from app.ingestion import (
    SUPPORTED_EXTENSIONS,
    QwenVLClient,
    VisionError,
    parse_document,
)
from app.milvus import MilvusConfig, MilvusVectorWriter
from app.mysql import MySQLConfig, MySQLRagWriter, MySQLWriteError
from app.whoosh import build_index

from config.settings import settings

DEFAULT_DATA_DIR = Path(settings.rag_data_dir)
DEFAULT_COLLECTION = settings.milvus_collection
DEFAULT_MILVUS_URI = settings.milvus_uri
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


def _supported_files(data_dir: Path) -> list[Path]:
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory does not exist: {data_dir}")
    if not data_dir.is_dir():
        raise NotADirectoryError(f"Data path is not a directory: {data_dir}")
    return sorted(
        path
        for path in data_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def ingest_directory(
    data_dir: Path = DEFAULT_DATA_DIR,
    *,
    collection_name: str = DEFAULT_COLLECTION,
    milvus_uri: str = DEFAULT_MILVUS_URI,
    drop_all_collections: bool = False,
    collection_per_document: bool = False,
    collection_per_pdf: bool | None = None,
    use_vision: bool = False,
    embedding_model: str | None = None,
    embedding_batch_size: int | None = None,
    mysql_enabled: bool = True,
    mysql_config: MySQLConfig | None = None,
    continue_on_error: bool = True,
    whoosh_enabled: bool = True,
    whoosh_index_dir: str | None = None,
) -> dict[str, int]:
    """Ingest supported files into Milvus, MySQL and the Whoosh BM25 index."""

    if collection_per_pdf is not None:
        collection_per_document = collection_per_pdf
    paths = _supported_files(data_dir)
    if not paths:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise FileNotFoundError(f"No supported files found in {data_dir}. Supported: {supported}")

    image_describer = None
    if use_vision:
        try:
            image_describer = QwenVLClient.from_env()
        except VisionError as exc:
            raise RuntimeError(f"Unable to initialize Qwen-VL: {exc}") from exc

    embed_config = EmbeddingConfig(
        model_name=embedding_model or settings.embedding_model_path,
        batch_size=embedding_batch_size or settings.embedding_batch_size,
    )
    embed_client = get_embedder()
    if embed_client is None:
        raise RuntimeError(
            "embedding model is unavailable; install sentence-transformers and "
            f"check EMBEDDING_MODEL_PATH={embed_config.model_name}"
        )
    admin_writer = MilvusVectorWriter(
        MilvusConfig(uri=milvus_uri, collection_name=collection_name)
    )
    if drop_all_collections:
        dropped = admin_writer.drop_all_collections()
        print(f"Dropped collections: {dropped}")

    mysql_writer: MySQLRagWriter | None = None
    if mysql_enabled:
        mysql_writer = MySQLRagWriter(mysql_config or MySQLConfig.from_env())
        mysql_writer.initialize()

    total_chunks = 0
    total_records = 0
    total_inserted = 0
    total_indexed = 0
    created_collections: set[str] = set()
    format_counts: dict[str, int] = {}
    failed_files = 0
    whoosh_started = False

    for path in paths:
        target_collection = (
            collection_name_for_document(path)
            if collection_per_document
            else collection_name
        )
        writer = MilvusVectorWriter(MilvusConfig(uri=milvus_uri, collection_name=target_collection))
        print(f"Parsing: {path}")
        print(f"Target collection: {target_collection}")
        document_id: str | None = None
        try:
            document = parse_document(
                path,
                image_describer=image_describer,
                source_root=data_dir,
            )
            document_id = str(document.metadata["document_id"])
            if mysql_writer is not None:
                mysql_writer.begin_document(
                    document_id,
                    source_name=document.source_name,
                    source_path=str(document.source_path or path),
                    source_format=document.source_format,
                    content_hash=str(document.metadata["content_hash"]),
                    file_size=int(document.metadata["file_size"]),
                    metadata=document.metadata,
                )

            chunks = build_chunks(document, config=ChunkerConfig())
            records = embed_chunks(chunks, embed_client, config=embed_config)
            source_format = document.source_format
            format_counts[source_format] = format_counts.get(source_format, 0) + 1
            total_chunks += len(chunks)
            total_records += len(records)

            inserted = 0
            if records:
                if target_collection not in created_collections:
                    writer.recreate_collection(dimension=len(records[0].vector))
                    created_collections.add(target_collection)
                inserted = writer.insert_records(records)
                total_inserted += inserted
                if whoosh_enabled:
                    try:
                        build_index(
                            records,
                            whoosh_index_dir,
                            recreate=not whoosh_started,
                        )
                        whoosh_started = True
                        total_indexed += len(records)
                    except Exception as whoosh_exc:  # noqa: BLE001 - BM25 must not fail ingestion
                        whoosh_enabled = False
                        print(
                            f"Whoosh index skipped ({type(whoosh_exc).__name__}: {whoosh_exc}); "
                            "the lexical route will stay unavailable until "
                            "scripts/build_whoosh_index.py runs."
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
                print(f"Completed without vector records: {path.name}")
            else:
                print(
                    f"Upserted {inserted} records from {path.name} into {target_collection} "
                    f"({len(chunks)} chunks, {len(records)} embedded)."
                )
        except Exception as exc:
            failed_files += 1
            if mysql_writer is not None and document_id:
                try:
                    mysql_writer.mark_failed(document_id, str(exc))
                except MySQLWriteError as status_error:
                    print(f"Unable to mark MySQL failure state for {path.name}: {status_error}")
            print(f"Failed: {path} -> {exc}")
            if not continue_on_error:
                raise

    if mysql_writer is not None:
        mysql_writer.close()

    result: dict[str, int] = {
        "files": len(paths),
        "pdf_files": sum(path.suffix.lower() == ".pdf" for path in paths),
        "collections": len(created_collections),
        "chunks": total_chunks,
        "vector_records": total_records,
        "inserted": total_inserted,
        "whoosh_documents": total_indexed,
        "failed": failed_files,
    }
    result.update({f"files_{key}": value for key, value in format_counts.items()})
    return result


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ingest industrial documents into Milvus.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--collection", default=DEFAULT_COLLECTION)
    parser.add_argument("--milvus-uri", default=DEFAULT_MILVUS_URI)
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
    parser.add_argument("--embedding-model", default=None, help="Defaults to EMBEDDING_MODEL_PATH.")
    parser.add_argument("--embedding-batch-size", type=int, default=None)
    parser.add_argument(
        "--no-mysql",
        action="store_true",
        help="Disable MySQL document/chunk metadata persistence.",
    )
    parser.add_argument(
        "--no-whoosh",
        action="store_true",
        help="Skip building the Whoosh BM25 index (the lexical route stays empty).",
    )
    parser.add_argument(
        "--whoosh-index-dir",
        default=None,
        help="Directory of the Whoosh index; defaults to WHOOSH_INDEX_DIR.",
    )
    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop at the first file that fails to parse, embed, or persist.",
    )
    return parser


def main() -> int:
    args = build_argument_parser().parse_args()
    result = ingest_directory(
        args.data_dir,
        collection_name=args.collection,
        milvus_uri=args.milvus_uri,
        drop_all_collections=args.drop_all_collections,
        collection_per_document=args.collection_per_document,
        use_vision=args.vision,
        embedding_model=args.embedding_model,
        embedding_batch_size=args.embedding_batch_size,
        mysql_enabled=not args.no_mysql,
        continue_on_error=not args.fail_fast,
        whoosh_enabled=not args.no_whoosh,
        whoosh_index_dir=args.whoosh_index_dir,
    )
    print(f"Ingestion complete: {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
