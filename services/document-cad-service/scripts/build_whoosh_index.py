"""Rebuild the Whoosh BM25 index from the Milvus collection.

Use this when the lexical route is empty or stale but the vectors are already in
Milvus -- for example after re-building the collection on another machine.
Reading from Milvus keeps both stores in sync without re-parsing the manuals.

Usage::

    python scripts/build_whoosh_index.py --all-configured
    python scripts/build_whoosh_index.py --collection industry_rag_alarm_codes
    python scripts/build_whoosh_index.py --index-dir data/index/whoosh
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from loguru import logger

from app.whoosh import build_index, count_documents, index_dir_for_collection

from config.settings import settings

OUTPUT_FIELDS: tuple[str, ...] = (
    "chunk_id",
    "text",
    "source_name",
    "source_path",
    "source_format",
    "corpus",
    "device_model",
    "error_code",
    "chunk_type",
    "quality",
    "metadata_json",
)
"""Columns the offline writer actually stores; the corpus is derived from them."""

_PAGE_SIZE = 1000
"""Number of rows fetched per Milvus ``query`` call."""


def iter_collection_rows(
    collection_name: str,
    uri: str | None = None,
    database: str | None = None,
) -> list[dict]:
    """Fetch every chunk row of a collection.

    Args:
        collection_name: Milvus collection to read.
        uri: Milvus URI; defaults to ``settings.milvus_uri``.

    Returns:
        One mapping per chunk, with the :data:`OUTPUT_FIELDS` columns.

    Raises:
        RuntimeError: If ``pymilvus`` is missing or the collection is absent.
    """
    try:
        from pymilvus import MilvusClient
    except (ImportError, ModuleNotFoundError) as exc:
        raise RuntimeError("pymilvus is not installed") from exc

    client = MilvusClient(
        uri=uri or settings.milvus_uri,
        db_name=database or settings.milvus_database,
    )
    if not client.has_collection(collection_name):
        raise RuntimeError(f"collection {collection_name!r} does not exist at {uri or settings.milvus_uri}")

    rows: list[dict] = []
    offset = 0
    paged = True
    while True:
        try:
            page = client.query(
                collection_name=collection_name,
                filter=None,
                output_fields=list(OUTPUT_FIELDS),
                limit=_PAGE_SIZE,
                offset=offset,
            )
        except TypeError:
            # Older MilvusClient builds have no ``offset``: fall back to a single
            # page and warn when the collection is larger than one page.
            if paged:
                logger.warning(
                    "this pymilvus build has no query offset; reading at most {} rows",
                    _PAGE_SIZE,
                )
            paged = False
            page = client.query(
                collection_name=collection_name,
                output_fields=list(OUTPUT_FIELDS),
                limit=_PAGE_SIZE,
            )
        if not page:
            break
        rows.extend(page)
        if not paged or len(page) < _PAGE_SIZE:
            break
        offset += len(page)

    logger.info("fetched {} rows from collection={}", len(rows), collection_name)
    return rows


def rebuild(
    collection_name: str | None = None,
    index_dir: str | None = None,
    uri: str | None = None,
    database: str | None = None,
    *,
    append: bool = False,
) -> int:
    """Rebuild the BM25 index from Milvus.

    Args:
        collection_name: Source collection. When omitted, all collections derived
            from ``RAG_DATA_DIR`` are rebuilt by ``rebuild_all_configured``.
        index_dir: Base Whoosh directory; the collection index is written under
            ``index_dir/<collection_name>``.
        uri: Milvus URI; defaults to ``settings.milvus_uri``.

    Returns:
        The number of indexed documents.
    """
    target_collection = collection_name
    if not target_collection:
        raise ValueError("collection_name is required when rebuilding one collection")
    target_index_dir = index_dir_for_collection(
        index_dir or settings.whoosh_index_dir,
        target_collection,
    )
    rows = iter_collection_rows(target_collection, uri, database)
    if not rows:
        logger.warning("collection={} is empty, nothing to index", target_collection)
        return 0

    written = build_index(rows, target_index_dir, recreate=not append)
    logger.info(
        "whoosh index rebuilt collection={} dir={} documents={}",
        target_collection,
        target_index_dir,
        written,
    )
    return written


def rebuild_all_configured(
    index_dir: str | None = None,
    uri: str | None = None,
    database: str | None = None,
    *,
    append: bool = False,
) -> dict[str, int]:
    """Rebuild BM25 indexes for every configured typed collection."""

    results: dict[str, int] = {}
    for collection_name in settings.milvus_search_collections:
        try:
            results[collection_name] = rebuild(
                collection_name,
                index_dir,
                uri,
                database,
                append=append,
            )
        except RuntimeError as exc:
            logger.warning("skip collection={} reason={}", collection_name, exc)
            results[collection_name] = 0
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Rebuild the Whoosh BM25 index from Milvus.")
    parser.add_argument("--collection", default=None)
    parser.add_argument("--index-dir", default=None)
    parser.add_argument("--milvus-uri", default=settings.milvus_uri)
    parser.add_argument("--milvus-database", default=settings.milvus_database)
    parser.add_argument(
        "--all-configured",
        action="store_true",
        help="Rebuild one Whoosh sub-index per collection derived from RAG_DATA_DIR.",
    )
    parser.add_argument(
        "--append",
        action="store_true",
        help="Update the existing Whoosh index instead of recreating it.",
    )
    args = parser.parse_args()

    if args.all_configured and args.collection:
        parser.error("use either --all-configured or --collection, not both")
    if not args.all_configured and not args.collection:
        parser.error("one of --all-configured or --collection is required")

    if args.all_configured:
        results = rebuild_all_configured(
            args.index_dir,
            args.milvus_uri,
            args.milvus_database,
            append=args.append,
        )
        total = sum(results.values())
        for collection_name, written in results.items():
            index_dir = index_dir_for_collection(
                args.index_dir or settings.whoosh_index_dir,
                collection_name,
            )
            print(
                f"Whoosh index rebuilt: collection={collection_name} "
                f"documents={written} total={count_documents(index_dir)}"
            )
        print(f"Whoosh indexes rebuilt: collections={len(results)} documents={total}")
        return 0

    target_index_dir = index_dir_for_collection(
        args.index_dir or settings.whoosh_index_dir,
        args.collection,
    )
    written = rebuild(
        args.collection,
        args.index_dir,
        args.milvus_uri,
        args.milvus_database,
        append=args.append,
    )
    print(f"Whoosh index rebuilt: collection={args.collection} documents={written} total={count_documents(target_index_dir)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
