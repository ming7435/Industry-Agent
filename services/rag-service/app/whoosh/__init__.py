"""Whoosh BM25 package: offline index building plus online lexical retrieval.

``app.whoosh.indexer`` belongs to the offline half (it is called by the ingestion
scripts), ``app.whoosh.retriever`` to the online half (it is resolved by
:mod:`app.api.deps`). Both share :mod:`app.whoosh.schema`.
"""

from .indexer import (
    build_index,
    count_documents,
    delete_documents,
    index_dir_for_collection,
    open_index,
    to_document,
)
from .retriever import BM25Retriever

__all__ = [
    "BM25Retriever",
    "build_index",
    "count_documents",
    "delete_documents",
    "index_dir_for_collection",
    "open_index",
    "to_document",
]
