"""Parse industrial PDFs into ordered text, table, and visual blocks."""

from __future__ import annotations

import argparse
import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .file_reader import PathLike
from .models import (
    BlockType,
    BoundingBox,
    DocumentBlock,
    ImageAsset,
    ParsedPage,
    PdfType,
    StructuredDocument,
)
from .vision import ImageDescriber, SiliconFlowVisionClient, VisionError


DEFAULT_VISION_PROMPT = """你是工业机械图纸和设备技术文档识别专家。请描述这张图片，供检索增强生成使用。
必须尽量准确保留：图纸类型、设备/零件名称、零件编号、尺寸和公差、材料、表面处理、技术要求、箭头与引出线指向关系、表格字段和值、报警或铭牌文字。
如果文字模糊或无法确认，请明确写“无法确认”，不要猜测。使用简洁的中文分点描述，不要输出 Markdown 图片语法，不要重复这段指令。"""


class PdfParseError(RuntimeError):
    """Raised when a PDF cannot be parsed or its parser is unavailable."""


@dataclass(frozen=True)
class PdfParserConfig:
    """Options controlling extraction, rendering, and visual recognition."""

    render_dpi: int = 150
    min_text_characters: int = 20
    recognize_images: bool = True
    keep_unrecognized_placeholders: bool = True
    vision_prompt: str = DEFAULT_VISION_PROMPT
    asset_output_dir: Path | None = None

    def __post_init__(self) -> None:
        if self.render_dpi <= 0:
            raise ValueError("render_dpi must be greater than zero.")
        if self.min_text_characters < 0:
            raise ValueError("min_text_characters must not be negative.")
        if not self.vision_prompt.strip():
            raise ValueError("vision_prompt must not be empty.")


class IndustrialPdfParser:
    """Extract a PDF while keeping visual evidence separate from text."""

    def __init__(
        self,
        config: PdfParserConfig | None = None,
        *,
        image_describer: ImageDescriber | None = None,
    ) -> None:
        self.config = config or PdfParserConfig()
        self.image_describer = image_describer

    def parse(self, path: PathLike) -> StructuredDocument:
        """Parse ``path`` and return a structured document for downstream RAG."""

        pdf_path = _validate_pdf_path(path)
        fitz = _load_fitz()
        try:
            document = fitz.open(pdf_path)
        except Exception as exc:
            raise PdfParseError(f"Unable to open PDF '{pdf_path}': {exc}") from exc

        try:
            return self._parse_document(document, pdf_path, fitz)
        finally:
            document.close()

    def _parse_document(
        self,
        document: Any,
        pdf_path: Path,
        fitz: Any,
    ) -> StructuredDocument:
        pages: list[ParsedPage] = []
        blocks: list[DocumentBlock] = []
        assets: list[ImageAsset] = []
        page_text_counts: list[int] = []

        for page_index in range(len(document)):
            page = document[page_index]
            page_number = page_index + 1
            page_blocks, page_assets, text_count = self._parse_page(
                page,
                document,
                fitz,
                page_number=page_number,
            )
            page_rect = page.rect
            parsed_page = ParsedPage(
                page_number=page_number,
                width=float(page_rect.width),
                height=float(page_rect.height),
                text_characters=text_count,
                has_images=bool(page.get_images(full=True)),
                has_drawings=_has_drawings(page),
                blocks=page_blocks,
            )
            pages.append(parsed_page)
            blocks.extend(page_blocks)
            assets.extend(page_assets)
            page_text_counts.append(text_count)

        pdf_type = _classify_pdf(page_text_counts, self.config.min_text_characters)
        return StructuredDocument(
            source_name=pdf_path.name,
            source_path=pdf_path,
            pdf_type=pdf_type,
            pages=pages,
            blocks=blocks,
            assets=assets,
            metadata={
                "page_count": len(pages),
                "text_pages": sum(
                    count >= self.config.min_text_characters for count in page_text_counts
                ),
                "visual_pages": sum(
                    count < self.config.min_text_characters for count in page_text_counts
                ),
                "parser": "PyMuPDF",
                "source_format": "pdf",
            },
        )

    def _parse_page(
        self,
        page: Any,
        document: Any,
        fitz: Any,
        *,
        page_number: int,
    ) -> tuple[list[DocumentBlock], list[ImageAsset], int]:
        text_records = _extract_text_records(page)
        text_count = sum(len(record["text"]) for record in text_records)
        table_records = _extract_table_records(page)
        table_boxes = [record["bbox"] for record in table_records]
        blocks: list[DocumentBlock] = []

        for index, record in enumerate(_order_text_records(text_records, page.rect)):
            if any(_overlap_ratio(record["bbox"], box) >= 0.5 for box in table_boxes):
                continue
            blocks.append(
                DocumentBlock(
                    block_id=f"p{page_number}-t{index + 1}",
                    page_number=page_number,
                    kind=BlockType.TEXT,
                    content=record["text"],
                    bbox=record["bbox"],
                    metadata={"source": "text_layer"},
                )
            )

        for index, record in enumerate(table_records, start=1):
            blocks.append(
                DocumentBlock(
                    block_id=f"p{page_number}-table{index}",
                    page_number=page_number,
                    kind=BlockType.TABLE,
                    content=record["markdown"],
                    bbox=record["bbox"],
                    placeholder=f"[[TABLE:p{page_number}-table{index}]]",
                    metadata={
                        "source": "pdf_table_detector",
                        "rows": record["rows"],
                        "columns": record["columns"],
                    },
                )
            )

        assets = self._extract_image_assets(page, document, page_number)
        if _has_drawings(page) or (not text_count and not assets):
            rendered_asset = self._render_page_asset(page, fitz, page_number)
            if rendered_asset is not None:
                assets.append(rendered_asset)

        for asset in assets:
            placeholder = f"[[{asset.kind.value.upper()}:p{page_number}-{asset.asset_id}]]"
            asset.description = self._describe_asset(asset, placeholder)
            content = asset.description or ""
            if not self.config.recognize_images:
                recognition_status = "disabled"
            elif self.image_describer is None:
                recognition_status = "pending"
            elif "recognition_error" in asset.metadata:
                recognition_status = "failed"
            else:
                recognition_status = "recognized"
            blocks.append(
                DocumentBlock(
                    block_id=f"p{page_number}-{asset.asset_id}",
                    page_number=page_number,
                    kind=asset.kind,
                    content=content,
                    bbox=asset.bbox,
                    placeholder=placeholder,
                    metadata={
                        "asset_id": asset.asset_id,
                        "media_type": asset.media_type,
                        "recognition_status": recognition_status,
                    },
                )
            )

        blocks = _order_blocks(blocks, page.rect)
        return blocks, assets, text_count

    def _extract_image_assets(
        self,
        page: Any,
        document: Any,
        page_number: int,
    ) -> list[ImageAsset]:
        assets: list[ImageAsset] = []
        seen_xrefs: set[int] = set()
        for image_index, image_info in enumerate(page.get_images(full=True), start=1):
            xref = int(image_info[0])
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)
            try:
                extracted = document.extract_image(xref)
                data = extracted["image"]
                extension = extracted.get("ext", "png")
                media_type = mimetypes.types_map.get(
                    f".{extension.lower()}", "image/png"
                )
                rects = page.get_image_rects(xref)
                bbox = BoundingBox.from_sequence(rects[0]) if rects else None
            except (KeyError, IndexError, TypeError, ValueError, OSError):
                continue

            asset = ImageAsset(
                asset_id=f"i{image_index}",
                page_number=page_number,
                data=data,
                media_type=media_type,
                bbox=bbox,
                kind=BlockType.IMAGE,
                metadata={
                    "xref": xref,
                    "extension": extension,
                    "width": extracted.get("width"),
                    "height": extracted.get("height"),
                },
            )
            assets.append(self._persist_asset(asset))
        return assets

    def _render_page_asset(
        self,
        page: Any,
        fitz: Any,
        page_number: int,
    ) -> ImageAsset | None:
        scale = self.config.render_dpi / 72
        try:
            pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            data = pixmap.tobytes("png")
        except (AttributeError, OSError, ValueError):
            return None
        asset = ImageAsset(
            asset_id="page",
            page_number=page_number,
            data=data,
            media_type="image/png",
            bbox=BoundingBox(0.0, 0.0, float(page.rect.width), float(page.rect.height)),
            kind=BlockType.CAD_DRAWING if _has_drawings(page) else BlockType.PAGE_IMAGE,
            metadata={"render_dpi": self.config.render_dpi},
        )
        return self._persist_asset(asset)

    def _persist_asset(self, asset: ImageAsset) -> ImageAsset:
        output_dir = self.config.asset_output_dir
        if output_dir is None:
            return asset
        output_dir.mkdir(parents=True, exist_ok=True)
        suffix = mimetypes.guess_extension(asset.media_type) or ".bin"
        output_path = output_dir / f"p{asset.page_number}-{asset.asset_id}{suffix}"
        output_path.write_bytes(asset.data)
        asset.path = output_path
        return asset

    def _describe_asset(self, asset: ImageAsset, placeholder: str) -> str | None:
        if not self.config.recognize_images:
            return None
        if self.image_describer is None:
            if self.config.keep_unrecognized_placeholders:
                return "[待Qwen-VL识别]"
            return None
        try:
            return self.image_describer.describe_image(
                asset.data,
                media_type=asset.media_type,
                filename=asset.path.name if asset.path else asset.asset_id,
                page_number=asset.page_number,
                prompt=self.config.vision_prompt,
            )
        except (VisionError, OSError, TimeoutError) as exc:
            asset.metadata["recognition_error"] = str(exc)
            if self.config.keep_unrecognized_placeholders:
                return f"[Qwen-VL识别失败：{exc}]"
            return None


def parse_pdf(
    path: PathLike,
    *,
    config: PdfParserConfig | None = None,
    image_describer: ImageDescriber | None = None,
) -> StructuredDocument:
    """Convenience wrapper around :class:`IndustrialPdfParser`."""

    return IndustrialPdfParser(config, image_describer=image_describer).parse(path)


def _load_fitz() -> Any:
    try:
        import fitz
    except ImportError as exc:
        raise PdfParseError(
            "PDF parsing requires PyMuPDF. Install it with 'pip install PyMuPDF'."
        ) from exc
    return fitz


def _validate_pdf_path(path: PathLike) -> Path:
    if path is None or (isinstance(path, str) and not path.strip()):
        raise ValueError("The PDF path must not be empty.")
    pdf_path = Path(path).expanduser()
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF does not exist: {pdf_path}")
    if not pdf_path.is_file():
        raise IsADirectoryError(f"PDF path is not a file: {pdf_path}")
    if pdf_path.suffix.lower() != ".pdf":
        raise ValueError(f"Expected a PDF file, got: {pdf_path}")
    return pdf_path


def _classify_pdf(text_counts: list[int], minimum: int) -> PdfType:
    if not text_counts:
        return PdfType.EMPTY
    text_pages = sum(count >= minimum for count in text_counts)
    if text_pages == len(text_counts):
        return PdfType.TEXT
    if text_pages == 0:
        return PdfType.SCANNED
    return PdfType.MIXED


def _extract_text_records(page: Any) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    try:
        raw_blocks = page.get_text("dict").get("blocks", [])
    except (AttributeError, TypeError, ValueError):
        return records
    for raw_block in raw_blocks:
        if raw_block.get("type") != 0:
            continue
        lines = raw_block.get("lines", [])
        text = "\n".join(
            "".join(str(span.get("text", "")) for span in line.get("spans", []))
            for line in lines
        ).strip()
        if not text:
            continue
        try:
            bbox = BoundingBox.from_sequence(raw_block.get("bbox"))
        except (TypeError, ValueError):
            continue
        records.append({"text": text, "bbox": bbox})
    return records


def _extract_table_records(page: Any) -> list[dict[str, Any]]:
    """Use PyMuPDF's native table detector when available."""

    find_tables = getattr(page, "find_tables", None)
    if find_tables is None:
        return []
    try:
        finder = find_tables()
        tables = getattr(finder, "tables", finder)
    except (AttributeError, TypeError, ValueError, RuntimeError):
        return []

    records: list[dict[str, Any]] = []
    for table in tables or []:
        try:
            rows = table.extract()
            bbox = BoundingBox.from_sequence(table.bbox)
        except (AttributeError, TypeError, ValueError, RuntimeError):
            continue
        if not rows:
            continue
        records.append(
            {
                "bbox": bbox,
                "markdown": _table_to_markdown(rows),
                "rows": len(rows),
                "columns": max((len(row) for row in rows), default=0),
            }
        )
    return records


def _table_to_markdown(rows: Any) -> str:
    from .parser import markdown_table

    return markdown_table(rows)


def _order_text_records(records: list[dict[str, Any]], page_rect: Any) -> list[dict[str, Any]]:
    """Order obvious multi-column text column-by-column, then top-to-bottom."""

    if len(records) < 2:
        return records
    sorted_by_x = sorted(records, key=lambda record: record["bbox"].x0)
    largest_gap = 0.0
    split_index: int | None = None
    for index in range(1, len(sorted_by_x)):
        gap = sorted_by_x[index]["bbox"].x0 - sorted_by_x[index - 1]["bbox"].x1
        if gap > largest_gap:
            largest_gap = gap
            split_index = index
    threshold = max(36.0, float(page_rect.width) * 0.12)
    if split_index is None or largest_gap < threshold:
        return sorted(records, key=lambda record: (record["bbox"].y0, record["bbox"].x0))
    columns = [sorted_by_x[:split_index], sorted_by_x[split_index:]]
    return [
        record
        for column in columns
        for record in sorted(column, key=lambda item: (item["bbox"].y0, item["bbox"].x0))
    ]


def _overlap_ratio(first: BoundingBox, second: BoundingBox) -> float:
    intersection_width = max(0.0, min(first.x1, second.x1) - max(first.x0, second.x0))
    intersection_height = max(0.0, min(first.y1, second.y1) - max(first.y0, second.y0))
    intersection = intersection_width * intersection_height
    return intersection / first.area if first.area else 0.0


def _has_drawings(page: Any) -> bool:
    try:
        return bool(page.get_drawings())
    except (AttributeError, RuntimeError, TypeError, ValueError):
        return False


def _block_sort_key(block: DocumentBlock) -> tuple[float, float, int]:
    if block.bbox is None:
        return (float("inf"), float("inf"), 0)
    type_order = {
        BlockType.TEXT: 0,
        BlockType.TABLE: 1,
        BlockType.IMAGE: 2,
        BlockType.PAGE_IMAGE: 3,
        BlockType.CAD_DRAWING: 4,
    }
    return (block.bbox.y0, block.bbox.x0, type_order[block.kind])


def _order_blocks(blocks: list[DocumentBlock], page_rect: Any) -> list[DocumentBlock]:
    """Keep text, tables, and bounded images in a spatial reading order."""

    full_page_kinds = {BlockType.PAGE_IMAGE, BlockType.CAD_DRAWING}
    flow_blocks: list[DocumentBlock] = []
    full_page_blocks: list[DocumentBlock] = []
    unpositioned_blocks: list[DocumentBlock] = []
    page_area = float(page_rect.width) * float(page_rect.height)

    for block in blocks:
        if block.bbox is None:
            unpositioned_blocks.append(block)
        elif block.kind in full_page_kinds and block.bbox.area >= page_area * 0.8:
            full_page_blocks.append(block)
        else:
            flow_blocks.append(block)

    ordered_flow = _order_text_records(
        [{"block": block, "bbox": block.bbox} for block in flow_blocks],
        page_rect,
    )
    ordered_blocks = [record["block"] for record in ordered_flow]
    ordered_blocks.extend(sorted(full_page_blocks, key=_block_sort_key))
    ordered_blocks.extend(unpositioned_blocks)
    return ordered_blocks


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Parse an industrial PDF into JSON metadata.")
    parser.add_argument("path", type=Path, help="PDF path")
    parser.add_argument("--asset-dir", type=Path, help="Directory for extracted images")
    parser.add_argument("--no-vision", action="store_true", help="Do not add visual recognition results")
    parser.add_argument(
        "--vision",
        action="store_true",
        help="Use SiliconFlow vision from SILICONFLOW_API_KEY",
    )
    return parser


def main() -> int:
    args = _build_argument_parser().parse_args()
    import json

    try:
        image_describer = SiliconFlowVisionClient.from_env() if args.vision else None
        result = parse_pdf(
            args.path,
            config=PdfParserConfig(
                asset_output_dir=args.asset_dir,
                recognize_images=not args.no_vision,
            ),
            image_describer=image_describer,
        )
    except (PdfParseError, FileNotFoundError, IsADirectoryError, ValueError) as exc:
        print(f"Error: {exc}")
        return 1
    print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


__all__ = [
    "DEFAULT_VISION_PROMPT",
    "IndustrialPdfParser",
    "PdfParseError",
    "PdfParserConfig",
    "parse_pdf",
]
