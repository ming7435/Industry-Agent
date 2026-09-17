"""Unified document parsers for offline RAG ingestion."""

from __future__ import annotations

import csv
import io
import mimetypes
import os
import re
import shutil
import subprocess
import tempfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .file_reader import PathLike, read_file
from .models import (
    BlockType,
    BoundingBox,
    DocumentBlock,
    ImageAsset,
    ParsedPage,
    PdfType,
    StructuredDocument,
)
from .pdf_parser import DEFAULT_VISION_PROMPT, parse_pdf
from .reader import DocumentSource
from .vision import ImageDescriber, VisionError


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}
IMAGE_PATTERN = re.compile(r"!\[([^\]]*)\]\((?:<)?([^)>]+)(?:>)?\)")
TABLE_ROWS_PER_BLOCK = 500
CAD_ENTITY_TYPES = {
    "LINE",
    "LWPOLYLINE",
    "POLYLINE",
    "CIRCLE",
    "ARC",
    "ELLIPSE",
    "TEXT",
    "MTEXT",
    "DIMENSION",
    "INSERT",
}
SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".md",
    ".markdown",
    ".docx",
    ".csv",
    ".xlsx",
    *IMAGE_EXTENSIONS,
    ".dxf",
    ".dwg",
}


class CsvParseError(RuntimeError):
    pass


class DocxParseError(RuntimeError):
    pass


class ImageParseError(RuntimeError):
    pass


class XlsxParseError(RuntimeError):
    pass


class DxfParseError(RuntimeError):
    """Raised when DXF parsing is unavailable or fails."""


class DwgConvertError(RuntimeError):
    """Raised when DWG conversion cannot be completed."""


class UnsupportedDocumentError(ValueError):
    """Raised when no parser is registered for a file extension."""


@dataclass(frozen=True)
class DwgConverterConfig:
    """External DWG conversion settings."""

    converter_path: str | None = None
    output_version: str = "ACAD2018"
    output_format: str = "DXF"
    recursive: bool = False

    @classmethod
    def from_env(cls) -> "DwgConverterConfig":
        return cls(converter_path=os.getenv("ODA_FILE_CONVERTER"))


def parse_document(
    path: PathLike,
    *,
    image_describer: ImageDescriber | None = None,
    dwg_config: DwgConverterConfig | None = None,
    source_root: Path | None = None,
) -> StructuredDocument:
    """Parse a supported file and return a common StructuredDocument."""

    if path is None or (isinstance(path, str) and not path.strip()):
        raise ValueError("The input path must not be empty.")
    source = DocumentSource.from_path(path)
    suffix = source.suffix
    if suffix == ".pdf":
        document = parse_pdf(source.path, image_describer=image_describer)
    elif suffix == ".txt":
        document = parse_txt(source.path)
    elif suffix in {".md", ".markdown"}:
        document = parse_markdown(source.path, image_describer=image_describer)
    elif suffix == ".docx":
        document = parse_docx(source.path, image_describer=image_describer)
    elif suffix == ".csv":
        document = parse_csv(source.path)
    elif suffix == ".xlsx":
        document = parse_xlsx(source.path)
    elif suffix in IMAGE_EXTENSIONS:
        document = parse_image(source.path, image_describer=image_describer)
    elif suffix == ".dxf":
        document = parse_dxf(source.path)
    elif suffix == ".dwg":
        document = parse_dwg(source.path, config=dwg_config)
    else:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise UnsupportedDocumentError(
            f"Unsupported document extension '{suffix or '<none>'}'. Supported: {supported}"
        )

    document.metadata.update(
        {
            "document_id": source.identity(root=source_root),
            "content_hash": source.sha256(),
            "file_size": source.size,
        }
    )
    return document


def parse_txt(path: str | Path) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".txt"})
    text, encoding = source.read_text()
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    if not paragraphs and text.strip():
        paragraphs = [text.strip()]
    blocks = [
        make_text_block(f"p1-t{index}", paragraph, metadata={"source": "text_file", "encoding": encoding})
        for index, paragraph in enumerate(paragraphs, start=1)
    ]
    return text_document(source.path, blocks, source_format="txt", metadata={"encoding": encoding, "paragraph_count": len(blocks)})


def parse_csv(path: str | Path) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".csv"})
    text, encoding = source.read_text()
    try:
        rows = list(csv.reader(io.StringIO(text)))
    except csv.Error as exc:
        raise CsvParseError(f"Unable to parse CSV '{source.path}': {exc}") from exc
    if not rows:
        return text_document(source.path, [], source_format="csv", metadata={"encoding": encoding, "row_count": 0})

    header, data_rows = rows[0], rows[1:]
    batches = [data_rows[start : start + TABLE_ROWS_PER_BLOCK] for start in range(0, len(data_rows), TABLE_ROWS_PER_BLOCK)] or [[]]
    blocks: list[DocumentBlock] = []
    for part, batch in enumerate(batches, start=1):
        table_rows = [header, *batch]
        block_id = f"p1-table{part}"
        blocks.append(DocumentBlock(
            block_id=block_id,
            page_number=1,
            kind=BlockType.TABLE,
            content=markdown_table(table_rows),
            placeholder=f"[[TABLE:{block_id}]]",
            metadata={
                "source": "csv",
                "encoding": encoding,
                "row_start": 2 + (part - 1) * TABLE_ROWS_PER_BLOCK,
                "row_end": 1 + (part - 1) * TABLE_ROWS_PER_BLOCK + len(batch),
                "rows": len(table_rows),
                "columns": max((len(row) for row in table_rows), default=0),
            },
        ))
    return text_document(source.path, blocks, source_format="csv", metadata={"encoding": encoding, "row_count": len(rows)})


def parse_xlsx(path: str | Path) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".xlsx"})
    workbook = _load_workbook(source.path)
    blocks: list[DocumentBlock] = []
    page_numbers: list[int] = []
    try:
        for page_number, worksheet in enumerate(workbook.worksheets, start=1):
            rows = [["" if value is None else value for value in row] for row in worksheet.iter_rows(values_only=True)]
            while rows and not any(str(value).strip() for value in rows[-1]):
                rows.pop()
            if not rows:
                continue
            page_numbers.append(page_number)
            header, data_rows = rows[0], rows[1:]
            batches = [data_rows[start : start + TABLE_ROWS_PER_BLOCK] for start in range(0, len(data_rows), TABLE_ROWS_PER_BLOCK)] or [[]]
            for part, batch in enumerate(batches, start=1):
                table_rows = [header, *batch]
                block_id = f"p{page_number}-table{part}"
                blocks.append(DocumentBlock(
                    block_id=block_id,
                    page_number=page_number,
                    kind=BlockType.TABLE,
                    content=markdown_table(table_rows),
                    placeholder=f"[[TABLE:{block_id}]]",
                    metadata={"source": "xlsx", "worksheet": worksheet.title, "table_part": part, "rows": len(table_rows), "columns": max((len(row) for row in table_rows), default=0)},
                ))
        worksheet_count = len(workbook.sheetnames)
    finally:
        workbook.close()
    return structured_document(source.path, blocks, source_format="xlsx", page_numbers=page_numbers or [1], metadata={"worksheet_count": worksheet_count})


def parse_image(path: str | Path, *, image_describer: ImageDescriber | None = None, vision_prompt: str = DEFAULT_VISION_PROMPT) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions=IMAGE_EXTENSIONS)
    asset = image_asset_from_file(source.path)
    description, status = describe_visual(asset, image_describer=image_describer, prompt=vision_prompt)
    asset.description = description
    block = DocumentBlock(
        block_id="p1-image",
        page_number=1,
        kind=BlockType.IMAGE,
        content=description,
        placeholder="[[IMAGE:p1-image]]",
        metadata={"source": "standalone_image", "asset_id": asset.asset_id, "media_type": asset.media_type, "recognition_status": status},
    )
    return structured_document(source.path, [block], source_format=source.suffix.lstrip("."), assets=[asset], metadata={"recognition_status": status})


def parse_markdown(path: str | Path, *, image_describer: ImageDescriber | None = None, vision_prompt: str = DEFAULT_VISION_PROMPT) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".md", ".markdown"})
    text, encoding = source.read_text()
    blocks: list[DocumentBlock] = []
    assets: list[ImageAsset] = []
    heading_path: list[str] = []
    text_buffer: list[str] = []

    def add_text(content: str, metadata: dict[str, Any]) -> None:
        if content.strip():
            blocks.append(make_text_block(f"p1-t{len(blocks) + 1}", content.strip(), metadata=metadata))

    def flush_text() -> None:
        nonlocal text_buffer
        add_text("\n".join(text_buffer), {"source": "markdown", "encoding": encoding, "heading_path": list(heading_path)})
        text_buffer = []

    lines = text.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        heading = re.match(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$", line)
        if heading:
            flush_text()
            level, title = len(heading.group(1)), heading.group(2).strip()
            heading_path[:] = heading_path[: level - 1]
            heading_path.append(title)
            add_text(title, {"source": "markdown_heading", "heading_level": level, "heading_path": list(heading_path), "is_heading": True})
            index += 1
            continue
        if _is_table_start(lines, index):
            flush_text()
            table_lines = [lines[index], lines[index + 1]]
            index += 2
            while index < len(lines) and _is_table_row(lines[index]):
                table_lines.append(lines[index])
                index += 1
            block_id = f"p1-table{len(blocks) + 1}"
            blocks.append(DocumentBlock(block_id, 1, BlockType.TABLE, "\n".join(table_lines), placeholder=f"[[TABLE:{block_id}]]", metadata={"source": "markdown_table", "heading_path": list(heading_path)}))
            continue
        image_match = IMAGE_PATTERN.search(line)
        if image_match:
            flush_text()
            reference = image_match.group(2).strip()
            local_image = _resolve_local_image(source.path, reference)
            if local_image is None:
                add_text(line, {"source": "markdown_image_reference", "image_alt": image_match.group(1), "image_reference": reference, "heading_path": list(heading_path)})
            else:
                asset = image_asset_from_file(local_image, asset_id=f"i{len(assets) + 1}")
                description, status = describe_visual(asset, image_describer=image_describer, prompt=vision_prompt)
                asset.description = description
                assets.append(asset)
                block_id = f"p1-{asset.asset_id}"
                blocks.append(DocumentBlock(
                    block_id, 1, BlockType.IMAGE,
                    f"图片说明：{image_match.group(1).strip()}\n{description}".strip(),
                    placeholder=f"[[IMAGE:{block_id}]]",
                    metadata={"source": "markdown_image", "asset_id": asset.asset_id, "image_reference": reference, "recognition_status": status, "heading_path": list(heading_path)},
                ))
            index += 1
            continue
        text_buffer.append(line)
        index += 1
    flush_text()
    return text_document(source.path, blocks, source_format="md", assets=assets, metadata={"encoding": encoding, "heading_count": sum(bool(block.metadata.get("is_heading")) for block in blocks), "image_count": len(assets)})


def parse_docx(path: str | Path, *, image_describer: ImageDescriber | None = None, vision_prompt: str = DEFAULT_VISION_PROMPT) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".docx"})
    document = _load_docx(source.path)
    blocks: list[DocumentBlock] = []
    assets: list[ImageAsset] = []
    heading_path: list[str] = []
    for body_index, element in enumerate(document.element.body.iterchildren(), start=1):
        tag = element.tag.rsplit("}", 1)[-1]
        if tag == "p":
            paragraph = _paragraph_from_element(document, element)
            text = paragraph.text.strip()
            style_name = str(paragraph.style.name or "")
            level = _heading_level(style_name)
            if text:
                metadata: dict[str, Any] = {"source": "docx_paragraph", "style": style_name, "body_index": body_index}
                if level:
                    heading_path[:] = heading_path[: level - 1]
                    heading_path.append(text)
                    metadata.update({"is_heading": True, "heading_level": level})
                if heading_path:
                    metadata["heading_path"] = list(heading_path)
                blocks.append(make_text_block(f"p1-t{len(blocks) + 1}", text, metadata=metadata))
            for relationship_id in _image_relationship_ids(element):
                asset = _docx_asset(document, relationship_id, len(assets) + 1)
                if asset is None:
                    continue
                description, status = describe_visual(asset, image_describer=image_describer, prompt=vision_prompt)
                asset.description = description
                assets.append(asset)
                block_id = f"p1-{asset.asset_id}"
                blocks.append(DocumentBlock(
                    block_id, 1, BlockType.IMAGE, description,
                    placeholder=f"[[IMAGE:{block_id}]]",
                    metadata={"source": "docx_embedded_image", "asset_id": asset.asset_id, "media_type": asset.media_type, "recognition_status": status, "heading_path": list(heading_path), "body_index": body_index},
                ))
        elif tag == "tbl":
            table = _table_from_element(document, element)
            rows = [[cell.text.strip() for cell in row.cells] for row in table.rows]
            content = markdown_table(rows)
            if content:
                block_id = f"p1-table{len(blocks) + 1}"
                blocks.append(DocumentBlock(block_id, 1, BlockType.TABLE, content, placeholder=f"[[TABLE:{block_id}]]", metadata={"source": "docx_table", "rows": len(rows), "columns": max((len(row) for row in rows), default=0), "heading_path": list(heading_path), "body_index": body_index}))
    return text_document(source.path, blocks, source_format="docx", assets=assets, metadata={"paragraph_count": sum(block.kind is BlockType.TEXT for block in blocks), "table_count": sum(block.kind is BlockType.TABLE for block in blocks), "image_count": len(assets)})


def parse_dxf(path: PathLike) -> StructuredDocument:
    """Extract layers, entity counts, text, dimensions, and block references."""

    file_path = validate_input_path(path, {".dxf"})
    ezdxf = _load_ezdxf()
    try:
        drawing = ezdxf.readfile(str(file_path))
    except Exception as exc:
        raise DxfParseError(f"Unable to open DXF '{file_path}': {exc}") from exc

    modelspace = drawing.modelspace()
    entity_counts: Counter[str] = Counter()
    layer_counts: Counter[str] = Counter()
    texts: list[str] = []
    dimensions: list[str] = []
    inserts: list[str] = []
    coordinates: list[tuple[float, float]] = []

    for entity in modelspace:
        entity_type = str(entity.dxftype()).upper()
        entity_counts[entity_type] += 1
        layer_counts[str(getattr(entity.dxf, "layer", "0"))] += 1
        if entity_type in {"TEXT", "MTEXT"}:
            value = _entity_text(entity)
            if value:
                texts.append(value)
        elif entity_type == "DIMENSION":
            value = _dimension_text(entity)
            if value:
                dimensions.append(value)
        elif entity_type == "INSERT":
            name = str(getattr(entity.dxf, "name", ""))
            if name:
                inserts.append(name)
        coordinates.extend(_entity_coordinates(entity))

    summary = _summary_text(file_path, entity_counts, layer_counts, texts, dimensions, inserts, coordinates)
    blocks: list[DocumentBlock] = [
        make_text_block(
            "p1-cad-summary",
            summary,
            metadata={
                "source": "dxf",
                "entity_counts": dict(entity_counts),
                "layer_counts": dict(layer_counts),
                "entity_types": sorted(entity_counts),
                "layers": sorted(layer_counts),
                "drawing_name": file_path.stem,
                "file_format": "dxf",
            },
        )
    ]
    if texts:
        blocks.append(
            make_text_block(
                "p1-cad-text",
                "图纸文字标注：" + "；".join(_unique(texts)),
                metadata={"source": "dxf_text_entities", "entity_types": ["TEXT", "MTEXT"]},
            )
        )
    if dimensions:
        blocks.append(
            make_text_block(
                "p1-cad-dimensions",
                "图纸尺寸标注：" + "；".join(_unique(dimensions)),
                metadata={"source": "dxf_dimensions", "entity_types": ["DIMENSION"]},
            )
        )
    if inserts:
        blocks.append(
            make_text_block(
                "p1-cad-blocks",
                "图纸块引用：" + "；".join(_unique(inserts)),
                metadata={"source": "dxf_inserts", "entity_types": ["INSERT"]},
            )
        )

    document = structured_document(
        file_path,
        blocks,
        source_format="dxf",
        metadata={
            "parser": "ezdxf",
            "file_format": "dxf",
            "entity_counts": dict(entity_counts),
            "layer_counts": dict(layer_counts),
            "drawing_name": file_path.stem,
            "bbox": _bbox(coordinates),
        },
    )
    for block in document.blocks:
        block.kind = BlockType.CAD_DRAWING
        block.metadata["recognition_status"] = "recognized"
    for page in document.pages:
        page.has_drawings = True
    return document


def parse_dwg(
    path: PathLike,
    *,
    config: DwgConverterConfig | None = None,
) -> StructuredDocument:
    """Convert DWG to DXF, then parse the converted DXF document."""

    dwg_path = validate_input_path(path, {".dwg"})
    converter_config = config or DwgConverterConfig.from_env()
    converted_path = convert_dwg_to_dxf(dwg_path, config=converter_config)
    document = parse_dxf(converted_path)
    document.source_name = dwg_path.name
    document.source_path = dwg_path
    document.metadata.update(
        {
            "source_format": "dwg",
            "parser": "dwg_to_dxf+ezdxf",
            "original_file_format": "dwg",
            "converted_dxf_path": str(converted_path),
        }
    )
    for block in document.blocks:
        block.metadata["source_format"] = "dwg"
        block.metadata["converted_dxf_path"] = str(converted_path)
    return document


def convert_dwg_to_dxf(
    path: Path,
    *,
    config: DwgConverterConfig | None = None,
) -> Path:
    """Convert one DWG file to a temporary DXF using ODA File Converter."""

    config = config or DwgConverterConfig.from_env()
    converter = _resolve_converter(config.converter_path)
    output_dir = Path(tempfile.mkdtemp(prefix="dwg-to-dxf-"))
    command = [
        str(converter),
        str(path.parent),
        str(output_dir),
        config.output_version,
        config.output_format,
        "1" if config.recursive else "0",
        "1",
    ]
    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise DwgConvertError(f"DWG conversion failed for '{path}': {exc}") from exc
    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip()
        raise DwgConvertError(f"DWG conversion failed for '{path}': {detail}")
    candidates = list(output_dir.glob(f"{path.stem}*.dxf")) + list(output_dir.rglob(f"{path.stem}*.dxf"))
    if not candidates:
        raise DwgConvertError(f"DWG converter did not create a DXF for '{path}'.")
    return candidates[0]


def validate_input_path(path: PathLike, extensions: set[str] | None = None) -> Path:
    if path is None or (isinstance(path, str) and not path.strip()):
        raise ValueError("The input path must not be empty.")
    file_path = Path(path).expanduser()
    if not file_path.exists():
        raise FileNotFoundError(f"File does not exist: {file_path}")
    if not file_path.is_file():
        raise IsADirectoryError(f"Path is not a file: {file_path}")
    if extensions and file_path.suffix.lower() not in extensions:
        expected = ", ".join(sorted(extensions))
        raise ValueError(f"Expected one of {expected}, got: {file_path}")
    return file_path


def text_document(
    path: Path,
    blocks: list[DocumentBlock],
    *,
    source_format: str,
    metadata: dict[str, Any] | None = None,
    assets: list[ImageAsset] | None = None,
    page_number: int = 1,
) -> StructuredDocument:
    return structured_document(
        path,
        blocks,
        source_format=source_format,
        metadata=metadata,
        assets=assets,
        page_numbers=[page_number],
    )


def structured_document(
    path: Path,
    blocks: list[DocumentBlock],
    *,
    source_format: str,
    metadata: dict[str, Any] | None = None,
    assets: list[ImageAsset] | None = None,
    page_numbers: list[int] | None = None,
) -> StructuredDocument:
    """Build a document with one logical page per supplied page number."""

    numbers = page_numbers or sorted({block.page_number for block in blocks}) or [1]
    pages: list[ParsedPage] = []
    for page_number in numbers:
        page_blocks = [block for block in blocks if block.page_number == page_number]
        pages.append(
            ParsedPage(
                page_number=page_number,
                width=0.0,
                height=0.0,
                text_characters=sum(len(block.content) for block in page_blocks),
                has_images=any(block.kind is BlockType.IMAGE for block in page_blocks),
                has_drawings=any(block.kind is BlockType.CAD_DRAWING for block in page_blocks),
                blocks=page_blocks,
            )
        )
    document_metadata = {
        "source_format": source_format,
        "parser": source_format,
    }
    if metadata:
        document_metadata.update(metadata)
    return StructuredDocument(
        source_name=path.name,
        source_path=path,
        pdf_type=PdfType.TEXT if blocks else PdfType.EMPTY,
        pages=pages,
        blocks=blocks,
        assets=assets or [],
        metadata=document_metadata,
    )


def make_text_block(
    block_id: str,
    content: str,
    *,
    page_number: int = 1,
    metadata: dict[str, Any] | None = None,
) -> DocumentBlock:
    return DocumentBlock(
        block_id=block_id,
        page_number=page_number,
        kind=BlockType.TEXT,
        content=content,
        metadata=metadata or {},
    )


def markdown_table(rows: list[list[Any]]) -> str:
    if not rows:
        return ""
    width = max(len(row) for row in rows)
    normalized = [
        [str(cell).replace("|", "\\|").replace("\n", " ").strip() for cell in row]
        + [""] * (width - len(row))
        for row in rows
    ]
    header = normalized[0]
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    lines.extend("| " + " | ".join(row) + " |" for row in normalized[1:])
    return "\n".join(lines)


def describe_visual(
    asset: ImageAsset,
    *,
    image_describer: ImageDescriber | None,
    prompt: str,
) -> tuple[str, str]:
    if image_describer is None:
        return "[待Qwen-VL识别]", "pending"
    try:
        description = image_describer.describe_image(
            asset.data,
            media_type=asset.media_type,
            filename=asset.path.name if asset.path else asset.asset_id,
            page_number=asset.page_number,
            prompt=prompt,
        )
    except (VisionError, OSError, TimeoutError) as exc:
        asset.metadata["recognition_error"] = str(exc)
        return f"[Qwen-VL识别失败：{exc}]", "failed"
    return description, "recognized"


def image_asset_from_file(path: Path, *, asset_id: str = "image") -> ImageAsset:
    data = read_file(path)
    media_type = mimetypes.guess_type(path.name)[0] or "image/png"
    return ImageAsset(
        asset_id=asset_id,
        page_number=1,
        data=data,
        media_type=media_type,
        bbox=BoundingBox(0.0, 0.0, 0.0, 0.0),
        kind=BlockType.IMAGE,
        path=path,
        metadata={"extension": path.suffix.lower().lstrip(".")},
    )


def _load_workbook(path: Path) -> Any:
    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise XlsxParseError("XLSX parsing requires openpyxl.") from exc
    try:
        return load_workbook(path, read_only=True, data_only=True)
    except Exception as exc:
        raise XlsxParseError(f"Unable to open XLSX '{path}': {exc}") from exc


def _load_docx(path: Path) -> Any:
    try:
        from docx import Document
    except ImportError as exc:
        raise DocxParseError("DOCX parsing requires python-docx.") from exc
    try:
        return Document(path)
    except Exception as exc:
        raise DocxParseError(f"Unable to open DOCX '{path}': {exc}") from exc


def _paragraph_from_element(document: Any, element: Any) -> Any:
    from docx.text.paragraph import Paragraph
    return Paragraph(element, document)


def _table_from_element(document: Any, element: Any) -> Any:
    from docx.table import Table
    return Table(element, document)


def _heading_level(style_name: str) -> int | None:
    if not style_name.lower().startswith("heading"):
        return None
    suffix = style_name[len("heading") :].strip()
    return int(suffix) if suffix.isdigit() and int(suffix) > 0 else None


def _image_relationship_ids(element: Any) -> list[str]:
    embed_attribute = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
    return [relationship_id for node in element.iter() if node.tag.rsplit("}", 1)[-1] == "blip" and (relationship_id := node.get(embed_attribute))]


def _docx_asset(document: Any, relationship_id: str, image_index: int) -> ImageAsset | None:
    try:
        part = document.part.rels[relationship_id].target_part
        return ImageAsset(asset_id=f"i{image_index}", page_number=1, data=part.blob, media_type=getattr(part, "content_type", "image/png"), kind=BlockType.IMAGE, metadata={"relationship_id": relationship_id})
    except (AttributeError, KeyError):
        return None


def _resolve_local_image(markdown_path: Path, reference: str) -> Path | None:
    if re.match(r"^(?:https?:|data:|//)", reference, flags=re.IGNORECASE):
        return None
    candidate = (markdown_path.parent / reference.split("#", 1)[0].split("?", 1)[0]).resolve()
    return candidate if candidate.is_file() else None


def _is_table_start(lines: list[str], index: int) -> bool:
    return index + 1 < len(lines) and _is_table_row(lines[index]) and bool(re.fullmatch(r"\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*", lines[index + 1]))


def _is_table_row(line: str) -> bool:
    return line.strip().startswith("|") and line.strip().endswith("|")


def _load_ezdxf() -> Any:
    try:
        import ezdxf
    except ImportError as exc:
        raise DxfParseError(
            "DXF parsing requires ezdxf. Install it with 'pip install ezdxf'."
        ) from exc
    return ezdxf


def _entity_text(entity: Any) -> str:
    text = getattr(entity.dxf, "text", "")
    if not text and hasattr(entity, "plain_text"):
        text = entity.plain_text()
    return str(text).replace("\\P", "\n").strip()


def _dimension_text(entity: Any) -> str:
    value = str(getattr(entity.dxf, "text", "")).strip()
    if value and value != "<>":
        return value
    try:
        measurement = float(entity.get_measurement())
    except (AttributeError, TypeError, ValueError):
        return ""
    return f"{measurement:g}"


def _entity_coordinates(entity: Any) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for attribute in ("start", "end", "center", "insert"):
        value = getattr(entity.dxf, attribute, None)
        if value is not None and hasattr(value, "x") and hasattr(value, "y"):
            points.append((float(value.x), float(value.y)))
    return points


def _summary_text(
    path: Path,
    entity_counts: Counter[str],
    layer_counts: Counter[str],
    texts: list[str],
    dimensions: list[str],
    inserts: list[str],
    coordinates: list[tuple[float, float]],
) -> str:
    parts = [
        f"CAD图纸：{path.stem}",
        "文件格式：DXF",
        f"图层：{', '.join(sorted(layer_counts)) or '无'}",
        "实体统计：" + "，".join(f"{kind} {count}个" for kind, count in sorted(entity_counts.items())),
    ]
    if texts:
        parts.append("文字标注：" + "；".join(_unique(texts)[:100]))
    if dimensions:
        parts.append("尺寸标注：" + "；".join(_unique(dimensions)[:100]))
    if inserts:
        parts.append("块引用：" + "；".join(_unique(inserts)[:100]))
    bbox = _bbox(coordinates)
    if bbox:
        parts.append(f"坐标范围：{bbox}")
    return "\n".join(parts)


def _bbox(coordinates: list[tuple[float, float]]) -> list[float] | None:
    if not coordinates:
        return None
    xs = [point[0] for point in coordinates]
    ys = [point[1] for point in coordinates]
    return [min(xs), min(ys), max(xs), max(ys)]


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value.strip()))


def _resolve_converter(converter_path: str | None) -> Path:
    if converter_path:
        path = Path(converter_path).expanduser()
        if path.exists():
            return path
        resolved = shutil.which(converter_path)
        if resolved:
            return Path(resolved)
    for candidate in (
        "ODAFileConverter",
        "ODAFileConverter.exe",
        "FileConverter",
        "FileConverter.exe",
    ):
        resolved = shutil.which(candidate)
        if resolved:
            return Path(resolved)
    raise DwgConvertError(
        "DWG parsing requires ODA File Converter. Set ODA_FILE_CONVERTER to the executable path."
    )


__all__ = [
    "CAD_ENTITY_TYPES",
    "CsvParseError",
    "DocxParseError",
    "DwgConvertError",
    "DwgConverterConfig",
    "DxfParseError",
    "IMAGE_EXTENSIONS",
    "ImageParseError",
    "SUPPORTED_EXTENSIONS",
    "UnsupportedDocumentError",
    "XlsxParseError",
    "convert_dwg_to_dxf",
    "parse_csv",
    "parse_document",
    "parse_docx",
    "parse_dwg",
    "parse_dxf",
    "parse_image",
    "parse_markdown",
    "parse_txt",
    "parse_xlsx",
]
