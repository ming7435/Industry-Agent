"""Rebuild the Whoosh BM25 index from the Milvus collection.

Use this when the lexical route is empty or stale but the vectors are already in
Milvus -- for example after ingesting with ``--no-whoosh``, or after re-building
the collection on another machine. Reading from Milvus keeps both stores in sync
without re-parsing the manuals.

Usage::

    python scripts/build_whoosh_index.py
    python scripts/build_whoosh_index.py --collection industry_rag_chunks
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

from app.whoosh import build_index, count_documents

from config.settings import settings

OUTPUT_FIELDS: tuple[str, ...] = (
    "chunk_id",
    "text",
    "source_name",
    "source_path",
    "source_format",
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
) -> int:
    """Rebuild the BM25 index from Milvus.

    Args:
        collection_name: Source collection; defaults to
            ``settings.milvus_collection``.
        index_dir: Target index directory; defaults to
            ``settings.whoosh_index_dir``.
        uri: Milvus URI; defaults to ``settings.milvus_uri``.

    Returns:
        The number of indexed documents.
    """
    target_collection = collection_name or settings.milvus_collection
    rows = iter_collection_rows(target_collection, uri, database)
    if not rows:
        logger.warning("collection={} is empty, nothing to index", target_collection)
        return 0

    written = build_index(rows, index_dir, recreate=True)
    logger.info(
        "whoosh index rebuilt dir={} documents={}",
        index_dir or settings.whoosh_index_dir,
        written,
    )
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Rebuild the Whoosh BM25 index from Milvus.")
    parser.add_argument("--collection", default=settings.milvus_collection)
    parser.add_argument("--index-dir", default=settings.whoosh_index_dir)
    parser.add_argument("--milvus-uri", default=settings.milvus_uri)
    parser.add_argument("--milvus-database", default=settings.milvus_database)
    args = parser.parse_args()

    written = rebuild(args.collection, args.index_dir, args.milvus_uri, args.milvus_database)
    print(f"Whoosh index rebuilt: documents={written} total={count_documents(args.index_dir)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
