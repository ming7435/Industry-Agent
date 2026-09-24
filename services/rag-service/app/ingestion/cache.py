"""Persistent local cache for parsed, cleaned, and chunked documents."""

from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.chunk import IndustrialChunk

from .models import (
    BlockType,
    BoundingBox,
    DocumentBlock,
    ImageAsset,
    ParsedPage,
    PdfType,
    StructuredDocument,
)

CACHE_SCHEMA_VERSION = 1


@dataclass(frozen=True)
class CachedIngestionArtifact:
    """A document and its retrieval-ready chunks restored from local cache."""

    document: StructuredDocument
    chunks: list[IndustrialChunk]


class IngestionCache:
    """Store one validated intermediate artifact per source document."""

    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)

    def load(
        self,
        document_id: str,
        *,
        content_hash: str,
        pipeline_signature: str,
    ) -> CachedIngestionArtifact | None:
        """Return a cache hit only when source content and pipeline match."""

        document_root = self.root / document_id
        try:
            pointer = _read_json(document_root / "current.json")
            if pointer.get("content_hash") != content_hash:
                return None
            if pointer.get("pipeline_signature") != pipeline_signature:
                return None
            artifact_name = str(pointer["artifact"])
            if not artifact_name or Path(artifact_name).name != artifact_name:
                return None
            directory = document_root / "artifacts" / artifact_name
            manifest = _read_json(directory / "manifest.json")
            if manifest.get("schema_version") != CACHE_SCHEMA_VERSION:
                return None
            if manifest.get("content_hash") != content_hash:
                return None
            if manifest.get("pipeline_signature") != pipeline_signature:
                return None
            document = _document_from_dict(_read_json(directory / "document.json"))
            chunks = _read_chunks(directory / "chunks.jsonl")
            if int(manifest.get("chunk_count", -1)) != len(chunks):
                return None
            return CachedIngestionArtifact(document=document, chunks=chunks)
        except (OSError, TypeError, ValueError, KeyError, json.JSONDecodeError):
            return None

    def store(
        self,
        document_id: str,
        *,
        content_hash: str,
        pipeline_signature: str,
        document: StructuredDocument,
        chunks: list[IndustrialChunk],
    ) -> None:
        """Atomically publish an artifact; the manifest is written last."""

        document_root = self.root / document_id
        artifact_name = (
            f"{content_hash[:12]}-{pipeline_signature[:12]}-{uuid.uuid4().hex}"
        )
        directory = document_root / "artifacts" / artifact_name
        directory.mkdir(parents=True, exist_ok=True)
        _write_json_atomic(directory / "document.json", document.to_dict())
        _write_chunks_atomic(directory / "chunks.jsonl", chunks)
        _write_json_atomic(
            directory / "manifest.json",
            {
                "schema_version": CACHE_SCHEMA_VERSION,
                "document_id": document_id,
                "content_hash": content_hash,
                "pipeline_signature": pipeline_signature,
                "chunk_count": len(chunks),
            },
        )
        # Readers only follow current.json, so the fully written generation
        # becomes visible with one atomic file replacement.
        document_root.mkdir(parents=True, exist_ok=True)
        _write_json_atomic(
            document_root / "current.json",
            {
                "artifact": artifact_name,
                "content_hash": content_hash,
                "pipeline_signature": pipeline_signature,
            },
        )


def _read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object: {path}")
    return value


def _write_json_atomic(path: Path, value: Any) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str),
        encoding="utf-8",
    )
    os.replace(temporary, path)


def _read_chunks(path: Path) -> list[IndustrialChunk]:
    chunks: list[IndustrialChunk] = []
    with path.open("r", encoding="utf-8") as stream:
        for line in stream:
            if not line.strip():
                continue
            value = json.loads(line)
            chunks.append(
                IndustrialChunk(
                    chunk_id=str(value["chunk_id"]),
                    text=str(value["text"]),
                    metadata=dict(value.get("metadata") or {}),
                )
            )
    return chunks


def _write_chunks_atomic(path: Path, chunks: list[IndustrialChunk]) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8", newline="\n") as stream:
        for chunk in chunks:
            stream.write(json.dumps(chunk.to_dict(), ensure_ascii=False, separators=(",", ":"), default=str))
            stream.write("\n")
    os.replace(temporary, path)


def _document_from_dict(value: dict[str, Any]) -> StructuredDocument:
    blocks = [_block_from_dict(item) for item in value.get("blocks") or []]
    pages = [
        ParsedPage(
            page_number=int(item["page_number"]),
            width=float(item.get("width") or 0),
            height=float(item.get("height") or 0),
            text_characters=int(item.get("text_characters") or 0),
            has_images=bool(item.get("has_images")),
            has_drawings=bool(item.get("has_drawings")),
            blocks=[_block_from_dict(block) for block in item.get("blocks") or []],
        )
        for item in value.get("pages") or []
    ]
    assets = [
        ImageAsset(
            asset_id=str(item["asset_id"]),
            page_number=int(item["page_number"]),
            data=b"",
            media_type=str(item.get("media_type") or "application/octet-stream"),
            bbox=_bbox_from_value(item.get("bbox")),
            kind=BlockType(str(item.get("kind") or BlockType.IMAGE.value)),
            description=item.get("description"),
            path=Path(item["path"]) if item.get("path") else None,
            metadata=dict(item.get("metadata") or {}),
        )
        for item in value.get("assets") or []
    ]
    source_path = value.get("source_path")
    return StructuredDocument(
        source_name=str(value["source_name"]),
        source_path=Path(source_path) if source_path else None,
        pdf_type=PdfType(str(value.get("pdf_type") or PdfType.EMPTY.value)),
        pages=pages,
        blocks=blocks,
        assets=assets,
        metadata=dict(value.get("metadata") or {}),
    )


def _block_from_dict(value: dict[str, Any]) -> DocumentBlock:
    return DocumentBlock(
        block_id=str(value["block_id"]),
        page_number=int(value["page_number"]),
        kind=BlockType(str(value["kind"])),
        content=str(value.get("content") or ""),
        bbox=_bbox_from_value(value.get("bbox")),
        placeholder=value.get("placeholder"),
        metadata=dict(value.get("metadata") or {}),
    )


def _bbox_from_value(value: Any) -> BoundingBox | None:
    return BoundingBox.from_sequence(value) if value is not None else None


__all__ = ["CachedIngestionArtifact", "IngestionCache"]
