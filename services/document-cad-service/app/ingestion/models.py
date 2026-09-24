"""Data models produced by the industrial PDF ingestion stage."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any


class PdfType(str, Enum):
    """Coarse classification of the pages in a PDF document."""

    TEXT = "text"
    SCANNED = "scanned"
    MIXED = "mixed"
    EMPTY = "empty"


class BlockType(str, Enum):
    """Content types that can occur in a structured document."""

    TEXT = "text"
    TABLE = "table"
    IMAGE = "image"
    PAGE_IMAGE = "page_image"
    CAD_DRAWING = "cad_drawing"


@dataclass(frozen=True)
class BoundingBox:
    """A PDF rectangle in points, measured from the top-left corner."""

    x0: float
    y0: float
    x1: float
    y1: float

    @classmethod
    def from_sequence(cls, values: Any) -> "BoundingBox":
        """Build a box from a four-value PDF rectangle."""

        if values is None or len(values) != 4:
            raise ValueError("A bounding box must contain four values.")
        x0, y0, x1, y1 = (float(value) for value in values)
        return cls(x0=x0, y0=y0, x1=x1, y1=y1)

    @property
    def width(self) -> float:
        return max(0.0, self.x1 - self.x0)

    @property
    def height(self) -> float:
        return max(0.0, self.y1 - self.y0)

    @property
    def area(self) -> float:
        return self.width * self.height

    def to_list(self) -> list[float]:
        return [self.x0, self.y0, self.x1, self.y1]


@dataclass
class ImageAsset:
    """An extracted or rendered visual asset and its optional description."""

    asset_id: str
    page_number: int
    data: bytes
    media_type: str
    bbox: BoundingBox | None = None
    kind: BlockType = BlockType.IMAGE
    description: str | None = None
    path: Path | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self, *, include_data: bool = False) -> dict[str, Any]:
        """Return JSON-friendly metadata without serializing bytes by default."""

        result: dict[str, Any] = {
            "asset_id": self.asset_id,
            "page_number": self.page_number,
            "media_type": self.media_type,
            "bbox": self.bbox.to_list() if self.bbox else None,
            "kind": self.kind.value,
            "description": self.description,
            "path": str(self.path) if self.path else None,
            "metadata": dict(self.metadata),
        }
        if include_data:
            result["data"] = self.data
        return result


@dataclass
class DocumentBlock:
    """A logical block in reading order, optionally backed by a placeholder."""

    block_id: str
    page_number: int
    kind: BlockType
    content: str
    bbox: BoundingBox | None = None
    placeholder: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def render(self, *, include_placeholder: bool = True) -> str:
        """Render the block for insertion into a downstream text document."""

        content = self.content.strip()
        if not self.placeholder or not include_placeholder:
            return content
        if not content:
            return self.placeholder
        return f"{self.placeholder}\n{content}"

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-friendly representation of the block."""

        return {
            "block_id": self.block_id,
            "page_number": self.page_number,
            "kind": self.kind.value,
            "content": self.content,
            "bbox": self.bbox.to_list() if self.bbox else None,
            "placeholder": self.placeholder,
            "metadata": dict(self.metadata),
        }


@dataclass
class ParsedPage:
    """Page-level extraction statistics useful for auditing and debugging."""

    page_number: int
    width: float
    height: float
    text_characters: int
    has_images: bool
    has_drawings: bool
    blocks: list[DocumentBlock] = field(default_factory=list)

    @property
    def is_visual(self) -> bool:
        return self.text_characters == 0 or self.has_images or self.has_drawings

    def to_dict(self) -> dict[str, Any]:
        return {
            "page_number": self.page_number,
            "width": self.width,
            "height": self.height,
            "text_characters": self.text_characters,
            "has_images": self.has_images,
            "has_drawings": self.has_drawings,
            "blocks": [block.to_dict() for block in self.blocks],
        }


@dataclass
class StructuredDocument:
    """The parse result passed to chunking, embedding, and retrieval stages."""

    source_name: str
    source_path: Path | None
    pdf_type: PdfType
    pages: list[ParsedPage]
    blocks: list[DocumentBlock]
    assets: list[ImageAsset]
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def source_format(self) -> str:
        """Return the source format recorded by the parser."""

        return str(self.metadata.get("source_format") or "pdf")

    def to_markdown(self, *, include_placeholders: bool = True) -> str:
        """Render pages and blocks while preserving page boundaries."""

        sections = [f"# {self.source_name}", f"文档类型：{self.source_format}"]
        for page in self.pages:
            sections.append(f"## 第 {page.page_number} 页")
            page_content = [
                block.render(include_placeholder=include_placeholders)
                for block in page.blocks
            ]
            sections.append("\n\n".join(item for item in page_content if item))
        return "\n\n".join(section for section in sections if section).strip()

    def to_text(self) -> str:
        """Render semantic content without internal placeholder markers."""

        return self.to_markdown(include_placeholders=False)

    def to_dict(self, *, include_asset_data: bool = False) -> dict[str, Any]:
        """Return structured metadata suitable for JSON serialization."""

        return {
            "source_name": self.source_name,
            "source_path": str(self.source_path) if self.source_path else None,
            "source_format": self.source_format,
            "pdf_type": self.pdf_type.value,
            "pages": [page.to_dict() for page in self.pages],
            "blocks": [block.to_dict() for block in self.blocks],
            "assets": [
                asset.to_dict(include_data=include_asset_data) for asset in self.assets
            ],
            "metadata": dict(self.metadata),
        }


__all__ = [
    "BlockType",
    "BoundingBox",
    "DocumentBlock",
    "ImageAsset",
    "ParsedPage",
    "PdfType",
    "StructuredDocument",
]
