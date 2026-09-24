"""Unified document parsers for offline RAG ingestion."""

from __future__ import annotations

import csv
import io
import mimetypes
import re
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


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp", ".jp2"}
# 注册 jp2 的 MIME，使视觉识别上传时 media_type 准确（默认 mimetypes 不识别 .jp2）
mimetypes.add_type("image/jp2", ".jp2")
IMAGE_PATTERN = re.compile(r"!\[([^\]]*)\]\((?:<)?([^)>]+)(?:>)?\)")
TABLE_ROWS_PER_BLOCK = 500
SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".md",
    ".markdown",
    ".docx",
    ".csv",
    ".xlsx",
    *IMAGE_EXTENSIONS,
}


class CsvParseError(RuntimeError):
    pass


class DocxParseError(RuntimeError):
    pass


class ImageParseError(RuntimeError):
    pass


class XlsxParseError(RuntimeError):
    pass


class UnsupportedDocumentError(ValueError):
    """Raised when no parser is registered for a file extension."""


def parse_document(
    path: PathLike,
    *,
    image_describer: ImageDescriber | None = None,
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
    normalized = _normalize_table_rows(rows)
    if not normalized:
        return ""
    header = normalized[0]
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    lines.extend("| " + " | ".join(row) + " |" for row in normalized[1:])
    return "\n".join(lines)


def _normalize_table_rows(rows: list[list[Any]]) -> list[list[str]]:
    normalized = [[_normalize_table_cell(cell) for cell in row] for row in rows]
    normalized = [row for row in normalized if any(row)]
    if not normalized:
        return []

    width = max(len(row) for row in normalized)
    padded = [row + [""] * (width - len(row)) for row in normalized]
    useful_columns = [index for index in range(width) if any(row[index] for row in padded)]
    if not useful_columns:
        return []

    compact = [[row[index] for index in useful_columns] for row in padded]
    header_index = _detect_header_row_index(compact)
    header = [cell or f"列{index + 1}" for index, cell in enumerate(compact[header_index])]
    data_rows = compact[:header_index] + compact[header_index + 1 :]
    return [header, *data_rows]


def _normalize_table_cell(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).replace("|", "\\|").replace("\n", " ").strip()
    return re.sub(r"\s+", " ", text)


def _detect_header_row_index(rows: list[list[str]]) -> int:
    best_index = 0
    best_score = -1.0
    for index, row in enumerate(rows[:5]):
        non_empty = [cell for cell in row if cell]
        if not non_empty:
            continue
        score = len(non_empty) * 2
        if index == 0:
            score += 1
        score += sum(1 for cell in non_empty if re.search(r"[A-Za-z_一-鿿]", cell))
        score -= sum(1 for cell in non_empty if _looks_like_numeric_value(cell))
        if score > best_score:
            best_score = score
            best_index = index
    return best_index


def _looks_like_numeric_value(text: str) -> bool:
    return bool(re.fullmatch(r"[-+]?\d+(?:[.,]\d+)*(?:\s*[A-Za-z%℃°/]+)?", text.strip()))


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
    if path.suffix.lower() == ".jp2":
        try:
            from PIL import Image

            with Image.open(io.BytesIO(data)) as image:
                converted = image.convert("RGB")
                output = io.BytesIO()
                converted.save(output, format="PNG")
                data = output.getvalue()
            media_type = "image/png"
        except (ImportError, OSError, ValueError) as exc:
            raise ImageParseError(f"Unable to convert JP2 image '{path}' to PNG: {exc}") from exc
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

__all__ = [
    "CsvParseError",
    "DocxParseError",
    "IMAGE_EXTENSIONS",
    "ImageParseError",
    "SUPPORTED_EXTENSIONS",
    "UnsupportedDocumentError",
    "XlsxParseError",
    "parse_csv",
    "parse_document",
    "parse_docx",
    "parse_image",
    "parse_markdown",
    "parse_txt",
    "parse_xlsx",
]
