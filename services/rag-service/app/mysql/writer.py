"""Transactional MySQL persistence for RAG documents and chunks."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Callable, Iterable
from typing import Any

from app.embedding import VectorRecord, prune_empty
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

    def initialize(self, *, include_cad_metadata: bool = False) -> None:
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
                if include_cad_metadata:
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS cad_drawings (
                            drawing_id CHAR(64) PRIMARY KEY,
                            document_id CHAR(64) NOT NULL,
                            drawing_name VARCHAR(512) NOT NULL,
                            project_id VARCHAR(128) NULL,
                            tenant_id VARCHAR(128) NULL,
                            current_version_id CHAR(64) NULL,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
                            CONSTRAINT fk_cad_drawings_document
                                FOREIGN KEY (document_id) REFERENCES rag_documents(document_id)
                                ON DELETE CASCADE,
                            KEY idx_cad_drawings_project (project_id),
                            KEY idx_cad_drawings_tenant (tenant_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                        """
                    )
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS cad_drawing_versions (
                            version_id CHAR(64) PRIMARY KEY,
                            drawing_id CHAR(64) NOT NULL,
                            document_id CHAR(64) NOT NULL,
                            version_label VARCHAR(128) NOT NULL,
                            source_format VARCHAR(32) NOT NULL,
                            dxf_version VARCHAR(64) NULL,
                            unit_name VARCHAR(64) NULL,
                            coordinate_system VARCHAR(128) NULL,
                            bbox_json JSON NULL,
                            entity_count INT UNSIGNED NOT NULL DEFAULT 0,
                            layer_count INT UNSIGNED NOT NULL DEFAULT 0,
                            metadata_json JSON NOT NULL,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
                            CONSTRAINT fk_cad_versions_drawing
                                FOREIGN KEY (drawing_id) REFERENCES cad_drawings(drawing_id)
                                ON DELETE CASCADE,
                            KEY idx_cad_versions_document (document_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                        """
                    )
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS cad_layers (
                            layer_id VARCHAR(160) PRIMARY KEY,
                            version_id CHAR(64) NOT NULL,
                            layer_name VARCHAR(255) NOT NULL,
                            entity_count INT UNSIGNED NOT NULL DEFAULT 0,
                            metadata_json JSON NOT NULL,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
                            CONSTRAINT fk_cad_layers_version
                                FOREIGN KEY (version_id) REFERENCES cad_drawing_versions(version_id)
                                ON DELETE CASCADE,
                            KEY idx_cad_layers_name (layer_name)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                        """
                    )
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS cad_entities (
                            entity_id VARCHAR(160) PRIMARY KEY,
                            version_id CHAR(64) NOT NULL,
                            drawing_id CHAR(64) NOT NULL,
                            document_id CHAR(64) NOT NULL,
                            dxf_handle VARCHAR(128) NULL,
                            entity_type VARCHAR(64) NOT NULL,
                            layer_name VARCHAR(255) NULL,
                            block_name VARCHAR(255) NULL,
                            space_name VARCHAR(64) NULL,
                            device_id VARCHAR(128) NULL,
                            text_content TEXT NULL,
                            bbox_json JSON NULL,
                            geometry_json JSON NULL,
                            color VARCHAR(64) NULL,
                            linetype VARCHAR(128) NULL,
                            lineweight DOUBLE NULL,
                            raw_json JSON NOT NULL,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
                            CONSTRAINT fk_cad_entities_version
                                FOREIGN KEY (version_id) REFERENCES cad_drawing_versions(version_id)
                                ON DELETE CASCADE,
                            KEY idx_cad_entities_layer_type (layer_name, entity_type),
                            KEY idx_cad_entities_device (device_id),
                            KEY idx_cad_entities_document (document_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                        """
                    )
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS cad_text_annotations (
                            annotation_id VARCHAR(160) PRIMARY KEY,
                            entity_id VARCHAR(160) NOT NULL,
                            version_id CHAR(64) NOT NULL,
                            drawing_id CHAR(64) NOT NULL,
                            document_id CHAR(64) NOT NULL,
                            text_content TEXT NOT NULL,
                            device_id VARCHAR(128) NULL,
                            layer_name VARCHAR(255) NULL,
                            bbox_json JSON NULL,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
                            CONSTRAINT fk_cad_annotations_entity
                                FOREIGN KEY (entity_id) REFERENCES cad_entities(entity_id)
                                ON DELETE CASCADE,
                            KEY idx_cad_annotations_device (device_id),
                            KEY idx_cad_annotations_version (version_id)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                        """
                    )
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS cad_entity_relations (
                            relation_id VARCHAR(160) PRIMARY KEY,
                            version_id CHAR(64) NOT NULL,
                            drawing_id CHAR(64) NOT NULL,
                            document_id CHAR(64) NOT NULL,
                            source_entity_id VARCHAR(160) NOT NULL,
                            target_entity_id VARCHAR(160) NOT NULL,
                            relation_type VARCHAR(64) NOT NULL,
                            evidence_text TEXT NULL,
                            metadata_json JSON NOT NULL,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
                            KEY idx_cad_relations_source (source_entity_id),
                            KEY idx_cad_relations_target (target_entity_id),
                            KEY idx_cad_relations_version_type (version_id, relation_type)
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

    def find_complete_document(self, document_id: str, content_hash: str) -> dict[str, Any] | None:
        """Return stored completion stats when the document content is unchanged."""

        connection = self._get_connection()
        try:
            connection.select_db(self.config.database)
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT chunk_count, vector_count FROM rag_documents
                    WHERE document_id=%s AND content_hash=%s AND status='complete'
                    """,
                    (document_id, content_hash),
                )
                row = cursor.fetchone()
            if not row:
                return None
            return {"chunk_count": int(row[0]), "vector_count": int(row[1])}
        except Exception as exc:
            raise MySQLWriteError(f"Unable to check existing document '{document_id}': {exc}") from exc

    def begin_document(
        self,
        document_id: str,
        *,
        source_name: str,
        source_path: str,
        source_format: str,
        content_hash: str,
        file_size: int,
        storage: dict[str, Any] | None = None,
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
                        file_size=VALUES(file_size),
                        status='processing', error_message=NULL, metadata_json=VALUES(metadata_json)
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

    def replace_cad_document(self, document: StructuredDocument) -> dict[str, int]:
        """Persist structured CAD drawing/version/layer/entity rows for a parsed DXF/DWG."""

        entities = list(document.metadata.get("cad_entities") or [])
        if document.source_format not in {"dxf", "dwg"} and not entities:
            return {
                "drawings": 0,
                "versions": 0,
                "layers": 0,
                "entities": 0,
                "annotations": 0,
                "relations": 0,
            }

        document_id = str(document.metadata["document_id"])
        drawing_id = str(document.metadata.get("drawing_id") or _stable_id("drawing", document_id))
        version_id = str(document.metadata.get("version_id") or _stable_id("version", document_id, document.metadata.get("content_hash")))
        document.metadata["drawing_id"] = drawing_id
        document.metadata["version_id"] = version_id
        layer_counts = dict(document.metadata.get("layer_counts") or {})
        for index, entity in enumerate(entities, start=1):
            entity["entity_id"] = _entity_row_id(version_id, entity, index)
        _sync_cad_block_entity_ids(document)
        connection = self._get_connection()
        try:
            connection.select_db(self.config.database)
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM cad_text_annotations WHERE version_id=%s", (version_id,))
                cursor.execute("DELETE FROM cad_entity_relations WHERE version_id=%s", (version_id,))
                cursor.execute("DELETE FROM cad_entities WHERE version_id=%s", (version_id,))
                cursor.execute("DELETE FROM cad_layers WHERE version_id=%s", (version_id,))
                cursor.execute(
                    """
                    INSERT INTO cad_drawings (
                        drawing_id, document_id, drawing_name, project_id, tenant_id, current_version_id
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        document_id=VALUES(document_id), drawing_name=VALUES(drawing_name),
                        project_id=VALUES(project_id), tenant_id=VALUES(tenant_id),
                        current_version_id=VALUES(current_version_id)
                    """,
                    (
                        drawing_id,
                        document_id,
                        str(document.metadata.get("drawing_name") or document.source_name),
                        document.metadata.get("project_id"),
                        document.metadata.get("tenant_id"),
                        version_id,
                    ),
                )
                cursor.execute(
                    """
                    INSERT INTO cad_drawing_versions (
                        version_id, drawing_id, document_id, version_label, source_format,
                        dxf_version, unit_name, coordinate_system, bbox_json,
                        entity_count, layer_count, metadata_json
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        drawing_id=VALUES(drawing_id), document_id=VALUES(document_id),
                        version_label=VALUES(version_label), source_format=VALUES(source_format),
                        dxf_version=VALUES(dxf_version), unit_name=VALUES(unit_name),
                        coordinate_system=VALUES(coordinate_system), bbox_json=VALUES(bbox_json),
                        entity_count=VALUES(entity_count), layer_count=VALUES(layer_count),
                        metadata_json=VALUES(metadata_json)
                    """,
                    (
                        version_id,
                        drawing_id,
                        document_id,
                        str(document.metadata.get("version_label") or document.metadata.get("content_hash", "")[:12] or "v1"),
                        document.source_format,
                        document.metadata.get("dxf_version"),
                        document.metadata.get("unit_name"),
                        document.metadata.get("coordinate_system"),
                        _json_or_none(document.metadata.get("bbox")),
                        len(entities),
                        len(layer_counts),
                        _json(document.metadata),
                    ),
                )
                for layer_name, entity_count in layer_counts.items():
                    cursor.execute(
                        """
                        INSERT INTO cad_layers (layer_id, version_id, layer_name, entity_count, metadata_json)
                        VALUES (%s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            layer_name=VALUES(layer_name), entity_count=VALUES(entity_count),
                            metadata_json=VALUES(metadata_json)
                        """,
                        (
                            _stable_id("layer", version_id, str(layer_name))[:160],
                            version_id,
                            str(layer_name),
                            int(entity_count),
                            _json({"layer_name": layer_name}),
                        ),
                    )
                relation_rows = _cad_relation_rows(document, entities, version_id, drawing_id, document_id)
                annotation_count = 0
                for row in relation_rows:
                    cursor.execute(
                        """
                        INSERT INTO cad_entity_relations (
                            relation_id, version_id, drawing_id, document_id,
                            source_entity_id, target_entity_id, relation_type,
                            evidence_text, metadata_json
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            relation_type=VALUES(relation_type),
                            evidence_text=VALUES(evidence_text),
                            metadata_json=VALUES(metadata_json)
                        """,
                        row,
                    )
                relation_count = len(relation_rows)
                for index, entity in enumerate(entities, start=1):
                    entity_id = _entity_row_id(version_id, entity, index)
                    cursor.execute(
                        """
                        INSERT INTO cad_entities (
                            entity_id, version_id, drawing_id, document_id, dxf_handle,
                            entity_type, layer_name, block_name, space_name, device_id,
                            text_content, bbox_json, geometry_json, color, linetype,
                            lineweight, raw_json
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE
                            dxf_handle=VALUES(dxf_handle), entity_type=VALUES(entity_type),
                            layer_name=VALUES(layer_name), block_name=VALUES(block_name),
                            space_name=VALUES(space_name), device_id=VALUES(device_id),
                            text_content=VALUES(text_content), bbox_json=VALUES(bbox_json),
                            geometry_json=VALUES(geometry_json), color=VALUES(color),
                            linetype=VALUES(linetype), lineweight=VALUES(lineweight),
                            raw_json=VALUES(raw_json)
                        """,
                        (
                            entity_id,
                            version_id,
                            drawing_id,
                            document_id,
                            entity.get("handle"),
                            entity.get("entity_type") or "UNKNOWN",
                            entity.get("layer_name"),
                            entity.get("block_name"),
                            entity.get("space_name"),
                            entity.get("device_id"),
                            entity.get("text"),
                            _json_or_none(entity.get("bbox")),
                            _json_or_none(entity.get("geometry")),
                            entity.get("color"),
                            entity.get("linetype"),
                            entity.get("lineweight"),
                            _json(entity.get("raw") or entity),
                        ),
                    )
                    if entity.get("text"):
                        annotation_count += 1
                        cursor.execute(
                            """
                            INSERT INTO cad_text_annotations (
                                annotation_id, entity_id, version_id, drawing_id, document_id,
                                text_content, device_id, layer_name, bbox_json
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE
                                text_content=VALUES(text_content), device_id=VALUES(device_id),
                                layer_name=VALUES(layer_name), bbox_json=VALUES(bbox_json)
                            """,
                            (
                                _stable_id("annotation", entity_id)[:160],
                                entity_id,
                                version_id,
                                drawing_id,
                                document_id,
                                entity.get("text"),
                                entity.get("device_id"),
                                entity.get("layer_name"),
                                _json_or_none(entity.get("bbox")),
                            ),
                        )
            connection.commit()
            return {
                "drawings": 1,
                "versions": 1,
                "layers": len(layer_counts),
                "entities": len(entities),
                "annotations": annotation_count,
                "relations": relation_count,
            }
        except Exception as exc:
            connection.rollback()
            raise MySQLWriteError(f"Unable to store CAD metadata for '{document.source_name}': {exc}") from exc

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

    def update_document_metadata(
        self,
        document_id: str,
        *,
        source_name: str,
        source_path: str,
        source_format: str,
        content_hash: str,
        file_size: int,
        storage: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Update processing metadata without resetting the current chunk manifest."""

        connection = self._get_connection()
        try:
            connection.select_db(self.config.database)
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE rag_documents SET
                        source_name=%s, source_path=%s, source_format=%s,
                        content_hash=%s, file_size=%s,
                        metadata_json=%s
                    WHERE document_id=%s
                    """,
                    (
                        source_name,
                        source_path,
                        source_format,
                        content_hash,
                        file_size,
                        _json(metadata or {}),
                        document_id,
                    ),
                )
            connection.commit()
        except Exception as exc:
            connection.rollback()
            raise MySQLWriteError(
                f"Unable to update document metadata '{document_id}': {exc}"
            ) from exc

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
    return json.dumps(
        prune_empty(value),
        ensure_ascii=False,
        separators=(",", ":"),
        default=str,
    )


def _json_or_none(value: Any) -> str | None:
    return _json(value) if value is not None else None


def _stable_id(*parts: Any) -> str:
    text = "|".join(str(part) for part in parts if part is not None)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _entity_row_id(version_id: str, entity: dict[str, Any], index: int) -> str:
    handle = entity.get("handle") or entity.get("entity_id")
    if handle:
        return _stable_id("entity", version_id, handle)[:160]
    return _stable_id("entity", version_id, index, entity.get("entity_type"), entity.get("layer_name"))[:160]


MAX_SPATIAL_NEIGHBORS_PER_ENTITY = 4
MAX_SPATIAL_RELATIONS = 20000
MAX_SPATIAL_ENTITIES = 5000


def _cad_relation_rows(
    document: StructuredDocument,
    entities: list[dict[str, Any]],
    version_id: str,
    drawing_id: str,
    document_id: str,
) -> list[tuple[Any, ...]]:
    """Build every entity relation row for one drawing version."""

    rows: list[tuple[Any, ...]] = []
    rows.extend(_device_relation_rows(entities, version_id, drawing_id, document_id))
    rows.extend(_block_relation_rows(entities, version_id, drawing_id, document_id))
    rows.extend(_layer_relation_rows(entities, version_id, drawing_id, document_id))
    rows.extend(_spatial_relation_rows(entities, version_id, drawing_id, document_id))
    return rows


def _device_relation_rows(
    entities: list[dict[str, Any]],
    version_id: str,
    drawing_id: str,
    document_id: str,
) -> list[tuple[Any, ...]]:
    """Link entities that share the same device identifier."""

    grouped: dict[str, list[dict[str, Any]]] = {}
    for entity in entities:
        device_id = entity.get("device_id")
        if device_id:
            grouped.setdefault(str(device_id), []).append(entity)

    rows: list[tuple[Any, ...]] = []
    for device_id, items in grouped.items():
        if len(items) < 2:
            continue
        ordered = sorted(items, key=lambda entity: str(entity.get("entity_id") or ""))
        for source_index, source_entity in enumerate(ordered):
            for target_entity in ordered[source_index + 1 :]:
                source_id = source_entity.get("entity_id")
                target_id = target_entity.get("entity_id")
                if not source_id or not target_id:
                    continue
                rows.append(
                    (
                        _stable_id("relation", version_id, source_id, target_id, "same_device_id")[:160],
                        version_id,
                        drawing_id,
                        document_id,
                        source_id,
                        target_id,
                        "same_device_id",
                        f"实体 {source_id} 与 {target_id} 共享设备编号 {device_id}。",
                        _json({"device_id": device_id, "derived_from": "text_or_block_label"}),
                    )
                )
    return rows


def _block_relation_rows(
    entities: list[dict[str, Any]],
    version_id: str,
    drawing_id: str,
    document_id: str,
) -> list[tuple[Any, ...]]:
    """Link INSERT references that instantiate the same block definition."""

    grouped: dict[str, list[str]] = {}
    for entity in entities:
        if entity.get("entity_type") != "INSERT":
            continue
        block_name = entity.get("block_name")
        entity_id = entity.get("entity_id")
        if block_name and entity_id:
            grouped.setdefault(str(block_name), []).append(str(entity_id))

    rows: list[tuple[Any, ...]] = []
    for block_name, entity_ids in grouped.items():
        if len(entity_ids) < 2:
            continue
        ordered = sorted(entity_ids)
        for source_index, source_id in enumerate(ordered):
            for target_id in ordered[source_index + 1 :]:
                rows.append(
                    (
                        _stable_id("relation", version_id, source_id, target_id, "same_block_definition")[:160],
                        version_id,
                        drawing_id,
                        document_id,
                        source_id,
                        target_id,
                        "same_block_definition",
                        f"块引用 {source_id} 与 {target_id} 都实例化块定义 {block_name}。",
                        _json({"block_name": block_name, "derived_from": "dxf_insert"}),
                    )
                )
    return rows


def _layer_relation_rows(
    entities: list[dict[str, Any]],
    version_id: str,
    drawing_id: str,
    document_id: str,
) -> list[tuple[Any, ...]]:
    """Link every CAD entity to the layer row it belongs to."""

    rows: list[tuple[Any, ...]] = []
    for entity in entities:
        entity_id = entity.get("entity_id")
        layer_name = entity.get("layer_name")
        if not entity_id or layer_name is None:
            continue
        layer_id = _stable_id("layer", version_id, str(layer_name))[:160]
        rows.append(
            (
                _stable_id("relation", version_id, entity_id, layer_id, "belongs_to_layer")[:160],
                version_id,
                drawing_id,
                document_id,
                entity_id,
                layer_id,
                "belongs_to_layer",
                f"实体 {entity_id} 位于图层 {layer_name}。",
                _json({"layer_name": layer_name, "derived_from": "dxf_layer"}),
            )
        )
    return rows


def _spatial_relation_rows(
    entities: list[dict[str, Any]],
    version_id: str,
    drawing_id: str,
    document_id: str,
) -> list[tuple[Any, ...]]:
    """Link nearby entities using a bounding-box grid so retrieval can reason spatially."""

    boxes: list[tuple[str, float, float, float, float]] = []
    for entity in entities:
        bbox = entity.get("bbox")
        entity_id = entity.get("entity_id")
        if not entity_id or not isinstance(bbox, list) or len(bbox) != 4:
            continue
        try:
            boxes.append((str(entity_id), float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])))
        except (TypeError, ValueError):
            continue
    boxes = boxes[:MAX_SPATIAL_ENTITIES]
    if len(boxes) < 2:
        return []

    min_x = min(box[1] for box in boxes)
    min_y = min(box[2] for box in boxes)
    max_x = max(box[3] for box in boxes)
    max_y = max(box[4] for box in boxes)
    cell_size = max(max_x - min_x, max_y - min_y) / 200.0
    if cell_size <= 0:
        return []

    grid: dict[tuple[int, int], list[int]] = {}
    for index, (_, x1, y1, x2, y2) in enumerate(boxes):
        center_x = (x1 + x2) / 2.0 - min_x
        center_y = (y1 + y2) / 2.0 - min_y
        key = (int(center_x // cell_size), int(center_y // cell_size))
        grid.setdefault(key, []).append(index)

    rows: list[tuple[Any, ...]] = []
    seen: set[tuple[int, int]] = set()
    for index, (entity_id, x1, y1, x2, y2) in enumerate(boxes):
        if len(rows) >= MAX_SPATIAL_RELATIONS:
            break
        center_x = (x1 + x2) / 2.0 - min_x
        center_y = (y1 + y2) / 2.0 - min_y
        cell_x = int(center_x // cell_size)
        cell_y = int(center_y // cell_size)
        candidates: list[int] = []
        for offset_x in (-1, 0, 1):
            for offset_y in (-1, 0, 1):
                candidates.extend(grid.get((cell_x + offset_x, cell_y + offset_y), []))
        added = 0
        for other_index in candidates:
            if other_index == index or added >= MAX_SPATIAL_NEIGHBORS_PER_ENTITY:
                continue
            if len(rows) >= MAX_SPATIAL_RELATIONS:
                break
            pair = (index, other_index) if index < other_index else (other_index, index)
            if pair in seen:
                continue
            seen.add(pair)
            other_id, ox1, oy1, ox2, oy2 = boxes[other_index]
            other_x = (ox1 + ox2) / 2.0 - min_x
            other_y = (oy1 + oy2) / 2.0 - min_y
            distance = ((center_x - other_x) ** 2 + (center_y - other_y) ** 2) ** 0.5
            rows.append(
                (
                    _stable_id("relation", version_id, entity_id, other_id, "spatial_neighbor")[:160],
                    version_id,
                    drawing_id,
                    document_id,
                    entity_id,
                    other_id,
                    "spatial_neighbor",
                    f"实体 {entity_id} 与 {other_id} 在空间上相邻，中心距离约 {distance:.3f}。",
                    _json({"distance": round(distance, 4), "derived_from": "bbox_grid"}),
                )
            )
            added += 1
    return rows


def _sync_cad_block_entity_ids(document: StructuredDocument) -> None:
    entities = list(document.metadata.get("cad_entities") or [])
    by_handle = {str(entity.get("handle")): entity.get("entity_id") for entity in entities if entity.get("handle")}
    for block in document.blocks:
        handle = block.metadata.get("entity_handle")
        if handle and str(handle) in by_handle:
            block.metadata["entity_id"] = by_handle[str(handle)]


def _ensure_columns(cursor: Any, table_name: str, columns: dict[str, str]) -> None:
    for column_name, definition in columns.items():
        cursor.execute(
            """
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s
            """,
            (table_name, column_name),
        )
        row = cursor.fetchone()
        exists = bool(row and int(row[0]))
        if not exists:
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")


__all__ = ["MySQLRagWriter", "MySQLWriteError"]
