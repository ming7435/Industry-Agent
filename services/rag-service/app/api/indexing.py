"""Unified online indexing for closed-work-order experiences.

The standalone SQLite document store is the durable HTTP contract, but it is
not a replacement for the production retrieval chain.  This module fans one
experience chunk out to the same Whoosh and Milvus writers used by offline
ingestion.  The route reports every backend independently so a partial write
can be retried without pretending that dense/BM25 coverage is complete.
"""

from __future__ import annotations

import os
from typing import Any, Callable, Iterable, Mapping

from app.embedding import VectorRecord
from app.embedding.model import get_embedder
from app.milvus.schema import MilvusConfig
from app.milvus.writer import MilvusVectorWriter
from app.whoosh.indexer import build_index, index_dir_for_collection
from config.settings import settings

from .models import DocumentUpsertRequest


def _enabled(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _chunks(request: DocumentUpsertRequest) -> list[dict[str, Any]]:
    values = list(request.chunks or [])
    if not values:
        values = [{"chunk_id": f"{request.document_id}:0", "text": request.content}]
    normalized: list[dict[str, Any]] = []
    for index, raw in enumerate(values):
        item = dict(raw or {})
        item["chunk_id"] = str(item.get("chunk_id") or f"{request.document_id}:{index}")
        item["text"] = str(item.get("text") or item.get("content") or request.content or "")
        item["metadata"] = {
            **dict(request.metadata or {}),
            **dict(item.get("metadata") or {}),
            "document_id": request.document_id,
            "collection": request.collection,
        }
        normalized.append(item)
    return normalized


class UnifiedExperienceIndexer:
    """Write one document to BM25 and dense indexes with explicit status."""

    def __init__(
        self,
        *,
        whoosh_writer: Callable[[Iterable[Mapping[str, Any]], str], int] | None = None,
        embedder_factory: Callable[[], Any | None] | None = None,
        milvus_writer_factory: Callable[[str], Any] | None = None,
        enable_whoosh: bool | None = None,
        enable_milvus: bool | None = None,
    ) -> None:
        # Injected factories make the contract testable without weakening the
        # production path, which uses the same writers as offline ingestion.
        self.whoosh_writer = whoosh_writer or self._write_whoosh
        self.embedder_factory = embedder_factory or get_embedder
        self.milvus_writer_factory = milvus_writer_factory or self._build_milvus_writer
        self.enable_whoosh = (
            _enabled("RAG_UPSERT_WHOOSH_ENABLED", default=False)
            if enable_whoosh is None
            else bool(enable_whoosh)
        )
        self.enable_milvus = (
            _enabled("RAG_UPSERT_MILVUS_ENABLED", default=os.getenv("APP_ENV", "development").lower() in {"prod", "production"})
            if enable_milvus is None
            else bool(enable_milvus)
        )
        # An injected backend is an explicit request to exercise that leg.
        if whoosh_writer is not None and enable_whoosh is None:
            self.enable_whoosh = True
        if milvus_writer_factory is not None and enable_milvus is None:
            self.enable_milvus = True

    def upsert(self, request: DocumentUpsertRequest) -> dict[str, Any]:
        chunks = _chunks(request)
        records = [
            {
                "id": item["chunk_id"],
                "chunk_id": item["chunk_id"],
                "text": item["text"],
                "source_name": str(request.metadata.get("source_name") or request.document_id),
                "source_path": str(request.metadata.get("source_path") or ""),
                "source_format": str(request.metadata.get("source_format") or "experience"),
                "metadata": dict(item["metadata"]),
            }
            for item in chunks
        ]
        backends: dict[str, dict[str, Any]] = {}
        if self.enable_whoosh:
            try:
                if _enabled("RAG_TEST_FAIL_WHOOSH"):
                    raise RuntimeError("whoosh test failure")
                written = self.whoosh_writer(records, request.collection)
                backends["whoosh"] = {"success": written == len(records), "required": True, "written": written}
                if written != len(records):
                    backends["whoosh"]["error"] = "whoosh wrote an incomplete chunk set"
            except Exception as error:  # noqa: BLE001 - surfaced in response
                backends["whoosh"] = {"success": False, "required": True, "error": str(error)}
        else:
            backends["whoosh"] = {"success": True, "required": False, "skipped": True, "reason": "RAG_UPSERT_WHOOSH_ENABLED is false"}

        if self.enable_milvus:
            try:
                embedder = self.embedder_factory()
                if embedder is None:
                    raise RuntimeError("embedding provider is unavailable")
                vectors = list(embedder.embed_texts([item["text"] for item in records]))
                if len(vectors) != len(records):
                    raise RuntimeError("embedding provider returned an incomplete vector set")
                vector_records = [
                    VectorRecord(
                        id=item["id"],
                        chunk_id=item["chunk_id"],
                        text=item["text"],
                        vector=list(vector),
                        source_name=item["source_name"],
                        source_path=item["source_path"],
                        source_format=item["source_format"],
                        metadata=item["metadata"],
                    )
                    for item, vector in zip(records, vectors)
                ]
                writer = self.milvus_writer_factory(request.collection)
                writer.recreate_collection(dimension=len(vector_records[0].vector))
                written = writer.insert_records(vector_records)
                backends["milvus"] = {"success": written == len(vector_records), "required": True, "written": written}
                if written != len(vector_records):
                    backends["milvus"]["error"] = "milvus wrote an incomplete chunk set"
            except Exception as error:  # noqa: BLE001 - surfaced in response
                backends["milvus"] = {"success": False, "required": True, "error": str(error)}
        else:
            backends["milvus"] = {"success": True, "required": False, "skipped": True, "reason": "RAG_UPSERT_MILVUS_ENABLED is false"}

        required = [item for item in backends.values() if item.get("required")]
        pipeline_ready = bool(required) and all(item.get("success") for item in required)
        return {
            "success": all(item.get("success") for item in required) if required else True,
            "pipeline_ready": pipeline_ready,
            "backends": backends,
            "chunk_count": len(records),
        }

    @staticmethod
    def _write_whoosh(records: Iterable[Mapping[str, Any]], collection: str) -> int:
        directory = index_dir_for_collection(
            os.getenv("RAG_DOCUMENT_WHOOSH_INDEX_DIR") or settings.whoosh_index_dir,
            collection,
        )
        return build_index(records, directory, recreate=False)

    @staticmethod
    def _build_milvus_writer(collection: str) -> MilvusVectorWriter:
        return MilvusVectorWriter(MilvusConfig(
            uri=settings.milvus_uri,
            database=settings.milvus_database,
            collection_name=collection,
            vector_field=settings.milvus_vector_field,
            primary_field=settings.milvus_primary_field,
            metric_type=settings.milvus_metric_type,
            index_type=settings.milvus_index_type,
            batch_size=settings.milvus_batch_size,
            drop_existing=False,
        ))


__all__ = ["UnifiedExperienceIndexer"]
