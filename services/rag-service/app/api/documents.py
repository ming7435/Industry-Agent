"""Small standalone document/chunk store for the RAG HTTP contract.

The store is SQLite-backed so remote Agent memory survives Agent Service
restarts without requiring Milvus/MySQL during local development. Optional
retrieval backends can be layered on top of the same document payload.
"""

from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Any, Mapping


class DocumentStore:
    def __init__(self, path: str | None = None) -> None:
        default = Path(__file__).resolve().parents[2] / "data" / "rag_documents.sqlite3"
        self.path = Path(path or os.getenv("RAG_DOCUMENT_STORE_PATH", str(default)))
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.path), check_same_thread=False)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._lock, self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS rag_documents (
                    document_id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    collection TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS rag_chunks (
                    document_id TEXT NOT NULL,
                    chunk_id TEXT NOT NULL,
                    text TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    PRIMARY KEY (document_id, chunk_id)
                );
                """
            )

    def upsert(self, document_id: str, content: str, metadata: Mapping[str, Any], collection: str, chunks: list[Mapping[str, Any]] | None = None) -> dict[str, Any]:
        document_id = str(document_id or "").strip()
        if not document_id:
            raise ValueError("document_id must not be blank")
        normalized_chunks = list(chunks or [{"chunk_id": f"{document_id}:0", "text": content, "metadata": dict(metadata)}])
        with self._lock, self._connect() as connection:
            connection.execute(
                "INSERT INTO rag_documents(document_id, content, collection, metadata_json) VALUES (?, ?, ?, ?) "
                "ON CONFLICT(document_id) DO UPDATE SET content=excluded.content, collection=excluded.collection, metadata_json=excluded.metadata_json, updated_at=CURRENT_TIMESTAMP",
                (document_id, str(content or ""), str(collection or ""), json.dumps(dict(metadata or {}), ensure_ascii=False, default=str)),
            )
            connection.execute("DELETE FROM rag_chunks WHERE document_id = ?", (document_id,))
            for index, chunk in enumerate(normalized_chunks):
                chunk_id = str(chunk.get("chunk_id") or f"{document_id}:{index}")
                connection.execute(
                    "INSERT INTO rag_chunks(document_id, chunk_id, text, metadata_json) VALUES (?, ?, ?, ?)",
                    (document_id, chunk_id, str(chunk.get("text") or chunk.get("content") or content or ""), json.dumps(dict(chunk.get("metadata") or metadata or {}), ensure_ascii=False, default=str)),
                )
        return self.get(document_id) or {}

    def get(self, document_id: str) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM rag_documents WHERE document_id = ?", (str(document_id),)).fetchone()
            if row is None:
                return None
            chunks = connection.execute("SELECT chunk_id, text, metadata_json FROM rag_chunks WHERE document_id = ? ORDER BY chunk_id", (str(document_id),)).fetchall()
        return {
            "document_id": row["document_id"],
            "content": row["content"],
            "collection": row["collection"],
            "metadata": json.loads(row["metadata_json"] or "{}"),
            "chunks": [{"chunk_id": item["chunk_id"], "text": item["text"], "metadata": json.loads(item["metadata_json"] or "{}")} for item in chunks],
            "updated_at": row["updated_at"],
        }

    def get_chunk(self, document_id: str, chunk_id: str) -> dict[str, Any] | None:
        document = self.get(document_id)
        if not document:
            return None
        return next((dict(chunk, document_id=str(document_id)) for chunk in document["chunks"] if chunk["chunk_id"] == str(chunk_id)), None)

    def search(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None) -> list[dict[str, Any]]:
        terms = [part.lower() for part in str(query or "").split() if part]
        selected_filters = {str(key): value for key, value in (filters or {}).items() if value not in (None, "", [], {})}
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT d.document_id, d.content, d.collection, d.metadata_json, "
                "c.chunk_id, c.text, c.metadata_json AS chunk_metadata "
                "FROM rag_documents d LEFT JOIN rag_chunks c ON c.document_id = d.document_id "
                "ORDER BY d.updated_at DESC, c.chunk_id"
            ).fetchall()
        hits = []
        for row in rows:
            text = str(row["text"] if row["text"] is not None else row["content"] or "")
            document_metadata = json.loads(row["metadata_json"] or "{}")
            chunk_metadata = json.loads(row["chunk_metadata"] or "{}") if row["chunk_metadata"] else {}
            metadata = {**document_metadata, **chunk_metadata, "collection": row["collection"], "document_id": row["document_id"]}
            if not all(_filter_matches(key, expected, metadata, str(row["collection"] or "")) for key, expected in selected_filters.items()):
                continue
            haystack = (text + " " + json.dumps(metadata, ensure_ascii=False)).lower()
            score = sum(1 for term in terms if term in haystack) if terms else 0
            if terms and score == 0:
                continue
            hits.append({
                "chunk_id": str(row["chunk_id"] or f"{row['document_id']}:0"),
                "text": text,
                "score": float(score or 0.1),
                "source": "standalone-document-store",
                "metadata": metadata,
            })
        hits.sort(key=lambda item: (float(item.get("score") or 0), str(item.get("chunk_id") or "")), reverse=True)
        return hits[: max(1, int(limit))]


def _filter_matches(key: str, expected: Any, metadata: Mapping[str, Any], collection: str) -> bool:
    """Apply exact metadata filters while normalizing corpus aliases."""

    actual = metadata.get(key, "")
    if key == "collection":
        actual = collection
    elif key == "corpus":
        actual = metadata.get("corpus") or metadata.get("knowledge_type") or collection
        aliases = {"alarm": "alarms", "case": "cases", "manual": "manuals", "sop": "sop", "bom": "bom"}
        actual = aliases.get(str(actual).lower(), actual)
    if isinstance(expected, (list, tuple, set)):
        return str(actual).casefold() in {str(item).casefold() for item in expected}
    return str(actual).casefold() == str(expected).casefold()


_document_store = DocumentStore()


def get_document_store() -> DocumentStore:
    return _document_store
