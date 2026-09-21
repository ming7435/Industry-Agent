"""Structure-aware semantic chunking for industrial documents."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Iterable

from app.clean import ChunkQuality, CleanedBlock, CleanerConfig, IndustrialCleaner
from app.ingestion.models import BlockType, StructuredDocument
from app.ingestion.pdf_parser import parse_pdf


class ChunkType(str, Enum):
    """Semantic chunk category used by retrieval and ranking."""

    TEXT = "text_chunk"
    TABLE = "table_chunk"
    VISUAL = "visual_chunk"
    CAD = "cad_chunk"
    SCANNED_PAGE = "scanned_page_chunk"
    MIXED = "mixed_chunk"


@dataclass(frozen=True)
class ChunkerConfig:
    """Options controlling grouping and chunk length."""

    max_characters: int = 1200
    overlap_characters: int = 120
    min_characters: int = 20
    repeated_line_min_pages: int = 2
    repeated_line_min_ratio: float = 0.4
    merge_visual_with_neighbors: bool = True
    visual_context_blocks: int = 1
    include_source_prefix: bool = True

    def __post_init__(self) -> None:
        if self.max_characters <= 0:
            raise ValueError("max_characters must be greater than zero.")
        if self.overlap_characters < 0:
            raise ValueError("overlap_characters must not be negative.")
        if self.overlap_characters >= self.max_characters:
            raise ValueError("overlap_characters must be smaller than max_characters.")
        if self.min_characters < 0:
            raise ValueError("min_characters must not be negative.")
        if self.repeated_line_min_pages <= 0:
            raise ValueError("repeated_line_min_pages must be greater than zero.")
        if not 0 <= self.repeated_line_min_ratio <= 1:
            raise ValueError("repeated_line_min_ratio must be between zero and one.")
        if self.visual_context_blocks < 0:
            raise ValueError("visual_context_blocks must not be negative.")

    def cleaner_config(self) -> CleanerConfig:
        """Return the matching cleaning config for this chunker config."""

        return CleanerConfig(
            min_characters=self.min_characters,
            repeated_line_min_pages=self.repeated_line_min_pages,
            repeated_line_min_ratio=self.repeated_line_min_ratio,
        )


@dataclass
class IndustrialChunk:
    """A retrieval-ready chunk with quality and source metadata."""

    chunk_id: str
    text: str
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "text": self.text,
            "metadata": dict(self.metadata),
        }


class IndustrialChunker:
    """Build first-stage structure-aware semantic chunks."""

    def __init__(
        self,
        config: ChunkerConfig | None = None,
        *,
        cleaner: IndustrialCleaner | None = None,
    ) -> None:
        self.config = config or ChunkerConfig()
        self.cleaner = cleaner or IndustrialCleaner(self.config.cleaner_config())

    def build_chunks(self, document: StructuredDocument) -> list[IndustrialChunk]:
        """Build cleaned chunks from a parsed structured document."""

        cleaned_blocks = self.cleaner.clean_document(document)
        groups = self._group_blocks(cleaned_blocks)
        chunks: list[IndustrialChunk] = []
        for group_index, group in enumerate(groups, start=1):
            for part_index, text in enumerate(self._split_group_text(document, group), start=1):
                if len(text.strip()) < self.config.min_characters:
                    continue
                chunks.append(
                    IndustrialChunk(
                        chunk_id=_chunk_id(document, group, group_index, part_index),
                        text=text,
                        metadata=_chunk_metadata(document, group, group_index, part_index),
                    )
                )
        return chunks

    def _group_blocks(self, blocks: list[CleanedBlock]) -> list[list[CleanedBlock]]:
        """Group blocks with first-stage structure-aware semantic rules."""

        groups: list[list[CleanedBlock]] = []
        text_buffer: list[tuple[int, CleanedBlock]] = []

        def flush_text_buffer() -> None:
            nonlocal text_buffer
            if text_buffer:
                groups.extend(
                    _pack_text_blocks(
                        [block for _, block in text_buffer],
                        self.config.max_characters,
                    )
                )
                text_buffer = []

        consumed_indexes: set[int] = set()
        index = 0
        while index < len(blocks):
            if index in consumed_indexes:
                index += 1
                continue

            block = blocks[index]
            if block.kind is BlockType.TEXT:
                text_buffer.append((index, block))
                index += 1
                continue

            if block.kind is BlockType.TABLE:
                flush_text_buffer()
                groups.extend(_pack_table_block(block, self.config.max_characters))
                index += 1
                continue

            if block.kind is BlockType.CAD_DRAWING:
                group, used = _cad_group(block, blocks, index, self.config)
                consumed_indexes.update(used)
                _remove_consumed_text(text_buffer, consumed_indexes)
                flush_text_buffer()
                groups.append(group)
                index += 1
                continue

            if block.kind is BlockType.IMAGE:
                if self.config.merge_visual_with_neighbors:
                    group, used = _visual_group(block, blocks, index, self.config)
                    consumed_indexes.update(used)
                    _remove_consumed_text(text_buffer, consumed_indexes)
                    flush_text_buffer()
                    groups.append(group)
                else:
                    flush_text_buffer()
                    groups.append([block])
                index += 1
                continue

            if block.kind is BlockType.PAGE_IMAGE:
                group, used = _scanned_page_group(block, blocks, index, self.config)
                consumed_indexes.update(used)
                _remove_consumed_text(text_buffer, consumed_indexes)
                flush_text_buffer()
                groups.append(group)
                index += 1
                continue

            text_buffer.append((index, block))
            index += 1

        flush_text_buffer()
        return groups

    def _split_group_text(
        self,
        document: StructuredDocument,
        group: list[CleanedBlock],
    ) -> list[str]:
        text = _render_group_text(
            document,
            group,
            include_source_prefix=self.config.include_source_prefix,
        )
        if len(text) <= self.config.max_characters:
            return [text]
        return _split_text(text, self.config.max_characters, self.config.overlap_characters)


def build_chunks(
    document: StructuredDocument,
    *,
    config: ChunkerConfig | None = None,
    cleaner: IndustrialCleaner | None = None,
) -> list[IndustrialChunk]:
    """Convenience wrapper around :class:`IndustrialChunker`."""

    return IndustrialChunker(config, cleaner=cleaner).build_chunks(document)


def _pack_text_blocks(
    blocks: list[CleanedBlock],
    max_characters: int,
) -> list[list[CleanedBlock]]:
    groups: list[list[CleanedBlock]] = []
    current: list[CleanedBlock] = []
    current_length = 0
    for block in blocks:
        block_length = len(block.clean_text)
        starts_heading = bool(block.metadata.get("is_heading"))
        if starts_heading and current:
            groups.append(current)
            current = []
            current_length = 0
        if current and current_length + block_length > max_characters:
            groups.append(current)
            current = []
            current_length = 0
        current.append(block)
        current_length += block_length
    if current:
        groups.append(current)
    return groups


def _pack_table_block(
    block: CleanedBlock,
    max_characters: int,
) -> list[list[CleanedBlock]]:
    if len(block.clean_text) <= max_characters:
        return [[block]]
    synthetic_blocks: list[CleanedBlock] = []
    table_lines = [line for line in block.clean_text.splitlines() if line.strip()]
    current_lines: list[str] = []
    part_index = 1
    for line in table_lines:
        candidate = "\n".join(current_lines + [line])
        if current_lines and len(candidate) > max_characters:
            synthetic_blocks.append(_derived_block(block, current_lines, part_index))
            current_lines = []
            part_index += 1
        current_lines.append(line)
    if current_lines:
        synthetic_blocks.append(_derived_block(block, current_lines, part_index))
    return [[item] for item in synthetic_blocks]


def _derived_block(
    block: CleanedBlock,
    lines: list[str],
    part_index: int,
) -> CleanedBlock:
    metadata = dict(block.metadata)
    metadata["parent_block_id"] = block.block_id
    metadata["table_part_index"] = part_index
    return CleanedBlock(
        block_id=f"{block.block_id}-part{part_index}",
        page_number=block.page_number,
        kind=block.kind,
        clean_text="\n".join(lines),
        raw_text=block.raw_text,
        quality=block.quality,
        warnings=list(block.warnings),
        metadata=metadata,
    )


def _visual_group(
    block: CleanedBlock,
    blocks: list[CleanedBlock],
    index: int,
    config: ChunkerConfig,
) -> tuple[list[CleanedBlock], set[int]]:
    return _context_group(
        block,
        blocks,
        index,
        config,
        allowed_context={BlockType.TEXT},
    )


def _cad_group(
    block: CleanedBlock,
    blocks: list[CleanedBlock],
    index: int,
    config: ChunkerConfig,
) -> tuple[list[CleanedBlock], set[int]]:
    return _context_group(
        block,
        blocks,
        index,
        config,
        allowed_context={BlockType.TEXT},
        short_context_only=True,
    )


def _scanned_page_group(
    block: CleanedBlock,
    blocks: list[CleanedBlock],
    index: int,
    config: ChunkerConfig,
) -> tuple[list[CleanedBlock], set[int]]:
    if block.quality is ChunkQuality.HIGH:
        return _context_group(
            block,
            blocks,
            index,
            config,
            allowed_context={BlockType.TEXT},
            short_context_only=True,
        )
    return [block], {index}


def _context_group(
    block: CleanedBlock,
    blocks: list[CleanedBlock],
    index: int,
    config: ChunkerConfig,
    *,
    allowed_context: set[BlockType],
    short_context_only: bool = False,
) -> tuple[list[CleanedBlock], set[int]]:
    before = _neighbor_context(
        blocks,
        range(index - 1, -1, -1),
        config.visual_context_blocks,
        allowed_context,
        short_context_only=short_context_only,
    )
    after = _neighbor_context(
        blocks,
        range(index + 1, len(blocks)),
        config.visual_context_blocks,
        allowed_context,
        short_context_only=short_context_only,
    )
    group = list(reversed([item for _, item in before])) + [block] + [item for _, item in after]
    used_indexes = {
        index,
        *(neighbor_index for neighbor_index, _ in before),
        *(neighbor_index for neighbor_index, _ in after),
    }
    while len("\n".join(item.clean_text for item in group)) > config.max_characters and len(group) > 1:
        if len(after) >= len(before) and after:
            used_indexes.discard(after.pop()[0])
        elif before:
            used_indexes.discard(before.pop(0)[0])
        else:
            break
        group = list(reversed([item for _, item in before])) + [block] + [item for _, item in after]
    return group, used_indexes


def _neighbor_context(
    blocks: list[CleanedBlock],
    indexes: range,
    limit: int,
    allowed_context: set[BlockType],
    *,
    short_context_only: bool,
) -> list[tuple[int, CleanedBlock]]:
    context: list[tuple[int, CleanedBlock]] = []
    for neighbor_index in indexes:
        candidate = blocks[neighbor_index]
        if candidate.kind not in allowed_context:
            break
        if short_context_only and len(candidate.clean_text) > 240:
            continue
        context.append((neighbor_index, candidate))
        if len(context) >= limit:
            break
    return context


def _remove_consumed_text(
    text_buffer: list[tuple[int, CleanedBlock]],
    consumed_indexes: set[int],
) -> None:
    if not consumed_indexes:
        return
    text_buffer[:] = [
        (index, block)
        for index, block in text_buffer
        if index not in consumed_indexes
    ]


def _render_group_text(
    document: StructuredDocument,
    group: list[CleanedBlock],
    *,
    include_source_prefix: bool,
) -> str:
    parts: list[str] = []
    if include_source_prefix:
        pages = _sorted_unique(block.page_number for block in group)
        block_types = _sorted_unique(block.kind.value for block in group)
        parts.append(f"文档: {document.source_name}")
        parts.append(f"页码: {', '.join(str(page) for page in pages)}")
        parts.append(f"内容类型: {', '.join(block_types)}")
    for block in group:
        title = f"[{block.kind.value} | 第{block.page_number}页 | {block.block_id}]"
        parts.append(f"{title}\n{block.clean_text}")
    return "\n\n".join(part for part in parts if part).strip()


def _split_text(text: str, max_characters: int, overlap_characters: int) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n{2,}", text) if paragraph.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(paragraph) > max_characters:
            if current:
                chunks.append(current.strip())
                current = ""
            chunks.extend(_split_long_text(paragraph, max_characters, overlap_characters))
            continue
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= max_characters:
            current = candidate
        else:
            chunks.append(current.strip())
            overlap = chunks[-1][-overlap_characters:].strip() if overlap_characters else ""
            overlapped = f"{overlap}\n\n{paragraph}".strip() if overlap else paragraph
            if len(overlapped) <= max_characters:
                current = overlapped
            else:
                # 不要让重叠内容把名义上受限的分块撑成超大分块；这对表格和较长工业参数段落尤其重要。
                chunks.extend(
                    _split_long_text(paragraph, max_characters, overlap_characters)
                )
                current = ""
    if current:
        chunks.append(current.strip())
    return chunks


def _split_long_text(text: str, max_characters: int, overlap_characters: int) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = _natural_split_end(text, start, max_characters)
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start = _next_split_start(text, end, overlap_characters)
    return [chunk for chunk in chunks if chunk]


def _natural_split_end(text: str, start: int, max_characters: int) -> int:
    hard_end = min(len(text), start + max_characters)
    if hard_end == len(text):
        return hard_end
    window = text[start:hard_end]
    minimum = max(0, int(max_characters * 0.55))
    split_marks = ["\n\n", "。", "！", "？", ";", "；", "\n", "，", ",", " "]
    best = -1
    for mark in split_marks:
        index = window.rfind(mark)
        if index >= minimum:
            best = index + len(mark)
            break
    if best <= 0:
        return hard_end
    return start + best


def _next_split_start(text: str, previous_end: int, overlap_characters: int) -> int:
    if overlap_characters <= 0:
        return previous_end
    start = max(0, previous_end - overlap_characters)
    while start < previous_end and text[start].isspace():
        start += 1
    return start


def _chunk_id(
    document: StructuredDocument,
    group: list[CleanedBlock],
    group_index: int,
    part_index: int,
) -> str:
    block_digest = hashlib.sha1(
        "|".join(block.block_id for block in group).encode("utf-8")
    ).hexdigest()[:10]
    document_key = str(
        document.metadata.get("document_id")
        or document.source_path
        or document.source_name
    )
    document_digest = hashlib.sha256(document_key.encode("utf-8")).hexdigest()[:20]
    return f"doc-{document_digest}-g{group_index}-p{part_index}-{block_digest}"


def _chunk_metadata(
    document: StructuredDocument,
    group: list[CleanedBlock],
    group_index: int,
    part_index: int,
) -> dict[str, Any]:
    qualities = [block.quality for block in group]
    warnings = _sorted_unique(warning for block in group for warning in block.warnings)
    block_types = _sorted_unique(block.kind.value for block in group)
    recognition_statuses = _sorted_unique(
        str(block.metadata.get("recognition_status"))
        for block in group
        if block.metadata.get("recognition_status")
    )
    entity_ids = _sorted_unique(
        str(block.metadata.get("entity_id") or block.metadata.get("entity_handle"))
        for block in group
        if block.metadata.get("entity_id") or block.metadata.get("entity_handle")
    )
    layer_names = _sorted_unique(
        str(block.metadata.get("layer_name"))
        for block in group
        if block.metadata.get("layer_name")
    )
    device_ids = _sorted_unique(
        str(block.metadata.get("device_id"))
        for block in group
        if block.metadata.get("device_id")
    )
    return {
        "document_id": document.metadata.get("document_id"),
        "drawing_id": document.metadata.get("drawing_id"),
        "version_id": document.metadata.get("version_id"),
        "project_id": document.metadata.get("project_id"),
        "tenant_id": document.metadata.get("tenant_id"),
        "entity_ids": entity_ids,
        "entity_id": entity_ids[0] if len(entity_ids) == 1 else None,
        "layer_names": layer_names,
        "layer_name": layer_names[0] if len(layer_names) == 1 else None,
        "device_ids": device_ids,
        "device_id": device_ids[0] if len(device_ids) == 1 else None,
        "content_hash": document.metadata.get("content_hash"),
        "source_name": document.source_name,
        "source_path": str(document.source_path) if document.source_path else None,
        "source_format": document.source_format,
        "pdf_type": document.pdf_type.value,
        "chunk_type": _chunk_type(group).value,
        "group_index": group_index,
        "part_index": part_index,
        "page_numbers": _sorted_unique(block.page_number for block in group),
        "block_ids": [block.block_id for block in group],
        "block_types": block_types,
        "contains_table": any(block.kind is BlockType.TABLE for block in group),
        "contains_image": any(block.kind in {BlockType.IMAGE, BlockType.PAGE_IMAGE} for block in group),
        "contains_cad": any(block.kind is BlockType.CAD_DRAWING for block in group),
        "recognition_statuses": recognition_statuses,
        "quality": _group_quality(qualities).value,
        "warnings": warnings,
    }


def _chunk_type(group: list[CleanedBlock]) -> ChunkType:
    kinds = {block.kind for block in group}
    if kinds == {BlockType.TEXT}:
        return ChunkType.TEXT
    if kinds == {BlockType.TABLE}:
        return ChunkType.TABLE
    if BlockType.CAD_DRAWING in kinds:
        return ChunkType.CAD
    if BlockType.PAGE_IMAGE in kinds:
        return ChunkType.SCANNED_PAGE
    if BlockType.IMAGE in kinds and len(kinds) == 1:
        return ChunkType.VISUAL
    if BlockType.IMAGE in kinds:
        return ChunkType.MIXED
    return ChunkType.MIXED


def _group_quality(qualities: list[ChunkQuality]) -> ChunkQuality:
    if not qualities:
        return ChunkQuality.LOW
    counts = Counter(qualities)
    if counts[ChunkQuality.LOW] and counts[ChunkQuality.LOW] >= len(qualities) / 2:
        return ChunkQuality.LOW
    if counts[ChunkQuality.MEDIUM] or counts[ChunkQuality.LOW]:
        return ChunkQuality.MEDIUM
    return ChunkQuality.HIGH


def _sorted_unique(values: Iterable[Any]) -> list[Any]:
    return sorted(set(values))


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Parse, clean, and chunk an industrial PDF.")
    parser.add_argument("path", type=Path, help="PDF path")
    parser.add_argument("--max-characters", type=int, default=ChunkerConfig.max_characters)
    parser.add_argument("--overlap-characters", type=int, default=ChunkerConfig.overlap_characters)
    return parser


def main() -> int:
    args = _build_argument_parser().parse_args()
    try:
        document = parse_pdf(args.path)
        chunks = build_chunks(
            document,
            config=ChunkerConfig(
                max_characters=args.max_characters,
                overlap_characters=args.overlap_characters,
            ),
        )
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"Error: {exc}")
        return 1
    print(json.dumps([chunk.to_dict() for chunk in chunks], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


__all__ = [
    "ChunkQuality",
    "ChunkType",
    "ChunkerConfig",
    "IndustrialChunk",
    "IndustrialChunker",
    "build_chunks",
]
