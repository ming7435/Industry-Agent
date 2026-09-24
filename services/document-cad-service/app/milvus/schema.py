"""Milvus collection schema helpers for vector records."""

from __future__ import annotations

from dataclasses import dataclass


DEFAULT_COLLECTION_NAME = "industry_rag_alarm_codes"
DEFAULT_VECTOR_FIELD = "vector"
DEFAULT_PRIMARY_FIELD = "id"
DEFAULT_METRIC_TYPE = "COSINE"
DEFAULT_INDEX_TYPE = "AUTOINDEX"


@dataclass(frozen=True)
class MilvusConfig:
    """Milvus connection and collection settings."""

    uri: str = "http://localhost:19530"
    token: str = ""
    database: str = "industry_agent"
    collection_name: str = DEFAULT_COLLECTION_NAME
    vector_field: str = DEFAULT_VECTOR_FIELD
    primary_field: str = DEFAULT_PRIMARY_FIELD
    metric_type: str = DEFAULT_METRIC_TYPE
    index_type: str = DEFAULT_INDEX_TYPE
    batch_size: int = 128
    drop_existing: bool = False

    def __post_init__(self) -> None:
        if not self.uri.strip():
            raise ValueError("uri must not be empty.")
        if not self.database.strip():
            raise ValueError("database must not be empty.")
        if not self.collection_name.strip():
            raise ValueError("collection_name must not be empty.")
        if self.batch_size <= 0:
            raise ValueError("batch_size must be greater than zero.")


__all__ = [
    "DEFAULT_COLLECTION_NAME",
    "DEFAULT_INDEX_TYPE",
    "DEFAULT_METRIC_TYPE",
    "DEFAULT_PRIMARY_FIELD",
    "DEFAULT_VECTOR_FIELD",
    "MilvusConfig",
]
