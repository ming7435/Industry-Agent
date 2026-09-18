"""Clean parsed industrial document blocks before chunking."""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from app.ingestion.models import BlockType, DocumentBlock, StructuredDocument


class ChunkQuality(str, Enum):
    """Coarse confidence tier for retrieval and answer grounding."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass(frozen=True)
class CleanerConfig:
    """Options controlling document-level and block-level cleaning."""

    min_characters: int = 20
    repeated_line_min_pages: int = 2
    repeated_line_min_ratio: float = 0.4

    def __post_init__(self) -> None:
        if self.min_characters < 0:
            raise ValueError("min_characters must not be negative.")
        if self.repeated_line_min_pages <= 0:
            raise ValueError("repeated_line_min_pages must be greater than zero.")
        if not 0 <= self.repeated_line_min_ratio <= 1:
            raise ValueError("repeated_line_min_ratio must be between zero and one.")


@dataclass
class CleanedBlock:
    """A cleaned block with enough provenance to rebuild evidence."""

    block_id: str
    page_number: int
    kind: BlockType
    clean_text: str
    raw_text: str
    quality: ChunkQuality
    warnings: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "block_id": self.block_id,
            "page_number": self.page_number,
            "kind": self.kind.value,
            "clean_text": self.clean_text,
            "raw_text": self.raw_text,
            "quality": self.quality.value,
            "warnings": list(self.warnings),
            "metadata": dict(self.metadata),
        }


class IndustrialCleaner:
    """Apply document-level and block-level cleaning to parsed PDF blocks."""

    def __init__(self, config: CleanerConfig | None = None) -> None:
        self.config = config or CleanerConfig()

    def clean_document(self, document: StructuredDocument) -> list[CleanedBlock]:
        """Clean a parsed document into retrieval-ready blocks."""

        repeated_lines = _detect_repeated_lines(document, self.config)
        cleaned_blocks: list[CleanedBlock] = []
        for block in document.blocks:
            cleaned = self.clean_block(
                block,
                repeated_lines=repeated_lines,
                document_format=document.source_format,
            )
            if cleaned is None:
                continue
            cleaned_blocks.append(cleaned)
        return cleaned_blocks

    def clean_block(
        self,
        block: DocumentBlock,
        *,
        repeated_lines: set[str] | None = None,
        document_format: str | None = None,
    ) -> CleanedBlock | None:
        """Clean one structured block without losing provenance."""

        raw_text = block.render(include_placeholder=True)
        text = _normalize_text(raw_text)
        text = _remove_placeholder_only_noise(text)
        text = _remove_repeated_lines(text, repeated_lines or set())
        text = _remove_noise_lines(text)
        if block.kind is BlockType.TEXT:
            text = _repair_broken_text_lines(text)
            text = _normalize_industrial_units(text)
            text = _translate_known_controller_messages(text)

        warnings = _block_warnings(block, text, document_format=document_format)
        if block.kind is BlockType.TABLE:
            text = _table_to_semantic_text(text)
        elif block.kind in {BlockType.IMAGE, BlockType.PAGE_IMAGE, BlockType.CAD_DRAWING}:
            text = _clean_visual_description(text)

        text = _normalize_text(text)
        if _is_discardable(
            text,
            self.config.min_characters,
            block.kind,
            is_heading=bool(block.metadata.get("is_heading")),
        ):
            return None

        quality = _quality_for_block(block, text, warnings)
        metadata = dict(block.metadata)
        metadata.update(
            {
                "placeholder": block.placeholder,
                "bbox": block.bbox.to_list() if block.bbox else None,
                "contains_table": block.kind is BlockType.TABLE,
                "contains_image": block.kind in {BlockType.IMAGE, BlockType.PAGE_IMAGE},
                "contains_cad": block.kind is BlockType.CAD_DRAWING,
            }
        )
        return CleanedBlock(
            block_id=block.block_id,
            page_number=block.page_number,
            kind=block.kind,
            clean_text=text,
            raw_text=raw_text,
            quality=quality,
            warnings=warnings,
            metadata=metadata,
        )


def clean_document(
    document: StructuredDocument,
    *,
    config: CleanerConfig | None = None,
) -> list[CleanedBlock]:
    """Convenience wrapper around :class:`IndustrialCleaner`."""

    return IndustrialCleaner(config).clean_document(document)


def _detect_repeated_lines(document: StructuredDocument, config: CleanerConfig) -> set[str]:
    pages_by_line: dict[str, set[int]] = defaultdict(set)
    page_count = max(1, len(document.pages))
    for block in document.blocks:
        if block.kind is not BlockType.TEXT:
            continue
        for line in _normalize_text(block.content).splitlines():
            normalized = _line_key(line)
            if not normalized or len(normalized) > 80:
                continue
            pages_by_line[normalized].add(block.page_number)

    minimum_pages = max(
        config.repeated_line_min_pages,
        int(page_count * config.repeated_line_min_ratio),
    )
    return {
        line
        for line, pages in pages_by_line.items()
        if len(pages) >= minimum_pages and _looks_like_header_footer(line)
    }


def _normalize_text(text: str) -> str:
    text = text.replace("　", " ")
    text = text.replace(" ", " ")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = _repair_broken_ascii_words(text)
    return text.strip()


def _repair_broken_ascii_words(text: str) -> str:
    return re.sub(r"(?<=[A-Za-z])-\n(?=[A-Za-z])", "", text)


def _remove_placeholder_only_noise(text: str) -> str:
    text = re.sub(r"\[\[(IMAGE|PAGE_IMAGE|CAD_DRAWING|TABLE):[^\]]+\]\]\s*", "", text)
    return text.strip()


def _remove_repeated_lines(text: str, repeated_lines: set[str]) -> str:
    if not repeated_lines:
        return text
    lines = [line for line in text.splitlines() if _line_key(line) not in repeated_lines]
    return "\n".join(lines)


def _remove_noise_lines(text: str) -> str:
    lines: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            lines.append("")
            continue
        if _is_page_number(stripped) or _is_separator(stripped) or _is_catalog_dots(stripped):
            continue
        lines.append(stripped)
    return "\n".join(lines).strip()


def _repair_broken_text_lines(text: str) -> str:
    """Join PDF line wraps without flattening lists, headings, or tables."""

    lines = [line.strip() for line in text.splitlines()]
    if len(lines) < 2:
        return text

    repaired: list[str] = []
    for line in lines:
        if not line:
            if repaired and repaired[-1]:
                repaired.append("")
            continue
        if repaired and _should_join_lines(repaired[-1], line):
            repaired[-1] = f"{repaired[-1]}{line}"
        else:
            repaired.append(line)
    return "\n".join(repaired).strip()


def _should_join_lines(previous: str, current: str) -> bool:
    if not previous.strip() or not current.strip():
        return False
    if _is_structural_line(previous) or _is_structural_line(current):
        return False
    if re.search(r"[。！？；;：:，,、)）】\\]]$", previous):
        return False
    if re.match(r"^[（(【\\[]", current):
        return True
    return _contains_cjk(previous[-1]) and _contains_cjk(current[0])


def _is_structural_line(line: str) -> bool:
    return bool(
        re.match(r"^\s*(#{1,6}\s+|[-*•]\s+|\d+[.)、]\s+|[A-Z]\.|[一二三四五六七八九十]+[、.])", line)
        or line.strip().startswith("|")
        or re.search(r"[:：]$", line.strip())
    )


def _contains_cjk(text: str) -> bool:
    return bool(re.search(r"[一-鿿]", text))


def _normalize_industrial_units(text: str) -> str:
    units = "mm|cm|m|MPa|kPa|Pa|kW|W|V|A|Hz|rpm|N|Nm|kg|g|℃|°C"
    text = re.sub(rf"(?<=\d)\s*({units})\b", r" \1", text, flags=re.IGNORECASE)
    text = re.sub(r"°\s*C", "°C", text, flags=re.IGNORECASE)
    text = re.sub(r"(?<=\d)\s+(℃|°C)", r"\1", text, flags=re.IGNORECASE)
    return text


def _translate_known_controller_messages(text: str) -> str:
    """把报警手册中的底层英文指针错误转换成可读中文。"""

    replacements = {
        r"Pointer with value zero is freed:\s*\{hex\}": "控制器检测到空指针被释放（底层软件指针异常）",
        r"Wrong memory pointer is freed:\s*\{hex\}": "控制器检测到错误内存指针被释放（底层软件内存异常）",
        r"The pointer value is 0": "控制器检测到指针值为 0（底层软件指针异常）",
        r"An error occurred in controller software\.": "控制器软件发生错误。",
        r"Try the following in turn:\s*": "建议依次执行以下处理：",
        r"Power off and restart the controller\.": "关闭并重新启动控制器。",
        r"Update the controller software\.": "升级控制器软件。",
        r"Contact ELITE ROBOTS after-sales service for assistance\.": "联系设备厂家售后服务。",
    }
    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text


def _table_to_semantic_text(markdown: str) -> str:
    rows = _parse_markdown_table(markdown)
    if not rows:
        return markdown
    header_rows, data_rows = _split_table_header_rows(rows)
    headers = _flatten_table_headers(header_rows)
    semantic_rows: list[str] = []
    for row_index, row in enumerate(data_rows, start=1):
        if _is_repeated_header_row(row, header_rows):
            continue
        if not any(cell.strip() for cell in row):
            continue
        pairs = []
        for index, value in enumerate(row):
            if not value.strip():
                continue
            column = headers[index] if index < len(headers) and headers[index] else f"列{index + 1}"
            pairs.append(f"{column}: {value}")
        if pairs:
            semantic_rows.append(f"表格行{row_index}: " + "；".join(pairs))
    return "\n".join(semantic_rows) or markdown


def _split_table_header_rows(rows: list[list[str]]) -> tuple[list[list[str]], list[list[str]]]:
    if len(rows) <= 1:
        return [rows[0]], []
    header_rows = [rows[0]]
    for row in rows[1:3]:
        if _looks_like_header_continuation(row):
            header_rows.append(row)
        else:
            break
    return header_rows, rows[len(header_rows) :]


def _looks_like_header_continuation(row: list[str]) -> bool:
    non_empty = [cell for cell in row if cell.strip()]
    if not non_empty:
        return False
    text_cells = sum(1 for cell in non_empty if re.search(r"[A-Za-z_一-鿿]", cell))
    numeric_cells = sum(1 for cell in non_empty if _looks_like_table_value(cell))
    return text_cells > 0 and numeric_cells == 0


def _flatten_table_headers(header_rows: list[list[str]]) -> list[str]:
    width = max((len(row) for row in header_rows), default=0)
    headers: list[str] = []
    for index in range(width):
        parts: list[str] = []
        for row in header_rows:
            if index >= len(row):
                continue
            cell = row[index].strip()
            if cell and cell not in parts:
                parts.append(cell)
        headers.append("/".join(parts) if parts else f"列{index + 1}")
    return headers


def _is_repeated_header_row(row: list[str], header_rows: list[list[str]]) -> bool:
    normalized = _normalize_table_row_for_compare(row)
    return any(normalized == _normalize_table_row_for_compare(header) for header in header_rows)


def _normalize_table_row_for_compare(row: list[str]) -> tuple[str, ...]:
    return tuple(re.sub(r"\s+", "", cell).lower() for cell in row)


def _looks_like_table_value(text: str) -> bool:
    return bool(re.fullmatch(r"[-+]?\d+(?:[.,]\d+)*(?:\s*[A-Za-z%℃°/]+)?", text.strip()))


def _parse_markdown_table(markdown: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in markdown.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or not stripped.endswith("|"):
            continue
        cells = [cell.replace("\\|", "|").strip() for cell in stripped.strip("|").split("|")]
        if cells and all(re.fullmatch(r"-+", cell.replace(" ", "")) for cell in cells):
            continue
        rows.append(cells)
    return rows


def _clean_visual_description(text: str) -> str:
    text = re.sub(r"^这(张|个)(图片|图像|页面).*?(展示|显示|是)", "", text)
    text = text.replace("可以看到", "")
    text = text.replace("从图中可以看出", "")
    text = text.replace("请注意", "")
    return text.strip(" ：:，,。\n")


def _block_warnings(
    block: DocumentBlock,
    text: str,
    *,
    document_format: str | None = None,
) -> list[str]:
    warnings: list[str] = []
    recognition_status = block.metadata.get("recognition_status")
    if recognition_status in {"pending", "failed", "disabled"}:
        warnings.append(f"recognition_{recognition_status}")
    if block.kind in {BlockType.PAGE_IMAGE, BlockType.CAD_DRAWING}:
        warnings.append("from_visual_page")
    if block.kind is BlockType.CAD_DRAWING:
        warnings.append("contains_cad")
    if _looks_garbled(text):
        warnings.append("possible_garbled_text")
    if document_format == "pdf" and block.bbox is None:
        warnings.append("missing_bbox")
    return warnings


def _quality_for_block(
    block: DocumentBlock,
    text: str,
    warnings: list[str],
) -> ChunkQuality:
    if not text.strip() or "recognition_failed" in warnings or _looks_garbled(text):
        return ChunkQuality.LOW
    if block.kind is BlockType.TEXT and not warnings:
        return ChunkQuality.HIGH
    if block.kind is BlockType.TABLE and "possible_garbled_text" not in warnings:
        return ChunkQuality.HIGH
    if block.kind in {BlockType.IMAGE, BlockType.PAGE_IMAGE, BlockType.CAD_DRAWING}:
        recognition_status = block.metadata.get("recognition_status")
        if recognition_status == "recognized":
            return ChunkQuality.MEDIUM
        return ChunkQuality.LOW
    return ChunkQuality.MEDIUM if warnings else ChunkQuality.HIGH


def _is_discardable(
    text: str,
    min_characters: int,
    kind: BlockType,
    *,
    is_heading: bool = False,
) -> bool:
    if not text:
        return True
    if kind in {BlockType.IMAGE, BlockType.PAGE_IMAGE, BlockType.CAD_DRAWING}:
        return text in {"[待Qwen-VL识别]"} or "识别失败" in text
    if len(text) < min_characters and not is_heading and not _contains_industrial_signal(text):
        return True
    return False


def _contains_industrial_signal(text: str) -> bool:
    patterns = [
        r"\b[A-Z]{1,4}[-_]?[0-9]{2,}\b",
        r"[Φφ]\s*\d+",
        r"±\s*\d+",
        r"\bM\d+(?:\.\d+)?\b",
        r"Ra\s*\d+(?:\.\d+)?",
        r"\d+(?:\.\d+)?\s*(mm|MPa|kW|V|A|℃|°C|rpm)\b",
        r"(图号|零件|材料|报警|型号|公差|尺寸)",
    ]
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def _line_key(line: str) -> str:
    return re.sub(r"\s+", "", line).strip().lower()


def _looks_like_header_footer(line: str) -> bool:
    return (
        len(line) <= 40
        or bool(re.search(r"(公司|手册|说明书|维修|维护|confidential|page)", line, re.I))
    )


def _is_page_number(text: str) -> bool:
    patterns = [
        r"^第\s*\d+\s*页(\s*/\s*共\s*\d+\s*页)?$",
        r"^\d+\s*/\s*\d+$",
        r"^-?\s*\d+\s*-?$",
        r"^page\s+\d+(\s+of\s+\d+)?$",
    ]
    return any(re.fullmatch(pattern, text, flags=re.IGNORECASE) for pattern in patterns)


def _is_separator(text: str) -> bool:
    return bool(re.fullmatch(r"[-_=—–·•\s]{3,}", text))


def _is_catalog_dots(text: str) -> bool:
    return bool(re.search(r"\.{4,}\s*\d+$", text))


def _looks_garbled(text: str) -> bool:
    if not text:
        return False
    suspicious = len(re.findall(r"[�□■◆◇�]", text))
    return suspicious >= 3 or suspicious / max(1, len(text)) > 0.08


__all__ = [
    "ChunkQuality",
    "CleanedBlock",
    "CleanerConfig",
    "IndustrialCleaner",
    "clean_document",
]
