"""Whoosh index schema shared by the offline writer and the online BM25 route.

One schema, two users:

* :mod:`app.whoosh.indexer` writes it after (or during) ingestion;
* :mod:`app.whoosh.retriever` reads it for the lexical leg of the online chain.

The analyser is chosen once here so both halves tokenise identically -- an index
built with one analyser and queried with another returns nothing. Chinese text is
the common case in this corpus, so jieba-based :class:`ChineseAnalyzer` is used
when available and a dependency-free CJK unigram analyser otherwise.
"""

from __future__ import annotations

from typing import Any

FIELD_CHUNK_ID = "chunk_id"
FIELD_TEXT = "text"
FIELD_CORPUS = "corpus"
FIELD_SOURCE_NAME = "source_name"
FIELD_DEVICE_MODEL = "device_model"
FIELD_ERROR_CODE = "error_code"
FIELD_METADATA = "metadata_json"

TEXT_FIELDS: tuple[str, ...] = (FIELD_TEXT,)
"""Fields searched by the BM25 query parser."""

FILTER_FIELDS: tuple[str, ...] = (
    FIELD_CORPUS,
    FIELD_DEVICE_MODEL,
    FIELD_ERROR_CODE,
    FIELD_SOURCE_NAME,
)
"""Fields a request filter can be pushed down to as a Whoosh ``Term``."""

_CJK_TOKEN_PATTERN = r"[\u4e00-\u9fff]|[A-Za-z0-9_]+"


def cjk_analyzer() -> Any:
    """Return a dependency-free analyser that still splits Chinese text.

    Returns:
        A Whoosh analyser tokenising CJK characters individually and ASCII words
        as a whole, lower-cased.
    """
    from whoosh.analysis import LowercaseFilter, RegexTokenizer

    return RegexTokenizer(_CJK_TOKEN_PATTERN) | LowercaseFilter()


def build_analyzer() -> Any:
    """Return the analyser used to write and to query the index.

    Returns:
        :class:`whoosh.analysis.ChineseAnalyzer` when jieba is installed,
        otherwise :func:`cjk_analyzer`.
    """
    try:
        from whoosh.analysis import ChineseAnalyzer
    except (ImportError, ModuleNotFoundError):
        return cjk_analyzer()

    try:
        return ChineseAnalyzer()
    except Exception:  # noqa: BLE001 - jieba present but unusable
        return cjk_analyzer()


def build_schema() -> Schema:
    """Return the Whoosh schema of the BM25 index.

    Returns:
        The schema with ``chunk_id`` as unique key, the analysed ``text`` field,
        the filterable metadata columns and the stored ``metadata_json`` blob.
    """
    from whoosh.fields import ID, STORED, TEXT, Schema

    analyzer = build_analyzer()
    return Schema(
        chunk_id=ID(stored=True, unique=True),
        text=TEXT(analyzer=analyzer, stored=True),
        corpus=ID(stored=True),
        source_name=ID(stored=True),
        device_model=ID(stored=True),
        error_code=ID(stored=True),
        metadata_json=STORED,
    )


__all__ = [
    "FILTER_FIELDS",
    "TEXT_FIELDS",
    "build_analyzer",
    "build_schema",
    "cjk_analyzer",
]
