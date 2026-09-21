"""Whoosh BM25 包：离线索引构建和在线词法检索。

``app.whoosh.indexer`` 属于离线部分（由入库脚本调用），``app.whoosh.retriever`` 属于在线部分（由 :mod:`app.api.deps` 解析）。二者共享 :mod:`app.whoosh.schema`。
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
