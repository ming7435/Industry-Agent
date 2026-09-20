"""Write embedded chunk records into Milvus."""

from __future__ import annotations

import json
from collections.abc import Iterable, Iterator, Sequence
from typing import Any

from app.corpus import infer_corpus, infer_device_model
from app.embedding import VectorRecord

from .schema import MilvusConfig


class MilvusWriteError(RuntimeError):
    """Raised when Milvus write operations fail."""


class MilvusVectorWriter:
    """Create a Milvus collection and insert vector records."""

    def __init__(self, config: MilvusConfig | None = None, *, client: Any | None = None) -> None:
        self.config = config or MilvusConfig()
        self.client = client or self._create_client()

    def drop_all_collections(self) -> list[str]:
        """Drop every collection in the connected Milvus instance."""

        dropped: list[str] = []
        for collection_name in list(self.client.list_collections()):
            self.client.drop_collection(collection_name)
            dropped.append(collection_name)
        return dropped

    def drop_collection(self) -> bool:
        """Drop only the configured collection.

        Returns:
            ``True`` when a collection existed and was dropped.
        """

        if not self.client.has_collection(self.config.collection_name):
            return False
        self.client.drop_collection(self.config.collection_name)
        return True

    def has_collection(self) -> bool:
        """Return whether the configured collection exists."""

        return bool(self.client.has_collection(self.config.collection_name))

    def recreate_collection(self, dimension: int) -> None:
        """Drop and create the target collection using the detected vector dimension."""

        if dimension <= 0:
            raise ValueError("dimension must be greater than zero.")
        if self.client.has_collection(self.config.collection_name):
            if self.config.drop_existing:
                self.client.drop_collection(self.config.collection_name)
            else:
                existing_dimension = self._collection_dimension()
                if existing_dimension is not None and existing_dimension != dimension:
                    raise MilvusWriteError(
                        f"Collection '{self.config.collection_name}' already uses "
                        f"dimension {existing_dimension}, but the current embedding "
                        f"model returned dimension {dimension}. Drop or migrate the "
                        "collection before changing embedding models."
                    )
                missing_fields = self._missing_required_fields()
                if missing_fields:
                    raise MilvusWriteError(
                        f"Collection '{self.config.collection_name}' is missing fields "
                        f"required by the current schema: {', '.join(missing_fields)}. "
                        "Drop or migrate the collection before writing CAD-aware records."
                    )
                return

        schema = self.client.create_schema(auto_id=False, enable_dynamic_field=False)
        schema.add_field(
            field_name=self.config.primary_field,
            datatype=self._data_type().VARCHAR,
            is_primary=True,
            max_length=256,
        )
        schema.add_field(field_name="chunk_id", datatype=self._data_type().VARCHAR, max_length=256)
        schema.add_field(field_name="text", datatype=self._data_type().VARCHAR, max_length=65535)
        schema.add_field(field_name="source_name", datatype=self._data_type().VARCHAR, max_length=512)
        schema.add_field(field_name="source_path", datatype=self._data_type().VARCHAR, max_length=2048)
        schema.add_field(field_name="source_format", datatype=self._data_type().VARCHAR, max_length=32)
        schema.add_field(field_name="corpus", datatype=self._data_type().VARCHAR, max_length=64)
        schema.add_field(field_name="device_model", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="error_code", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="drawing_id", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="version_id", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="entity_id", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="project_id", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="layer_name", datatype=self._data_type().VARCHAR, max_length=255)
        schema.add_field(field_name="device_id", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="tenant_id", datatype=self._data_type().VARCHAR, max_length=128)
        schema.add_field(field_name="page_numbers_json", datatype=self._data_type().VARCHAR, max_length=2048)
        schema.add_field(field_name="chunk_type", datatype=self._data_type().VARCHAR, max_length=64)
        schema.add_field(field_name="quality", datatype=self._data_type().VARCHAR, max_length=32)
        schema.add_field(field_name="contains_table", datatype=self._data_type().BOOL)
        schema.add_field(field_name="contains_image", datatype=self._data_type().BOOL)
        schema.add_field(field_name="contains_cad", datatype=self._data_type().BOOL)
        schema.add_field(field_name="metadata_json", datatype=self._data_type().VARCHAR, max_length=65535)
        schema.add_field(
            field_name=self.config.vector_field,
            datatype=self._data_type().FLOAT_VECTOR,
            dim=dimension,
        )

        index_params = self.client.prepare_index_params()
        index_params.add_index(
            field_name=self.config.vector_field,
            index_type=self.config.index_type,
            metric_type=self.config.metric_type,
        )
        self.client.create_collection(
            collection_name=self.config.collection_name,
            schema=schema,
            index_params=index_params,
        )

    def insert_records(self, records: Iterable[VectorRecord]) -> int:
        """Upsert vector records in batches and return the processed count.

        Milvus deployments that expose ``upsert`` get idempotent writes. Older
        clients without that method fall back to ``insert`` for compatibility.
        """

        total = 0
        batch: list[VectorRecord] = []
        for record in records:
            batch.append(record)
            if len(batch) < self.config.batch_size:
                continue
            total += self._write_batch(batch)
            batch = []
        if batch:
            total += self._write_batch(batch)
        if total:
            self.client.flush(collection_name=self.config.collection_name)
        return total

    def delete_records(self, record_ids: Iterable[str]) -> int:
        """Delete stale chunk IDs left by a previous ingestion run."""

        ids = [str(record_id) for record_id in record_ids if str(record_id)]
        if not ids:
            return 0
        delete_method = getattr(self.client, "delete", None)
        if delete_method is None:
            raise MilvusWriteError(
                "This Milvus client does not support delete; stale vectors cannot be removed."
            )
        deleted = 0
        for batch in _batched(ids, self.config.batch_size):
            delete_method(collection_name=self.config.collection_name, ids=batch)
            deleted += len(batch)
        return deleted

    def count(self) -> int:
        """Return the number of entities in the target collection."""

        stats = self.client.get_collection_stats(self.config.collection_name)
        row_count = stats.get("row_count") or stats.get("row_count", 0)
        return int(row_count)

    def _record_to_row(self, record: VectorRecord) -> dict[str, Any]:
        corpus = str(record.metadata.get("corpus") or infer_corpus(
            source_name=record.source_name,
            source_path=record.source_path,
            metadata=record.metadata,
        ))
        device_model = str(
            record.metadata.get("device_model")
            or infer_device_model(record.source_name, record.source_path)
            or ""
        )
        error_code = str(record.metadata.get("error_code") or record.metadata.get("alarm_code") or "")
        return {
            self.config.primary_field: record.id,
            "chunk_id": record.chunk_id,
            "text": record.text,
            "source_name": record.source_name or "",
            "source_path": record.source_path or "",
            "source_format": record.source_format or "",
            "corpus": corpus,
            "device_model": device_model,
            "error_code": error_code,
            "drawing_id": record.drawing_id or "",
            "version_id": record.version_id or "",
            "entity_id": record.entity_id or "",
            "project_id": record.project_id or "",
            "layer_name": record.layer_name or "",
            "device_id": record.device_id or "",
            "tenant_id": record.tenant_id or "",
            "page_numbers_json": json.dumps(record.page_numbers, ensure_ascii=False),
            "chunk_type": record.chunk_type or "",
            "quality": record.quality or "",
            "contains_table": record.contains_table,
            "contains_image": record.contains_image,
            "contains_cad": record.contains_cad,
            "metadata_json": record.metadata_json,
            self.config.vector_field: record.vector,
        }

    def _write_batch(self, batch: list[VectorRecord]) -> int:
        rows = [self._record_to_row(record) for record in batch]
        write_method = getattr(self.client, "upsert", None) or self.client.insert
        write_method(collection_name=self.config.collection_name, data=rows)
        return len(rows)

    def _collection_dimension(self) -> int | None:
        """Read an existing vector dimension when the client exposes schema details."""

        fields = self._collection_fields()
        for field in fields or []:
            name = field.get("name") if isinstance(field, dict) else getattr(field, "name", None)
            if name != self.config.vector_field:
                continue
            params = field.get("params", {}) if isinstance(field, dict) else getattr(field, "params", {})
            dimension = params.get("dim") if isinstance(params, dict) else getattr(params, "dim", None)
            if dimension is None and isinstance(field, dict):
                dimension = field.get("dim")
            try:
                return int(dimension) if dimension is not None else None
            except (TypeError, ValueError):
                return None
        return None

    def _missing_required_fields(self) -> list[str]:
        names = {
            field.get("name") if isinstance(field, dict) else getattr(field, "name", None)
            for field in self._collection_fields()
        }
        required = {
            self.config.primary_field,
            "chunk_id",
            "text",
            "source_name",
            "source_path",
            "source_format",
            "corpus",
            "device_model",
            "error_code",
            "drawing_id",
            "version_id",
            "entity_id",
            "project_id",
            "layer_name",
            "device_id",
            "tenant_id",
            "page_numbers_json",
            "chunk_type",
            "quality",
            "contains_table",
            "contains_image",
            "contains_cad",
            "metadata_json",
            self.config.vector_field,
        }
        return sorted(field for field in required if field not in names)

    def _collection_fields(self) -> list[Any]:
        describe = getattr(self.client, "describe_collection", None)
        if describe is None:
            return []
        try:
            description = describe(collection_name=self.config.collection_name)
        except (AttributeError, TypeError, RuntimeError, ValueError):
            return []
        fields = description.get("fields", []) if isinstance(description, dict) else getattr(description, "fields", [])
        return list(fields or [])

    def _create_client(self) -> Any:
        try:
            from pymilvus import MilvusClient
        except ImportError as exc:
            raise MilvusWriteError("pymilvus is required to write vector records.") from exc
        return MilvusClient(uri=self.config.uri, db_name=self.config.database)

    @staticmethod
    def _data_type() -> Any:
        try:
            from pymilvus import DataType
        except ImportError as exc:
            raise MilvusWriteError("pymilvus is required to define Milvus schemas.") from exc
        return DataType


def _batched(items: Sequence[str], batch_size: int) -> Iterator[list[str]]:
    for start in range(0, len(items), batch_size):
        yield list(items[start : start + batch_size])


__all__ = ["MilvusVectorWriter", "MilvusWriteError"]
