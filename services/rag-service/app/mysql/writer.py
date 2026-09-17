"""Transactional MySQL persistence for RAG documents and chunks."""

from __future__ import annotations

import json
from collections.abc import Callable, Iterable
from typing import Any

from app.embedding import VectorRecord
from app.ingestion import StructuredDocument

from .schema import MySQLConfig


class MySQLWriteError(RuntimeError):
    """Raised when RAG metadata cannot be persisted in MySQL."""


class MySQLRagWriter:
    """Store source documents and chunk payloads using idempotent upserts."""

    def __init__(
        self,
        config: MySQLConfig | None = None,
        *,
        connection: Any | None = None,
        connection_factory: Callable[..., Any] | None = None,
    ) -> None:
        self.config = config or MySQLConfig.from_env()
        self._connection = connection
        self._connection_factory = connection_factory

    def initialize(self) -> None:
        connection = self._get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"CREATE DATABASE IF NOT EXISTS `{self.config.database}` "
                    f"CHARACTER SET {self.config.charset} COLLATE utf8mb4_unicode_ci"
                )
                connection.select_db(self.config.database)
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS rag_documents (
                        document_id CHAR(64) PRIMARY KEY,
                        source_name VARCHAR(512) NOT NULL,
                        source_path VARCHAR(2048) NOT NULL,
                        source_format VARCHAR(32) NOT NULL,
                        content_hash CHAR(64) NOT NULL,
                        file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
                        status VARCHAR(32) NOT NULL,
                        chunk_count INT UNSIGNED NOT NULL DEFAULT 0,
                        vector_count INT UNSIGNED NOT NULL DEFAULT 0,
                        error_message TEXT NULL,
                        metadata_json JSON NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
                        KEY idx_rag_documents_status (status),
                        KEY idx_rag_documents_content_hash (content_hash)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS rag_chunks (
                        chunk_id VARCHAR(128) PRIMARY KEY,
                        document_id CHAR(64) NOT NULL,
                        chunk_text MEDIUMTEXT NOT NULL,
                        content_hash CHAR(64) NOT NULL,
                        milvus_collection VARCHAR(255) NOT NULL,
                        page_numbers_json JSON NOT NULL,
                        chunk_type VARCHAR(64) NULL,
                        quality VARCHAR(32) NULL,
                        contains_table BOOLEAN NOT NULL DEFAULT FALSE,
                        contains_image BOOLEAN NOT NULL DEFAULT FALSE,
                        contains_cad BOOLEAN NOT NULL DEFAULT FALSE,
                        metadata_json JSON NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
                        CONSTRAINT fk_rag_chunks_document
                            FOREIGN KEY (document_id) REFERENCES rag_documents(document_id)
                            ON DELETE CASCADE,
                        KEY idx_rag_chunks_document (document_id),
                        KEY idx_rag_chunks_type_quality (chunk_type, quality)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                    """
                )
            connection.commit()
        except Exception as exc:
            connection.rollback()
            raise MySQLWriteError(f"Unable to initialize MySQL RAG schema: {exc}") from exc

    def begin_document(
        self,
        document_id: str,
        *,
        source_name: str,
        source_path: str,
        source_format: str,
        content_hash: str,
        file_size: int,
        metadata: dict[str, Any] | None = None,
    ) -> set[str]:
        """Mark a document as processing and return its previously stored chunk IDs."""

        connection = self._get_connection()
        try:
            connection.select_db(self.config.database)
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT chunk_id FROM rag_chunks WHERE document_id=%s",
                    (document_id,),
                )
                previous = {str(row[0]) for row in cursor.fetchall()}
                cursor.execute(
                    """
                    INSERT INTO rag_documents (
                        document_id, source_name, source_path, source_format,
                        content_hash, file_size, status, metadata_json
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'processing', %s)
                    ON DUPLICATE KEY UPDATE
                        source_name=VALUES(source_name), source_path=VALUES(source_path),
                        source_format=VALUES(source_format), content_hash=VALUES(content_hash),
                        file_size=VALUES(file_size), status='processing',
                        error_message=NULL, metadata_json=VALUES(metadata_json)
                    """,
                    (
                        document_id,
                        source_name,
                        source_path,
                        source_format,
                        content_hash,
                        file_size,
                        _json(metadata or {}),
                    ),
                )
            connection.commit()
            return previous
        except Exception as exc:
            connection.rollback()
            raise MySQLWriteError(f"Unable to begin document '{source_name}': {exc}") from exc

    def replace_chunks(
        self,
        document_id: str,
        records: Iterable[VectorRecord],
        *,
        collection_name: str,
    ) -> set[str]:
        """Upsert current chunks and remove stale rows in one transaction."""

        items = list(records)
        current_ids = {record.chunk_id for record in items}
        connection = self._get_connection()
        try:
            connection.select_db(self.config.database)
            with connection.cursor() as cursor:
                for record in items:
                    cursor.execute(
                        """
                        INSERT INTO rag_chunks (
                            chunk_id, document_id, chunk_text, content_hash,
                            milvus_collection, page_numbers_json, chunk_type, quality,
                            contains_table, contains_image, contains_cad, metadata_json
                        ) VALUES (%s, %s, %s, SHA2(%s, 256), %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            document_id=VALUES(document_id), chunk_text=VALUES(chunk_text),
                            content_hash=VALUES(content_hash),
                            milvus_collection=VALUES(milvus_collection),
                            page_numbers_json=VALUES(page_numbers_json),
                            chunk_type=VALUES(chunk_type), quality=VALUES(quality),
                            contains_table=VALUES(contains_table),
                            contains_image=VALUES(contains_image),
                            contains_cad=VALUES(contains_cad),
                            metadata_json=VALUES(metadata_json)
                        """,
                        (
                            record.chunk_id,
                            document_id,
                            record.text,
                            record.text,
                            collection_name,
                            _json(record.page_numbers),
                            record.chunk_type,
                            record.quality,
                            record.contains_table,
                            record.contains_image,
                            record.contains_cad,
                            record.metadata_json,
                        ),
                    )
                if current_ids:
                    placeholders = ", ".join(["%s"] * len(current_ids))
                    cursor.execute(
                        f"DELETE FROM rag_chunks WHERE document_id=%s "
                        f"AND chunk_id NOT IN ({placeholders})",
                        (document_id, *sorted(current_ids)),
                    )
                else:
                    cursor.execute("DELETE FROM rag_chunks WHERE document_id=%s", (document_id,))
            connection.commit()
            return current_ids
        except Exception as exc:
            connection.rollback()
            raise MySQLWriteError(f"Unable to store chunks for '{document_id}': {exc}") from exc

    def mark_complete(self, document_id: str, *, chunk_count: int, vector_count: int) -> None:
        self._set_status(
            document_id,
            "complete",
            chunk_count=chunk_count,
            vector_count=vector_count,
            error_message=None,
        )

    def mark_failed(self, document_id: str, error: str) -> None:
        self._set_status(document_id, "failed", error_message=error[:65535])

    def close(self) -> None:
        if self._connection is not None:
            self._connection.close()
            self._connection = None

    def _set_status(
        self,
        document_id: str,
        status: str,
        *,
        chunk_count: int | None = None,
        vector_count: int | None = None,
        error_message: str | None = None,
    ) -> None:
        connection = self._get_connection()
        assignments = ["status=%s", "error_message=%s"]
        values: list[Any] = [status, error_message]
        if chunk_count is not None:
            assignments.append("chunk_count=%s")
            values.append(chunk_count)
        if vector_count is not None:
            assignments.append("vector_count=%s")
            values.append(vector_count)
        values.append(document_id)
        try:
            connection.select_db(self.config.database)
            with connection.cursor() as cursor:
                cursor.execute(
                    f"UPDATE rag_documents SET {', '.join(assignments)} WHERE document_id=%s",
                    tuple(values),
                )
            connection.commit()
        except Exception as exc:
            connection.rollback()
            raise MySQLWriteError(f"Unable to set document status: {exc}") from exc

    def _get_connection(self) -> Any:
        if self._connection is not None:
            return self._connection
        factory = self._connection_factory
        if factory is None:
            try:
                import pymysql
            except ImportError as exc:
                raise MySQLWriteError(
                    "MySQL persistence requires PyMySQL. Install it with 'pip install pymysql'."
                ) from exc
            factory = pymysql.connect
        try:
            self._connection = factory(
                host=self.config.host,
                port=self.config.port,
                user=self.config.user,
                password=self.config.password,
                charset=self.config.charset,
                connect_timeout=self.config.connect_timeout,
                autocommit=False,
            )
        except Exception as exc:
            raise MySQLWriteError(f"Unable to connect to MySQL: {exc}") from exc
        return self._connection


def _json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str)


__all__ = ["MySQLRagWriter", "MySQLWriteError"]
