"""Write embedded chunk records into Milvus."""

from __future__ import annotations

import json
from collections.abc import Iterable, Iterator
from typing import Any

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

    def recreate_collection(self, dimension: int) -> None:
        """Drop and create the target collection using the detected vector dimension."""

        if dimension <= 0:
            raise ValueError("dimension must be greater than zero.")
        if self.client.has_collection(self.config.collection_name):
            if self.config.drop_existing:
                self.client.drop_collection(self.config.collection_name)
            else:
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
        for batch in _batched(list(records), self.config.batch_size):
            if not batch:
                continue
            rows = [self._record_to_row(record) for record in batch]
            write_method = getattr(self.client, "upsert", None) or self.client.insert
            write_method(collection_name=self.config.collection_name, data=rows)
            total += len(rows)
        if total:
            self.client.flush(collection_name=self.config.collection_name)
        return total

    def count(self) -> int:
        """Return the number of entities in the target collection."""

        stats = self.client.get_collection_stats(self.config.collection_name)
        row_count = stats.get("row_count") or stats.get("row_count", 0)
        return int(row_count)

    def _record_to_row(self, record: VectorRecord) -> dict[str, Any]:
        return {
            self.config.primary_field: record.id,
            "chunk_id": record.chunk_id,
            "text": record.text,
            "source_name": record.source_name or "",
            "source_path": record.source_path or "",
            "source_format": record.source_format or "",
            "page_numbers_json": json.dumps(record.page_numbers, ensure_ascii=False),
            "chunk_type": record.chunk_type or "",
            "quality": record.quality or "",
            "contains_table": record.contains_table,
            "contains_image": record.contains_image,
            "contains_cad": record.contains_cad,
            "metadata_json": record.metadata_json,
            self.config.vector_field: record.vector,
        }

    def _create_client(self) -> Any:
        try:
            from pymilvus import MilvusClient
        except ImportError as exc:
            raise MilvusWriteError("pymilvus is required to write vector records.") from exc
        return MilvusClient(uri=self.config.uri)

    @staticmethod
    def _data_type() -> Any:
        try:
            from pymilvus import DataType
        except ImportError as exc:
            raise MilvusWriteError("pymilvus is required to define Milvus schemas.") from exc
        return DataType


def _batched(items: list[VectorRecord], batch_size: int) -> Iterator[list[VectorRecord]]:
    for start in range(0, len(items), batch_size):
        yield items[start : start + batch_size]


__all__ = ["MilvusVectorWriter", "MilvusWriteError"]
