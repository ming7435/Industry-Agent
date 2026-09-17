"""Offline builder of the Whoosh BM25 index.

The lexical leg of the online chain cannot work without an index, so this module
is the missing offline counterpart of :mod:`app.whoosh.retriever`. It accepts two
kinds of input:

* :class:`~app.embedding.models.VectorRecord` -- reuse them during ingestion,
  when the chunks are already embedded and about to be written to Milvus;
* plain mappings with the same keys -- reuse the rows already stored in Milvus
  when the BM25 index has to be rebuilt without re-parsing the manuals.

Both paths end in the same document layout, so a rebuild is indistinguishable
from a fresh build.
"""

from __future__ import annotations

import json
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from loguru import logger

from app.corpus import infer_corpus, infer_device_model

from config.settings import settings

from .schema import (
    FIELD_CHUNK_ID,
    FIELD_CORPUS,
    FIELD_DEVICE_MODEL,
    FIELD_ERROR_CODE,
    FIELD_METADATA,
    FIELD_SOURCE_NAME,
    FIELD_TEXT,
    build_schema,
)


def _metadata_json(record: Any) -> str:
    """Return the metadata of a record as a JSON string.

    Args:
        record: A ``VectorRecord`` or a mapping.

    Returns:
        The JSON payload stored alongside the indexed text.
    """
    if isinstance(record, dict):
        metadata = record.get("metadata")
        if isinstance(metadata, str):
            return metadata
        if isinstance(metadata, dict):
            return json.dumps(metadata, ensure_ascii=False)
        return json.dumps(
            {key: value for key, value in record.items() if key not in {"text", "vector"}},
            ensure_ascii=False,
            default=str,
        )
    return getattr(record, "metadata_json", "{}")


def _value(record: Any, name: str, default: str = "") -> str:
    """Read a scalar field from a record or a mapping.

    Args:
        record: A ``VectorRecord`` or a mapping.
        name: Field name.
        default: Value returned when the field is missing or empty.

    Returns:
        The string form of the field value.
    """
    raw = record.get(name) if isinstance(record, dict) else getattr(record, name, None)
    if raw is None:
        return default
    text = str(raw).strip()
    return text or default


def _parsed_metadata(record: Any) -> dict[str, Any]:
    """Return the metadata mapping a record carries.

    Args:
        record: A ``VectorRecord`` or a mapping.

    Returns:
        The metadata mapping, empty when the record carries none.
    """
    if isinstance(record, dict):
        metadata = record.get("metadata")
        if isinstance(metadata, dict):
            return dict(metadata)
        if isinstance(metadata, str):
            try:
                decoded = json.loads(metadata)
            except (TypeError, ValueError):
                return {}
            return decoded if isinstance(decoded, dict) else {}
        return {}
    metadata = getattr(record, "metadata", None)
    return dict(metadata) if isinstance(metadata, dict) else {}


def to_document(record: Any) -> dict[str, Any]:
    """Convert a chunk record into a Whoosh document.

    The corpus label is derived here (see :func:`app.corpus.infer_corpus`) from
    the ``source_name`` / ``source_path`` / metadata the offline pipeline
    already writes, so the BM25 index can be filtered by corpus even though the
    Milvus schema has no such column.

    Args:
        record: A ``VectorRecord`` or a mapping with the same keys.

    Returns:
        The document accepted by ``whoosh.writing.IndexWriter``.
    """
    metadata = _parsed_metadata(record)
    source_name = _value(record, "source_name")

    return {
        FIELD_CHUNK_ID: _value(record, "chunk_id") or _value(record, "id"),
        FIELD_TEXT: _value(record, "text"),
        FIELD_CORPUS: infer_corpus(
            source_name=source_name,
            source_path=_value(record, "source_path"),
            metadata=metadata,
        ),
        FIELD_SOURCE_NAME: source_name,
        FIELD_DEVICE_MODEL: _value(record, "device_model")
        or metadata.get("device_model")
        or infer_device_model(source_name),
        FIELD_ERROR_CODE: _value(record, "error_code") or metadata.get("error_code") or "",
        FIELD_METADATA: _metadata_json(record),
    }


def open_index(index_dir: str | Path | None = None, *, recreate: bool = False) -> Any:
    """Open (and optionally reset) the Whoosh index.

    Args:
        index_dir: Directory of the index; defaults to
            ``settings.whoosh_index_dir``.
        recreate: When ``True`` the directory is re-created from scratch.

    Returns:
        The opened ``whoosh.index.FileIndex``.

    Raises:
        RuntimeError: If ``whoosh`` is not installed.
    """
    try:
        from whoosh import index as whoosh_index
    except (ImportError, ModuleNotFoundError) as exc:
        raise RuntimeError("whoosh is not installed") from exc

    directory = Path(index_dir or settings.whoosh_index_dir)
    directory.parent.mkdir(parents=True, exist_ok=True)

    if recreate or not whoosh_index.exists_in(str(directory)):
        directory.mkdir(parents=True, exist_ok=True)
        return whoosh_index.create_in(str(directory), build_schema())

    return whoosh_index.open_dir(str(directory))


def build_index(
    records: Iterable[Any],
    index_dir: str | Path | None = None,
    *,
    recreate: bool = True,
) -> int:
    """Write chunk records into the Whoosh index.

    Args:
        records: Chunk records (``VectorRecord`` or mappings).
        index_dir: Directory of the index; defaults to
            ``settings.whoosh_index_dir``.
        recreate: Whether the index is rebuilt from scratch (default) or updated
            in place with ``update_document``.

    Returns:
        The number of indexed documents.
    """
    ix = open_index(index_dir, recreate=recreate)

    written = 0
    with ix.writer(limitmb=512) as writer:
        for record in records:
            document = to_document(record)
            if not document[FIELD_CHUNK_ID] or not document[FIELD_TEXT]:
                continue
            if recreate:
                writer.add_document(**document)
            else:
                writer.update_document(**document)
            written += 1

    logger.info(
        "whoosh index written dir={} documents={} recreate={}",
        index_dir or settings.whoosh_index_dir,
        written,
        recreate,
    )
    return written


def count_documents(index_dir: str | Path | None = None) -> int:
    """Return the number of documents in the index.

    Args:
        index_dir: Directory of the index; defaults to
            ``settings.whoosh_index_dir``.

    Returns:
        The document count, or ``0`` when the index does not exist yet.
    """
    try:
        from whoosh import index as whoosh_index
    except (ImportError, ModuleNotFoundError):
        return 0

    directory = Path(index_dir or settings.whoosh_index_dir)
    if not whoosh_index.exists_in(str(directory)):
        return 0

    ix = whoosh_index.open_dir(str(directory))
    with ix.searcher() as searcher:
        return int(searcher.doc_count())


__all__ = ["build_index", "count_documents", "open_index", "to_document"]
